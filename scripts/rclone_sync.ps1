param(
    [Parameter(Mandatory = $true)]
    [string]$Source,
    [Parameter(Mandatory = $true)]
    [string]$Destination,
    [switch]$DryRun
)

Write-Host "=== Sync rclone de $Source vers $Destination ==="

$rclone = Get-Command rclone -ErrorAction SilentlyContinue
if (-not $rclone) {
    Write-Error "rclone n'est pas installé ou pas dans le PATH."
    exit 1
}

$configPath = "$env:USERPROFILE\.config\rclone\rclone.conf"
$env:RCLONE_CONFIG = $configPath

$cmd = @(
    "sync",
    $Source,
    $Destination,
    "--config", $configPath,
    "--progress",
    "--verbose"
)

if ($DryRun) {
    $cmd += "--dry-run"
    Write-Host "Mode dry-run activé."
}

Write-Host "Commande: rclone $($cmd -join ' ')"

rclone @cmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Sync terminée avec succès."
    exit 0
} else {
    Write-Error "❌ Erreur sync (code $LASTEXITCODE)."
    exit $LASTEXITCODE
}
