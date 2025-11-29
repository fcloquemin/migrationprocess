param(
    [Parameter(Mandatory = $true)]
    [string]$RemoteName
)

Write-Host "=== Création remote OneDrive: $RemoteName ==="

$rclone = Get-Command rclone -ErrorAction SilentlyContinue
if (-not $rclone) {
    Write-Error "rclone n'est pas installé ou pas dans le PATH."
    exit 1
}

$configPath = "$env:USERPROFILE\.config\rclone\rclone.conf"
$env:RCLONE_CONFIG = $configPath

Write-Host "Fichier de config utilisé: $configPath"

# Lancement interactif avec ouverture du navigateur
rclone config create $RemoteName onedrive

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Remote OneDrive '$RemoteName' créé avec succès."
    Write-Host "Remotes disponibles :"
    rclone listremotes
    exit 0
} else {
    Write-Error "❌ Erreur lors de la création du remote OneDrive '$RemoteName'."
    exit $LASTEXITCODE
}
