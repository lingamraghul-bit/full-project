import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import './DashboardLayout.css';

export const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
