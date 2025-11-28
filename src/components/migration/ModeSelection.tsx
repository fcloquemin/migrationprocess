import { Upload, Download } from "lucide-react";
import { MigrationMode } from "@/types/migration";
import { Button } from "@/components/ui/button";

interface ModeSelectionProps {
  onSelectMode: (mode: MigrationMode) => void;
}

export const ModeSelection = ({ onSelectMode }: ModeSelectionProps) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">User Profile Migration</h1>
        <p className="text-muted-foreground text-lg">
          Choose whether you want to backup your data or restore from a previous backup
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <button
          onClick={() => onSelectMode('backup')}
          className="group relative bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-primary"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center">
              <Upload className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">Backup</h2>
              <p className="text-muted-foreground">
                Save your Desktop, Documents, and other folders to the cloud
              </p>
            </div>
            <Button variant="outline" size="lg" className="w-full" asChild>
              <span>Start Backup</span>
            </Button>
          </div>
        </button>

        <button
          onClick={() => onSelectMode('restore')}
          className="group relative bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-primary"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center">
              <Download className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">Restore</h2>
              <p className="text-muted-foreground">
                Retrieve your files from a previous backup in the cloud
              </p>
            </div>
            <Button variant="outline" size="lg" className="w-full" asChild>
              <span>Start Restore</span>
            </Button>
          </div>
        </button>
      </div>
    </div>
  );
};
