#!/bin/bash

# ============================================================
# VÉRIFICATION POST-MIGRATION
# ============================================================

set -euo pipefail

CONFIG_DIR="$(cd "$(dirname "${BASH_SOURCE}")/../config" && pwd)"

SOURCE="${1:?Source requise}"
DESTINATION="${2:?Destination requise}"

echo "Vérification migration..."
echo "Source: $SOURCE"
echo "Destination: $DESTINATION"
echo ""

# Taille source
echo "📦 Taille source:"
rclone --config="$CONFIG_DIR/rclone.conf" size "$SOURCE"

echo ""
echo "📦 Taille destination:"
rclone --config="$CONFIG_DIR/rclone.conf" size "$DESTINATION"

echo ""
echo "📋 Nombre de fichiers source:"
rclone --config="$CONFIG_DIR/rclone.conf" count "$SOURCE"

echo ""
echo "📋 Nombre de fichiers destination:"
rclone --config="$CONFIG_DIR/rclone.conf" count "$DESTINATION"

echo ""
echo "✓ Vérification complétée"
