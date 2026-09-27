import { useEffect, useState } from 'react';
import { auditApi } from '../../api/client';
import { AuditLog } from '../../types';
import { Shield } from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    auditApi.getAll({ page, limit: 30 }).then(r => {
      setLogs(r.data.data);
      setTotalPages(r.data.pagination?.totalPages || 1);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <div className="page-header">
        <div><h1><Shield size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Audit Logs</h1><p>System activity trail</p></div>
      </div>
      <div className="table-container animate-in">
        <table className="table">
          <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr> :
            logs.map(log => (
              <tr key={log.id}>
                <td className="text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}<br/><span className="text-xs text-muted">{log.user?.role}</span></td>
                <td><span className="badge badge-info">{log.action}</span></td>
                <td>{log.entity}{log.entityId ? <br/> : ''}{log.entityId && <span className="text-xs text-muted">{log.entityId.slice(0, 8)}...</span>}</td>
                <td className="text-xs text-muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.details || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && <div className="pagination"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button><span className="text-sm text-muted">Page {page} of {totalPages}</span><button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button></div>}
      </div>
    </div>
  );
};
