// electron/rclone-executor.cjs
const { spawn } = require('child_process');
const path = require('path');

function getRclonePath() {
  const baseDir = process.env.PORTABLE_EXECUTABLE_DIR 
    ? process.env.PORTABLE_EXECUTABLE_DIR 
    : process.cwd();
  return path.join(baseDir, 'rclone', 'rclone.exe');
}

// Exécuter une commande rclone générique
function runRcloneCommand(args, shell = 'powershell') {
  return new Promise((resolve) => {
    const rclonePath = getRclonePath();
    let command;
    let spawnArgs;

    // Construire la ligne de commande
    if (shell === 'powershell') {
      command = `& "${rclonePath}" ${args.map(a => `"${a}"`).join(' ')}`;
      spawnArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command];
    } else {
      command = `"${rclonePath}" ${args.join(' ')}`;
      spawnArgs = ['/c', command];
    }

    const child = spawn(
      shell === 'powershell' ? 'powershell.exe' : 'cmd.exe',
      spawnArgs,
      { windowsHide: true }
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        code,
        stdout,
        stderr,
      });
    });

    child.on('error', (err) => {
      resolve({
        success: false,
        code: -1,
        stdout: '',
        stderr: err.message,
      });
    });
  });
}

// Créer un remote rclone (config create)
async function createRemote(name, type, options = {}) {
  const args = ['config', 'create', name, type];

  // Ajouter les options supplémentaires (key value key value...)
  Object.entries(options).forEach(([key, value]) => {
    args.push(key);
    args.push(String(value));
  });

  return runRcloneCommand(args);
}

// Copier/syncer des fichiers
async function runSync(source, destination, flags = []) {
  // rclone copy source:path dest:path --progress --retries 3 ...
  const args = ['copy', source, destination, '--progress', '--retries', '3', ...flags];
  return runRcloneCommand(args);
}

// Lister un chemin distant (pour vérifier la connexion)
async function listRemote(remotePath) {
  const args = ['ls', remotePath];
  return runRcloneCommand(args);
}

module.exports = {
  getRclonePath,
  runRcloneCommand,
  createRemote,
  runSync,
  listRemote,
};
