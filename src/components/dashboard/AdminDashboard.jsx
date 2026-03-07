import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Regional access - Lahore Area</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon">🔌</div>
          <div className="stat-info">
            <h3>My Region Stations</h3>
            <p className="stat-number">25</p>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">🏍️</div>
          <div className="stat-info">
            <h3>Active Riders</h3>
            <p className="stat-number">450</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <h3>Today's Sessions</h3>
            <p className="stat-number">120</p>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h3>Regional Stations</h3>
        <p className="placeholder-text">
          Station list for your assigned region will appear here.
        </p>
      </div>
    </div>
  );
}
