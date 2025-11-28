export type MigrationMode = 'backup' | 'restore';

export type StorageType = 's3' | 's3-compatible' | 'onedrive' | 'sharepoint';

export type ProfileFolder = 'Desktop' | 'Documents' | 'Downloads' | 'Pictures' | 'Videos';

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
  // Storage-specific fields
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  region?: string;
}

export interface MigrationConfig {
  version: string;
  mode: MigrationMode;
  timestamp: string;
  username: string;
  remoteName: string;
  basePath: string;
  folders: {
    profileFolders: {
      type: ProfileFolder;
      localPath: string;
      remotePath: string;
    }[];
    customFolders: {
      id: string;
      name: string;
      localPath: string;
      remotePath: string;
    }[];
  };
  options?: {
    excludePatterns?: string[];
    includeHidden?: boolean;
    verifyTransfer?: boolean;
  };
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
