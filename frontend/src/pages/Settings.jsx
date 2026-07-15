import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key } from 'lucide-react';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const checkKey = async () => {
      try {
        const res = await fetch('http://localhost:3001/settings/api-key', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.saved) {
          setIsSaved(true);
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkKey();
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    // Quick format check before even hitting the server
    if (!apiKey.startsWith('sk-ant-')) {
      setStatus('Invalid format — Claude keys start with "sk-ant-"');
      return;
    }

    setStatus('Saving...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/settings/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ apiKey })
      });

      if (res.ok) {
        setStatus('Saved successfully!');
        setIsSaved(true);
        setApiKey('');
      } else {
        const data = await res.json();
        setStatus(data.error || 'Failed to save');
      }
    } catch (err) {
      setStatus('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      <header className="h-16 border-b border-border bg-surface flex items-center px-6">
        <h1 className="font-display font-semibold text-xl text-text-primary">Settings</h1>
        <div className="ml-auto flex gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-text-secondary hover:text-text-primary text-sm font-medium">Dashboard</button>
        </div>
      </header>

      <div className="flex-1 max-w-3xl w-full mx-auto p-6 mt-10">
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border bg-bg/50 flex gap-3 items-center">
            <Key className="text-text-secondary w-5 h-5" />
            <div>
              <h2 className="text-lg font-medium text-text-primary">API Key Configuration</h2>
              <p className="text-sm text-text-secondary">Store your Claude API key securely to enable parallel agents.</p>
            </div>
          </div>
          <div className="p-6">
            {isSaved && (
              <div className="mb-6 p-4 rounded bg-green-50 text-green-700 border border-green-200 text-sm flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                API Key is already stored securely. You can update it below.
              </div>
            )}
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Claude Code API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent font-mono"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${status.toLowerCase().includes('invalid') || status.toLowerCase().includes('error') ? 'text-red-600' : 'text-text-secondary'}`}>
                  {status}
                </span>
                <button type="submit" className="bg-accent text-white px-5 py-2 rounded-md font-medium text-sm hover:opacity-90">
                  Save API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
