from src.rclone.manager import RcloneManager

# Endpoints rclone
@app.post("/api/rclone/migrate")
def start_migration(source: str, dest: str, dry_run: bool = True):
    manager = RcloneManager()
    success, output = manager.sync(source, dest, dry_run)
    return {"success": success, "output": output, "timestamp": datetime.now()}

@app.get("/api/rclone/remotes")
def get_remotes():
    manager = RcloneManager()
    remotes = manager.list_remotes()
    return {"remotes": remotes}

@app.get("/api/rclone/validate/{remote_name}")
def validate_remote(remote_name: str):
    manager = RcloneManager()
    success, msg = manager.validate_remote(remote_name)
    return {"valid": success, "message": msg}
