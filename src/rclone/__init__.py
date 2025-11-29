
---

### **🔟 src/rclone/__init__.py**

```python
"""
Module Rclone - Gestion des migrations de données
"""

from .manager import RcloneManager
from .config_handler import ConfigHandler
from .executor import RcloneExecutor
from .validator import RcloneValidator
from .logger import RcloneLogger

__version__ = "1.0.0"
__all__ = [
    "RcloneManager",
    "ConfigHandler",
    "RcloneExecutor",
    "RcloneValidator",
    "RcloneLogger",
]
