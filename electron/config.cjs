// electron/config.cjs
const fs = require('fs').promises;
const path = require('path');

// Localiser le dossier portable (à côté de l'exe)
function getPortableDataDir() {
  // En dev : dossier du projet, en prod : à côté de l'exe
  const baseDir = process.env.PORTABLE_EXECUTABLE_DIR 
    ? process.env.PORTABLE_EXECUTABLE_DIR 
    : process.cwd();
  return path.join(baseDir, 'data');
}

// Initialiser le dossier /data s'il n'existe pas
async function ensureDataDir() {
  const dir = getPortableDataDir();
  try {
    await fs.mkdir(dir, { recursive: true });
    return dir;
  } catch (err) {
    console.error('Error creating data dir:', err);
    throw err;
  }
}

// Charger migration_config.json
async function loadMigrationConfig() {
  try {
    const dataDir = await ensureDataDir();
    const configPath = path.join(dataDir, 'migration_config.json');
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null; // Fichier n'existe pas encore
    }
    console.error('Error loading config:', err);
    throw err;
  }
}

// Sauvegarder migration_config.json
async function saveMigrationConfig(config) {
  const dataDir = await ensureDataDir();
  const configPath = path.join(dataDir, 'migration_config.json');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  return configPath;
}

// Obtenir les infos système Windows (hostname, username, version OS)
function getSystemInfo() {
  const os = require('os');
  return {
    hostname: os.hostname(),
    username: process.env.USERNAME || 'user',
    os_version: `${os.platform()} ${os.release()}`,
  };
}

module.exports = {
  getPortableDataDir,
  ensureDataDir,
  loadMigrationConfig,
  saveMigrationConfig,
  getSystemInfo,
};
