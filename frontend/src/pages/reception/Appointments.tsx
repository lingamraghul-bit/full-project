import { useEffect, useState } from 'react';
import { appointmentApi, departmentApi, patientApi, doctorApi } from '../../api/client';
import { Appointment, Department, Patient, Doctor } from '../../types';
import { CalendarCheck, Plus, X } from 'lucide-react';

export const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAppointments = async () => {
    try {
      const { data } = await appointmentApi.getAll({ page, limit: 20 });
      setAppointments(data.data);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => { fetchAppointments(); }, [page]);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    try { await appointmentApi.cancel(id); fetchAppointments(); } catch { /* handled */ }
  };

  const statusColor = (s: string) => {
    const m: Record<string, string> = { SCHEDULED: 'badge-info', CHECKED_IN: 'badge-primary', IN_QUEUE: 'badge-warning', IN_SERVICE: 'badge-purple', COMPLETED: 'badge-success', CANCELLED: 'badge-danger', NO_SHOW: 'badge-neutral' };
    return m[s] || 'badge-neutral';
  };

  return (
    <div>
      <div className="page-header">
        <div><h1><CalendarCheck size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Appointments</h1><p>Manage patient appointments</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={18} />Book Appointment</button>
      </div>

      <div className="table-container animate-in">
        <table className="table">
          <thead><tr><th>Patient</th><th>Department</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr> :
            appointments.length === 0 ? <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 40 }}>No appointments</td></tr> :
            appointments.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{a.patient?.firstName} {a.patient?.lastName}<br/><span className="text-xs text-muted">{a.patient?.patientId}</span></td>
                <td><span className="badge badge-primary">{a.department?.name}</span></td>
                <td>{a.doctor ? `Dr. ${a.doctor.user.firstName} ${a.doctor.user.lastName}` : '—'}</td>
                <td>{new Date(a.date).toLocaleDateString()}</td>
                <td>{a.timeSlot}</td>
                <td><span className={`badge ${statusColor(a.status)}`}>{a.status}</span></td>
                <td>
                  {a.status === 'SCHEDULED' && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-danger)' }} onClick={() => handleCancel(a.id)}>Cancel</button>}
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

      {showForm && <AppointmentFormModal onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); fetchAppointments(); }} />}
    </div>
  );
};

const AppointmentFormModal = ({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [form, setForm] = useState({ patientId: '', departmentId: '', doctorId: '', date: '', timeSlot: '', notes: '' });
  const [sub, setSub] = useState(false);

  useEffect(() => { departmentApi.getAll().then(r => setDepartments(r.data.data)); }, []);
  useEffect(() => { if (form.departmentId) doctorApi.getAll({ departmentId: form.departmentId }).then(r => setDoctors(r.data.data)); }, [form.departmentId]);
  useEffect(() => { if (patientSearch.length >= 2) patientApi.getAll({ search: patientSearch, limit: 5 }).then(r => setPatients(r.data.data)); }, [patientSearch]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setSub(true);
    try {
      await appointmentApi.create({ ...form, doctorId: form.doctorId || undefined });
      onCreated();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
    setSub(false);
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => { const h = Math.floor(i / 2) + 8; const m = i % 2 === 0 ? '00' : '30'; return `${h.toString().padStart(2, '0')}:${m}`; }).filter(t => t >= '08:00' && t <= '19:30');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header"><h2>Book Appointment</h2><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button></div>
        <form onSubmit={handle}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label>Patient *</label>
              <div style={{ position: 'relative' }}>
                <input className="input" placeholder="Search patient..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                {patients.length > 0 && patientSearch && !form.patientId && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', zIndex: 10, maxHeight: 200, overflow: 'auto' }}>
                    {patients.map(p => (
                      <div key={p.id} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-primary)', fontSize: '0.875rem' }}
                        onClick={() => { setForm({ ...form, patientId: p.id }); setPatientSearch(`${p.firstName} ${p.lastName} (${p.patientId})`); setPatients([]); }}>
                        {p.firstName} {p.lastName} — {p.patientId}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="input-group"><label>Department *</label><select className="input select" required value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value, doctorId: '' })}><option value="">Select</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            {doctors.length > 0 && <div className="input-group"><label>Doctor</label><select className="input select" value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })}><option value="">Any available</option>{doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.user.firstName} {d.user.lastName}</option>)}</select></div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-group"><label>Date *</label><input className="input" type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div className="input-group"><label>Time Slot *</label><select className="input select" required value={form.timeSlot} onChange={e => setForm({ ...form, timeSlot: e.target.value })}><option value="">Select</option>{timeSlots.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            </div>
            <div className="input-group"><label>Notes</label><input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={sub || !form.patientId}>{sub ? <span className="spinner" /> : 'Book'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
