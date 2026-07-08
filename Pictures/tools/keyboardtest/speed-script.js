document.addEventListener('DOMContentLoaded', () => {
    // Cloudflare's public measurement endpoints (the same backend used by speed.cloudflare.com).
    // Every number shown to the user comes from a real transfer against these endpoints —
    // if they are unreachable the test fails visibly instead of showing made-up values.
    const DOWN_URL = 'https://speed.cloudflare.com/__down';
    const UP_URL = 'https://speed.cloudflare.com/__up';

    const PHASE_BUDGET_MS = 8000;
    const GAUGE_MAX_MBPS = 300;
    const GAUGE_MAX_PING = 200;

    const startBtn = document.getElementById('start-speed-test');
    const speedGauge = document.getElementById('speed-gauge');
    const speedNumber = document.getElementById('speed-number');
    const speedUnit = document.getElementById('speed-unit');
    const speedPhase = document.getElementById('speed-phase');
    const speedError = document.getElementById('speed-error');

    const resPing = document.getElementById('res-ping');
    const resDownload = document.getElementById('res-download');
    const resUpload = document.getElementById('res-upload');

    const cardPing = document.getElementById('card-ping');
    const cardDownload = document.getElementById('card-download');
    const cardUpload = document.getElementById('card-upload');

    let testing = false;

    const setGauge = (val, max) => {
        const percent = Math.min(100, (val / max) * 100);
        speedGauge.style.setProperty('--percentage', `${percent}%`);
        speedNumber.textContent = val >= 100 ? Math.round(val) : val.toFixed(1);
    };

    const setPhase = (text) => {
        speedPhase.textContent = text;
    };

    const measurePing = async () => {
        cardPing.classList.add('active');
        speedUnit.textContent = 'ms';
        setPhase('Ping測定中…');

        // Warm-up request so the samples measure round-trip time, not the TLS handshake.
        await fetch(`${DOWN_URL}?bytes=0&warmup=${Date.now()}`, { cache: 'no-store' });

        const times = [];
        for (let i = 0; i < 5; i++) {
            const start = performance.now();
            await fetch(`${DOWN_URL}?bytes=0&i=${i}&t=${Date.now()}`, { cache: 'no-store' });
            const ms = performance.now() - start;
            times.push(ms);
            setGauge(ms, GAUGE_MAX_PING);
            resPing.textContent = Math.round(ms);
            await new Promise(r => setTimeout(r, 150));
        }

        times.sort((a, b) => a - b);
        const median = times[Math.floor(times.length / 2)];
        resPing.textContent = Math.round(median);
        cardPing.classList.remove('active');
        return median;
    };

    const measureDownload = async () => {
        cardDownload.classList.add('active');
        speedUnit.textContent = 'Mbps';
        setPhase('ダウンロード測定中…');

        const sizes = [1e6, 5e6, 25e6, 50e6, 100e6];
        const start = performance.now();
        let totalBytes = 0;
        let mbps = 0;

        for (const size of sizes) {
            const elapsedMs = performance.now() - start;
            if (elapsedMs > PHASE_BUDGET_MS) break;

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), PHASE_BUDGET_MS - elapsedMs + 500);
            try {
                const res = await fetch(`${DOWN_URL}?bytes=${size}&t=${Date.now()}`, {
                    cache: 'no-store',
                    signal: controller.signal
                });
                const reader = res.body.getReader();
                for (;;) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    totalBytes += value.length;
                    const elapsed = (performance.now() - start) / 1000;
                    mbps = (totalBytes * 8) / elapsed / 1e6;
                    setGauge(mbps, GAUGE_MAX_MBPS);
                    resDownload.textContent = mbps.toFixed(1);
                }
            } catch (err) {
                if (err.name === 'AbortError') break; // time budget reached mid-transfer
                throw err;
            } finally {
                clearTimeout(timer);
            }
        }

        cardDownload.classList.remove('active');
        if (totalBytes === 0) throw new Error('download produced no data');
        resDownload.textContent = mbps.toFixed(1);
        return mbps;
    };

    const uploadOnce = (bytes) => new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const payload = new Blob([new Uint8Array(bytes)]);
        const start = performance.now();

        xhr.open('POST', `${UP_URL}?t=${Date.now()}`);
        xhr.timeout = PHASE_BUDGET_MS + 4000;
        xhr.upload.onprogress = (e) => {
            const elapsed = (performance.now() - start) / 1000;
            if (elapsed > 0 && e.loaded > 0) {
                const mbps = (e.loaded * 8) / elapsed / 1e6;
                setGauge(mbps, GAUGE_MAX_MBPS);
                resUpload.textContent = mbps.toFixed(1);
            }
        };
        xhr.onload = () => resolve({ bytes, seconds: (performance.now() - start) / 1000 });
        xhr.onerror = () => reject(new Error('upload request failed'));
        xhr.ontimeout = () => reject(new Error('upload timed out'));
        xhr.send(payload);
    });

    const measureUpload = async () => {
        cardUpload.classList.add('active');
        speedUnit.textContent = 'Mbps';
        setPhase('アップロード測定中…');

        const sizes = [1e6, 5e6, 10e6];
        const start = performance.now();
        let totalBytes = 0;
        let totalSeconds = 0;

        for (const size of sizes) {
            if (performance.now() - start > PHASE_BUDGET_MS) break;
            const result = await uploadOnce(size);
            totalBytes += result.bytes;
            totalSeconds += result.seconds;
        }

        cardUpload.classList.remove('active');
        if (totalSeconds === 0) throw new Error('upload produced no data');
        const mbps = (totalBytes * 8) / totalSeconds / 1e6;
        resUpload.textContent = mbps.toFixed(1);
        return mbps;
    };

    startBtn.addEventListener('click', async () => {
        if (testing) return;
        testing = true;
        startBtn.disabled = true;
        startBtn.textContent = '測定中...';
        speedError.style.display = 'none';

        resPing.textContent = '-';
        resDownload.textContent = '-';
        resUpload.textContent = '-';
        setGauge(0, GAUGE_MAX_MBPS);

        try {
            await measurePing();
            const download = await measureDownload();
            await measureUpload();
            setGauge(download, GAUGE_MAX_MBPS);
            speedUnit.textContent = 'Mbps';
            setPhase('測定完了');
        } catch (err) {
            console.error('Speed test failed:', err);
            speedError.style.display = 'block';
            setPhase('測定失敗');
            setGauge(0, GAUGE_MAX_MBPS);
            cardPing.classList.remove('active');
            cardDownload.classList.remove('active');
            cardUpload.classList.remove('active');
        } finally {
            testing = false;
            startBtn.disabled = false;
            startBtn.textContent = '再測定する';
        }
    });
});
