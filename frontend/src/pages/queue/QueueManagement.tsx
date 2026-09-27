import { useEffect, useState } from 'react';
import { queueApi, departmentApi } from '../../api/client';
import { useSocket } from '../../contexts/SocketContext';
import { Department } from '../../types';
import { ListOrdered, PhoneCall, Play, CheckCircle, SkipForward, XCircle, RefreshCw } from 'lucide-react';

export const QueuePage = () => {
  const { socket } = useSocket();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    departmentApi.getAll().then(r => {
      setDepartments(r.data.data);
      if (r.data.data.length > 0) setSelectedDept(r.data.data[0].id);
    });
  }, []);

  const fetchQueue = async () => {
    if (!selectedDept) return;
    try {
      const { data } = await queueApi.getByDepartment(selectedDept);
      setQueueData(data.data);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => { if (selectedDept) { setLoading(true); fetchQueue(); } }, [selectedDept]);

  useEffect(() => {
    if (socket) {
      socket.on('queue:updated', (payload: any) => {
        if (payload.departmentId === selectedDept) fetchQueue();
      });
      return () => { socket.off('queue:updated'); };
    }
  }, [socket, selectedDept]);

  const handleAction = async (action: string, entryId: string) => {
    try {
      switch (action) {
        case 'start': await queueApi.startService(entryId); break;
        case 'complete': await queueApi.completeService(entryId); break;
        case 'skip': await queueApi.skip(entryId); break;
        case 'cancel': await queueApi.cancel(entryId); break;
        case 'recall': await queueApi.recall(entryId); break;
      }
      fetchQueue();
    } catch (err: any) { alert(err.response?.data?.message || 'Action failed'); }
  };

  const handleCallNext = async () => {
    try {
      const { data } = await queueApi.callNext(selectedDept);
      if (!data.data) alert('No patients waiting');
      else fetchQueue();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1><ListOrdered size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Queue Management</h1>
          <p>Real-time patient queue operations</p>
        </div>
        <div className="flex gap-sm items-center">
          <select className="input select" style={{ width: 220 }} value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={handleCallNext}>
            <PhoneCall size={18} />Call Next
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {queueData && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
          <div className="stat-card animate-in animate-in-1">
            <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>{queueData.totalWaiting}</div>
            <div className="stat-label">Waiting</div>
          </div>
          <div className="stat-card animate-in animate-in-2">
            <div className="stat-value" style={{ color: 'var(--accent-info)' }}>{queueData.called ? '1' : '0'}</div>
            <div className="stat-label">Called</div>
          </div>
          <div className="stat-card animate-in animate-in-3">
            <div className="stat-value" style={{ color: 'var(--accent-secondary)' }}>{queueData.serving ? '1' : '0'}</div>
            <div className="stat-label">In Service</div>
          </div>
        </div>
      )}

      {/* Currently Serving / Called */}
      {queueData?.serving && (
        <div className="glass-card animate-in animate-in-4" style={{ padding: 24, marginBottom: 20, borderLeft: '4px solid var(--accent-secondary)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted" style={{ marginBottom: 4 }}>NOW SERVING</div>
              <span className="token-display" style={{ fontSize: '2rem' }}>{queueData.serving.tokenNumber}</span>
              <div className="text-sm text-muted mt-sm">{queueData.serving.appointment?.patient ? `${queueData.serving.appointment.patient.firstName} ${queueData.serving.appointment.patient.lastName}` : 'Walk-in'}</div>
            </div>
            <div className="flex gap-sm">
              <button className="btn btn-primary btn-sm" onClick={() => handleAction('complete', queueData.serving.id)}><CheckCircle size={16} />Complete</button>
            </div>
          </div>
        </div>
      )}

      {queueData?.called && (
        <div className="glass-card animate-in animate-in-5" style={{ padding: 24, marginBottom: 20, borderLeft: '4px solid var(--accent-info)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted" style={{ marginBottom: 4 }}>CALLED</div>
              <span className="token-display" style={{ fontSize: '2rem' }}>{queueData.called.tokenNumber}</span>
              <div className="text-sm text-muted mt-sm">{queueData.called.appointment?.patient ? `${queueData.called.appointment.patient.firstName} ${queueData.called.appointment.patient.lastName}` : 'Walk-in'}</div>
            </div>
            <div className="flex gap-sm">
              <button className="btn btn-primary btn-sm" onClick={() => handleAction('start', queueData.called.id)}><Play size={16} />Start Service</button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleAction('recall', queueData.called.id)}><RefreshCw size={16} />Recall</button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleAction('skip', queueData.called.id)}><SkipForward size={16} />Skip</button>
            </div>
          </div>
        </div>
      )}

      {/* Waiting List */}
      <div className="table-container animate-in animate-in-6">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-primary)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Waiting Queue</h3>
        </div>
        <table className="table">
          <thead><tr><th>Token</th><th>Patient</th><th>Priority</th><th>Check-in</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr> :
            !queueData?.waiting?.length ? <tr><td colSpan={5} className="text-center text-muted" style={{ padding: 40 }}>No patients waiting</td></tr> :
            queueData.waiting.map((entry: any) => (
              <tr key={entry.id}>
                <td><span className="token-badge">{entry.tokenNumber}</span></td>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{entry.appointment?.patient ? `${entry.appointment.patient.firstName} ${entry.appointment.patient.lastName}` : 'Walk-in'}</td>
                <td><span className={`badge ${entry.priority >= 2 ? 'badge-danger' : entry.priority === 1 ? 'badge-warning' : 'badge-neutral'}`}>{entry.priority >= 2 ? 'Emergency' : entry.priority === 1 ? 'Appointment' : 'Normal'}</span></td>
                <td className="text-sm text-muted">{new Date(entry.checkinTime).toLocaleTimeString()}</td>
                <td>
                  <div className="flex gap-sm">
                    <button className="btn btn-ghost btn-sm" title="Cancel" onClick={() => handleAction('cancel', entry.id)}><XCircle size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
