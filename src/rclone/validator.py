"""
Validateur Rclone - Valide configurations et remotes
"""

from typing import Tuple
from .executor import RcloneExecutor
from .logger import RcloneLogger


class RcloneValidator:
    """Valide les configurations et connexions rclone"""
    
    def __init__(self, config_path: str = None):
        self.executor = RcloneExecutor(config_path)
        self.logger = RcloneLogger(__name__)
    
    def validate_remote(self, remote_name: str) -> Tuple[bool, str]:
        """
        Valide la connexion à un remote
        
        Args:
            remote_name: Nom du remote (ex: "source", "destination")
            
        Returns:
            (success, message)
        """
        self.logger.info(f"Validation remote: {remote_name}")
        
        # Test: lister racine du remote
        success, output = self.executor.run_rclone_command([
            "lsd",
            f"{remote_name}:",
            "--max-depth=1"
        ])
        
        if success:
            self.logger.info(f"Remote {remote_name} valide")
            return True, f"Remote '{remote_name}' is valid"
        else:
            self.logger.error(f"Remote {remote_name} invalide: {output}")
            return False, f"Remote '{remote_name}' connection failed: {output}"
    
    def validate_sync_paths(
        self,
        source: str,
        destination: str
    ) -> Tuple[bool, str]:
        """
        Valide que source ET destination sont accessibles
        
        Returns:
            (success, message)
        """
        self.logger.info(f"Validation paths: {source} → {destination}")
        
        # Parser remote names
        source_remote = source.split(":")
        dest_remote = destination.split(":")
        
        # Valider source
        src_ok, src_msg = self.validate_remote(source_remote)
        if not src_ok:
            return False, f"Source error: {src_msg}"
        
        # Valider destination
        dest_ok, dest_msg = self.validate_remote(dest_remote)
        if not dest_ok:
            return False, f"Destination error: {dest_msg}"
        
        return True, "Both source and destination are valid"
