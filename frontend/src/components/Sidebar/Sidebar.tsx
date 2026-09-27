import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Users, Stethoscope, Building2,
  CalendarCheck, QrCode, ListOrdered, BarChart3, Shield, Settings,
  LogOut, UserCog, Layers, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import { useState } from 'react';
import './Sidebar.css';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
  { to: '/patients', icon: <Users size={20} />, label: 'Patients', roles: ['ADMIN', 'RECEPTIONIST'] },
  { to: '/appointments', icon: <CalendarCheck size={20} />, label: 'Appointments', roles: ['ADMIN', 'RECEPTIONIST'] },
  { to: '/queue', icon: <ListOrdered size={20} />, label: 'Queue', roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
  { to: '/qr-checkin', icon: <QrCode size={20} />, label: 'QR Check-in', roles: ['ADMIN', 'RECEPTIONIST'] },
  { to: '/departments', icon: <Building2 size={20} />, label: 'Departments', roles: ['ADMIN'] },
  { to: '/doctors', icon: <Stethoscope size={20} />, label: 'Doctors', roles: ['ADMIN'] },
  { to: '/staff', icon: <UserCog size={20} />, label: 'Staff', roles: ['ADMIN'] },
  { to: '/services', icon: <Layers size={20} />, label: 'Services', roles: ['ADMIN'] },
  { to: '/analytics', icon: <BarChart3 size={20} />, label: 'Analytics', roles: ['ADMIN'] },
  { to: '/audit-logs', icon: <Shield size={20} />, label: 'Audit Logs', roles: ['ADMIN'] },
  { to: '/settings', icon: <Settings size={20} />, label: 'Settings', roles: ['ADMIN'] },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const filtered = navItems.filter(item => user && item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Activity size={28} color="var(--accent-primary)" />
          {!collapsed && <span className="logo-text">SmartQMS</span>}
        </div>
        <button className="btn-icon btn-ghost sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {filtered.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          {!collapsed && (
            <div className="user-info">
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <span className="user-role">{user?.role?.replace('_', ' ')}</span>
            </div>
          )}
        </div>
        <button className="btn-ghost nav-item" onClick={handleLogout} title="Logout">
          <span className="nav-icon"><LogOut size={20} /></span>
          {!collapsed && <span className="nav-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
