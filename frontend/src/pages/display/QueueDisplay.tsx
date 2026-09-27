import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { queueApi, departmentApi } from '../../api/client';
import { DisplayQueue, Department } from '../../types';
import { io } from 'socket.io-client';
import './QueueDisplay.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const QueueDisplayPage = () => {
  const { departmentId } = useParams();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState(departmentId || '');
  const [displayData, setDisplayData] = useState<DisplayQueue | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!departmentId) {
      departmentApi.getAll().then(r => {
        setDepartments(r.data.data);
        if (r.data.data.length > 0 && !selectedDept) setSelectedDept(r.data.data[0].id);
      });
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDisplay = async () => {
    if (!selectedDept) return;
    try {
      const { data } = await queueApi.getDisplay(selectedDept);
      setDisplayData(data.data);
    } catch { /* handled */ }
  };

  useEffect(() => { fetchDisplay(); }, [selectedDept]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.on('queue:updated', (payload: any) => {
      if (payload.departmentId === selectedDept) fetchDisplay();
    });
    socket.on('token:called', () => fetchDisplay());
    socket.on('token:completed', () => fetchDisplay());
    // Auto-refresh every 15s as fallback
    const interval = setInterval(fetchDisplay, 15000);
    return () => { socket.disconnect(); clearInterval(interval); };
  }, [selectedDept]);

  return (
    <div className="display-page">
      <div className="display-header">
        <div className="display-logo">
          <h1>SmartQMS</h1>
          {displayData && <h2>{displayData.department.name}</h2>}
        </div>
        <div className="display-time">
          <div className="display-clock">{currentTime.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          <div className="display-date">{currentTime.toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      {!departmentId && departments.length > 0 && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <select className="input select" style={{ width: 300, background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      )}

      <div className="display-content">
        {/* Now Serving */}
        <div className="display-serving">
          <div className="display-label">NOW SERVING</div>
          {displayData?.serving ? (
            <div className="display-token-main animate-pulse">{displayData.serving.tokenNumber}</div>
          ) : (
            <div className="display-token-empty">—</div>
          )}
          {displayData?.serving?.room && <div className="display-room">Room {displayData.serving.room}</div>}
        </div>

        {/* Called */}
        {displayData?.called && (
          <div className="display-called">
            <div className="display-label">CALLED - PLEASE PROCEED</div>
            <div className="display-token-called">{displayData.called.tokenNumber}</div>
            {displayData.called.room && <div className="display-room">Room {displayData.called.room}</div>}
          </div>
        )}

        {/* Upcoming */}
        <div className="display-upcoming">
          <div className="display-label">UPCOMING</div>
          <div className="display-upcoming-grid">
            {displayData?.upcoming?.length ? displayData.upcoming.map((item, i) => (
              <div key={i} className="display-upcoming-token">{item.tokenNumber}</div>
            )) : (
              <div className="display-token-empty" style={{ fontSize: '1.5rem' }}>No patients waiting</div>
            )}
          </div>
          <div className="display-total">{displayData?.totalWaiting || 0} patients waiting</div>
        </div>
      </div>
    </div>
  );
};
