// src/components/migration/CloudConfig.tsx
import { useState } from "react";
import { Cloud, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { StorageType, RcloneConfig, MigrationConfig } from "@/types/migration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface CloudConfigProps {
  mode: "backup" | "restore";
  onConfigured: (config: RcloneConfig) => void;
  onBack: () => void;
}

export const CloudConfig = ({ mode, onConfigured, onBack }: CloudConfigProps) => {
  const { toast } = useToast();
  const [storageType, setStorageType] = useState<StorageType>("s3");
  const [remoteName, setRemoteName] = useState("migration-backup");
  const [endpoint, setEndpoint] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [bucket, setBucket] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [basePath, setBasePath] = useState("");
  const [metaPath, setMetaPath] = useState("");
  const [configStatus, setConfigStatus] = useState<
    "none" | "checking" | "found" | "not-found" | "error"
  >("none");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Vérifier que l'API Electron est disponible
  const getElectronApi = () => {
    if (!(window as any).migrationApi) {
      throw new Error(
        "L'API Electron n'est pas disponible. Assurez-vous que l'app s'exécute sous Electron."
      );
    }
    return (window as any).migrationApi;
  };

  const handleConfigure = async () => {
    setIsLoading(true);
    setConfigStatus("checking");
    setErrorMessage("");

    try {
      const api = getElectronApi();

      // 1. Construire les chemins auto-générés
      const username = "username"; // TODO: Récupérer du système via Electron
      const timestamp = new Date().toISOString().split("T")[0];
      const finalBasePath =
        basePath || `${bucket || "backup"}/${username}/Migration/${timestamp}`;
      const finalMetaPath =
        metaPath || `${bucket || "backup"}/${username}/_migration_config`;

      // 2. Valider les champs obligatoires selon le type
      if (!remoteName.trim()) {
        throw new Error("Le nom du remote est obligatoire");
      }

      if (storageType.startsWith("s3")) {
        if (!accessKey.trim() || !secretKey.trim()) {
          throw new Error("Les clés d'accès AWS sont obligatoires");
        }
        if (!bucket.trim()) {
          throw new Error("Le nom du bucket est obligatoire");
        }
      }

      // 3. Construire les options pour rclone config create
      const options: Record<string, any> = {};

      if (storageType === "s3") {
        options["provider"] = "AWS";
        options["access_key_id"] = accessKey;
        options["secret_access_key"] = secretKey;
        options["region"] = region;
      } else if (storageType === "s3-compatible") {
        if (!endpoint.trim()) {
          throw new Error("L'URL du endpoint est obligatoire pour S3-compatible");
        }
        options["provider"] = "Other";
        options["endpoint"] = endpoint;
        options["access_key_id"] = accessKey;
        options["secret_access_key"] = secretKey;
      } else if (storageType === "onedrive") {
        // OneDrive avec auth locale (navigateur)
        options["type"] = "onedrive";
        // rclone will open browser for auth
      } else if (storageType === "sharepoint") {
        // SharePoint avec auth locale
        options["type"] = "sharepoint";
      }

      // 4. Appeler Electron pour créer le remote rclone
      toast({
        title: "Création du remote...",
        description: `Configuration du remote "${remoteName}" en cours...`,
      });

      const createResult = await api.createRemote(remoteName, storageType, options);

      if (!createResult.success) {
        throw new Error(
          createResult.error || "Échec de la création du remote rclone"
        );
      }

      // 5. Créer l'objet RcloneConfig pour le reste du workflow
      const config: RcloneConfig = {
        remoteName,
        storageType,
        configPath: "./data/rclone.conf",
        basePath: finalBasePath,
        metaPath: finalMetaPath,
        endpoint: storageType === "s3-compatible" ? endpoint : undefined,
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        bucket,
        region,
      };

      // 6. Sauvegarder la config localement (optionnel, pour référence)
      const migrationConfig: MigrationConfig = {
        version: "1.0",
        mode,
        created_at: new Date().toISOString(),
        last_run_at: null,
        machine: { hostname: "unknown", os_version: "unknown" },
        user: { username: "unknown", domain: null },
        remote: {
          name: remoteName,
          type: storageType,
          base_path: finalBasePath,
          meta_path: finalMetaPath,
        },
        options: {
          behavior_on_restore: "skip_existing",
          exclude_patterns: ["*.tmp", "Thumbs.db"],
          include_hidden: false,
        },
        folders: [],
      };

      await api.saveConfig(migrationConfig);

      setConfigStatus("found");
      toast({
        title: "Succès!",
        description: `Le remote "${remoteName}" a été créé avec succès.`,
      });

      // 7. Transmettre la config au composant parent
      onConfigured(config);
    } catch (error: any) {
      console.error("Error during configuration:", error);
      const errorMsg = error.message || "Erreur inconnue lors de la configuration";
      setErrorMessage(errorMsg);
      setConfigStatus("error");
      toast({
        title: "Erreur",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isS3Type = storageType === "s3" || storageType === "s3-compatible";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
          <Cloud className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Configuration Cloud</h1>
        <p className="text-muted-foreground">
          {mode === "backup"
            ? "Configurez votre stockage cloud pour sauvegarder vos données"
            : "Connectez-vous à votre stockage cloud pour restaurer vos données"}
        </p>
      </div>

      {configStatus === "found" && (
        <Alert className="mb-6 border-primary bg-primary/5">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            Configuration validée! Le remote est prêt.
          </AlertDescription>
        </Alert>
      )}

      {configStatus === "error" && (
        <Alert className="mb-6 border-destructive bg-destructive/5">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-card rounded-xl p-8 shadow-md space-y-6">
        {/* Type de stockage */}
        <div className="space-y-2">
          <Label htmlFor="storage-type">Type de Stockage</Label>
          <Select
            value={storageType}
            onValueChange={(v) => setStorageType(v as StorageType)}
            disabled={isLoading}
          >
            <SelectTrigger id="storage-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="s3">Amazon S3</SelectItem>
              <SelectItem value="s3-compatible">S3-Compatible (MinIO, etc.)</SelectItem>
              <SelectItem value="onedrive">OneDrive</SelectItem>
              <SelectItem value="sharepoint">SharePoint</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Nom du remote */}
        <div className="space-y-2">
          <Label htmlFor="remote-name">Nom du Remote</Label>
          <Input
            id="remote-name"
            value={remoteName}
            onChange={(e) => setRemoteName(e.target.value)}
            placeholder="ex: migration-backup"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Nom unique pour identifier ce remote dans rclone
          </p>
        </div>

        {/* Configuration S3 / S3-Compatible */}
        {isS3Type && (
          <>
            {storageType === "s3-compatible" && (
              <div className="space-y-2">
                <Label htmlFor="endpoint">URL du Endpoint</Label>
                <Input
                  id="endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://minio.example.com"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  URL complète du serveur S3-compatible
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="access-key">Access Key ID</Label>
              <Input
                id="access-key"
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="AKIA..."
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret-key">Secret Access Key</Label>
              <Input
                id="secret-key"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bucket">Nom du Bucket</Label>
                <Input
                  id="bucket"
                  value={bucket}
                  onChange={(e) => setBucket(e.target.value)}
                  placeholder="my-backup-bucket"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Région (AWS)</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="us-east-1"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base-path">Chemin de Base (optionnel)</Label>
              <Input
                id="base-path"
                value={basePath}
                onChange={(e) => setBasePath(e.target.value)}
                placeholder="Auto-généré si vide"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Exemple: bucket-name/username/Migration/2025-11-28
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta-path">Chemin de Configuration (optionnel)</Label>
              <Input
                id="meta-path"
                value={metaPath}
                onChange={(e) => setMetaPath(e.target.value)}
                placeholder="Auto-généré si vide"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Exemple: bucket-name/username/_migration_config
              </p>
            </div>
          </>
        )}

        {/* Info OneDrive / SharePoint */}
        {(storageType === "onedrive" || storageType === "sharepoint") && (
          <Alert>
            <AlertDescription>
              L'authentification {storageType === "onedrive" ? "OneDrive" : "SharePoint"} s'ouvrira dans votre navigateur
              pour une connexion sécurisée après la validation de cette étape.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-4 mt-8">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="flex-1"
          disabled={isLoading}
        >
          Retour
        </Button>
        <Button
          size="lg"
          onClick={handleConfigure}
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Configuration en cours...
            </>
          ) : (
            "Continuer"
          )}
        </Button>
      </div>
    </div>
  );
};
