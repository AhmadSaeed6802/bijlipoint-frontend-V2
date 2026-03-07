import React from 'react';
import { useAuth } from '../../context/AuthContext';
import SuperAdminDashboard from './SuperAdminDashboard';
import AdminDashboard from './AdminDashboard';
import StationDashboard from './StationDashboard';
import RiderDashboard from './RiderDashboard';

export default function Dashboard() {
  const { user, logout } = useAuth();

  if (!user) {
    window.location.href = '/';
    return null;
  }

  const getDashboard = () => {
    switch (user.role) {
      case 'SuperAdmin':
        return <SuperAdminDashboard />;
      case 'Admin':
        return <AdminDashboard />;
      case 'StationOwner':
        return <StationDashboard />;
      case 'Rider':
        return <RiderDashboard />;
      default:
        return <div>Invalid role</div>;
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>⚡ BijliPoint</h2>
          <p className="user-role">{user.role}</p>
          
        </div>
        
        <div className="sidebar-user">
          <div className="user-avatar">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <h4>{user.name}</h4>
            <p>{user.email}</p>
          </div>
        </div>
        
        
        <button onClick={logout} className="btn-logout">
          Logout →
        </button>
        <button 
          onClick={() => window.location.href = '/'} 
          className="btn-home"
        >
          🏠 Back to Home
        </button>

      </div>

      <div className="dashboard-main">
        {getDashboard()}
      </div>
    </div>
  );
}
