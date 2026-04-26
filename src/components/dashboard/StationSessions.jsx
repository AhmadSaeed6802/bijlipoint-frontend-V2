import React, { useState, useEffect } from 'react';
import API_URL from '../../apiConfig';

function fmt(d) {
  return new Date(d).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' });
}

const STATUS_CFG = {
  'Active':        { bg: '#FEF3C7', color: '#D97706', label: 'Active' },
  'Completed':     { bg: '#ECFDF5', color: '#10B981', label: 'Completed' },
  'AutoCompleted': { bg: '#EFF6FF', color: '#3B82F6', label: 'Auto-Ended' },
  'Timeout':       { bg: '#FEF2F2', color: '#EF4444', label: 'Timeout' },
  'ForceStopped':  { bg: '#F5F3FF', color: '#8B5CF6', label: 'Force Stopped' },
};

export default function StationSessions({ stationId }) {
  const [data, setData]       = useState(null);
  const [days, setDays]       = useState(7);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(null);

  useEffect(() => { load(true); }, [stationId, days]);

  // Auto-refresh every 10 seconds so new/ended sessions appear without manual action
  useEffect(() => {
    const t = setInterval(() => load(false), 10000);
    return () => clearInterval(t);
  }, [stationId, days]);

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/sessions/station/${stationId}?days=${days}`);
      const json = await res.json();
      if (!res.ok) { setData(null); console.error('Sessions API error:', json.error); }
      else setData(json);
    } catch (e) { console.error('Sessions fetch failed:', e); }
    if (showSpinner) setLoading(false);
  };

  const forceStop = async (sessionId) => {
    if (!window.confirm('Force-stop this session? An OFF command will be sent to the port.')) return;
    setStopping(sessionId);
    try {
      const res = await fetch(`${API_URL}/sessions/force-stop/${sessionId}`, { method: 'POST' });
      const json = await res.json();
      if (res.ok) { alert(`Stopped. Units: ${Number(json.units).toFixed(3)} kWh  Cost: Rs ${Number(json.totalCost).toFixed(2)}`); load(); }
      else alert(json.error);
    } catch { alert('Failed to stop session.'); }
    setStopping(null);
  };

  if (loading) return <div style={{ padding: 20 }}>Loading sessions...</div>;
  if (!data)   return <div style={{ padding: 20, color: '#EF4444' }}>Failed to load sessions.</div>;

  return (
    <div>
      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card green">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Revenue</h3>
            <p className="stat-number">Rs {Number(data.totalRevenue).toFixed(0)}</p>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <h3>Sessions</h3>
            <p className="stat-number">{data.totalSessions}</p>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">🔋</div>
          <div className="stat-info">
            <h3>Energy Sold</h3>
            <p className="stat-number">{Number(data.totalUnits).toFixed(2)} kWh</p>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">🔌</div>
          <div className="stat-info">
            <h3>Active Now</h3>
            <p className="stat-number">{data.activeSessions}</p>
          </div>
        </div>
      </div>

      {data.activeSessions > 0 && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '8px 14px', marginBottom: 12, fontSize: 13, color: '#065F46', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔌</span>
          <span><strong>{data.activeSessions}</strong> charging session{data.activeSessions > 1 ? 's' : ''} in progress right now</span>
        </div>
      )}

      {/* Period filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Show last:</span>
        {[7, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              padding: '4px 12px', borderRadius: 20, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: days === d ? '#10B981' : '#fff',
              color:      days === d ? '#fff'    : '#374151',
            }}
          >
            {d} days
          </button>
        ))}
        <button
          onClick={() => load()}
          style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 20, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: '#fff', color: '#374151' }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Sessions table */}
      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        {data.sessions.length === 0 ? (
          <p style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No sessions in this period.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Port', 'Rider', 'Started', 'Duration', 'kWh', 'Revenue', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.sessions.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700 }}>P{String(s.portNumber).padStart(2, '0')}</td>
                  <td style={{ padding: '10px 14px' }}>{s.riderName}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>{fmt(s.startTime)}</td>
                  <td style={{ padding: '10px 14px' }}>{s.durationMin} min</td>
                  <td style={{ padding: '10px 14px' }}>{Number(s.unitsConsumed).toFixed(3)}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#10B981' }}>Rs {Number(s.totalCost).toFixed(0)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                      background: (STATUS_CFG[s.status] || STATUS_CFG['Completed']).bg,
                      color:      (STATUS_CFG[s.status] || STATUS_CFG['Completed']).color,
                    }}>
                      {(STATUS_CFG[s.status] || { label: s.status }).label}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {s.status === 'Active' && (
                      <button
                        onClick={() => forceStop(s.id)}
                        disabled={stopping === s.id}
                        style={{ padding: '3px 10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {stopping === s.id ? '...' : 'Stop'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
