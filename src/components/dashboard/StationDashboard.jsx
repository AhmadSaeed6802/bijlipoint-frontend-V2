import React, { useEffect, useState } from 'react';
import API_URL from '../../apiConfig';
import LiveMonitoring from '../monitoring/LiveMonitoring';
import StationSessions from './StationSessions';
import StationPortHealth from './StationPortHealth';
import '../monitoring/LiveMonitoring.css';

export default function StationDashboard() {
  const [user, setUser] = useState(null);
  const [stations, setStations] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [activeStation, setActiveStation] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stationPassword, setStationPassword] = useState('');

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('bijli_user'));
    setUser(userData);
    if (userData?.id) fetchMyStations(userData.id);
  }, []);

  const fetchMyStations = async (ownerId) => {
    try {
      const res = await fetch(`${API_URL}/stations/my-stations/${ownerId}`);
      const data = await res.json();
      if (!res.ok) { setFetchError(data.error || 'Failed to load stations'); return; }
      setStations(Array.isArray(data) ? data : []);
      setFetchError(null);
    } catch (err) {
      setFetchError('Could not reach server. Is the backend running?');
      console.error('Error fetching stations:', err);
    }
  };

  const openStation = (station) => {
    if (station.approvalStatus !== 'Approved') {
      alert('Station not approved yet. Please wait for admin approval.');
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
        body: JSON.stringify({ stationId: selectedStation.id, password: stationPassword })
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
    return <StationView station={activeStation} onBack={() => setActiveStation(null)} />;
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Station Owner Dashboard</h1>
        <button onClick={() => setShowRegisterForm(true)} className="btn btn-primary">
          + Register New Station
        </button>
      </div>

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
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>Total Stations</h3>
            <p className="stat-number">{stations.length}</p>
          </div>
        </div>
      </div>

      {fetchError && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          Error: {fetchError}
        </div>
      )}

      {approvedStations.length > 0 && (
        <div className="dashboard-card">
          <h3>My Approved Stations</h3>
          <div className="station-list">
            {approvedStations.map(station => (
              <div key={station.id} className="station-item-card">
                <div>
                  <h4>{station.name}</h4>
                  {station.stationID && (
                    <p style={{ color: '#10B981', fontFamily: 'monospace', fontSize: '13px' }}>
                      ID: {station.stationID}
                    </p>
                  )}
                  <p>{station.address}</p>
                  <p>{station.totalPlugs} ports • Rs {station.ratePerKwh}/kWh</p>
                </div>
                <button onClick={() => openStation(station)} className="btn btn-primary">
                  Open Station →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingStations.length > 0 && (
        <div className="dashboard-card">
          <h3>⏳ Pending Approval</h3>
          <div className="station-list">
            {pendingStations.map(station => (
              <div key={station.id} className="station-item-card pending">
                <div>
                  <h4>{station.name}</h4>
                  {station.stationID && (
                    <p style={{ color: '#F59E0B', fontFamily: 'monospace', fontSize: '13px' }}>
                      ID: {station.stationID}
                    </p>
                  )}
                  <p>{station.address}</p>
                  <span className="status-badge pending">Waiting for admin approval</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {showPasswordPrompt && (
        <div className="modal-overlay" onClick={() => setShowPasswordPrompt(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Enter Station Password</h3>
            <p>Station: <strong>{selectedStation.name}</strong></p>
            {selectedStation.stationID && (
              <p style={{ color: '#10B981', fontFamily: 'monospace' }}>
                ID: {selectedStation.stationID}
              </p>
            )}
            <input
              type="password"
              autoComplete="current-password"
              value={stationPassword}
              onChange={e => setStationPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && verifyAndOpen()}
              placeholder="Station password"
              className="form-input"
            />
            <div className="modal-actions">
              <button onClick={verifyAndOpen} className="btn btn-primary">Open</button>
              <button
                onClick={() => { setShowPasswordPrompt(false); setStationPassword(''); }}
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

function StationView({ station, onBack }) {
  const [tab, setTab] = useState('live');

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <div>
          <h1>{station.name}</h1>
          {station.stationID && (
            <p style={{ color: '#10B981', fontFamily: 'monospace', fontSize: '14px' }}>
              Station ID: <strong>{station.stationID}</strong>
            </p>
          )}
        </div>
        <button
          onClick={onBack}
          style={{
            padding: '10px 20px', background: '#ffffff', color: '#111827',
            border: '2px solid #d1d5db', borderRadius: '8px', fontWeight: 600,
            fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          ← Back to Stations
        </button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f3f4f6', borderRadius: 10, padding: 4 }}>
        {[['live', '📡 Live Monitoring'], ['sessions', '💰 Sessions & Revenue'], ['health', '🔍 Port Health']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 13,
              background: tab === key ? '#fff' : 'transparent',
              color:      tab === key ? '#111' : '#6b7280',
              boxShadow:  tab === key ? '0 1px 4px #0001' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'live'     && <LiveMonitoring stationId={station.id} stationID={station.stationID} />}
      {tab === 'sessions' && <StationSessions stationId={station.id} />}
      {tab === 'health'   && <StationPortHealth stationId={station.id} />}
    </div>
  );
}

function RegisterStationForm({ ownerId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    ratePerKwh: 18,
    openTime: '00:00',
    closeTime: '23:59',
    whatsAppNumber: '',
    stationID: '',
    stationPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (formData.stationID.length !== 16) {
      alert('Station ID must be exactly 16 characters: 4-letter name + 12-digit MAC\nExample: LUMS123456789101');
      return;
    }

    if (!formData.stationPassword || formData.stationPassword.length < 6) {
      alert('Station password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/stations/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ownerId,
          totalPlugs: 3,
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
      alert('Failed to register station — check your connection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <h3>Register New Station</h3>
        <form onSubmit={handleSubmit} className="station-form">

          <div className="form-group">
            <label>Station ID * <span style={{ color: '#888', fontSize: '12px' }}>(16 characters: 4-letter name + 12-digit MAC)</span></label>
            <input
              type="text"
              value={formData.stationID}
              onChange={e => setFormData({ ...formData, stationID: e.target.value.toUpperCase() })}
              required
              maxLength="16"
              placeholder="LUMS123456789101"
              autoComplete="off"
              style={{ fontFamily: 'monospace', fontSize: '16px', letterSpacing: '2px' }}
            />
            <small style={{ color: formData.stationID.length === 16 ? '#10B981' : '#888' }}>
              {formData.stationID.length}/16 characters
              {formData.stationID.length === 16 && ' ✓'}
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Station Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="DHA Phase 5 Station"
              />
            </div>
            <div className="form-group">
              <label>WhatsApp Number</label>
              <input
                type="tel"
                value={formData.whatsAppNumber}
                onChange={e => setFormData({ ...formData, whatsAppNumber: e.target.value })}
                placeholder="+92 300 1234567"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Address *</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
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
                onChange={e => setFormData({ ...formData, latitude: e.target.value })}
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
                onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                required
                placeholder="74.4119"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Rate (Rs/kWh) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.ratePerKwh}
                onChange={e => setFormData({ ...formData, ratePerKwh: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label>Ports</label>
              <input
                type="text"
                value="3 (fixed)"
                readOnly
                style={{ background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Opening Time</label>
              <input
                type="time"
                value={formData.openTime}
                onChange={e => setFormData({ ...formData, openTime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Closing Time</label>
              <input
                type="time"
                value={formData.closeTime}
                onChange={e => setFormData({ ...formData, closeTime: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Station Password * <span style={{ color: '#888', fontSize: '12px' }}>(min 6 characters)</span></label>
            {/* Hidden field prevents browser autofill on the real password */}
            <input type="password" style={{ display: 'none' }} aria-hidden="true" />
            <input
              type="password"
              value={formData.stationPassword}
              onChange={e => setFormData({ ...formData, stationPassword: e.target.value })}
              required
              minLength="6"
              placeholder="Create a password for this station"
              autoComplete="new-password"
            />
            <small>Used to open the station dashboard. Keep it safe.</small>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register Station'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
