import { useEffect, useState } from 'react';
import { analyticsApi } from '../../api/client';
import { AnalyticsOverview } from '../../types';
import { BarChart3, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#14B8A6', '#6366F1', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6', '#10B981'];

export const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    setLoading(true);
    analyticsApi.overview(days).then(r => { setData(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, [days]);

  const handleExport = async () => {
    try {
      const res = await analyticsApi.export({ type: 'daily' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `queue-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch { alert('Export failed'); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!data) return null;

  return (
    <div>
      <div className="page-header">
        <div><h1><BarChart3 size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Analytics</h1><p>Queue performance and insights</p></div>
        <div className="flex gap-sm">
          <select className="input select" style={{ width: 140 }} value={days} onChange={e => setDays(parseInt(e.target.value))}>
            <option value={7}>Last 7 days</option><option value={14}>Last 14 days</option><option value={30}>Last 30 days</option>
          </select>
          <button className="btn btn-secondary" onClick={handleExport}><Download size={16} />Export CSV</button>
        </div>
      </div>

      <div className="content-grid content-grid-2">
        {/* Patients Per Day */}
        <div className="glass-card animate-in animate-in-1" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 20 }}>Patients Per Day</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.patientsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 8, fontSize: 13 }} />
                <Bar dataKey="count" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg Wait Time */}
        <div className="glass-card animate-in animate-in-2" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 20 }}>Average Wait Time (min)</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.avgWaitPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 8, fontSize: 13 }} />
                <Line type="monotone" dataKey="avg_wait" stroke="var(--accent-secondary)" strokeWidth={2} dot={{ fill: 'var(--accent-secondary)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Department */}
        <div className="glass-card animate-in animate-in-3" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 20 }}>Volume by Department</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byDepartment} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 8, fontSize: 13 }} />
                <Bar dataKey="count" fill="var(--accent-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="glass-card animate-in animate-in-4" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 20 }}>Status Breakdown</h3>
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={(entry: any) => `${entry.status}: ${entry.count}`} labelLine={{ stroke: 'var(--text-muted)' }}>
                  {data.statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 8, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="glass-card animate-in animate-in-5" style={{ padding: 24, gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 20 }}>Peak Hours</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="hour" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${v}:00`} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 8, fontSize: 13 }} labelFormatter={v => `${v}:00`} />
                <Bar dataKey="count" fill="var(--accent-warning)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
