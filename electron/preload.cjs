// electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('migrationApi', {
  // Configuration management
  loadConfig: () => ipcRenderer.invoke('load-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // Remote creation
  createRemote: (params) => ipcRenderer.invoke('create-remote', params),
  
  // Backup/Restore execution
  startBackup: (config) => ipcRenderer.invoke('start-backup', config),
  startRestore: (config) => ipcRenderer.invoke('start-restore', config),
  
  // Listen to progress events
  onRcloneProgress: (callback) => ipcRenderer.on('rclone-progress', (event, data) => callback(data)),
  offRcloneProgress: () => ipcRenderer.removeAllListeners('rclone-progress'),
});
