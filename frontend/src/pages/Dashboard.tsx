import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { dashboardApi } from '../api/client';
import { AdminDashboard as AdminDashboardType, ReceptionDashboard, DoctorDashboard as DoctorDashboardType } from '../types';
import {
  Users, UserPlus, Clock, Activity, CheckCircle, DoorOpen,
  CalendarCheck, Timer, Stethoscope, ListOrdered, AlertCircle
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();

  if (user?.role === 'DOCTOR') return <DoctorView />;
  if (user?.role === 'RECEPTIONIST') return <ReceptionView />;
  return <AdminView />;
};

const AdminView = () => {
  const [data, setData] = useState<AdminDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      const res = await dashboardApi.admin();
      setData(res.data.data);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    if (socket) {
      socket.on('queue:updated', fetchData);
      return () => { socket.off('queue:updated', fetchData); };
    }
  }, [socket]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state"><AlertCircle size={48} /><h3>Failed to load dashboard</h3></div>;

  const stats = [
    { label: 'Total Patients', value: data.totalPatients, icon: <Users size={22} />, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Today Registered', value: data.todayPatients, icon: <UserPlus size={22} />, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'Waiting in Queue', value: data.waiting, icon: <Clock size={22} />, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    { label: 'Being Served', value: data.inService, icon: <Activity size={22} />, color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
    { label: 'Completed Today', value: data.completed, icon: <CheckCircle size={22} />, color: '#14B8A6', bg: 'rgba(20,184,166,0.12)' },
    { label: 'Rooms Available', value: `${data.roomsAvailable}/${data.totalRooms}`, icon: <DoorOpen size={22} />, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
    { label: "Today's Appointments", value: data.todayAppointments, icon: <CalendarCheck size={22} />, color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
    { label: 'Avg Wait Time', value: `${data.avgWaitTime}m`, icon: <Timer size={22} />, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Real-time overview of hospital operations</p>
        </div>
        <span className="badge badge-success">● Live</span>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`stat-card animate-in animate-in-${i + 1}`}>
            <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReceptionView = () => {
  const [data, setData] = useState<ReceptionDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      const res = await dashboardApi.reception();
      setData(res.data.data);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    if (socket) {
      socket.on('queue:updated', fetchData);
      return () => { socket.off('queue:updated', fetchData); };
    }
  }, [socket]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!data) return null;

  const stats = [
    { label: 'Registered Today', value: data.todayRegistered, icon: <UserPlus size={22} />, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'Appointments Today', value: data.todayAppointments, icon: <CalendarCheck size={22} />, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Waiting', value: data.waiting, icon: <Clock size={22} />, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    { label: 'Being Served', value: data.inService, icon: <Activity size={22} />, color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
    { label: 'Completed', value: data.completed, icon: <CheckCircle size={22} />, color: '#14B8A6', bg: 'rgba(20,184,166,0.12)' },
    { label: 'No Shows', value: data.noShows, icon: <AlertCircle size={22} />, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reception Dashboard</h1>
          <p>Today's patient registration and queue overview</p>
        </div>
        <span className="badge badge-success">● Live</span>
      </div>
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`stat-card animate-in animate-in-${i + 1}`}>
            <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DoctorView = () => {
  const [data, setData] = useState<DoctorDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      const res = await dashboardApi.doctor();
      setData(res.data.data);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    if (socket) {
      socket.on('queue:updated', fetchData);
      return () => { socket.off('queue:updated', fetchData); };
    }
  }, [socket]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!data) return null;

  const stats = [
    { label: 'Appointments Today', value: data.todayAppointments, icon: <CalendarCheck size={22} />, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Waiting', value: data.queue.waiting, icon: <Clock size={22} />, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    { label: 'In Service', value: data.queue.inService, icon: <Stethoscope size={22} />, color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
    { label: 'Completed', value: data.queue.completed, icon: <CheckCircle size={22} />, color: '#14B8A6', bg: 'rgba(20,184,166,0.12)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{data.doctor.name}'s Dashboard</h1>
          <p>{data.doctor.department.name} • {data.doctor.specialization}</p>
        </div>
        <span className="badge badge-success">● Live</span>
      </div>
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`stat-card animate-in animate-in-${i + 1}`}>
            <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {data.queue.entries.length > 0 && (
        <div className="table-container mt-lg animate-in animate-in-5">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-primary)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
              <ListOrdered size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
              Queue
            </h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient</th>
                <th>Status</th>
                <th>Check-in</th>
              </tr>
            </thead>
            <tbody>
              {data.queue.entries.map(entry => (
                <tr key={entry.id}>
                  <td><span className="token-badge">{entry.tokenNumber}</span></td>
                  <td>{entry.appointment?.patient ? `${entry.appointment.patient.firstName} ${entry.appointment.patient.lastName}` : 'Walk-in'}</td>
                  <td>
                    <span className={`badge ${
                      entry.status === 'WAITING' ? 'badge-warning' :
                      entry.status === 'CALLED' ? 'badge-info' :
                      entry.status === 'IN_SERVICE' ? 'badge-purple' :
                      entry.status === 'COMPLETED' ? 'badge-success' : 'badge-neutral'
                    }`}>{entry.status}</span>
                  </td>
                  <td className="text-muted text-sm">{new Date(entry.checkinTime).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
