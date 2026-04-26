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

export default function SuperAdminDashboard() {
  const [tab, setTab]       = useState('overview');
  const [stats, setStats]   = useState({ totalApproved: 0, totalPending: 0, totalRiders: 0, totalOwners: 0 });
  const [pending, setPending] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/stations/stats`).then(r => r.json()).then(setStats).catch(() => {});
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res  = await fetch(`${API_URL}/stations/pending`);
      const data = await res.json();
      setPending(Array.isArray(data) ? data : []);
    } catch {}
  };

  const approveStation = async (id, approve) => {
    const adminId = JSON.parse(sessionStorage.getItem('bijli_user'))?.id;
    try {
      await fetch(`${API_URL}/stations/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId: id, adminId, approve }),
      });
      fetchPending();
      fetch(`${API_URL}/stations/stats`).then(r => r.json()).then(setStats).catch(() => {});
    } catch {}
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Super Admin Dashboard</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>Full platform access — all stations and riders</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon">🔌</div>
          <div className="stat-info"><h3>Approved Stations</h3><p className="stat-number">{stats.totalApproved}</p></div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">⏳</div>
          <div className="stat-info"><h3>Pending Approval</h3><p className="stat-number">{stats.totalPending}</p></div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">🏍️</div>
          <div className="stat-info"><h3>Total Riders</h3><p className="stat-number">{stats.totalRiders}</p></div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">👥</div>
          <div className="stat-info"><h3>Station Owners</h3><p className="stat-number">{stats.totalOwners}</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f3f4f6', borderRadius: 10, padding: 4 }}>
        {[
          { key: 'overview',  label: '📋 Approvals' },
          { key: 'sessions',  label: '⚡ Sessions', },
          { key: 'health',    label: '🔍 Port Health' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13,
            background: tab === t.key ? '#fff' : 'transparent',
            color:      tab === t.key ? '#111' : '#6b7280',
            boxShadow:  tab === t.key ? '0 1px 4px #0001' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'overview'  && <ApprovalsTab pending={pending} onApprove={approveStation} />}
      {tab === 'sessions'  && <AdminSessionsTab />}
      {tab === 'health'    && <PortHealthTab />}
    </div>
  );
}

// ── Approvals ──────────────────────────────────────────────────────────────
function ApprovalsTab({ pending, onApprove }) {
  return (
    <div className="dashboard-card">
      <h3>Pending Station Approvals</h3>
      {pending.length === 0 ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: 24 }}>No stations pending approval.</p>
      ) : pending.map(st => (
        <div key={st.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{st.name}</div>
            <div style={{ fontSize: 12, color: '#10B981', fontFamily: 'monospace' }}>{st.stationID}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{st.address}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onApprove(st.id, true)}  style={{ padding: '6px 16px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Approve</button>
            <button onClick={() => onApprove(st.id, false)} style={{ padding: '6px 16px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── All Sessions ───────────────────────────────────────────────────────────
function AdminSessionsTab() {
  const [data, setData]         = useState(null);
  const [days, setDays]         = useState(30);
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [stopping, setStopping] = useState(null);

  useEffect(() => { load(); }, [days, status]);

  const load = async () => {
    setLoading(true);
    try {
      const url = `${API_URL}/sessions/admin/all?days=${days}${status ? `&status=${status}` : ''}`;
      const res = await fetch(url);
      setData(await res.json());
    } catch {}
    setLoading(false);
  };

  const forceStop = async (sessionId) => {
    if (!window.confirm('Force-stop this session?')) return;
    setStopping(sessionId);
    try {
      const res  = await fetch(`${API_URL}/sessions/force-stop/${sessionId}`, { method: 'POST' });
      const json = await res.json();
      if (res.ok) { alert(`Stopped. Units: ${Number(json.units).toFixed(3)} kWh  Cost: Rs ${Number(json.totalCost).toFixed(2)}`); load(); }
      else alert(json.error);
    } catch { alert('Failed.'); }
    setStopping(null);
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!data)   return <div style={{ padding: 20, color: '#EF4444' }}>Failed to load sessions.</div>;

  return (
    <div>
      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          ['💰', 'Revenue',    `Rs ${Number(data.totalRevenue).toFixed(0)}`,   'green'],
          ['⚡', 'Sessions',   data.totalSessions,                              'blue'],
          ['🔋', 'Energy Sold',`${Number(data.totalUnits).toFixed(2)} kWh`,    'orange'],
          ['🔌', 'Active Now', data.activeSessions,                             'purple'],
          ['⚠️', 'Timeouts',   data.timeoutSessions,                            data.timeoutSessions > 0 ? 'red' : 'green'],
        ].map(([icon, label, val, cls]) => (
          <div key={label} className={`stat-card ${cls}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-info"><h3>{label}</h3><p className="stat-number">{val}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Period:</span>
        {[7, 30, 90].map(d => (
          <button key={d} onClick={() => setDays(d)} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: days === d ? '#10B981' : '#fff', color: days === d ? '#fff' : '#374151' }}>{d}d</button>
        ))}
        <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 8 }}>Status:</span>
        {['', 'Active', 'Completed', 'AutoCompleted', 'Timeout', 'ForceStopped'].map(s => (
          <button key={s} onClick={() => setStatus(s)} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: status === s ? '#3B82F6' : '#fff', color: status === s ? '#fff' : '#374151' }}>{s || 'All'}</button>
        ))}
      </div>

      {/* Table */}
      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        {data.sessions.length === 0 ? (
          <p style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No sessions found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Station', 'Port', 'Rider', 'Started', 'Duration', 'kWh', 'Revenue', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.sessions.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{s.stationName}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace' }}>P{String(s.portNumber).padStart(2,'0')}</td>
                    <td style={{ padding: '9px 12px' }}>{s.riderName}</td>
                    <td style={{ padding: '9px 12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{fmt(s.startTime)}</td>
                    <td style={{ padding: '9px 12px' }}>{s.durationMin}m</td>
                    <td style={{ padding: '9px 12px' }}>{Number(s.unitsConsumed).toFixed(3)}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#10B981' }}>Rs {Number(s.totalCost).toFixed(0)}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: (STATUS_CFG[s.status]||STATUS_CFG['Completed']).bg, color: (STATUS_CFG[s.status]||STATUS_CFG['Completed']).color }}>
                        {(STATUS_CFG[s.status]||{label:s.status}).label}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      {s.status === 'Active' && (
                        <button onClick={() => forceStop(s.id)} disabled={stopping === s.id} style={{ padding: '3px 10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          {stopping === s.id ? '...' : 'Stop'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Port Health ────────────────────────────────────────────────────────────
function PortHealthTab() {
  const [data, setData]       = useState(null);
  const [days, setDays]       = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [days]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/sessions/admin/port-health?days=${days}`);
      setData(await res.json());
    } catch {}
    setLoading(false);
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!data)   return <div style={{ padding: 20, color: '#EF4444' }}>Failed to load.</div>;

  const SEVERITY = {
    High:   { bg: '#FEF2F2', color: '#EF4444' },
    Medium: { bg: '#FFF7ED', color: '#F97316' },
    Low:    { bg: '#FFFBEB', color: '#D97706' },
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Check last:</span>
        {[7, 14, 30].map(d => (
          <button key={d} onClick={() => setDays(d)} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: days === d ? '#10B981' : '#fff', color: days === d ? '#fff' : '#374151' }}>{d} days</button>
        ))}
      </div>

      <div className="dashboard-card">
        <h3>Ports with Repeated Timeouts</h3>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          Ports flagged with 2+ timeout sessions — indicates hardware, power, or network issues.
        </p>

        {data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#10B981' }}>
            <div style={{ fontSize: 32 }}>✅</div>
            <p style={{ marginTop: 8 }}>No problematic ports detected in this period.</p>
          </div>
        ) : data.map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{p.stationName} — Port {String(p.portNumber).padStart(2, '0')}</div>
              <div style={{ fontSize: 12, color: '#10B981', fontFamily: 'monospace' }}>{p.stationID}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{p.timeoutCount}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>timeouts</div>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: 12, background: SEVERITY[p.severity].bg, color: SEVERITY[p.severity].color }}>
                {p.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
