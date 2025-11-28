import { useState, useEffect } from "react";
import { Upload, Download, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { TransferProgress as TransferProgressType, TransferSummary } from "@/types/migration";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TransferProgressProps {
  mode: 'backup' | 'restore';
  folderCount: number;
  onComplete: (summary: TransferSummary) => void;
  onCancel: () => void;
}

export const TransferProgress = ({ mode, folderCount, onComplete, onCancel }: TransferProgressProps) => {
  const [status, setStatus] = useState<'ready' | 'transferring' | 'complete'>('ready');
  const [progress, setProgress] = useState<TransferProgressType>({
    totalFiles: 0,
    transferredFiles: 0,
    totalBytes: 0,
    transferredBytes: 0,
    currentFile: '',
    speed: 0,
    eta: 0,
    errors: [],
  });

  // Simulate transfer progress (in real app, this would come from rclone)
  useEffect(() => {
    if (status === 'transferring') {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newTransferred = Math.min(prev.transferredFiles + 5, 100);
          const newBytes = Math.min(prev.transferredBytes + 5000000, 500000000);
          
          if (newTransferred >= 100) {
            setTimeout(() => {
              setStatus('complete');
              onComplete({
                success: true,
                mode,
                foldersProcessed: folderCount,
                totalFiles: 100,
                totalBytes: 500000000,
                duration: 120,
                errors: [],
                timestamp: new Date().toISOString(),
              });
            }, 1000);
          }

          return {
            totalFiles: 100,
            transferredFiles: newTransferred,
            totalBytes: 500000000,
            transferredBytes: newBytes,
            currentFile: `folder${Math.floor(newTransferred / 20)}/file${newTransferred}.txt`,
            speed: 5000000,
            eta: (100 - newTransferred) * 0.5,
            errors: [],
          };
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [status, mode, folderCount, onComplete]);

  const startTransfer = () => {
    setStatus('transferring');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const progressPercent = progress.totalFiles > 0
    ? (progress.transferredFiles / progress.totalFiles) * 100
    : 0;

  if (status === 'complete') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
          <CheckCircle className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-2">
          {mode === 'backup' ? 'Backup Complete!' : 'Restore Complete!'}
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          {mode === 'backup'
            ? 'Your files have been safely backed up to the cloud'
            : 'Your files have been successfully restored'}
        </p>

        <div className="bg-card rounded-xl p-8 shadow-md space-y-4 text-left">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Folders processed:</span>
            <span className="font-semibold">{folderCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total files:</span>
            <span className="font-semibold">{progress.totalFiles}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total size:</span>
            <span className="font-semibold">{formatBytes(progress.totalBytes)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-semibold">~2 minutes</span>
          </div>
        </div>

        {mode === 'backup' && (
          <Alert className="mt-6 border-primary bg-primary/5">
            <AlertDescription className="text-primary">
              You can now sign out and move to your new session. Use "Restore" mode to retrieve your files.
            </AlertDescription>
          </Alert>
        )}

        <Button size="lg" onClick={() => window.location.reload()} className="mt-8 w-full">
          Start New Migration
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
          {mode === 'backup' ? (
            <Upload className="w-8 h-8 text-primary-foreground" />
          ) : (
            <Download className="w-8 h-8 text-primary-foreground" />
          )}
        </div>
        <h1 className="text-3xl font-bold mb-2">
          {status === 'ready' ? 'Ready to Transfer' : 'Transfer in Progress'}
        </h1>
        <p className="text-muted-foreground">
          {status === 'ready'
            ? `Click "Start" to begin ${mode === 'backup' ? 'backing up' : 'restoring'} your files`
            : `${mode === 'backup' ? 'Backing up' : 'Restoring'} ${folderCount} folder${folderCount !== 1 ? 's' : ''}...`}
        </p>
      </div>

      <div className="bg-card rounded-xl p-8 shadow-md space-y-6">
        {status === 'transferring' && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-semibold">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>

            <div className="space-y-3 py-4 border-y">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{progress.currentFile}</div>
                  <div className="text-xs text-muted-foreground">Current file</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Files</div>
                <div className="font-semibold">{progress.transferredFiles} / {progress.totalFiles}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Size</div>
                <div className="font-semibold">{formatBytes(progress.transferredBytes)} / {formatBytes(progress.totalBytes)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Speed</div>
                <div className="font-semibold">{formatBytes(progress.speed)}/s</div>
              </div>
              <div>
                <div className="text-muted-foreground">ETA</div>
                <div className="font-semibold">{formatTime(progress.eta)}</div>
              </div>
            </div>
          </>
        )}

        {status === 'ready' && (
          <div className="text-center py-8">
            <Alert className="mb-6">
              <AlertDescription>
                This process will {mode === 'backup' ? 'upload' : 'download'} {folderCount} folder{folderCount !== 1 ? 's' : ''}.
                Make sure you have a stable internet connection.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {progress.errors.length > 0 && (
          <Alert className="border-destructive bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {progress.errors.length} error{progress.errors.length !== 1 ? 's' : ''} occurred during transfer
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex gap-4 mt-8">
        {status === 'ready' ? (
          <>
            <Button variant="outline" size="lg" onClick={onCancel} className="flex-1">
              Back
            </Button>
            <Button size="lg" onClick={startTransfer} className="flex-1">
              Start {mode === 'backup' ? 'Backup' : 'Restore'}
            </Button>
          </>
        ) : (
          <Button variant="outline" size="lg" onClick={onCancel} className="w-full">
            Cancel Transfer
          </Button>
        )}
      </div>
    </div>
  );
};
