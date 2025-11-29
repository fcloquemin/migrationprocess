import subprocess
import os
from typing import Tuple, List

class RcloneManager:
    def __init__(self, config_path=None):
        self.config_path = config_path or os.path.expanduser('~/.config/rclone/rclone.conf')
    
    def sync(self, source: str, dest: str, dry_run: bool = True) -> Tuple[bool, str]:
        """Synchronise source vers destination"""
        cmd = [
            'rclone', 'sync', source, dest,
            '--config', self.config_path,
            '--progress', '--verbose'
        ]
        if dry_run:
            cmd.append('--dry-run')
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        return result.returncode == 0, result.stdout + result.stderr
    
    def list_remotes(self) -> List[str]:
        """Liste les remotes disponibles"""
        result = subprocess.run(
            ['rclone', 'listremotes', '--config', self.config_path],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            return [r.strip(':') for r in result.stdout.strip().split('\n') if r.strip()]
        return []
    
    def validate_remote(self, remote_name: str) -> Tuple[bool, str]:
        """Valide un remote"""
        result = subprocess.run(
            ['rclone', 'about', remote_name + ':', '--config', self.config_path],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            return True, "Remote valide et accessible"
        return False, f"Erreur: {result.stderr}"
