import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ChargingSession from '../charging/ChargingSession';

export default function RiderDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [showCharging, setShowCharging] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalSpent: 0,
    totalUnits: 0
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`https://localhost:49597/api/sessions/user/${user.id}`);
      const data = await res.json();
      setSessions(data);
      
      const total = data.reduce((sum, s) => sum + s.totalCost, 0);
      const units = data.reduce((sum, s) => sum + s.unitsConsumed, 0);
      
      setStats({
        totalSessions: data.length,
        totalSpent: total,
        totalUnits: units
      });
    } catch (err) {
      console.log('No sessions yet');
    }
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Rider Dashboard</h1>
        <p>Your charging history & stats</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <h3>Total Sessions</h3>
            <p className="stat-number">{stats.totalSessions}</p>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">🔋</div>
          <div className="stat-info">
            <h3>Energy Consumed</h3>
            <p className="stat-number">{stats.totalUnits.toFixed(2)} kWh</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Total Spent</h3>
            <p className="stat-number">Rs {stats.totalSpent.toFixed(0)}</p>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">🌱</div>
          <div className="stat-info">
            <h3>CO2 Saved</h3>
            <p className="stat-number">{(stats.totalUnits * 0.5).toFixed(0)} kg</p>
          </div>
        </div>
      </div>

      <div className="charging-action">
        <button 
          onClick={() => setShowCharging(true)} 
          className="btn-start-charging"
        >
          ⚡ Start Charging Now
        </button>
      </div>

      <div className="dashboard-card">
        <h3>Recent Charging Sessions</h3>
        {sessions.length > 0 ? (
          <div className="session-list">
            {sessions.slice(0, 5).map(session => (
              <div key={session.id} className="session-item">
                <div className="session-info">
                  <h4>Station #{session.stationId}</h4>
                  <p>{session.unitsConsumed.toFixed(2)} kWh - Rs {session.totalCost.toFixed(0)}</p>
                </div>
                <span className="session-date">
                  {new Date(session.startTime).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No charging sessions yet. Start your first charge!</p>
        )}
      </div>

      {showCharging && (
        <ChargingSession 
          userId={user.id}
          onClose={() => {
            setShowCharging(false);
            fetchSessions();
          }}
        />
      )}
    </div>
  );
}
