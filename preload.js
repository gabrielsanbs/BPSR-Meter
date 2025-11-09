const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    setWindowMovable: (movable) => ipcRenderer.send('set-window-movable', movable),
    closeWindow: () => ipcRenderer.send('close-window'),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    resizeWindow: (width, height) => ipcRenderer.send('resize-window', width, height),
    toggleLockState: () => ipcRenderer.send('toggle-lock-state'),
    onLockStateChanged: (callback) => ipcRenderer.on('lock-state-changed', (event, isLocked) => callback(isLocked)),
    openHistoryWindow: () => ipcRenderer.send('open-history-window'),
    // Função para drag manual (recebe deltaX e deltaY)
    windowDragMove: (deltaX, deltaY) => ipcRenderer.send('window-drag-move', deltaX, deltaY),
});

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type]);
    }
});
