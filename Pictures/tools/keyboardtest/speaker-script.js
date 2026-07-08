document.addEventListener('DOMContentLoaded', () => {
    const channelVal = document.getElementById('current-channel');
    const freqVal = document.getElementById('current-freq');
    const balanceVal = document.getElementById('current-balance');
    const freqSlider = document.getElementById('freq-slider');
    const playBtn = document.getElementById('play-freq');
    const stopBtn = document.getElementById('stop-freq');
    const triggers = document.querySelectorAll('.test-trigger');

    let audioCtx = null;
    let oscillator = null;
    let gainNode = null;
    let panner = null;

    const initAudio = () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioCtx.createGain();
            panner = audioCtx.createStereoPanner();
            gainNode.connect(panner);
            panner.connect(audioCtx.destination);
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    };

    // stop() throws if the oscillator already ended — always guard it
    const stopOscillator = (osc) => {
        if (!osc) return;
        try {
            osc.stop();
        } catch (e) { /* already stopped */ }
    };

    const playTone = (freq, pan = 0, duration = 0) => {
        initAudio();
        stopOscillator(oscillator);

        const osc = audioCtx.createOscillator();
        oscillator = osc;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.connect(gainNode);

        panner.pan.setValueAtTime(pan, audioCtx.currentTime);
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);

        osc.start();

        if (duration > 0) {
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime + Math.max(0.05, duration - 0.1));
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
            // capture `osc` so this timer can never kill a tone started after it
            setTimeout(() => {
                stopOscillator(osc);
                if (oscillator === osc) oscillator = null;
            }, duration * 1000);
        }
    };

    const stopTone = () => {
        if (!gainNode || !oscillator) return;
        const osc = oscillator;
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
        setTimeout(() => {
            stopOscillator(osc);
            if (oscillator === osc) oscillator = null;
        }, 150);
    };

    const sideLabels = { left: '左 (LEFT)', right: '右 (RIGHT)' };

    triggers.forEach(btn => {
        btn.addEventListener('click', () => {
            const side = btn.dataset.side;
            const pan = side === 'left' ? -1 : 1;
            const container = document.getElementById(`spk-${side}`);
            const cone = container.querySelector('.spk-cone');

            channelVal.textContent = sideLabels[side];
            balanceVal.textContent = sideLabels[side];
            playBtn.disabled = false; // any continuous tone has been replaced

            playTone(440, pan, 1.5);

            container.style.borderColor = 'var(--primary)';
            cone.style.transform = 'scale(1.1)';
            setTimeout(() => {
                container.style.borderColor = '';
                cone.style.transform = '';
                channelVal.textContent = 'なし';
                balanceVal.textContent = 'センター';
            }, 1500);
        });
    });

    playBtn.addEventListener('click', () => {
        const freq = Number(freqSlider.value);
        channelVal.textContent = '両方 (STEREO)';
        balanceVal.textContent = 'センター';
        playTone(freq, 0);
        playBtn.disabled = true;
    });

    stopBtn.addEventListener('click', () => {
        stopTone();
        channelVal.textContent = 'なし';
        playBtn.disabled = false;
    });

    freqSlider.addEventListener('input', () => {
        const val = Number(freqSlider.value);
        freqVal.textContent = val + 'Hz';
        if (oscillator) {
            oscillator.frequency.setTargetAtTime(val, audioCtx.currentTime, 0.01);
        }
    });
});
