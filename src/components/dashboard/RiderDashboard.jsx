import React from 'react';

export default function RiderDashboard() {
  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Rider Dashboard</h1>
        <p>Your charging history & favorites</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <h3>Total Sessions</h3>
            <p className="stat-number">28</p>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Total Spent</h3>
            <p className="stat-number">Rs 4,200</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">🌱</div>
          <div className="stat-info">
            <h3>CO2 Saved</h3>
            <p className="stat-number">45 kg</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Recent Charging Sessions</h3>
          <div className="session-list">
            <div className="session-item">
              <div className="session-info">
                <h4>LUMS Charging Hub</h4>
                <p>15 kWh - Rs 225</p>
              </div>
              <span className="session-date">Today, 2:30 PM</span>
            </div>
            <div className="session-item">
              <div className="session-info">
                <h4>DHA Phase 5</h4>
                <p>12 kWh - Rs 216</p>
              </div>
              <span className="session-date">Yesterday</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Favorite Stations</h3>
          <div className="favorite-list">
            <div className="favorite-item">
              <span>⭐</span>
              <div>
                <h4>LUMS Hub</h4>
                <p>5 visits</p>
              </div>
            </div>
          </div>
          <button className="btn btn-primary">Find Stations</button>
        </div>
      </div>
    </div>
  );
}
