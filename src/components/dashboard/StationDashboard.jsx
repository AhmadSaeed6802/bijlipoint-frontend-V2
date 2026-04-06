import React, { useEffect, useState } from 'react';
import API_URL from '../../apiConfig';
import LiveMonitoring from '../monitoring/LiveMonitoring';
import '../monitoring/LiveMonitoring.css';

export default function StationDashboard() {
  const [user, setUser] = useState(null);
  const [stations, setStations] = useState([]);
  const [activeStation, setActiveStation] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stationPassword, setStationPassword] = useState('');

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('bijli_user'));
    setUser(userData);
    fetchMyStations(userData.id);
  }, []);

  const fetchMyStations = async (ownerId) => {
    try {
      const res = await fetch(`${API_URL}/stations/my-stations/${ownerId}`);
      const data = await res.json();
      setStations(data);
    } catch (err) {
      console.error('Error fetching stations:', err);
    }
  };

  const openStation = (station) => {
    if (station.approvalStatus !== 'Approved') {
      alert('Station not approved yet!');
      return;
    }
    setSelectedStation(station);
    setShowPasswordPrompt(true);
  };

  const verifyAndOpen = async () => {
    try {
      const res = await fetch(`${API_URL}/stations/verify-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: selectedStation.id,
          password: stationPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setActiveStation(selectedStation);
        setShowPasswordPrompt(false);
        setStationPassword('');
      } else {
        alert(data.error || 'Access denied');
      }
    } catch (err) {
      alert('Failed to verify password');
    }
  };

  const approvedStations = stations.filter(s => s.approvalStatus === 'Approved');
  const pendingStations = stations.filter(s => s.approvalStatus === 'Pending');

  if (activeStation) {
    return (
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>{activeStation.name}</h1>
          <button 
            onClick={() => setActiveStation(null)}
            className="btn btn-secondary"
          >
            ← Back to Stations
          </button>
        </div>
        <LiveMonitoring stationId={activeStation.id} />
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Station Owner Dashboard</h1>
        <button 
          onClick={() => setShowRegisterForm(true)} 
          className="btn btn-primary"
        >
          + Register New Station
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon">🔌</div>
          <div className="stat-info">
            <h3>Approved Stations</h3>
            <p className="stat-number">{approvedStations.length}</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>Pending Approval</h3>
            <p className="stat-number">{pendingStations.length}</p>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <h3>Total Ports</h3>
            <p className="stat-number">
              {stations.reduce((sum, s) => sum + s.totalPlugs, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Approved Stations */}
      {approvedStations.length > 0 && (
        <div className="dashboard-card">
          <h3>My Approved Stations</h3>
          <div className="station-list">
            {approvedStations.map(station => (
              <div key={station.id} className="station-item-card">
                <div>
                  <h4>{station.name}</h4>
                  <p>{station.address}</p>
                  <p>{station.totalPlugs} ports • Rs {station.ratePerKwh}/kWh</p>
                </div>
                <button 
                  onClick={() => openStation(station)}
                  className="btn btn-primary"
                >
                  Open Station →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Stations */}
      {pendingStations.length > 0 && (
        <div className="dashboard-card">
          <h3>⏳ Pending Approval</h3>
          <div className="station-list">
            {pendingStations.map(station => (
              <div key={station.id} className="station-item-card pending">
                <div>
                  <h4>{station.name}</h4>
                  <p>{station.address}</p>
                  <span className="status-badge pending">Pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registration Form */}
      {showRegisterForm && (
        <RegisterStationForm 
          ownerId={user.id}
          onClose={() => setShowRegisterForm(false)}
          onSuccess={() => {
            setShowRegisterForm(false);
            fetchMyStations(user.id);
          }}
        />
      )}

      {/* Password Prompt */}
      {showPasswordPrompt && (
        <div className="modal-overlay" onClick={() => setShowPasswordPrompt(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Enter Station Password</h3>
            <p>Station: {selectedStation.name}</p>
            <input
              type="password"
              value={stationPassword}
              onChange={e => setStationPassword(e.target.value)}
              placeholder="Station password"
              className="form-input"
            />
            <div className="modal-actions">
              <button onClick={verifyAndOpen} className="btn btn-primary">
                Open
              </button>
              <button 
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setStationPassword('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Registration Form Component
function RegisterStationForm({ ownerId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    totalPlugs: 9,
    ratePerKwh: 18,
    openTime: '00:00',
    closeTime: '23:59',
    whatsAppNumber: '',
    stationPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/stations/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ownerId,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        onSuccess();
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (err) {
      alert('Failed to register station');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <h3>Register New Station</h3>
        <form onSubmit={handleSubmit} className="station-form">
          <div className="form-row">
            <div className="form-group">
              <label>Station Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
                placeholder="DHA Phase 5 Station"
              />
            </div>

            <div className="form-group">
              <label>WhatsApp Number</label>
              <input
                type="tel"
                value={formData.whatsAppNumber}
                onChange={e => setFormData({...formData, whatsAppNumber: e.target.value})}
                placeholder="+92 300 1234567"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Address *</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              required
              placeholder="Main Boulevard, DHA Phase 5, Lahore"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitude *</label>
              <input
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={e => setFormData({...formData, latitude: e.target.value})}
                required
                placeholder="31.4742"
              />
            </div>

            <div className="form-group">
              <label>Longitude *</label>
              <input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={e => setFormData({...formData, longitude: e.target.value})}
                required
                placeholder="74.4119"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Ports *</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.totalPlugs}
                onChange={e => setFormData({...formData, totalPlugs: parseInt(e.target.value)})}
                required
              />
            </div>

            <div className="form-group">
              <label>Rate (Rs/kWh) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.ratePerKwh}
                onChange={e => setFormData({...formData, ratePerKwh: parseFloat(e.target.value)})}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Opening Time</label>
              <input
                type="time"
                value={formData.openTime}
                onChange={e => setFormData({...formData, openTime: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Closing Time</label>
              <input
                type="time"
                value={formData.closeTime}
                onChange={e => setFormData({...formData, closeTime: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Station Password * (min 6 characters)</label>
            <input
              type="password"
              value={formData.stationPassword}
              onChange={e => setFormData({...formData, stationPassword: e.target.value})}
              required
              minLength="6"
              placeholder="Secure password for this station"
            />
            <small>This password will be required to access station monitoring</small>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">
              Register Station
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
