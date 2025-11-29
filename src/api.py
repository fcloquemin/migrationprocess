from flask import Flask, request, jsonify, redirect
from src.rclone.manager import RcloneManager
import subprocess
import threading
import time
import os
import json
from datetime import datetime

app = Flask(__name__)

# Mapping frontend -> rclone backend types
BACKEND_MAP = {
    'onedrive': 'onedrive',
    'google drive': 'drive', 
    'dropbox': 'dropbox',
    's3': 's3'
}

@app.route('/api/rclone/create', methods=['POST'])
def create_rclone_storage():
    """Crée un storage rclone depuis l'interface"""
    data = request.json
    name = data.get('name')
    backend_type = data.get('type', '').lower().strip()
    
    if not name or not backend_type:
        return jsonify({'error': 'Nom et type requis'}), 400
    
    rclone_type = BACKEND_MAP.get(backend_type, backend_type)
    
    try:
        # Commande rclone config create
        cmd = [
            'rclone', 'config', 'create', name, rclone_type,
            '--non-interactive'
        ]
        
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            timeout=120,
            env={**os.environ, 'RCLONE_CONFIG': os.path.expanduser('~/.config/rclone/rclone.conf')}
        )
        
        if result.returncode == 0:
            return jsonify({'success': True, 'name': name, 'type': rclone_type})
        else:
            return jsonify({'error': f"rclone error: {result.stderr}"}), 400
            
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Timeout lors de la configuration'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/rclone/auth/<name>')
def rclone_auth(name):
    """Lance l'auth OAuth pour OneDrive"""
    def auth_thread():
        try:
            cmd = ['rclone', 'config', 'create', name, 'onedrive']
            subprocess.run(cmd, timeout=300)
            with open(f'/tmp/rclone_auth_{name}', 'w') as f:
                f.write('success')
        except Exception as e:
            with open(f'/tmp/rclone_auth_{name}', 'w') as f:
                f.write(f'error: {str(e)}')
    
    threading.Thread(target=auth_thread, daemon=True).start()
    
    return '''
    <html>
    <body style="font-family: Arial;">
        <h2>🔄 Configuration OneDrive en cours...</h2>
        <p>Un navigateur va s'ouvrir pour l'authentification Microsoft.</p>
        <p>⚠️ Fermez cette fenêtre après autorisation.</p>
        <script>
            setTimeout(() => {
                window.opener?.postMessage({rcloneAuthComplete: true, name: ''' + name + '''}, "*");
                window.close();
            }, 5000);
        </script>
    </body>
    </html>
    '''

@app.route('/api/rclone/list')
def list_rclone_storages():
    """Liste les storages configurés"""
    try:
        result = subprocess.run(
            ['rclone', 'listremotes', '--json'], 
            capture_output=True, 
            text=True,
            env={**os.environ, 'RCLONE_CONFIG': os.path.expanduser('~/.config/rclone/rclone.conf')}
        )
        if result.returncode == 0:
            remotes = json.loads(result.stdout)
            return jsonify({'storages': remotes})
    except:
        pass
    return jsonify({'storages': []})

# VOS ROUTES EXISTANTES (corrigées)
@app.post("/api/rclone/migrate")
def start_migration():
    data = request.json
    source = data.get('source')
    dest = data.get('dest')
    dry_run = data.get('dry_run', True)
    
    manager = RcloneManager()
    success, output = manager.sync(source, dest, dry_run)
    return jsonify({
        "success": success, 
        "output": output, 
        "timestamp": datetime.now().isoformat()
    })

@app.get("/api/rclone/remotes")
def get_remotes():
    manager = RcloneManager()
    remotes = manager.list_remotes()
    return jsonify({"remotes": remotes})

@app.get("/api/rclone/validate/<remote_name}")
def validate_remote(remote_name):
    manager = RcloneManager()
    success, msg = manager.validate_remote(remote_name)
    return jsonify({"valid": success, "message": msg})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
