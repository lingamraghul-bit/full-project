import { useEffect, useState } from 'react';
import { doctorApi, departmentApi } from '../../api/client';
import { Doctor, Department } from '../../types';
import { Stethoscope, Plus, Trash2, X } from 'lucide-react';

export const DoctorsPage = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterDept, setFilterDept] = useState('');

  const fetchData = async () => {
    try {
      const [docRes, deptRes] = await Promise.all([
        doctorApi.getAll({ departmentId: filterDept || undefined }),
        departmentApi.getAll(),
      ]);
      setDoctors(docRes.data.data);
      setDepartments(deptRes.data.data);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filterDept]);

  const handleCreate = async (formData: any) => {
    try {
      await doctorApi.create(formData);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this doctor?')) return;
    try { await doctorApi.delete(id); fetchData(); } catch { /* handled */ }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1><Stethoscope size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Doctors</h1>
          <p>Manage hospital doctors</p>
        </div>
        <div className="flex gap-sm">
          <select className="input select" style={{ width: 200 }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={18} />Add Doctor</button>
        </div>
      </div>

      <div className="table-container animate-in">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Specialization</th><th>Duration</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : doctors.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 40 }}>No doctors found</td></tr>
            ) : doctors.map(doc => (
              <tr key={doc.id}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Dr. {doc.user.firstName} {doc.user.lastName}</td>
                <td>{doc.user.email}</td>
                <td><span className="badge badge-primary">{doc.department.name}</span></td>
                <td>{doc.specialization || '—'}</td>
                <td>{doc.consultationDuration} min</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => handleDelete(doc.id)}><Trash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && <DoctorFormModal departments={departments} onClose={() => setShowForm(false)} onSubmit={handleCreate} />}
    </div>
  );
};

const DoctorFormModal = ({ departments, onClose, onSubmit }: { departments: Department[]; onClose: () => void; onSubmit: (data: any) => void }) => {
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', phone: '', departmentId: '', specialization: '', qualification: '', consultationDuration: 15 });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2>Add New Doctor</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="input-group"><label>First Name *</label><input className="input" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
            <div className="input-group"><label>Last Name *</label><input className="input" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Email *</label><input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="input-group"><label>Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="input-group">
              <label>Department *</label>
              <select className="input select" required value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                <option value="">Select</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="input-group"><label>Specialization</label><input className="input" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} /></div>
            <div className="input-group"><label>Qualification</label><input className="input" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? <span className="spinner" /> : 'Create Doctor'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
