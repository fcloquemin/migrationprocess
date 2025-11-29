#!/bin/bash

# ============================================================
# RCLONE SYNC PRINCIPAL - Source vers Destination
# ============================================================
# Usage: ./sync-source-to-dest.sh [source] [dest] [--dry-run]
# Example: ./sync-source-to-dest.sh source: destination: --dry-run

set -euo pipefail

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="$PARENT_DIR/config"
LOGS_DIR="$PARENT_DIR/logs"
FILTERS_DIR="$PARENT_DIR/filters"

# Créer dossier logs s'il n'existe pas
mkdir -p "$LOGS_DIR"

# Timestamp pour logs
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOGS_DIR/sync-$TIMESTAMP.log"

# Paramètres par défaut
SOURCE="${1:?ERROR: Source requise (ex: source:bucket)}"
DESTINATION="${2:?ERROR: Destination requise (ex: destination:bucket)}"
DRY_RUN="${3:---dry-run}"

# Options rclone
RCLONE_OPTS=(
    "--config=$CONFIG_DIR/rclone.conf"
    "--verbose"
    "--progress"
    "--stats=10s"
    "--stats-one-line"
    "--transfers=4"
    "--checkers=8"
    "--log-file=$LOG_FILE"
    "--log-level=INFO"
    "--exclude-from=$FILTERS_DIR/exclude-filter.txt"
    "--include-from=$FILTERS_DIR/include-filter.txt"
    "--checksum"
    "--size-only=false"
)

# Ajouter dry-run si demandé
if [[ "$DRY_RUN" == "--dry-run" ]]; then
    RCLONE_OPTS+=("--dry-run")
    echo -e "${YELLOW}[DRY-RUN MODE]${NC} Aucun fichier ne sera modifié"
fi

# Afficher configuration
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}RCLONE SYNC - Configuration${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo "Source:       $SOURCE"
echo "Destination: $DESTINATION"
echo "Config:      $CONFIG_DIR/rclone.conf"
echo "Logs:        $LOG_FILE"
echo "Dry-run:     $([[ "$DRY_RUN" == "--dry-run" ]] && echo "OUI" || echo "NON")"
echo ""

# Vérifier que rclone est installé
if ! command -v rclone &> /dev/null; then
    echo -e "${RED}ERREUR: rclone n'est pas installé${NC}"
    exit 1
fi

# Vérifier que config existe
if [[ ! -f "$CONFIG_DIR/rclone.conf" ]]; then
    echo -e "${RED}ERREUR: $CONFIG_DIR/rclone.conf non trouvé${NC}"
    echo "Créez rclone.conf en copiant rclone.conf.example"
    exit 1
fi

# Vérifier que filtres existent
if [[ ! -f "$FILTERS_DIR/exclude-filter.txt" ]]; then
    echo -e "${YELLOW}ATTENTION: exclude-filter.txt non trouvé, création d'une version vide${NC}"
    touch "$FILTERS_DIR/exclude-filter.txt"
fi

# Exécuter rclone sync
echo -e "${GREEN}Démarrage sync...${NC}\n"

if rclone sync "${RCLONE_OPTS[@]}" "$SOURCE" "$DESTINATION"; then
    echo -e "\n${GREEN}✓ Sync réussi!${NC}"
    echo "Logs: $LOG_FILE"
    exit 0
else
    echo -e "\n${RED}✗ Sync échoué!${NC}"
    echo "Logs: $LOG_FILE"
    exit 1
fi
