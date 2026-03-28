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
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            micStatus.textContent = 'CONNECTED';
            micStatus.style.color = 'var(--accent)';
            startBtn.disabled = true;
            micError.style.display = 'none';

            draw();
        } catch (err) {
            console.error('Mic access denied:', err);
            micError.style.display = 'block';
        }
    };

    const stopTest = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            audioCtx.close();
            cancelAnimationFrame(animationId);
            
            micStatus.textContent = 'DISCONNECTED';
            micStatus.style.color = 'var(--danger)';
            startBtn.disabled = false;
            inputLevelVal.textContent = '0%';
            micPulse.style.transform = 'scale(1)';
            micGlow.style.opacity = '0';
        }
    };

    const draw = () => {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        // Visual Layout
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
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

        // Update levels and Pulse UI
        const level = peak; 
        inputLevelVal.textContent = Math.round(level * 100) + '%';
        updateMaxVol(level);
        
        const scale = 1 + level * 0.4;
        micPulse.style.transform = `scale(${scale})`;
        micGlow.style.opacity = level * 2;

        animationId = requestAnimationFrame(draw);
    };

    startBtn.addEventListener('click', startTest);
    stopBtn.addEventListener('click', stopTest);
});
