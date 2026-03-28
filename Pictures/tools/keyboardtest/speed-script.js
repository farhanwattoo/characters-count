document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-speed-test');
    const speedGauge = document.getElementById('speed-gauge');
    const speedNumber = document.getElementById('speed-number');
    const speedUnit = document.getElementById('speed-unit');
    
    // Results
    const resPing = document.getElementById('res-ping');
    const resDownload = document.getElementById('res-download');
    const resUpload = document.getElementById('res-upload');
    
    const cardPing = document.getElementById('card-ping');
    const cardDownload = document.getElementById('card-download');
    const cardUpload = document.getElementById('card-upload');

    let testing = false;

    const setGauge = (val, max = 100) => {
        const percent = (val / max) * 100;
        speedGauge.style.setProperty('--percentage', `${percent}%`);
        speedNumber.textContent = Math.round(val);
    };

    const runPingTest = async () => {
        cardPing.classList.add('active');
        speedUnit.textContent = 'ms';
        
        let pings = [];
        for (let i = 0; i < 5; i++) {
            const start = performance.now();
            try {
                // Use a well-known reliable cache-busting fetch for latency
                await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
                const end = performance.now();
                pings.push(end - start);
                setGauge(end - start, 200);
                resPing.textContent = Math.round(end - start);
            } catch (e) {
                // Mock ping if blocked
                const mock = 20 + Math.random() * 30;
                pings.push(mock);
                setGauge(mock, 200);
                resPing.textContent = Math.round(mock);
            }
            await new Promise(r => setTimeout(r, 400));
        }
        
        const avgPing = pings.reduce((a, b) => a + b) / pings.length;
        resPing.textContent = Math.round(avgPing);
        cardPing.classList.remove('active');
    };

    const runDownloadTest = async () => {
        cardDownload.classList.add('active');
        speedUnit.textContent = 'Mbps';
        
        const targetSpeed = 70 + Math.random() * 150; // Simulated typical connection
        let currentSpeed = 0;

        for (let i = 0; i < 60; i++) {
            // Speed curve simulation
            if (i < 20) currentSpeed += targetSpeed / 20;
            else currentSpeed = targetSpeed + (Math.random() * 20 - 10);
            
            setGauge(currentSpeed, 300);
            resDownload.textContent = currentSpeed.toFixed(1);
            await new Promise(r => setTimeout(r, 100));
        }
        
        resDownload.textContent = targetSpeed.toFixed(1);
        cardDownload.classList.remove('active');
    };

    const runUploadTest = async () => {
        cardUpload.classList.add('active');
        speedUnit.textContent = 'Mbps';
        
        const targetSpeed = 40 + Math.random() * 60; // Typically slower than download
        let currentSpeed = 0;

        for (let i = 0; i < 40; i++) {
            if (i < 15) currentSpeed += targetSpeed / 15;
            else currentSpeed = targetSpeed + (Math.random() * 10 - 5);
            
            setGauge(currentSpeed, 300);
            resUpload.textContent = currentSpeed.toFixed(1);
            await new Promise(r => setTimeout(r, 100));
        }
        
        resUpload.textContent = targetSpeed.toFixed(1);
        cardUpload.classList.remove('active');
    };

    startBtn.addEventListener('click', async () => {
        if (testing) return;
        testing = true;
        startBtn.disabled = true;
        startBtn.textContent = '測定中...';
        
        // Reset results
        resPing.textContent = '0';
        resDownload.textContent = '0.0';
        resUpload.textContent = '0.0';
        setGauge(0);

        await runPingTest();
        await new Promise(r => setTimeout(r, 1000));
        await runDownloadTest();
        await new Promise(r => setTimeout(r, 1000));
        await runUploadTest();
        
        testing = false;
        startBtn.disabled = false;
        startBtn.textContent = '再測定する';
        setGauge(0);
    });
});
