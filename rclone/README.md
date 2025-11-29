# 🔄 Module Rclone - Migration Process

Gestion centralisée de rclone pour migrations de données inter-cloud.

## 📋 Structure

- **config/** : Fichiers de configuration rclone
- **scripts/** : Scripts shell pour exécution
- **filters/** : Patterns d'inclusion/exclusion
- **tools/** : Outils Python pour gestion avancée
- **documentation/** : Guides détaillés
- **logs/** : Logs d'exécution (généré à l'exécution)

## 🚀 Démarrage Rapide

### 1. Configuration

```bash
cp config/rclone.conf.example config/rclone.conf
# Éditer config/rclone.conf et ajouter vos credentials
