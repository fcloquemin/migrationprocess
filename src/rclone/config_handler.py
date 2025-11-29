"""
Gestionnaire de configuration Rclone
"""

import os
from pathlib import Path
from typing import Optional, Dict


class ConfigHandler:
    """Gère les fichiers de configuration rclone"""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialise le gestionnaire config
        
        Args:
            config_path: Chemin custom vers rclone.conf
        """
        if config_path:
            self.config_path = Path(config_path)
        else:
            # Localisation par défaut
            self.config_path = Path.home() / ".config" / "rclone" / "rclone.conf"
        
        # Chemin alternatif local au projet
        project_config = Path(__file__).parent.parent.parent / "rclone" / "config" / "rclone.conf"
        if project_config.exists() and not self.config_path.exists():
            self.config_path = project_config
    
    def exists(self) -> bool:
        """Vérifie si le fichier config existe"""
        return self.config_path.exists()
    
    def get_config_path(self) -> str:
        """Retourne le chemin config"""
        return str(self.config_path)
    
    def load_config(self) -> Dict:
        """
        Charge la configuration
        
        Returns:
            Dictionnaire des remotes
        """
        if not self.exists():
            raise FileNotFoundError(f"Config file not found: {self.config_path}")
        
        remotes = {}
        current_remote = None
        
        with open(self.config_path, "r") as f:
            for line in f:
                line = line.strip()
                
                # Skip comments et lignes vides
                if not line or line.startswith("#"):
                    continue
                
                # Détection remote [name]
                if line.startswith("[") and line.endswith("]"):
                    current_remote = line[1:-1]
                    remotes[current_remote] = {}
                
                # Parse key=value
                elif "=" in line and current_remote:
                    key, value = line.split("=", 1)
                    remotes[current_remote][key.strip()] = value.strip()
        
        return remotes
    
    def get_remote(self, remote_name: str) -> Optional[Dict]:
        """Obtient la config d'un remote spécifique"""
        remotes = self.load_config()
        return remotes.get(remote_name)
    
    def validate_config(self) -> tuple[bool, str]:
        """
        Valide que la config est valide
        
        Returns:
            (valid, message)
        """
        try:
            remotes = self.load_config()
            if not remotes:
                return False, "No remotes configured"
            return True, f"Config valid with {len(remotes)} remotes"
        except Exception as e:
            return False, f"Config validation error: {str(e)}"
