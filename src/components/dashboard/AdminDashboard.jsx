import React, { useEffect, useState } from 'react';
import API_URL from '../../apiConfig';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [pendingStations, setPendingStations] = useState([]);
  const [stats, setStats] = useState({ totalApproved: 0, totalPending: 0, totalRiders: 0 });
  const [detailStation, setDetailStation] = useState(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('bijli_user'));
    setUser(userData);
    fetchPendingStations();
    fetchStats();
  }, [refresh]);

  const fetchPendingStations = async () => {
    try {
      const res = await fetch(`${API_URL}/stations/pending`);
      const data = await res.json();
      setPendingStations(data);
    } catch (err) {
      console.error('Error fetching pending stations:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/stations/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleApproval = async (stationId, approve) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/stations/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId, approve, adminId: user.id })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Action failed');
        return;
      }
      alert(data.message);
      setDetailStation(null);
      setRefresh(r => r + 1);
    } catch (err) {
      alert('Network error — please try again');
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
            <p className="stat-number">{stats.totalPending}</p>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🔌</div>
          <div className="stat-info">
            <h3>Approved Stations</h3>
            <p className="stat-number">{stats.totalApproved}</p>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">🏍️</div>
          <div className="stat-info">
            <h3>Total Riders</h3>
            <p className="stat-number">{stats.totalRiders}</p>
          </div>
        </div>
      </div>

      {pendingStations.length > 0 ? (
        <div className="dashboard-card">
          <h3>⏳ Pending Station Approvals</h3>
          <div className="approval-list">
            {pendingStations.map(station => (
              <div key={station.id} className="approval-item">
                <div className="approval-info">
                  <h4>{station.name}</h4>
                  {station.stationID && (
                    <p style={{ color: '#10B981', fontFamily: 'monospace', fontSize: '13px' }}>
                      ID: {station.stationID}
                    </p>
                  )}
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
                    onClick={() => setDetailStation(station)}
                    className="btn btn-secondary"
                    style={{ marginBottom: '6px' }}
                  >
                    View Details
                  </button>
                  <button onClick={() => handleApproval(station.id, true)} className="btn btn-success">
                    Approve
                  </button>
                  <button onClick={() => handleApproval(station.id, false)} className="btn btn-danger">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="dashboard-card">
          <p className="empty-state">No pending approvals</p>
        </div>
      )}

      {detailStation && (
        <StationDetailModal
          station={detailStation}
          onClose={() => setDetailStation(null)}
          onApprove={() => handleApproval(detailStation.id, true)}
          onReject={() => handleApproval(detailStation.id, false)}
        />
      )}
    </div>
  );
}

function StationDetailModal({ station, onClose, onApprove, onReject }) {
  const [fullDetail, setFullDetail] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/stations/details/${station.id}`)
      .then(r => r.json())
      .then(d => setFullDetail(d))
      .catch(() => setFullDetail(station));
  }, [station.id]);

  const detail = fullDetail || station;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <h3>Station Details</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ color: '#888', fontSize: '12px' }}>Station Name</label>
            <p style={{ fontWeight: 600 }}>{detail.name}</p>
          </div>
          <div>
            <label style={{ color: '#888', fontSize: '12px' }}>Station ID</label>
            <p style={{ fontFamily: 'monospace', color: '#10B981', fontWeight: 600 }}>{detail.stationID || '—'}</p>
          </div>
          <div>
            <label style={{ color: '#888', fontSize: '12px' }}>Address</label>
            <p>{detail.address}</p>
          </div>
          <div>
            <label style={{ color: '#888', fontSize: '12px' }}>Rate</label>
            <p>Rs {detail.ratePerKwh}/kWh</p>
          </div>
          <div>
            <label style={{ color: '#888', fontSize: '12px' }}>Total Ports</label>
            <p>{detail.totalPlugs}</p>
          </div>
          <div>
            <label style={{ color: '#888', fontSize: '12px' }}>WhatsApp</label>
            <p>{detail.whatsAppNumber || '—'}</p>
          </div>
          {detail.latitude && (
            <div>
              <label style={{ color: '#888', fontSize: '12px' }}>Location</label>
              <p style={{ fontSize: '13px' }}>{detail.latitude}, {detail.longitude}</p>
            </div>
          )}
          <div>
            <label style={{ color: '#888', fontSize: '12px' }}>Open Hours</label>
            <p>{detail.openTime ? String(detail.openTime).substring(0, 5) : '00:00'} – {detail.closeTime ? String(detail.closeTime).substring(0, 5) : '23:59'}</p>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onApprove} className="btn btn-success">Approve</button>
          <button onClick={onReject} className="btn btn-danger">Reject</button>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}
