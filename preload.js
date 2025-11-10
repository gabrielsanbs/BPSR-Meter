const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    setWindowMovable: (movable) => ipcRenderer.send('set-window-movable', movable),
    closeWindow: () => ipcRenderer.send('close-window'),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    resizeWindow: (width, height) => ipcRenderer.send('resize-window', width, height),
    toggleLockState: () => ipcRenderer.send('toggle-lock-state'),
    onLockStateChanged: (callback) => ipcRenderer.on('lock-state-changed', (event, isLocked) => callback(isLocked)),
    openHistoryWindow: () => ipcRenderer.send('open-history-window'),
    openSettingsWindow: () => ipcRenderer.send('open-settings-window'),
    settingsChanged: (settings) => ipcRenderer.send('settings-changed', settings),
    onSettingsChanged: (callback) => ipcRenderer.on('settings-changed', (event, settings) => callback(settings)),
    // Função para drag manual (recebe deltaX e deltaY)
    windowDragMove: (deltaX, deltaY) => ipcRenderer.send('window-drag-move', deltaX, deltaY),
    // Função para controlar setIgnoreMouseEvents quando travado
    setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
    // Controle do polling de posição do mouse
    startMousePolling: () => ipcRenderer.send('start-mouse-polling'),
    stopMousePolling: () => ipcRenderer.send('stop-mouse-polling'),
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
