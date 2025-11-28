import { useState } from "react";
import { MigrationMode, RcloneConfig, FolderSelection, TransferSummary, ProfileFolder } from "@/types/migration";
import { Stepper } from "@/components/migration/Stepper";
import { ModeSelection } from "@/components/migration/ModeSelection";
import { CloudConfig } from "@/components/migration/CloudConfig";
import { FolderSelection as FolderSelectionComponent } from "@/components/migration/FolderSelection";
import { TransferProgress } from "@/components/migration/TransferProgress";

const STEPS = [
  { number: 1, title: "Mode", description: "Backup or Restore" },
  { number: 2, title: "Cloud", description: "Configure storage" },
  { number: 3, title: "Folders", description: "Select data" },
  { number: 4, title: "Transfer", description: "Execute & finish" },
];

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [mode, setMode] = useState<MigrationMode | null>(null);
  const [cloudConfig, setCloudConfig] = useState<RcloneConfig | null>(null);
  const [folderSelection, setFolderSelection] = useState<FolderSelection | null>(null);

  // Simulated detected folders for restore mode
  const detectedFolders: ProfileFolder[] = ['Desktop', 'Documents', 'Downloads'];

  const handleModeSelect = (selectedMode: MigrationMode) => {
    setMode(selectedMode);
    setCurrentStep(2);
  };

  const handleCloudConfigured = (config: RcloneConfig) => {
    setCloudConfig(config);
    setCurrentStep(3);
  };

  const handleFolderSelection = (selection: FolderSelection) => {
    setFolderSelection(selection);
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
              detectedFolders={mode === 'restore' ? detectedFolders : undefined}
              onContinue={handleFolderSelection}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && mode && folderSelection && (
            <TransferProgress
              mode={mode}
              folderCount={folderSelection.profileFolders.length + folderSelection.customFolders.length}
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
