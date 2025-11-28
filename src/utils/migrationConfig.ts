import { 
  MigrationConfig, 
  MigrationMode, 
  FolderConfig, 
  RcloneConfig,
  ProfileFolder,
  CustomFolder,
  FolderSelection
} from "@/types/migration";

// Default profile folder IDs and labels
const PROFILE_FOLDER_MAP: Record<ProfileFolder, string> = {
  'Desktop': 'desktop',
  'Documents': 'documents',
  'Downloads': 'downloads',
  'Pictures': 'pictures',
  'Videos': 'videos',
};

/**
 * Get Windows user profile path for a folder
 */
export const getProfilePath = (folder: ProfileFolder): string => {
  const username = getUserInfo().username;
  return `C:\\Users\\${username}\\${folder}`;
};

/**
 * Get current machine information
 * In real implementation, this would call Electron IPC to get actual system info
 */
export const getMachineInfo = () => {
  return {
    hostname: 'PLACEHOLDER-PC',
    os_version: 'Windows 11 Pro',
  };
};

/**
 * Get current user information
 * In real implementation, this would call Electron IPC to get actual user info
 */
export const getUserInfo = () => {
  return {
    username: 'username',
    domain: null,
  };
};

/**
 * Create a new migration config from wizard inputs
 */
export const createMigrationConfig = (
  mode: MigrationMode,
  rcloneConfig: RcloneConfig,
  folderSelection: FolderSelection,
  existingConfig?: MigrationConfig
): MigrationConfig => {
  const now = new Date().toISOString();
  const machine = getMachineInfo();
  const user = getUserInfo();
  
  // Build folder configs
  const folders: FolderConfig[] = [];
  
  // Add selected profile folders
  folderSelection.profileFolders.forEach(folder => {
    const localPath = getProfilePath(folder);
    const remotePath = `${rcloneConfig.basePath}/${folder}`;
    
    folders.push({
      id: PROFILE_FOLDER_MAP[folder],
      label: folder,
      local_path: localPath,
      remote_path: remotePath,
      selected: true,
      last_backup_at: existingConfig?.folders.find(f => f.id === PROFILE_FOLDER_MAP[folder])?.last_backup_at || null,
      last_restore_at: existingConfig?.folders.find(f => f.id === PROFILE_FOLDER_MAP[folder])?.last_restore_at || null,
      size_bytes_estimate: null,
    });
  });
  
  // Add custom folders
  folderSelection.customFolders.forEach(folder => {
    const remotePath = `${rcloneConfig.basePath}/Custom/${folder.name}`;
    
    folders.push({
      id: `custom_${folder.id}`,
      label: folder.name,
      local_path: folder.path,
      remote_path: remotePath,
      selected: true,
      last_backup_at: null,
      last_restore_at: null,
      size_bytes_estimate: null,
    });
  });
  
  return {
    version: '1.0',
    mode,
    created_at: existingConfig?.created_at || now,
    last_run_at: existingConfig?.last_run_at || null,
    machine,
    user,
    remote: {
      name: rcloneConfig.remoteName,
      type: rcloneConfig.storageType,
      base_path: rcloneConfig.basePath,
      meta_path: rcloneConfig.metaPath,
    },
    options: existingConfig?.options || {
      behavior_on_restore: 'skip_existing',
      exclude_patterns: ['*.tmp', 'Thumbs.db', '.DS_Store'],
      include_hidden: false,
    },
    folders,
  };
};

/**
 * Parse folder selection from existing migration config
 */
export const parseFolderSelection = (config: MigrationConfig): {
  profileFolders: ProfileFolder[];
  customFolders: CustomFolder[];
} => {
  const profileFolders: ProfileFolder[] = [];
  const customFolders: CustomFolder[] = [];
  
  config.folders.forEach(folder => {
    if (folder.selected) {
      // Check if it's a profile folder
      const profileFolder = Object.entries(PROFILE_FOLDER_MAP).find(
        ([_, id]) => id === folder.id
      );
      
      if (profileFolder) {
        profileFolders.push(profileFolder[0] as ProfileFolder);
      } else if (folder.id.startsWith('custom_')) {
        customFolders.push({
          id: folder.id.replace('custom_', ''),
          name: folder.label,
          path: folder.local_path,
        });
      }
    }
  });
  
  return { profileFolders, customFolders };
};

/**
 * Build rclone command for backup
 */
export const buildBackupCommand = (
  config: MigrationConfig,
  folder: FolderConfig
): string => {
  const excludeFlags = config.options.exclude_patterns
    .map(pattern => `--exclude "${pattern}"`)
    .join(' ');
  
  const hiddenFlag = config.options.include_hidden ? '' : '--exclude ".*"';
  
  return `rclone copy "${folder.local_path}" "${config.remote.name}:${folder.remote_path}" ${excludeFlags} ${hiddenFlag} --progress --transfers 4 --checkers 8 --retries 3`;
};

/**
 * Build rclone command for restore
 */
export const buildRestoreCommand = (
  config: MigrationConfig,
  folder: FolderConfig
): string => {
  const excludeFlags = config.options.exclude_patterns
    .map(pattern => `--exclude "${pattern}"`)
    .join(' ');
  
  const behaviorFlag = config.options.behavior_on_restore === 'overwrite' 
    ? '--ignore-existing=false' 
    : '--ignore-existing';
  
  return `rclone copy "${config.remote.name}:${folder.remote_path}" "${folder.local_path}" ${excludeFlags} ${behaviorFlag} --progress --transfers 4 --checkers 8 --retries 3`;
};

/**
 * Update config after successful backup/restore
 */
export const updateConfigAfterTransfer = (
  config: MigrationConfig,
  mode: MigrationMode
): MigrationConfig => {
  const now = new Date().toISOString();
  
  return {
    ...config,
    mode,
    last_run_at: now,
    folders: config.folders.map(folder => ({
      ...folder,
      ...(mode === 'backup' && folder.selected ? { last_backup_at: now } : {}),
      ...(mode === 'restore' && folder.selected ? { last_restore_at: now } : {}),
    })),
  };
};

/**
 * Serialize config to JSON string
 */
export const serializeConfig = (config: MigrationConfig): string => {
  return JSON.stringify(config, null, 2);
};

/**
 * Parse config from JSON string
 */
export const parseConfig = (json: string): MigrationConfig | null => {
  try {
    const config = JSON.parse(json) as MigrationConfig;
    // Validate required fields
    if (!config.version || !config.mode || !config.remote || !config.folders) {
      return null;
    }
    return config;
  } catch (error) {
    console.error('Failed to parse migration config:', error);
    return null;
  }
};

/**
 * Mock function to save config locally
 * In real implementation, this would call Electron IPC to write to disk
 */
export const saveConfigLocally = async (config: MigrationConfig): Promise<boolean> => {
  console.log('Saving config locally:', config);
  // Mock implementation
  localStorage.setItem('migration_config', serializeConfig(config));
  return true;
};

/**
 * Mock function to load config from local storage
 * In real implementation, this would call Electron IPC to read from disk
 */
export const loadConfigLocally = async (): Promise<MigrationConfig | null> => {
  console.log('Loading config locally');
  // Mock implementation
  const json = localStorage.getItem('migration_config');
  if (!json) return null;
  return parseConfig(json);
};

/**
 * Mock function to upload config to cloud
 * In real implementation, this would execute rclone copy command
 */
export const uploadConfigToCloud = async (config: MigrationConfig): Promise<boolean> => {
  console.log('Uploading config to cloud:', `${config.remote.name}:${config.remote.meta_path}/migration_config.json`);
  // Mock implementation
  return true;
};

/**
 * Mock function to download config from cloud
 * In real implementation, this would execute rclone copy command
 */
export const downloadConfigFromCloud = async (
  remoteName: string,
  metaPath: string
): Promise<MigrationConfig | null> => {
  console.log('Downloading config from cloud:', `${remoteName}:${metaPath}/migration_config.json`);
  // Mock implementation - try to load from localStorage
  return loadConfigLocally();
};
