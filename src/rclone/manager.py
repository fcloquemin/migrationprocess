"""
Gestionnaire principal Rclone - Interface principale pour migrations
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime

from .config_handler import ConfigHandler
from .executor import RcloneExecutor
from .validator import RcloneValidator
from .logger import RcloneLogger


class RcloneManager:
    """Gestionnaire principal pour orchestrer les migrations rclone"""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialise le gestionnaire rclone
        
        Args:
            config_path: Chemin vers rclone.conf (optionnel)
        """
        self.config_handler = ConfigHandler(config_path)
        self.executor = RcloneExecutor(config_path)
        self.validator = RcloneValidator(config_path)
        self.logger = RcloneLogger(__name__)
        
        self.logger.info("RcloneManager initialisé")
    
    def list_remotes(self) -> List[str]:
        """Liste tous les remotes configurés"""
        remotes = self.executor.run_command("listremotes")
        return remotes.strip().split("\n") if remotes else []
    
    def validate_remote(self, remote_name: str) -> Tuple[bool, str]:
        """
        Valide la connexion à un remote
        
        Returns:
            (success, message)
        """
        return self.validator.validate_remote(remote_name)
    
    def sync(
        self,
        source: str,
        destination: str,
        dry_run: bool = True,
        options: Optional[Dict] = None
    ) -> Tuple[bool, str]:
        """
        Effectue une synchronisation
        
        Args:
            source: Remote source (ex: "source:bucket")
            destination: Remote destination (ex: "dest:bucket")
            dry_run: Test sans appliquer les changements
            options: Options rclone additionnelles
            
        Returns:
            (success, output)
        """
        self.logger.info(f"Sync: {source} → {destination} (dry_run={dry_run})")
        
        cmd = ["sync", source, destination]
        if dry_run:
            cmd.append("--dry-run")
        
        if options:
            for key, value in options.items():
                cmd.append(f"--{key}={value}")
        
        success, output = self.executor.run_rclone_command(cmd)
        return success, output
    
    def copy(
        self,
        source: str,
        destination: str,
        dry_run: bool = True
    ) -> Tuple[bool, str]:
        """Copie fichiers de source vers destination"""
        self.logger.info(f"Copy: {source} → {destination}")
        cmd = ["copy", source, destination]
        if dry_run:
            cmd.append("--dry-run")
        return self.executor.run_rclone_command(cmd)
    
    def size(self, path: str) -> Optional[str]:
        """Obtient la taille totale d'un chemin"""
        cmd = ["size", path]
        success, output = self.executor.run_rclone_command(cmd)
        return output if success else None
    
    def count(self, path: str) -> Optional[int]:
        """Compte le nombre de fichiers"""
        cmd = ["count", path, "--json"]
        success, output = self.executor.run_rclone_command(cmd)
        if success:
            try:
                data = json.loads(output)
                return data.get("count", 0)
            except json.JSONDecodeError:
                return None
        return None
    
    def create_migration_plan(
        self,
        source: str,
        destination: str
    ) -> Dict:
        """
        Crée un plan de migration détaillé
        
        Returns:
            Dictionnaire avec statistiques et recommandations
        """
        self.logger.info(f"Création plan migration: {source} → {destination}")
        
        size_src = self.size(source)
        count_src = self.count(source)
        
        plan = {
            "timestamp": datetime.now().isoformat(),
            "source": source,
            "destination": destination,
            "source_size": size_src,
            "source_files": count_src,
            "status": "planned",
            "steps": [
                {"step": 1, "action": "validate", "description": "Valider remotes"},
                {"step": 2, "action": "dry-run", "description": "Exécuter dry-run"},
                {"step": 3, "action": "sync", "description": "Sync réelle"},
                {"step": 4, "action": "verify", "description": "Vérification"}
            ]
        }
        
        return plan


# Fonction helper pour utilisation simple
def quick_sync(source: str, destination: str, dry_run: bool = True) -> Tuple[bool, str]:
    """Fonction rapide pour faire une sync simple"""
    manager = RcloneManager()
    return manager.sync(source, destination, dry_run)
