import { useEffect, useState } from 'react';
import { staffApi, departmentApi } from '../../api/client';
import { Staff, Department } from '../../types';
import { UserCog, Plus, Trash2, X } from 'lucide-react';

export const StaffPage = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    try {
      const [sRes, dRes] = await Promise.all([staffApi.getAll(), departmentApi.getAll()]);
      setStaff(sRes.data.data);
      setDepartments(dRes.data.data);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (formData: any) => {
    try { await staffApi.create(formData); setShowForm(false); fetchData(); } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this staff?')) return;
    try { await staffApi.delete(id); fetchData(); } catch { /* handled */ }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1><UserCog size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Staff</h1><p>Manage hospital staff</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={18} />Add Staff</button>
      </div>
      <div className="table-container animate-in">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Position</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr> :
            staff.length === 0 ? <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 40 }}>No staff found</td></tr> :
            staff.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.user.firstName} {s.user.lastName}</td>
                <td>{s.user.email}</td>
                <td><span className="badge badge-info">{s.user.role.replace('_', ' ')}</span></td>
                <td>{s.department?.name || '—'}</td>
                <td>{s.position || '—'}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header"><h2>Add Staff</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <StaffForm departments={departments} onSubmit={handleCreate} onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

const StaffForm = ({ departments, onSubmit, onClose }: { departments: Department[]; onSubmit: (d: any) => void; onClose: () => void }) => {
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', phone: '', role: 'RECEPTIONIST', departmentId: '', position: '' });
  const [sub, setSub] = useState(false);
  const handle = async (e: React.FormEvent) => { e.preventDefault(); setSub(true); await onSubmit({ ...form, departmentId: form.departmentId || undefined }); setSub(false); };

  return (
    <form onSubmit={handle}>
      <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="input-group"><label>First Name *</label><input className="input" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
        <div className="input-group"><label>Last Name *</label><input className="input" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
        <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Email *</label><input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
        <div className="input-group"><label>Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="input-group">
          <label>Role *</label>
          <select className="input select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="LAB_STAFF">Lab Staff</option>
            <option value="DIAGNOSTIC_STAFF">Diagnostic Staff</option>
          </select>
        </div>
        <div className="input-group"><label>Department</label><select className="input select" value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}><option value="">None</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        <div className="input-group"><label>Position</label><input className="input" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} /></div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={sub}>{sub ? <span className="spinner" /> : 'Create Staff'}</button>
      </div>
    </form>
  );
};
