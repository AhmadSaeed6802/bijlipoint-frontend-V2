import React, { useEffect, useState } from 'react';
import API_URL from '../../apiConfig';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [pendingStations, setPendingStations] = useState([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('bijli_user'));
    setUser(userData);
    fetchPendingStations();
  }, [refresh]);

  const fetchPendingStations = async () => {
    try {
      const res = await fetch(`${API_URL}/stations/pending`);
      const data = await res.json();
      setPendingStations(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleApproval = async (stationId, approve) => {
    if (!user) return;

    try {
      const res = await fetch(`${API_URL}/stations/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId,
          approve,
          adminId: user.id
        })
      });

      const data = await res.json();
      alert(data.message);
      setRefresh(r => r + 1); // Refresh list
    } catch (err) {
      alert('Failed to process approval');
    }
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Regional access - Lahore Area</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card orange">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>Pending Approvals</h3>
            <p className="stat-number">{pendingStations.length}</p>
          </div>
        </div>

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
      </div>

      {/* Pending Approvals */}
      {pendingStations.length > 0 && (
        <div className="dashboard-card">
          <h3>⏳ Pending Station Approvals</h3>
          <div className="approval-list">
            {pendingStations.map(station => (
              <div key={station.id} className="approval-item">
                <div className="approval-info">
                  <h4>{station.name}</h4>
                  <p>{station.address}</p>
                  <p className="approval-details">
                    {station.totalPlugs} ports • Rs {station.ratePerKwh}/kWh
                  </p>
                  <p className="approval-date">
                    Requested: {new Date(station.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="approval-actions">
                  <button 
                    onClick={() => handleApproval(station.id, true)}
                    className="btn btn-success"
                  >
                    ✓ Approve
                  </button>
                  <button 
                    onClick={() => handleApproval(station.id, false)}
                    className="btn btn-danger"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingStations.length === 0 && (
        <div className="dashboard-card">
          <p className="empty-state">No pending approvals</p>
        </div>
      )}
    </div>
  );
}
