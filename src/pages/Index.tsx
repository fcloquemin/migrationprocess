import { useState, useEffect } from "react";
import { MigrationMode, RcloneConfig, FolderSelection, TransferSummary, MigrationConfig } from "@/types/migration";
import { Stepper } from "@/components/migration/Stepper";
import { ModeSelection } from "@/components/migration/ModeSelection";
import { CloudConfig } from "@/components/migration/CloudConfig";
import { FolderSelection as FolderSelectionComponent } from "@/components/migration/FolderSelection";
import { TransferProgress } from "@/components/migration/TransferProgress";
import { createMigrationConfig, downloadConfigFromCloud, loadConfigLocally } from "@/utils/migrationConfig";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { number: 1, title: "Mode", description: "Backup or Restore" },
  { number: 2, title: "Cloud", description: "Configure storage" },
  { number: 3, title: "Folders", description: "Select data" },
  { number: 4, title: "Transfer", description: "Execute & finish" },
];

const Index = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [mode, setMode] = useState<MigrationMode | null>(null);
  const [cloudConfig, setCloudConfig] = useState<RcloneConfig | null>(null);
  const [folderSelection, setFolderSelection] = useState<FolderSelection | null>(null);
  const [migrationConfig, setMigrationConfig] = useState<MigrationConfig | null>(null);
  const [existingConfig, setExistingConfig] = useState<MigrationConfig | null>(null);

  // Try to load existing config on mount
  useEffect(() => {
    const loadExisting = async () => {
      const config = await loadConfigLocally();
      if (config) {
        setExistingConfig(config);
        console.log('Loaded existing config:', config);
      }
    };
    loadExisting();
  }, []);

  const handleModeSelect = (selectedMode: MigrationMode) => {
    setMode(selectedMode);
    setCurrentStep(2);
  };

  const handleCloudConfigured = async (config: RcloneConfig) => {
    setCloudConfig(config);
    
    // In restore mode, try to download existing config from cloud
    if (mode === 'restore') {
      toast({
        title: "Checking for backup...",
        description: "Looking for existing backup configuration in the cloud",
      });
      
      const cloudConfig = await downloadConfigFromCloud(config.remoteName, config.metaPath);
      if (cloudConfig) {
        setExistingConfig(cloudConfig);
        toast({
          title: "Backup found!",
          description: `Found backup from ${new Date(cloudConfig.created_at).toLocaleDateString()}`,
        });
      } else {
        toast({
          title: "No backup found",
          description: "No previous backup configuration was found in the cloud",
          variant: "destructive",
        });
      }
    }
    
    setCurrentStep(3);
  };

  const handleFolderSelection = (selection: FolderSelection) => {
    setFolderSelection(selection);
    
    // Create complete migration config
    if (mode && cloudConfig) {
      const config = createMigrationConfig(mode, cloudConfig, selection, existingConfig || undefined);
      setMigrationConfig(config);
      console.log('Created migration config:', config);
    }
    
    setCurrentStep(4);
  };

  const handleTransferComplete = (summary: TransferSummary) => {
    console.log('Transfer complete:', summary);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <Stepper steps={STEPS} currentStep={currentStep} />

        <div className="mt-8">
          {currentStep === 1 && (
            <ModeSelection onSelectMode={handleModeSelect} />
          )}

          {currentStep === 2 && mode && (
            <CloudConfig
              mode={mode}
              onConfigured={handleCloudConfigured}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && mode && (
            <FolderSelectionComponent
              mode={mode}
              existingConfig={mode === 'restore' ? existingConfig : null}
              onContinue={handleFolderSelection}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && mode && migrationConfig && (
            <TransferProgress
              mode={mode}
              config={migrationConfig}
              onComplete={handleTransferComplete}
              onCancel={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
