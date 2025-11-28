import { useState, useEffect } from "react";
import { Folder, Plus, X, CheckCircle, Info } from "lucide-react";
import { ProfileFolder, CustomFolder, FolderSelection as FolderSelectionType, MigrationConfig } from "@/types/migration";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseFolderSelection } from "@/utils/migrationConfig";

interface FolderSelectionProps {
  mode: 'backup' | 'restore';
  existingConfig?: MigrationConfig | null;
  onContinue: (selection: FolderSelectionType) => void;
  onBack: () => void;
}

const PROFILE_FOLDERS: ProfileFolder[] = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Videos'];

export const FolderSelection = ({ mode, existingConfig, onContinue, onBack }: FolderSelectionProps) => {
  const [selectedFolders, setSelectedFolders] = useState<ProfileFolder[]>([]);
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customFolderName, setCustomFolderName] = useState('');
  const [customFolderPath, setCustomFolderPath] = useState('');
  const [configLoaded, setConfigLoaded] = useState(false);

  // Load existing config if in restore mode
  useEffect(() => {
    if (mode === 'restore' && existingConfig && !configLoaded) {
      const { profileFolders, customFolders: customFoldersFromConfig } = parseFolderSelection(existingConfig);
      setSelectedFolders(profileFolders);
      setCustomFolders(customFoldersFromConfig);
      setConfigLoaded(true);
    }
  }, [mode, existingConfig, configLoaded]);

  const toggleFolder = (folder: ProfileFolder) => {
    setSelectedFolders(prev =>
      prev.includes(folder)
        ? prev.filter(f => f !== folder)
        : [...prev, folder]
    );
  };

  const addCustomFolder = () => {
    if (customFolderName && customFolderPath) {
      setCustomFolders(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          name: customFolderName,
          path: customFolderPath,
        }
      ]);
      setCustomFolderName('');
      setCustomFolderPath('');
      setShowAddCustom(false);
    }
  };

  const removeCustomFolder = (id: string) => {
    setCustomFolders(prev => prev.filter(f => f.id !== id));
  };

  const handleContinue = () => {
    onContinue({
      profileFolders: selectedFolders,
      customFolders,
    });
  };

  const totalSelected = selectedFolders.length + customFolders.length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
          <Folder className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Select Folders</h1>
        <p className="text-muted-foreground">
          {mode === 'backup'
            ? 'Choose which folders to backup to the cloud'
            : 'Select which folders to restore from your backup'}
        </p>
      </div>

      {mode === 'restore' && existingConfig && (
        <Alert className="mb-6 border-primary bg-primary/5">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            Found a previous backup from {new Date(existingConfig.created_at).toLocaleDateString()} with {existingConfig.folders.filter(f => f.selected).length} folders.
            {existingConfig.last_run_at && (
              <span className="block mt-1">
                Last backup: {new Date(existingConfig.last_run_at).toLocaleString()}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {mode === 'backup' && (
        <Alert className="mb-6 border-border bg-muted/50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Selected folders will be backed up to the cloud. A configuration file will be saved to help restore your data later.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-card rounded-xl p-8 shadow-md space-y-6">
        <div>
          <h3 className="font-semibold mb-4 text-lg">Profile Folders</h3>
          <div className="space-y-3">
            {PROFILE_FOLDERS.map(folder => (
              <label
                key={folder}
                className="flex items-center p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <Checkbox
                  checked={selectedFolders.includes(folder)}
                  onCheckedChange={() => toggleFolder(folder)}
                  className="mr-4"
                />
                <div className="flex-1">
                  <div className="font-medium group-hover:text-primary transition-colors">
                    {folder}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    C:\Users\[Username]\{folder}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {customFolders.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4 text-lg">Custom Folders</h3>
            <div className="space-y-3">
              {customFolders.map(folder => (
                <div
                  key={folder.id}
                  className="flex items-center p-4 rounded-lg border-2 border-primary/30 bg-primary/5"
                >
                  <div className="flex-1">
                    <div className="font-medium">{folder.name}</div>
                    <div className="text-sm text-muted-foreground">{folder.path}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomFolder(folder.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showAddCustom ? (
          <div className="p-4 rounded-lg border-2 border-dashed border-border space-y-3">
            <Input
              placeholder="Folder name"
              value={customFolderName}
              onChange={(e) => setCustomFolderName(e.target.value)}
            />
            <Input
              placeholder="Full path (e.g., C:\Custom\Folder)"
              value={customFolderPath}
              onChange={(e) => setCustomFolderPath(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addCustomFolder}>
                Add Folder
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddCustom(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowAddCustom(true)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Folder
          </Button>
        )}

        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total selected:</span>
            <span className="font-semibold">{totalSelected} folder{totalSelected !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <Button variant="outline" size="lg" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={totalSelected === 0}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
