import React from 'react';

export default function StationDashboard() {
  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Station Owner Dashboard</h1>
        <p>Manage your charging stations</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon">🔌</div>
          <div className="stat-info">
            <h3>My Stations</h3>
            <p className="stat-number">3</p>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <h3>Active Plugs</h3>
            <p className="stat-number">18/24</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Today's Revenue</h3>
            <p className="stat-number">Rs 3,500</p>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Total Sessions</h3>
            <p className="stat-number">45</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>My Stations</h3>
          <div className="station-list">
            <div className="station-item">
              <h4>DHA Phase 5 Station</h4>
              <p>9 plugs - Rs 18/kWh</p>
              <span className="status-badge open">Open</span>
            </div>
          </div>
          <button className="btn btn-primary">Add New Station</button>
        </div>

        <div className="dashboard-card">
          <h3>Breaker Control</h3>
          <p>Electric breaker API integration</p>
          <div className="breaker-controls">
            <div className="breaker-status">
              <span className="status-dot active"></span>
              <span>All breakers operational</span>
            </div>
            <button className="btn btn-secondary">View Details</button>
          </div>
        </div>
      </div>

      <div className="dashboard-card full-width">
        <h3>Recent Charging Sessions</h3>
        <p className="placeholder-text">
          Session history with electricity consumption data will appear here.
          Integration with breaker API coming soon.
        </p>
      </div>
    </div>
  );
}
