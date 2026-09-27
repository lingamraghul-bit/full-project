import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { DashboardLayout } from './layouts/DashboardLayout/DashboardLayout';
import { LoginPage } from './pages/auth/Login';
import { DashboardPage } from './pages/Dashboard';
import { PatientsPage } from './pages/admin/Patients';
import { DepartmentsPage } from './pages/admin/Departments';
import { DoctorsPage } from './pages/admin/Doctors';
import { StaffPage } from './pages/admin/Staff';
import { ServicesPage } from './pages/admin/Services';
import { AppointmentsPage } from './pages/reception/Appointments';
import { QRCheckinPage } from './pages/reception/QRCheckin';
import { QueuePage } from './pages/queue/QueueManagement';
import { AnalyticsPage } from './pages/admin/Analytics';
import { AuditLogsPage } from './pages/admin/AuditLogs';
import { SettingsPage } from './pages/admin/Settings';
import { QueueDisplayPage } from './pages/display/QueueDisplay';
import { Role } from './types';
import { ReactNode } from 'react';

// Protected route wrapper
const Protected = ({ children, roles }: { children: ReactNode; roles?: Role[] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Redirect if already logged in
const PublicOnly = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
            <Route path="/display" element={<QueueDisplayPage />} />
            <Route path="/display/:departmentId" element={<QueueDisplayPage />} />

            {/* Protected dashboard routes */}
            <Route path="/" element={<Protected><DashboardLayout /></Protected>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />

              {/* Patient management - Admin & Receptionist */}
              <Route path="patients" element={<Protected roles={['ADMIN', 'RECEPTIONIST']}><PatientsPage /></Protected>} />
              <Route path="appointments" element={<Protected roles={['ADMIN', 'RECEPTIONIST']}><AppointmentsPage /></Protected>} />
              <Route path="qr-checkin" element={<Protected roles={['ADMIN', 'RECEPTIONIST']}><QRCheckinPage /></Protected>} />

              {/* Queue - Admin, Receptionist, Doctor */}
              <Route path="queue" element={<Protected roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR']}><QueuePage /></Protected>} />

              {/* Admin only */}
              <Route path="departments" element={<Protected roles={['ADMIN']}><DepartmentsPage /></Protected>} />
              <Route path="doctors" element={<Protected roles={['ADMIN']}><DoctorsPage /></Protected>} />
              <Route path="staff" element={<Protected roles={['ADMIN']}><StaffPage /></Protected>} />
              <Route path="services" element={<Protected roles={['ADMIN']}><ServicesPage /></Protected>} />
              <Route path="analytics" element={<Protected roles={['ADMIN']}><AnalyticsPage /></Protected>} />
              <Route path="audit-logs" element={<Protected roles={['ADMIN']}><AuditLogsPage /></Protected>} />
              <Route path="settings" element={<Protected roles={['ADMIN']}><SettingsPage /></Protected>} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
