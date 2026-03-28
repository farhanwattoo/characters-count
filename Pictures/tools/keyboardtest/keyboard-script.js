document.addEventListener('DOMContentLoaded', () => {
    const lastKeyName = document.getElementById('last-key-name');
    const lastKeyCode = document.getElementById('last-key-code');
    const keysCount = document.getElementById('keys-count');
    const activeKeysCount = document.getElementById('active-keys-count');
    const testStatus = document.getElementById('test-status');
    const resetBtn = document.getElementById('reset-keyboard');
    const clearHistoryBtn = document.getElementById('clear-history');
    const keyHistory = document.getElementById('key-history');
    
    // Key Name Translation Mapping
    const keyMap = {
        'Escape': 'Esc',
        'Backspace': '後退',
        'Tab': 'タブ',
        'Enter': '改行',
        'ShiftLeft': '左シフト',
        'ShiftRight': '右シフト',
        'ControlLeft': '左Ctrl',
        'ControlRight': '右Ctrl',
        'AltLeft': '左Alt',
        'AltRight': '右Alt',
        'MetaLeft': 'Win',
        'MetaRight': 'Win',
        'Space': 'スペース',
        'ArrowUp': '↑',
        'ArrowDown': '↓',
        'ArrowLeft': '←',
        'ArrowRight': '→',
        'CapsLock': '英数/Caps',
        'Insert': '挿入',
        'Delete': '削除',
        'Home': 'ホーム',
        'End': 'エンド',
        'PageUp': 'ページ上',
        'PageDown': 'ページ下',
        'NonConvert': '無変換',
        'Convert': '変換',
        'KanaMode': 'カタカナ',
        'PrintScreen': 'PrtSc',
        'ScrollLock': 'ScrLk',
        'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5', 'F6': 'F6',
        'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12',
        'Numpad0': 'Num 0', 'Numpad1': 'Num 1', 'Numpad2': 'Num 2', 'Numpad3': 'Num 3',
        'Numpad4': 'Num 4', 'Numpad5': 'Num 5', 'Numpad6': 'Num 6', 'Numpad7': 'Num 7',
        'Numpad8': 'Num 8', 'Numpad9': 'Num 9', 'NumpadDecimal': 'Num .',
        'NumpadEnter': 'Num 改行', 'NumpadAdd': 'Num +', 'NumpadSubtract': 'Num -',
        'NumpadMultiply': 'Num *', 'NumpadDivide': 'Num /', 'NumLock': 'NumLk'
    };

    const pressedKeysList = new Set();
    const verifiedKeys = new Set();

    function addHistoryLine(code, name) {
        if (keyHistory.children[0] && keyHistory.children[0].style.color === 'var(--text-muted)') {
            keyHistory.innerHTML = '';
        }
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 });
        const line = document.createElement('div');
        line.innerHTML = `<span style="color: var(--text-muted)">[${time}]</span> ${name} (${code}) <span style="color: var(--primary)">Down</span>`;
        keyHistory.prepend(line);
        if (keyHistory.children.length > 50) keyHistory.removeChild(keyHistory.lastChild);
    }

    function updateStatus() {
        keysCount.textContent = verifiedKeys.size;
        activeKeysCount.textContent = pressedKeysList.size;
        
        const activeCount = pressedKeysList.size;
        if (activeCount > 1) {
            testStatus.textContent = `${activeCount}キー 同時押し中`;
            testStatus.style.color = 'var(--primary)';
        } else if (verifiedKeys.size > 0) {
            testStatus.textContent = 'テスト中...';
            testStatus.style.color = 'var(--primary)';
        } else {
            testStatus.textContent = '待機中';
            testStatus.style.color = 'var(--accent)';
        }
    }

    const onKeyDown = (e) => {
        // Prevent default for keys that interfere with testing, but keep Ctrl/Cmd for shortcuts
        const forbiddenKeys = ['F1', 'F3', 'F5', 'F6', 'F7', 'F10', 'F11', 'F12', 'Tab', 'AltLeft', 'AltRight', 'ContextMenu'];
        if (forbiddenKeys.includes(e.code)) {
            e.preventDefault();
        }

        const displayName = keyMap[e.code] || e.key;
        const finalName = displayName === ' ' ? 'スペース' : displayName;
        
        lastKeyName.textContent = finalName;
        lastKeyCode.textContent = e.code;
        
        if (!pressedKeysList.has(e.code)) {
            pressedKeysList.add(e.code);
            addHistoryLine(e.code, finalName);
        }
        
        verifiedKeys.add(e.code);
        
        const keyElement = document.querySelector(`.kb-key[data-key="${e.code}"]`);
        if (keyElement) {
            keyElement.classList.add('active');
            keyElement.classList.add('pressed');
        }
        
        updateStatus();
    };

    const onKeyUp = (e) => {
        pressedKeysList.delete(e.code);
        const keyElement = document.querySelector(`.kb-key[data-key="${e.code}"]`);
        if (keyElement) {
            keyElement.classList.remove('active');
        }
        updateStatus();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    resetBtn.addEventListener('click', () => {
        const keys = document.querySelectorAll('.kb-key');
        keys.forEach(k => {
            k.classList.remove('active');
            k.classList.remove('pressed');
        });
        pressedKeysList.clear();
        verifiedKeys.clear();
        lastKeyName.textContent = '-';
        lastKeyCode.textContent = '0';
        updateStatus();
    });

    clearHistoryBtn.addEventListener('click', () => {
        keyHistory.innerHTML = '<div style="color: var(--text-muted);">ここに入力履歴が表示されます...</div>';
    });

    window.addEventListener('blur', () => {
        const keys = document.querySelectorAll('.kb-key');
        keys.forEach(k => k.classList.remove('active'));
        pressedKeysList.clear();
        updateStatus();
    });
});
