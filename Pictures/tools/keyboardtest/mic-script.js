document.addEventListener('DOMContentLoaded', () => {
    const inputLevelVal = document.getElementById('input-level');
    const micStatus = document.getElementById('mic-status');
    const maxVolumeVal = document.getElementById('max-volume');
    const startBtn = document.getElementById('start-mic');
    const stopBtn = document.getElementById('stop-mic');
    const micPulse = document.getElementById('mic-pulse');
    const micGlow = document.getElementById('mic-glow');
    const micError = document.getElementById('mic-error');

    let audioCtx = null;
    let stream = null;
    let analyser = null;
    let animationId = null;
    let maxVol = 0;

    const canvas = document.getElementById('oscilloscope');
    const ctx = canvas.getContext('2d');

    const updateMaxVol = (val) => {
        if (val > maxVol) {
            maxVol = val;
            maxVolumeVal.textContent = Math.round(maxVol * 100) + '%';
        }
    };

    const startTest = async () => {
        if (stream) return;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            micError.textContent = 'エラー: このブラウザはマイク入力 (getUserMedia) に対応していません。';
            micError.style.display = 'block';
            return;
        }

        startBtn.disabled = true;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            micStatus.textContent = '接続中';
            micStatus.style.color = 'var(--accent)';
            micError.style.display = 'none';

            draw();
        } catch (err) {
            console.error('Mic access denied:', err);
            micError.style.display = 'block';
            micStatus.textContent = 'エラー';
            micStatus.style.color = 'var(--danger)';
            startBtn.disabled = false;
            stream = null;
        }
    };

    const stopTest = () => {
        if (!stream) return;

        cancelAnimationFrame(animationId);
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        analyser = null;
        if (audioCtx) {
            audioCtx.close();
            audioCtx = null;
        }

        micStatus.textContent = '停止中';
        micStatus.style.color = 'var(--danger)';
        startBtn.disabled = false;
        inputLevelVal.textContent = '0%';
        micPulse.style.transform = 'scale(1)';
        micGlow.style.opacity = '0';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const draw = () => {
        if (!analyser) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        // resize the backing store only when the layout actually changed
        const w = canvas.parentElement.clientWidth;
        const h = canvas.parentElement.clientHeight;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;
        let peak = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * canvas.height / 2;

            const diff = Math.abs(1.0 - v);
            if (diff > peak) peak = diff;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        const level = peak;
        inputLevelVal.textContent = Math.round(level * 100) + '%';
        updateMaxVol(level);

        micPulse.style.transform = `scale(${1 + level * 0.4})`;
        micGlow.style.opacity = Math.min(1, level * 2);

        animationId = requestAnimationFrame(draw);
    };

    startBtn.addEventListener('click', startTest);
    stopBtn.addEventListener('click', stopTest);
});
