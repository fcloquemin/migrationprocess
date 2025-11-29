#!/bin/bash

# ============================================================
# RCLONE SYNC AVEC LOGGING AVANCÉ
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="$PARENT_DIR/config"
LOGS_DIR="$PARENT_DIR/logs"

mkdir -p "$LOGS_DIR"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOGS_DIR/sync-detailed-$TIMESTAMP.log"

SOURCE="${1:?Erreur: Source requise}"
DESTINATION="${2:?Erreur: Destination requise}"

{
    echo "=========================================="
    echo "RCLONE SYNC - Détails d'Exécution"
    echo "=========================================="
    echo "Timestamp: $TIMESTAMP"
    echo "Source: $SOURCE"
    echo "Destination: $DESTINATION"
    echo "Utilisateur: $(whoami)"
    echo "Hostname: $(hostname)"
    echo ""
    
    # Version rclone
    echo "Rclone Version:"
    rclone version
    echo ""
    
    # Lister remotes
    echo "Remotes disponibles:"
    rclone --config="$CONFIG_DIR/rclone.conf" listremotes
    echo ""
    
    # Stats avant
    echo "======== AVANT SYNC ========"
    rclone --config="$CONFIG_DIR/rclone.conf" size "$SOURCE" || true
    echo ""
    
    # Exécuter sync
    echo "======== EXÉCUTION SYNC ========"
    rclone sync \
        --config="$CONFIG_DIR/rclone.conf" \
        --verbose \
        --stats=5s \
        --log-level=DEBUG \
        "$SOURCE" "$DESTINATION" 2>&1
    
    # Stats après
    echo ""
    echo "======== APRÈS SYNC ========"
    rclone --config="$CONFIG_DIR/rclone.conf" size "$DESTINATION" || true
    
} | tee "$LOG_FILE"

echo ""
echo "Logs complets: $LOG_FILE"
