"""
Exécuteur Rclone - Lance les commandes rclone
"""

import subprocess
from pathlib import Path
from typing import Tuple, List, Optional
from .logger import RcloneLogger


class RcloneExecutor:
    """Exécute les commandes rclone"""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialise l'exécuteur
        
        Args:
            config_path: Chemin custom vers rclone.conf
        """
        self.config_path = config_path
        self.logger = RcloneLogger(__name__)
        
        # Vérifier que rclone est installé
        self._check_rclone_installed()
    
    def _check_rclone_installed(self) -> bool:
        """Vérifie que rclone est installé"""
        try:
            subprocess.run(["rclone", "--version"], capture_output=True, check=True)
            self.logger.info("Rclone installé et accessible")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.logger.error("Rclone n'est pas installé ou pas dans PATH")
            raise RuntimeError("Rclone not installed. Please install rclone first.")
    
    def run_command(self, command: str) -> str:
        """Exécute une commande rclone simple"""
        return self.run_rclone_command(command.split())
    
    def run_rclone_command(
        self,
        cmd: List[str],
        timeout: int = 3600
    ) -> Tuple[bool, str]:
        """
        Exécute une commande rclone
        
        Args:
            cmd: Liste des arguments rclone
            timeout: Timeout en secondes
            
        Returns:
            (success, output)
        """
        # Construire la commande complète
        full_cmd = ["rclone"]
        
        if self.config_path:
            full_cmd.extend(["--config", self.config_path])
        
        full_cmd.extend(cmd)
        
        self.logger.debug(f"Exécution: {' '.join(full_cmd)}")
        
        try:
            result = subprocess.run(
                full_cmd,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            output = result.stdout + result.stderr
            
            if result.returncode == 0:
                self.logger.info(f"Commande réussie: {cmd}")
                return True, output
            else:
                self.logger.error(f"Commande échouée: {cmd} - {output}")
                return False, output
                
        except subprocess.TimeoutExpired:
            error_msg = f"Timeout après {timeout}s"
            self.logger.error(error_msg)
            return False, error_msg
        except Exception as e:
            error_msg = f"Erreur exécution: {str(e)}"
            self.logger.error(error_msg)
            return False, error_msg
