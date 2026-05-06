import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../apiConfig';

const ALL_PORTS = [1, 2, 3];
const STALE_MS  = 30000;
const V_OFF     = 30;
const V_MIN     = 180;
const V_MAX     = 260;
const I_CHARGE  = 0.3;

function portState(r) {
  if (!r) return 'no-data';
  if (Date.now() - new Date(r.receivedAt).getTime() > STALE_MS) return 'stale';
  if (r.voltage < V_OFF)                  return 'off';
  if (r.voltage < V_MIN || r.voltage > V_MAX) return 'fault';
  if (r.current >= I_CHARGE)              return 'charging';
  return 'idle';
}

const PORT_CFG = {
  'no-data': { label: 'No Data',   color: '#9ca3af', bg: '#f3f4f6' },
  'stale':   { label: 'Offline',   color: '#EF4444', bg: '#FEE2E2' },
  'off':     { label: 'Port OFF',  color: '#6b7280', bg: '#f3f4f6' },
  'fault':   { label: 'Fault',     color: '#F97316', bg: '#FFF7ED' },
  'idle':    { label: 'Available', color: '#10B981', bg: '#ECFDF5' },
  'charging':{ label: 'In Use',    color: '#F59E0B', bg: '#FFFBEB' },
};

function fmt(d) {
  return new Date(d).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' });
}

export default function RiderDashboard() {
  const { user } = useAuth();
  const [tab, setTab]               = useState('stations'); // stations | session | history
  const [stations, setStations]     = useState([]);
  const [expanded, setExpanded]     = useState(null);       // stationId expanded
  const [portsMap, setPortsMap]     = useState({});         // { stationId: { portNum: reading } }
  const [activeSession, setActive]  = useState(null);
  const [receipt, setReceipt]       = useState(null);
  const [history, setHistory]       = useState([]);
  const [stats, setStats]           = useState({ sessions: 0, spent: 0, units: 0 });
  const [starting, setStarting]         = useState(false);
  const [stopping, setStopping]         = useState(false);
  const [stopPhase, setStopPhase]       = useState(null);  // null | 'waiting' | 'retrying' | 'failed'
  const [connectPhase, setConnectPhase] = useState(null);  // null | 'connecting' | 'retrying' | 'failed'
  const pollRef                         = useRef(null);
  const prevSessionRef                  = useRef(null);
  const connectPollRef                  = useRef(null);
  const connectingStationRef            = useRef(null);
  const connectingPortRef               = useRef(null);
  const syncRef                         = useRef(null); // always points to latest fetchActiveSession

  useEffect(() => {
    fetchStations();
    syncRef.current?.();
    fetchHistory();
  }, []);

  useEffect(() => () => clearInterval(connectPollRef.current), []);

  // Poll active session every 2 s whenever the session tab is open
  useEffect(() => {
    if (tab !== 'session') return;
    syncRef.current?.();
    pollRef.current = setInterval(() => syncRef.current?.(), 2000);
    return () => clearInterval(pollRef.current);
  }, [tab]);

  // Force a refresh on window focus or page becoming visible
  useEffect(() => {
    const onFocus = () => syncRef.current?.();
    const onVisibility = () => { if (document.visibilityState === 'visible') syncRef.current?.(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Poll port readings for expanded station
  useEffect(() => {
    if (!expanded) return;
    fetchPorts(expanded);
    const t = setInterval(() => fetchPorts(expanded), 3000);
    return () => clearInterval(t);
  }, [expanded]);

  const fetchStations = async () => {
    try {
      const res  = await fetch(`${API_URL}/stations/approved`);
      const data = await res.json();
      setStations(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fetchPorts = async (stationId) => {
    try {
      const res  = await fetch(`${API_URL}/mqtt/latest/${stationId}`);
      const data = await res.json();
      const map  = {};
      data.forEach(r => { map[r.portNumber] = r; });
      setPortsMap(prev => ({ ...prev, [stationId]: map }));
    } catch {}
  };

  const fetchActiveSession = async () => {
    try {
      const res  = await fetch(`${API_URL}/sessions/active/${user.id}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const wasActive = prevSessionRef.current;
      prevSessionRef.current = data;
      setActive(data);
      if (data) {
        setTab('session');
        setConnectPhase(null); // session confirmed — clear any connecting/failed state
      }
      if (!data) {
        setStopPhase(null);
        setConnectPhase(prev => (prev === 'failed' ? null : prev)); // clear failed, keep connecting
      }
      if (wasActive && !data) {
        // Fire-and-forget: don't await — lets setActive(null)/setStopPhase(null) commit
        // immediately rather than waiting on the network before React flushes the batch.
        fetchHistory().then(done => {
          const last = done?.[0];
          if (last) setReceipt({
            stationName:   last.stationName,
            unitsConsumed: last.unitsConsumed,
            totalCost:     last.totalCost,
            duration:      last.durationMin,
            ratePerKwh:    last.unitsConsumed > 0
                             ? Number((last.totalCost / last.unitsConsumed).toFixed(2))
                             : 0,
          });
        });
      }
    } catch {}
  };
  syncRef.current = fetchActiveSession; // kept fresh every render — no stale-closure issues

  const fetchHistory = async () => {
    try {
      const res  = await fetch(`${API_URL}/sessions/history/${user.id}`);
      const data = await res.json();
      const done = Array.isArray(data) ? data : [];
      setHistory(done);
      setStats({
        sessions: done.length,
        spent:    done.reduce((s, r) => s + Number(r.totalCost), 0),
        units:    done.reduce((s, r) => s + Number(r.unitsConsumed), 0),
      });
      return done;
    } catch { return []; }
  };

  // Connect retry timer — runs fresh each time connectPhase changes; cleanup auto-cancels timer
  useEffect(() => {
    if (connectPhase !== 'connecting' && connectPhase !== 'retrying') return;
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`${API_URL}/sessions/active/${user.id}`);
        const session = r.ok ? await r.json() : null;
        if (session) {
          clearInterval(connectPollRef.current);
          setConnectPhase(null);
          prevSessionRef.current = session;
          setActive(session);
          return;
        }

      } catch {}
      if (connectPhase === 'connecting') {
        try {
          await fetch(`${API_URL}/sessions/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              riderId:    user.id,
              stationId:  connectingStationRef.current,
              portNumber: connectingPortRef.current,
            }),
          });
        } catch {}
        setConnectPhase('retrying');
      } else {
        clearInterval(connectPollRef.current);
        setConnectPhase('failed');
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [connectPhase]);

  // Stop phase: 1-second watcher detects idle immediately; 10-second timer sends retry command
  useEffect(() => {
    if (!stopPhase) return;

    // Watch every 1 s — session disappears the instant charger goes idle.
    // Uses only stable setters + refs: no stale-closure risk.
    const watchId = setInterval(async () => {
      try {
        const r = await fetch(`${API_URL}/sessions/active/${user.id}`, { cache: 'no-store' });
        const session = r.ok ? await r.json() : null;
        if (!session) {
          clearInterval(watchId);
          const was = prevSessionRef.current;
          prevSessionRef.current = null;
          setActive(null);
          setStopPhase(null);
          setConnectPhase(p => p === 'failed' ? null : p);
          if (was) {
            // Fire-and-forget — same reason as fetchActiveSession: don't block state commit
            fetch(`${API_URL}/sessions/history/${user.id}`)
              .then(hr => hr.ok ? hr.json() : [])
              .then(list => {
                const done = Array.isArray(list) ? list : [];
                setHistory(done);
                setStats({ sessions: done.length, spent: done.reduce((a, x) => a + Number(x.totalCost), 0), units: done.reduce((a, x) => a + Number(x.unitsConsumed), 0) });
                const last = done[0];
                if (last) setReceipt({ stationName: last.stationName, unitsConsumed: last.unitsConsumed, totalCost: last.totalCost, duration: last.durationMin, ratePerKwh: last.unitsConsumed > 0 ? +(last.totalCost / last.unitsConsumed).toFixed(2) : 0 });
              })
              .catch(() => {});
          }
        }
      } catch {}
    }, 1000);

    // Only resend stop command for 'waiting' and 'retrying'
    if (stopPhase === 'failed') return () => clearInterval(watchId);

    const retryTimer = setTimeout(async () => {
      try {
        const r = await fetch(`${API_URL}/sessions/active/${user.id}`);
        const session = r.ok ? await r.json() : null;
        if (!session) return; // already ended — watcher handled it
        if (stopPhase === 'waiting') {
          try { await fetch(`${API_URL}/sessions/stop/${session.sessionId}`, { method: 'POST' }); } catch {}
          setStopPhase('retrying');
        } else {
          setStopPhase('failed');
        }
      } catch {}
    }, 10000);

    return () => { clearInterval(watchId); clearTimeout(retryTimer); };
  }, [stopPhase]);

  const startCharging = async (stationId, portNumber) => {
    if (connectPhase === 'connecting' || connectPhase === 'retrying') return;
    setStarting(true);
    try {
      const res  = await fetch(`${API_URL}/sessions/start`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ riderId: user.id, stationId, portNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.toLowerCase().includes('already have an active')) {
          await fetchActiveSession();
        } else {
          alert(data.error);
        }
        return;
      }
      // ON command queued — 1s poll watches for session; useEffect timer handles retry
      connectingStationRef.current = stationId;
      connectingPortRef.current    = portNumber;
      setConnectPhase('connecting');
      setTab('session');
      clearInterval(connectPollRef.current);
      connectPollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`${API_URL}/sessions/active/${user.id}`, { cache: 'no-store' });
          if (!r.ok) return;
          const session = await r.json();
          if (session) {
            clearInterval(connectPollRef.current);
            setConnectPhase(null);
            prevSessionRef.current = session;
            setActive(session);
          }
        } catch {}
      }, 1000);
    } catch { alert('Failed to start charging. Try again.'); }
    finally  { setStarting(false); }
  };

  const stopCharging = async () => {
    if (!activeSession || stopPhase === 'waiting' || stopPhase === 'retrying') return;
    setStopping(true);
    try {
      const res  = await fetch(`${API_URL}/sessions/stop/${activeSession.sessionId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.toLowerCase().includes('not active')) {
          await fetchActiveSession();
        } else {
          alert(data.error);
        }
        return;
      }
      setStopPhase('waiting');
    } catch { alert('Failed to stop charging. Try again.'); }
    finally  { setStopping(false); }
  };

  const closeReceipt = () => {
    setReceipt(null);
    setTab('history');
  };

  const toggleStation = (id) => {
    setExpanded(prev => (prev === id ? null : id));
  };

  // ── RECEIPT OVERLAY ─────────────────────────────────────────────────────
  if (receipt) {
    return (
      <div className="dashboard-content">
        <div style={{ maxWidth: 420, margin: '60px auto', background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px #0001', textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h2 style={{ margin: '12px 0 4px' }}>Charging Complete</h2>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>{receipt.stationName}</p>
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '16px 20px', textAlign: 'left', marginBottom: 20 }}>
            {[
              ['Energy',    `${Number(receipt.unitsConsumed).toFixed(3)} kWh`],
              ['Duration',  `${receipt.duration} min`],
              ['Rate',      `Rs ${receipt.ratePerKwh}/kWh`],
              ['Total',     `Rs ${Number(receipt.totalCost).toFixed(2)}`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontWeight: k === 'Total' ? 700 : 400, fontSize: k === 'Total' ? 18 : 14 }}>
                <span style={{ color: '#6b7280' }}>{k}</span>
                <span style={{ color: k === 'Total' ? '#10B981' : '#111' }}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={closeReceipt} className="btn btn-primary" style={{ width: '100%' }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Rider Dashboard</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>Welcome, {user.name}</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon">⚡</div>
          <div className="stat-info"><h3>Sessions</h3><p className="stat-number">{stats.sessions}</p></div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">🔋</div>
          <div className="stat-info"><h3>Energy Used</h3><p className="stat-number">{stats.units.toFixed(2)} kWh</p></div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">💰</div>
          <div className="stat-info"><h3>Total Spent</h3><p className="stat-number">Rs {stats.spent.toFixed(0)}</p></div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">🌱</div>
          <div className="stat-info"><h3>CO₂ Saved</h3><p className="stat-number">{(stats.units * 0.5).toFixed(1)} kg</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f3f4f6', borderRadius: 10, padding: 4 }}>
        {[
          { key: 'stations', label: '🔌 Find Station' },
          { key: 'session',  label: activeSession ? '⚡ Active Session' : '⚡ Session', badge: !!activeSession },
          { key: 'history',  label: '📋 History' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: tab === t.key ? '#fff' : 'transparent',
              color:      tab === t.key ? '#111' : '#6b7280',
              boxShadow:  tab === t.key ? '0 1px 4px #0001' : 'none',
              position: 'relative',
            }}
          >
            {t.label}
            {t.badge && tab !== 'session' && (
              <span style={{ position: 'absolute', top: 4, right: 8, width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            )}
          </button>
        ))}
      </div>

      {/* ── FIND STATION TAB ── */}
      {tab === 'stations' && (
        <div>
          {stations.length === 0 ? (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
              <div style={{ fontSize: 40 }}>📡</div>
              <p>No approved stations available.</p>
            </div>
          ) : stations.map(st => (
            <div key={st.id} className="dashboard-card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
              {/* Station header */}
              <div
                onClick={() => toggleStation(st.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer' }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: 15 }}>{st.name}</h4>
                  <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: 13 }}>{st.address}</p>
                  <p style={{ margin: '2px 0 0', color: '#10B981', fontSize: 12, fontFamily: 'monospace' }}>{st.stationID}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#10B981' }}>Rs {st.ratePerKwh}/kWh</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{expanded === st.id ? '▲ Hide' : '▼ View Ports'}</div>
                </div>
              </div>

              {/* Ports */}
              {expanded === st.id && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 20px 16px', background: '#fafafa' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {ALL_PORTS.map(pn => {
                      const r    = (portsMap[st.id] || {})[pn];
                      const ps   = portState(r);
                      const cfg  = PORT_CFG[ps];
                      const canStart = ps === 'idle' && !activeSession && connectPhase === null;
                      return (
                        <div key={pn} style={{ background: cfg.bg, borderRadius: 10, padding: '12px 10px', textAlign: 'center', border: `1px solid ${cfg.color}33` }}>
                          <div style={{ fontWeight: 700, fontSize: 18, color: cfg.color }}>P{String(pn).padStart(2, '0')}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: cfg.color, margin: '4px 0 8px' }}>{cfg.label}</div>
                          {r && (
                            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
                              {Number(r.voltage).toFixed(0)}V · {Number(r.current).toFixed(1)}A
                            </div>
                          )}
                          {canStart && (
                            <button
                              onClick={() => startCharging(st.id, pn)}
                              disabled={starting}
                              style={{ width: '100%', padding: '6px 0', background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                            >
                              {starting ? '...' : 'Start'}
                            </button>
                          )}
                          {ps === 'idle' && activeSession && (
                            <div style={{ fontSize: 10, color: '#F59E0B' }}>Session active</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Station action buttons */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`, '_blank')}
                      style={{ flex: 1, padding: '8px 0', background: '#EFF6FF', color: '#3B82F6', border: '1px solid #BFDBFE', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
                    >
                      🗺️ Directions
                    </button>
                    {st.whatsAppNumber && (
                      <button
                        onClick={() => window.open(`https://wa.me/${st.whatsAppNumber.replace(/\D/g, '')}?text=Hi! I want to charge my EV at ${st.name}`, '_blank')}
                        style={{ flex: 1, padding: '8px 0', background: '#ECFDF5', color: '#10B981', border: '1px solid #A7F3D0', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
                      >
                        💬 WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ACTIVE SESSION TAB ── */}
      {tab === 'session' && (
        <div>
          {connectPhase === 'failed' ? (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40 }}>❌</div>
              <h3 style={{ margin: '12px 0 4px', color: '#EF4444' }}>Could Not Start Session</h3>
              <p style={{ color: '#6b7280', margin: '0 0 8px' }}>The port did not respond to 2 start attempts.</p>
              <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 20 }}>Port may be offline or not ready. Try a different port.</p>
              <button
                onClick={() => { setConnectPhase(null); setTab('stations'); }}
                className="btn btn-primary"
                style={{ marginTop: 4 }}
              >
                ← Back to Find Station
              </button>
            </div>
          ) : connectPhase ? (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, animation: 'pulse 1s infinite' }}>🔄</div>
              <h3 style={{ margin: '12px 0 4px' }}>
                {connectPhase === 'retrying' ? '2nd Attempt — Connecting...' : 'Connecting to Charger...'}
              </h3>
              <p style={{ color: '#6b7280', margin: 0 }}>
                {connectPhase === 'retrying' ? 'Sending 2nd start signal to hardware' : 'Waiting for hardware signal (attempt 1/2)'}
              </p>
              <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>
                {connectPhase === 'retrying' ? 'If no response, session start will be cancelled.' : 'If no response in 10 s, a 2nd attempt will be sent automatically.'}
              </p>
            </div>
          ) : !activeSession ? (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
              <div style={{ fontSize: 40 }}>🔌</div>
              <p>No active session. Go to <strong>Find Station</strong> to start charging.</p>
              <button onClick={() => setTab('stations')} className="btn btn-primary" style={{ marginTop: 12 }}>Find Station</button>
            </div>
          ) : (
            <div className="dashboard-card" style={{ maxWidth: 480, margin: '0 auto' }}>
              {/* Connection lost warning */}
              {(() => {
                const r = (portsMap[activeSession.stationId] || {})[activeSession.portNumber];
                const stale = r && (Date.now() - new Date(r.receivedAt).getTime() > STALE_MS);
                return stale ? (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <div>
                      <div style={{ fontWeight: 700, color: '#EF4444', fontSize: 13 }}>Station signal lost</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>Session will auto-end if signal doesn't return within 2 minutes.</div>
                    </div>
                  </div>
                ) : null;
              })()}

              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 48, animation: 'pulse 1.5s infinite' }}>⚡</div>
                <h3 style={{ margin: '8px 0 2px' }}>Charging Active</h3>
                <p style={{ color: '#6b7280', margin: 0 }}>{activeSession.stationName} · Port {String(activeSession.portNumber).padStart(2, '0')}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  ['Energy',    `${Number(activeSession.unitsConsumed).toFixed(3)} kWh`, '#3B82F6'],
                  ['Est. Cost', `Rs ${Number(activeSession.estimatedCost).toFixed(2)}`,  '#10B981'],
                  ['Power',     `${Number(activeSession.power).toFixed(0)} W`,           '#F97316'],
                  ['Duration',  `${activeSession.durationMin} min`,                      '#8B5CF6'],
                  ['Voltage',   `${Number(activeSession.voltage).toFixed(1)} V`,         '#6b7280'],
                  ['Current',   `${Number(activeSession.current).toFixed(2)} A`,         '#6b7280'],
                ].map(([label, value, color]) => (
                  <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginBottom: 16 }}>
                Rate: Rs {activeSession.ratePerKwh}/kWh · Started: {fmt(activeSession.startTime)}
              </div>

              {(() => {
                const busy   = stopping || stopPhase === 'waiting' || stopPhase === 'retrying';
                const btnBg  = stopPhase === 'failed'   ? '#F97316'
                             : stopPhase === 'retrying' ? '#F59E0B'
                             : stopPhase === 'waiting'  ? '#6b7280'
                             : '#EF4444';
                const label  = stopping              ? 'Sending stop...'
                             : stopPhase === 'waiting'  ? '⏳ Stop sent — waiting for charger... (1/2)'
                             : stopPhase === 'retrying' ? '⏳ 2nd attempt — waiting for charger...'
                             : stopPhase === 'failed'   ? '⚠️ Not responding. Retry stop?'
                             : '⏹ Stop Charging';
                const hint   = stopPhase === 'waiting'  ? 'If charger does not idle in 10 s, a 2nd stop will be sent automatically.'
                             : stopPhase === 'retrying' ? '2nd stop command sent. Session ends when charger goes idle.'
                             : stopPhase === 'failed'   ? 'Charger did not respond to 2 stop attempts. Click again to retry, or it will auto-end after 2 min timeout.'
                             : null;
                return (
                  <>
                    <button
                      onClick={stopCharging}
                      disabled={busy}
                      style={{ width: '100%', padding: '12px 0', background: btnBg, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: busy ? 'default' : 'pointer' }}
                    >
                      {label}
                    </button>
                    {hint && (
                      <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>{hint}</p>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="dashboard-card">
          <h3>Charging History</h3>
          {history.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: 24 }}>No completed sessions yet.</p>
          ) : (
            <div>
              {history.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.stationName}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      Port {String(s.portNumber).padStart(2, '0')} · {Number(s.unitsConsumed).toFixed(3)} kWh · {s.durationMin} min
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{fmt(s.startTime)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#10B981', fontSize: 16 }}>Rs {Number(s.totalCost).toFixed(2)}</div>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 10,
                      background: s.status === 'Timeout' ? '#FEF2F2' : s.status === 'AutoCompleted' ? '#EFF6FF' : s.status === 'ForceStopped' ? '#F5F3FF' : '#ECFDF5',
                      color:      s.status === 'Timeout' ? '#EF4444' : s.status === 'AutoCompleted' ? '#3B82F6' : s.status === 'ForceStopped' ? '#8B5CF6' : '#10B981',
                    }}>
                      {s.status === 'AutoCompleted' ? 'Auto-Ended' : s.status === 'Timeout' ? 'Timeout' : s.status === 'ForceStopped' ? 'Force Stopped' : 'Completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
