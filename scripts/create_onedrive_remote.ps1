param(
    [Parameter(Mandatory = $true)]
    [string]$RemoteName
)

Write-Host "=== Création remote OneDrive: $RemoteName ==="

# Vérifier rclone
$rclone = Get-Command rclone -ErrorAction SilentlyContinue
if (-not $rclone) {
    Write-Error "rclone n'est pas installé ou pas dans le PATH."
    exit 1
}

# Fichier de config (standard Windows)
$configPath = "$env:USERPROFILE\.config\rclone\rclone.conf"
$env:RCLONE_CONFIG = $configPath

Write-Host "Config utilisée: $configPath"

# Lancement de la config interactive OneDrive (ouvre le navigateur)
# On laisse rclone poser les questions dans la console
rclone config create $RemoteName onedrive

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Remote OneDrive '$RemoteName' créé avec succès."
    rclone listremotes
    exit 0
} else {
    Write-Error "❌ Erreur lors de la création du remote OneDrive '$RemoteName'."
    exit $LASTEXITCODE
}
