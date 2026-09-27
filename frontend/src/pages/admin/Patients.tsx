import { useEffect, useState } from 'react';
import { patientApi, qrApi } from '../../api/client';
import { Patient, QRGenerateResponse } from '../../types';
import { Users, Plus, Search, Eye, QrCode, X, Printer } from 'lucide-react';

export const PatientsPage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showQR, setShowQR] = useState<QRGenerateResponse | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPatients = async () => {
    try {
      const { data } = await patientApi.getAll({ search, page, limit: 20 });
      setPatients(data.data);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => { fetchPatients(); }, [search, page]);

  const handleRegister = async (formData: any) => {
    try {
      await patientApi.create(formData);
      setShowForm(false);
      fetchPatients();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to register');
    }
  };

  const handleGenerateQR = async (patientId: string) => {
    try {
      const { data } = await qrApi.generate(patientId);
      setShowQR(data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate QR');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1><Users size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Patients</h1>
          <p>Register and manage patients</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={18} />Register Patient</button>
      </div>

      <div className="search-bar mb-lg">
        <Search size={18} />
        <input className="input" placeholder="Search by name, ID, or phone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="table-container animate-in">
        <table className="table">
          <thead><tr><th>Patient ID</th><th>Name</th><th>Phone</th><th>Gender</th><th>Age</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 40 }}>No patients found</td></tr>
            ) : patients.map(p => (
              <tr key={p.id}>
                <td><span className="token-badge">{p.patientId}</span></td>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.firstName} {p.lastName}</td>
                <td>{p.phone}</td>
                <td>{p.gender || '—'}</td>
                <td>{p.age || '—'}</td>
                <td>
                  <div className="flex gap-sm">
                    <button className="btn btn-ghost btn-sm" title="View"><Eye size={16} /></button>
                    <button className="btn btn-ghost btn-sm" title="Generate QR" onClick={() => handleGenerateQR(p.id)}><QrCode size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
            <span className="text-sm text-muted">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
          </div>
        )}
      </div>

      {/* Register Patient Modal */}
      {showForm && <PatientFormModal onClose={() => setShowForm(false)} onSubmit={handleRegister} />}

      {/* QR Modal */}
      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <div className="modal-header">
              <h2>QR Code Generated</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowQR(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <img src={showQR.qrImage} alt="QR Code" style={{ width: 200, height: 200, borderRadius: 12 }} />
              <p style={{ fontWeight: 600 }}>{showQR.patient.name}</p>
              <p className="text-sm text-muted">ID: {showQR.patient.patientId}</p>
              <p className="text-xs text-muted">Valid until: {new Date(showQR.expiresAt).toLocaleString()}</p>
              <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} />Print QR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PatientFormModal = ({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', age: '', gender: '', email: '', bloodGroup: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({
      ...form,
      age: form.age ? parseInt(form.age) : undefined,
      gender: form.gender || undefined,
    });
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2>Register New Patient</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="input-group">
              <label>First Name *</label>
              <input className="input" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Last Name *</label>
              <input className="input" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Phone *</label>
              <input className="input" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Age</label>
              <input className="input" type="number" min={0} max={150} value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Gender</label>
              <select className="input select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="input-group">
              <label>Blood Group</label>
              <select className="input select" value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}>
                <option value="">Select</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Email</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Address</label>
              <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
