document.addEventListener('DOMContentLoaded', () => {
    const lastClickName = document.getElementById('last-click-name');
    const pollingRateVal = document.getElementById('polling-rate');
    const clicksCount = document.getElementById('clicks-count');
    const scrollDirection = document.getElementById('scroll-direction');
    const resetBtn = document.getElementById('reset-mouse');
    
    // SVG Elements
    const mouseLeft = document.getElementById('mouse-left');
    const mouseRight = document.getElementById('mouse-right');
    const mouseMiddle = document.getElementById('mouse-middle');
    
    const mouseLabels = {
        0: '左クリック',
        1: '中央ボタン',
        2: '右クリック',
        3: 'サイドボタン計',
        4: 'サイドボタン計'
    };

    let lastTime = 0;
    let clickTotal = 0;
    let pollingEvents = [];

    function updateStatus(buttonName) {
        lastClickName.textContent = buttonName;
        clickTotal++;
        clicksCount.textContent = clickTotal;
    }

    const onMouseDown = (e) => {
        const buttons = mouseLabels;
        updateStatus(buttons[e.button] || '不明なボタン');
        
        if (e.button === 0) mouseLeft.setAttribute('fill', 'var(--primary)');
        if (e.button === 1) mouseMiddle.setAttribute('fill', 'var(--primary)');
        if (e.button === 2) mouseRight.setAttribute('fill', 'var(--primary)');
    };

    const onMouseUp = (e) => {
        if (e.button === 0) mouseLeft.setAttribute('fill', '#243447');
        if (e.button === 1) mouseMiddle.setAttribute('fill', '#334155');
        if (e.button === 2) mouseRight.setAttribute('fill', '#243447');
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('wheel', (e) => {
        scrollDirection.textContent = e.deltaY > 0 ? '下スクロール' : '上スクロール';
        mouseMiddle.setAttribute('fill', 'var(--secondary)');
        setTimeout(() => mouseMiddle.setAttribute('fill', '#334155'), 100);
    });

    window.addEventListener('mousemove', (e) => {
        const now = performance.now();
        if (lastTime > 0) {
            const delta = now - lastTime;
            pollingEvents.push(1000 / delta);
            if (pollingEvents.length > 50) pollingEvents.shift();
            
            const avg = pollingEvents.reduce((a, b) => a + b) / pollingEvents.length;
            pollingRateVal.textContent = Math.round(avg) + 'Hz';
        }
        lastTime = now;
    });

    resetBtn.addEventListener('click', () => {
        clickTotal = 0;
        clicksCount.textContent = '0';
        lastClickName.textContent = '-';
        scrollDirection.textContent = '-';
        pollingRateVal.textContent = '0Hz';
    });

    const canvas = document.getElementById('polling-graph');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const resize = () => {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            
            const step = canvas.width / (pollingEvents.length - 1);
            pollingEvents.forEach((val, i) => {
                const x = i * step;
                const y = canvas.height - (val / 1000) * canvas.height;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            requestAnimationFrame(draw);
        };
        draw();
    }
});
