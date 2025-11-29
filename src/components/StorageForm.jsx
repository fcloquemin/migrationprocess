// src/components/StorageForm.jsx
import React, { useState } from 'react';

const BACKENDS = {
  'onedrive': { name: 'OneDrive', fields: ['name'] },
  'google drive': { name: 'Google Drive', fields: ['name'] },
  'dropbox': { name: 'Dropbox', fields: ['name'] },
  's3': { name: 'S3', fields: ['name', 'provider', 'access_key_id', 'secret_access_key'] }
};

export default function StorageForm({ onStorageCreated }) {
  const [formData, setFormData] = useState({ name: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Lancer auth OAuth pour OneDrive
      if (formData.type === 'onedrive') {
        const authUrl = `/api/rclone/auth/${formData.name}?type=onedrive`;
        window.open(authUrl, 'rclone-auth', 'width=800,height=600');
        
        // Écouter le message de retour
        window.onmessage = (event) => {
          if (event.data.rcloneAuthComplete) {
            createStorage(formData.name, 'onedrive');
          }
        };
        return;
      }
      
      await createStorage(formData.name, formData.type);
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createStorage = async (name, type) => {
    const response = await fetch('/api/rclone/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        type: type.toLowerCase().replace(/\s+/g, ' ') // "onedrive", pas "One Drive"
      })
    });
    
    if (response.ok) {
      onStorageCreated();
      setFormData({ name: '', type: '' });
    } else {
      throw new Error(await response.text());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Nom du storage</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <div>
        <label>Type de storage</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value})}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Sélectionnez...</option>
          {Object.entries(BACKENDS).map(([key, backend]) => (
            <option key={key} value={key}>{backend.name}</option>
          ))}
        </select>
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50"
      >
        {loading ? 'Configuration...' : 'Créer Storage'}
      </button>
    </form>
  );
}
