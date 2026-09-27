import { useEffect, useState } from 'react';
import { serviceApi, departmentApi } from '../../api/client';
import { Service, Department } from '../../types';
import { Layers, Plus, Trash2, X } from 'lucide-react';

export const ServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterDept, setFilterDept] = useState('');

  const fetchData = async () => {
    try {
      const [sRes, dRes] = await Promise.all([serviceApi.getAll({ departmentId: filterDept || undefined }), departmentApi.getAll()]);
      setServices(sRes.data.data);
      setDepartments(dRes.data.data);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filterDept]);

  const handleCreate = async (formData: any) => {
    try { await serviceApi.create(formData); setShowForm(false); fetchData(); } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this service?')) return;
    try { await serviceApi.delete(id); fetchData(); } catch { /* handled */ }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1><Layers size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Services</h1><p>Manage hospital services</p></div>
        <div className="flex gap-sm">
          <select className="input select" style={{ width: 200 }} value={filterDept} onChange={e => setFilterDept(e.target.value)}><option value="">All Departments</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={18} />Add Service</button>
        </div>
      </div>
      <div className="table-container animate-in">
        <table className="table">
          <thead><tr><th>Service</th><th>Department</th><th>Duration</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr> :
            services.length === 0 ? <tr><td colSpan={4} className="text-center text-muted" style={{ padding: 40 }}>No services found</td></tr> :
            services.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</td>
                <td><span className="badge badge-primary">{s.department?.name}</span></td>
                <td>{s.durationMins} min</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add Service</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <ServiceForm departments={departments} onSubmit={handleCreate} onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

const ServiceForm = ({ departments, onSubmit, onClose }: { departments: Department[]; onSubmit: (d: any) => void; onClose: () => void }) => {
  const [form, setForm] = useState({ name: '', departmentId: '', description: '', durationMins: 15 });
  const [sub, setSub] = useState(false);
  const handle = async (e: React.FormEvent) => { e.preventDefault(); setSub(true); await onSubmit(form); setSub(false); };

  return (
    <form onSubmit={handle}>
      <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="input-group"><label>Service Name *</label><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div className="input-group"><label>Department *</label><select className="input select" required value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}><option value="">Select</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        <div className="input-group"><label>Duration (minutes)</label><input className="input" type="number" min={1} value={form.durationMins} onChange={e => setForm({ ...form, durationMins: parseInt(e.target.value) || 15 })} /></div>
        <div className="input-group"><label>Description</label><input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={sub}>{sub ? <span className="spinner" /> : 'Create'}</button>
      </div>
    </form>
  );
};
