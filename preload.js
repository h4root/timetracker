const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getActivities: () => ipcRenderer.invoke('get-activities'),
  getWhitelist: () => ipcRenderer.invoke('get-whitelist'),
  addToWhitelist: (appName) => ipcRenderer.invoke('add-to-whitelist', appName),
  removeFromWhitelist: (appName) => ipcRenderer.invoke('remove-from-whitelist', appName)
});