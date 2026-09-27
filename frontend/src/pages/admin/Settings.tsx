import { useEffect, useState } from 'react';
import { settingsApi } from '../../api/client';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export const SettingsPage = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    settingsApi.getAll().then(r => { setSettings(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (key: string, value: string) => {
    setSaving(key);
    try {
      await settingsApi.update(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch { alert('Failed to save'); }
    setSaving('');
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const groups: Record<string, { key: string; label: string }[]> = {
    'General': [
      { key: 'hospital_name', label: 'Hospital Name' },
      { key: 'hospital_address', label: 'Address' },
      { key: 'hospital_phone', label: 'Phone' },
    ],
    'Operations': [
      { key: 'working_hours_start', label: 'Working Hours Start' },
      { key: 'working_hours_end', label: 'Working Hours End' },
    ],
    'Queue': [
      { key: 'avg_consultation_mins', label: 'Avg Consultation (mins)' },
      { key: 'max_queue_size', label: 'Max Queue Size' },
      { key: 'qr_expiry_hours', label: 'QR Code Expiry (hours)' },
    ],
    'Features': [
      { key: 'enable_ai_assistant', label: 'Enable AI Assistant' },
      { key: 'enable_sms_notifications', label: 'Enable SMS Notifications' },
    ],
  };

  return (
    <div>
      <div className="page-header">
        <div><h1><SettingsIcon size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Settings</h1><p>Hospital configuration</p></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
        {Object.entries(groups).map(([group, items], gi) => (
          <div key={group} className={`glass-card animate-in animate-in-${gi + 1}`} style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20, color: 'var(--accent-primary)' }}>{group}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {items.map(item => (
                <div key={item.key} className="flex items-center gap-md">
                  <label style={{ flex: '0 0 200px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.label}</label>
                  <div className="flex gap-sm" style={{ flex: 1 }}>
                    {item.key.startsWith('enable_') ? (
                      <select className="input select" value={settings[item.key] || 'false'} onChange={e => handleSave(item.key, e.target.value)} style={{ flex: 1 }}>
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    ) : (
                      <>
                        <input className="input" value={settings[item.key] || ''} onChange={e => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))} style={{ flex: 1 }} />
                        <button className="btn btn-ghost btn-sm" onClick={() => handleSave(item.key, settings[item.key] || '')} disabled={saving === item.key}>
                          {saving === item.key ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Save size={16} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
