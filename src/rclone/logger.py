"""
Logger Rclone - Logging personnalisé
"""

import logging
from pathlib import Path


class RcloneLogger:
    """Logger pour module rclone"""
    
    _initialized = False
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        
        if not RcloneLogger._initialized:
            # Configurer logging une seule fois
            self._setup_logging()
            RcloneLogger._initialized = True
    
    def _setup_logging(self):
        """Configure le logging"""
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
        
        # File handler
        log_dir = Path(__file__).parent.parent.parent / "rclone" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(
            log_dir / "rclone.log"
        )
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)
        
        self.logger.setLevel(logging.INFO)
    
    def info(self, message: str):
        self.logger.info(message)
    
    def error(self, message: str):
        self.logger.error(message)
    
    def warning(self, message: str):
        self.logger.warning(message)
    
    def debug(self, message: str):
        self.logger.debug(message)
