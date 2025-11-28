export type MigrationMode = 'backup' | 'restore';

export type StorageType = 's3' | 's3-compatible' | 'onedrive' | 'sharepoint';

export type ProfileFolder = 'Desktop' | 'Documents' | 'Downloads' | 'Pictures' | 'Videos';

export type RestoreBehavior = 'overwrite' | 'skip_existing' | 'ask';

// Machine information
export interface MachineInfo {
  hostname: string;
  os_version: string;
}

// User information
export interface UserInfo {
  username: string;
  domain: string | null;
}

// Remote storage configuration
export interface RemoteInfo {
  name: string;
  type: StorageType;
  base_path: string;
  meta_path: string;
}

// Migration options
export interface MigrationOptions {
  behavior_on_restore: RestoreBehavior;
  exclude_patterns: string[];
  include_hidden: boolean;
}

// Individual folder configuration
export interface FolderConfig {
  id: string;
  label: string;
  local_path: string;
  remote_path: string;
  selected: boolean;
  last_backup_at: string | null;
  last_restore_at: string | null;
  size_bytes_estimate: number | null;
}

// Complete migration configuration
export interface MigrationConfig {
  version: string;
  mode: MigrationMode;
  created_at: string;
  last_run_at: string | null;
  machine: MachineInfo;
  user: UserInfo;
  remote: RemoteInfo;
  options: MigrationOptions;
  folders: FolderConfig[];
}

// Legacy interfaces for backward compatibility
export interface CustomFolder {
  id: string;
  name: string;
  path: string;
}

export interface FolderSelection {
  profileFolders: ProfileFolder[];
  customFolders: CustomFolder[];
}

export interface RcloneConfig {
  remoteName: string;
  storageType: StorageType;
  configPath: string;
  basePath: string;
  metaPath: string;
  // Storage-specific fields
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  region?: string;
}

export interface TransferProgress {
  totalFiles: number;
  transferredFiles: number;
  totalBytes: number;
  transferredBytes: number;
  currentFile: string;
  speed: number;
  eta: number;
  errors: string[];
}

export interface TransferSummary {
  success: boolean;
  mode: MigrationMode;
  foldersProcessed: number;
  totalFiles: number;
  totalBytes: number;
  duration: number;
  errors: string[];
  timestamp: string;
}
