// src/services/migrationService.ts
import { MigrationConfig, RcloneConfig } from '@/types/migration';

// Vérifier que l'API Electron est dispo
function getApi() {
  if (!(window as any).migrationApi) {
    throw new Error('Migration API not available. Are you running in Electron?');
  }
  return (window as any).migrationApi;
}

export const migrationService = {
  // Charger la config sauvegardée
  async loadConfig(): Promise<MigrationConfig | null> {
    const api = getApi();
    const result = await api.loadConfig();
    if (result.success) {
      return result.data;
    }
    return null;
  },

  // Sauvegarder la config
  async saveConfig(config: MigrationConfig): Promise<void> {
    const api = getApi();
    const result = await api.saveConfig(config);
    if (!result.success) {
      throw new Error(result.error || 'Failed to save config');
    }
  },

  // Créer un remote rclone
  async createRemote(remoteName: string, type: string, options: Record<string, any>): Promise<void> {
    const api = getApi();
    const result = await api.createRemote({
      remoteName,
      type,
      options,
      shell: 'powershell',
    });
    if (!result.success) {
      throw new Error(result.error || 'Failed to create remote');
    }
  },

  // Lancer un backup
  async startBackup(config: MigrationConfig): Promise<void> {
    const api = getApi();
    const result = await api.startBackup(config);
    if (!result.success) {
      throw new Error(result.error || 'Failed to start backup');
    }
  },

  // Lancer une restore
  async startRestore(config: MigrationConfig): Promise<void> {
    const api = getApi();
    const result = await api.startRestore(config);
    if (!result.success) {
      throw new Error(result.error || 'Failed to start restore');
    }
  },
};
