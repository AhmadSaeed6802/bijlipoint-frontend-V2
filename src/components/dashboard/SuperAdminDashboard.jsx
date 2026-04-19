import React, { useState, useEffect } from 'react';
import API_URL from '../../apiConfig';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ totalApproved: 0, totalPending: 0, totalRiders: 0, totalOwners: 0 });

  useEffect(() => {
    fetch(`${API_URL}/stations/stats`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Super Admin Dashboard</h1>
        <p>Complete system access - All cities & regions</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon">🔌</div>
          <div className="stat-info">
            <h3>Approved Stations</h3>
            <p className="stat-number">{stats.totalApproved}</p>
            <span className="stat-change">{stats.totalPending} pending</span>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">🏍️</div>
          <div className="stat-info">
            <h3>Total Riders</h3>
            <p className="stat-number">{stats.totalRiders}</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Station Owners</h3>
            <p className="stat-number">{stats.totalOwners}</p>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Monthly Revenue</h3>
            <p className="stat-number">Rs 450K</p>
            <span className="stat-change">+15% growth</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">🆕</span>
              <div className="activity-info">
                <p>New station added in Gulberg</p>
                <span className="activity-time">2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">👤</span>
              <div className="activity-info">
                <p>5 new riders registered</p>
                <span className="activity-time">5 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">⚡</span>
              <div className="activity-info">
                <p>1,200 charging sessions today</p>
                <span className="activity-time">Just now</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn">Add New Station</button>
            <button className="action-btn">Create Admin</button>
            <button className="action-btn">View All Users</button>
            <button className="action-btn">System Reports</button>
            <button className="action-btn">Breaker API Config</button>
            <button className="action-btn">Revenue Analytics</button>
          </div>
        </div>
      </div>

      <div className="dashboard-card full-width">
        <h3>All Stations Overview</h3>
        <p className="placeholder-text">
          Station management interface will be implemented here.
          API integration for breaker control coming soon.
        </p>
      </div>
    </div>
  );
}
