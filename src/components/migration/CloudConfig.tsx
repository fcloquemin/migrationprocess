import { useState } from "react";
import { Cloud, CheckCircle, AlertCircle } from "lucide-react";
import { StorageType, RcloneConfig } from "@/types/migration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CloudConfigProps {
  mode: 'backup' | 'restore';
  onConfigured: (config: RcloneConfig) => void;
  onBack: () => void;
}

export const CloudConfig = ({ mode, onConfigured, onBack }: CloudConfigProps) => {
  const [storageType, setStorageType] = useState<StorageType>('s3');
  const [remoteName, setRemoteName] = useState('migration-backup');
  const [endpoint, setEndpoint] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [bucket, setBucket] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [configStatus, setConfigStatus] = useState<'none' | 'checking' | 'found' | 'not-found'>('none');

  const handleConfigure = () => {
    const config: RcloneConfig = {
      remoteName,
      storageType,
      configPath: './rclone.conf',
      endpoint: storageType === 's3-compatible' ? endpoint : undefined,
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      bucket,
      region,
    };
    onConfigured(config);
  };

  const isS3Type = storageType === 's3' || storageType === 's3-compatible';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
          <Cloud className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Cloud Configuration</h1>
        <p className="text-muted-foreground">
          {mode === 'backup' 
            ? 'Configure your cloud storage to save your data'
            : 'Connect to your cloud storage to restore your data'}
        </p>
      </div>

      {mode === 'restore' && configStatus === 'found' && (
        <Alert className="mb-6 border-primary bg-primary/5">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            Found existing backup configuration! Your settings have been loaded automatically.
          </AlertDescription>
        </Alert>
      )}

      {mode === 'restore' && configStatus === 'not-found' && (
        <Alert className="mb-6 border-destructive bg-destructive/5">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            No backup configuration found. Please enter your cloud settings manually.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-card rounded-xl p-8 shadow-md space-y-6">
        <div className="space-y-2">
          <Label htmlFor="storage-type">Storage Type</Label>
          <Select value={storageType} onValueChange={(v) => setStorageType(v as StorageType)}>
            <SelectTrigger id="storage-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="s3">Amazon S3</SelectItem>
              <SelectItem value="s3-compatible">S3-Compatible Storage</SelectItem>
              <SelectItem value="onedrive">OneDrive</SelectItem>
              <SelectItem value="sharepoint">SharePoint</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="remote-name">Remote Name</Label>
          <Input
            id="remote-name"
            value={remoteName}
            onChange={(e) => setRemoteName(e.target.value)}
            placeholder="migration-backup"
          />
        </div>

        {isS3Type && (
          <>
            {storageType === 's3-compatible' && (
              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint URL</Label>
                <Input
                  id="endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://s3.example.com"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="access-key">Access Key ID</Label>
              <Input
                id="access-key"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Your access key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret-key">Secret Access Key</Label>
              <Input
                id="secret-key"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Your secret key"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bucket">Bucket Name</Label>
                <Input
                  id="bucket"
                  value={bucket}
                  onChange={(e) => setBucket(e.target.value)}
                  placeholder="my-backup-bucket"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="us-east-1"
                />
              </div>
            </div>
          </>
        )}

        {(storageType === 'onedrive' || storageType === 'sharepoint') && (
          <Alert>
            <AlertDescription>
              OneDrive and SharePoint authentication will open in your browser for secure login.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex gap-4 mt-8">
        <Button variant="outline" size="lg" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button size="lg" onClick={handleConfigure} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
};
