import { useEffect, useState } from 'react';
import { departmentApi } from '../../api/client';
import { Department } from '../../types';
import { Building2, Plus, Edit2, Trash2, X } from 'lucide-react';

export const DepartmentsPage = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);

  const fetchDepartments = async () => {
    try {
      const { data } = await departmentApi.getAll();
      setDepartments(data.data);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleSubmit = async (formData: any) => {
    try {
      if (editing) {
        await departmentApi.update(editing.id, formData);
      } else {
        await departmentApi.create(formData);
      }
      setShowForm(false);
      setEditing(null);
      fetchDepartments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this department?')) return;
    try {
      await departmentApi.delete(id);
      fetchDepartments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1><Building2 size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Departments</h1>
          <p>Manage hospital departments</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={18} />Add Department</button>
      </div>

      <div className="stats-grid animate-in">
        {loading ? (
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : departments.map((dept, i) => (
          <div key={dept.id} className={`stat-card animate-in animate-in-${(i % 6) + 1}`} style={{ cursor: 'default' }}>
            <div className="flex items-center justify-between mb-md">
              <div className="stat-icon" style={{ background: 'rgba(20,184,166,0.12)', color: 'var(--accent-primary)', marginBottom: 0 }}>
                <Building2 size={22} />
              </div>
              <div className="flex gap-sm">
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(dept); setShowForm(true); }}><Edit2 size={14} /></button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(dept.id)}><Trash2 size={14} /></button>
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: 4 }}>{dept.name}</div>
            <div className="flex gap-sm" style={{ marginBottom: 8 }}>
              <span className="badge badge-primary">{dept.code}</span>
            </div>
            <div className="text-sm text-muted">{dept.description || 'No description'}</div>
            {dept._count && (
              <div className="flex gap-md mt-md text-xs text-muted">
                <span>{dept._count.doctors} Doctors</span>
                <span>{dept._count.rooms} Rooms</span>
                <span>{dept._count.services} Services</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <DeptFormModal
          dept={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

const DeptFormModal = ({ dept, onClose, onSubmit }: { dept: Department | null; onClose: () => void; onSubmit: (data: any) => void }) => {
  const [form, setForm] = useState({ name: dept?.name || '', code: dept?.code || '', description: dept?.description || '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{dept ? 'Edit Department' : 'Add Department'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label>Department Name *</label>
              <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cardiology" />
            </div>
            <div className="input-group">
              <label>Code * (auto-creates queue prefix from first letter)</label>
              <input className="input" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. CARD" maxLength={10} />
            </div>
            <div className="input-group">
              <label>Description</label>
              <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : dept ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
