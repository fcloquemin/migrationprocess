// electron/main.cjs
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
  // electron-squirrel-startup est optionnel, donc on protège le require
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
} catch {
  // ignore si le module n'est pas présent en dev
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- Ici on ajoutera l'IPC pour rclone (prochaine étape) ---
// electron/main.cjs - Ajouter tout ce bloc à la fin du fichier

const config = require('./config.cjs');
const rclone = require('./rclone-executor.cjs');

// === CONFIG IPC ===
ipcMain.handle('load-config', async () => {
  try {
    const migrationConfig = await config.loadMigrationConfig();
    return { success: true, data: migrationConfig };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('save-config', async (event, migrationConfig) => {
  try {
    const savedPath = await config.saveMigrationConfig(migrationConfig);
    return { success: true, path: savedPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// === REMOTE CREATION IPC ===
// Attendu : { remoteName, type, options, shell }
ipcMain.handle('create-remote', async (event, payload) => {
  const { remoteName, type, options = {} } = payload;
  
  try {
    const result = await rclone.createRemote(remoteName, type, options);
    
    if (result.success) {
      return {
        success: true,
        message: `Remote "${remoteName}" créé avec succès`,
      };
    } else {
      return {
        success: false,
        error: result.stderr || 'Erreur lors de la création du remote',
      };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// === TRANSFER IPC ===
// Pour le moment, stubs simples ; on les enrichira avec la vraie logique
ipcMain.handle('start-backup', async (event, migrationConfig) => {
  console.log('Backup lancé avec config:', migrationConfig);
  // TODO : implémenter la boucle de backup
  return { success: true, message: 'Backup démarré (stub)' };
});

ipcMain.handle('start-restore', async (event, migrationConfig) => {
  console.log('Restore lancé avec config:', migrationConfig);
  // TODO : implémenter la boucle de restore
  return { success: true, message: 'Restore démarré (stub)' };
});

// en haut du fichier main (ex: electron/main.js ou main.cjs)
const { ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
ipcMain.handle('rclone:create-onedrive', async (_event, remoteName) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'create_onedrive_remote.ps1');

    const child = spawn('powershell.exe', [
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      scriptPath,
      '-RemoteName',
      remoteName,
    ]);

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        reject({ success: false, code, error, output });
      }
    });
  });
});
