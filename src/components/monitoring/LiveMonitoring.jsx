import React, { useState, useEffect } from 'react';
import API_URL from '../../apiConfig';

const ALL_PORTS = [1, 2, 3];
const STALE_AFTER_MS = 30000; // 30 sec — no MQTT message = connection lost

// ─── Electrical thresholds (220V AC system) ───────────────────────────────
const V_OFF       = 30;   // V  — below this relay is open / no output power
const V_MIN       = 180;  // V  — below this (but > V_OFF) = brownout / fault
const V_MAX       = 260;  // V  — above this = over-voltage fault
const I_CHARGING  = 0.3;  // A  — CT clamp noise floor ~150mA; above this = real load
// ──────────────────────────────────────────────────────────────────────────

function getPortState(reading) {
  if (!reading) return 'no-data';

  const ageMs = Date.now() - new Date(reading.receivedAt).getTime();
  if (ageMs > STALE_AFTER_MS) return 'stale';

  const v = reading.voltage;
  const i = reading.current;

  if (v < V_OFF)                    return 'port-off';   // relay open / breaker off
  if (v < V_MIN || v > V_MAX)       return 'fault';      // brownout or over-voltage
  if (i >= I_CHARGING)              return 'charging';   // real load present
  return 'idle';                                         // powered, no load
}

const STATE = {
  'no-data':  { label: 'No Data',        color: '#9ca3af', bg: '#f3f4f6',   icon: '📡' },
  'stale':    { label: 'Disconnected',   color: '#EF4444', bg: '#FEE2E2',   icon: '⚠️' },
  'port-off': { label: 'Port OFF',       color: '#6b7280', bg: '#f3f4f6',   icon: '⚫' },
  'fault':    { label: 'Voltage Fault',  color: '#F97316', bg: '#FFF7ED',   icon: '🔴' },
  'idle':     { label: 'Available',      color: '#F59E0B', bg: '#FFFBEB',   icon: '🟡' },
  'charging': { label: 'Charging',       color: '#10B981', bg: '#ECFDF5',   icon: '⚡' },
};

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function LiveMonitoring({ stationId, stationID }) {
  const [readingsByPort, setReadingsByPort] = useState({});
  const [loading, setLoading]               = useState(true);
  const [lastPoll, setLastPoll]             = useState(null);

  useEffect(() => {
    fetchReadings();
    const t = setInterval(fetchReadings, 2000);
    return () => clearInterval(t);
  }, [stationId]);

  const fetchReadings = async () => {
    try {
      const res  = await fetch(`${API_URL}/mqtt/latest/${stationId}`);
      const data = await res.json();
      const map  = {};
      data.forEach(r => { map[r.portNumber] = r; });
      setReadingsByPort(map);
      setLastPoll(new Date());
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const sendCommand = async (portNumber, command) => {
    const user = JSON.parse(sessionStorage.getItem('bijli_user'));
    try {
      const res  = await fetch(`${API_URL}/mqtt/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId, portNumber, command, userId: user.id })
      });
      const data = await res.json();
      alert(data.message);
      fetchReadings();
    } catch { alert('Failed to send command'); }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading ports...</div>;

  return (
    <div className="live-monitoring">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>
          Live Monitoring
          {stationID && (
            <span style={{ fontSize: 13, color: '#10B981', fontFamily: 'monospace', marginLeft: 12 }}>
              {stationID}
            </span>
          )}
        </h2>
        {lastPoll && (
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            Refreshed: {lastPoll.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="ports-grid">
        {ALL_PORTS.map(portNum => {
          const r     = readingsByPort[portNum];
          const state = getPortState(r);
          const cfg   = STATE[state];
          const hasData = state !== 'no-data' && state !== 'stale';

          return (
            <div
              key={portNum}
              className="port-card"
              style={{ borderTop: `4px solid ${cfg.color}`, background: '#fff' }}
            >
              {/* Port header */}
              <div className="port-header" style={{ alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
                    PORT
                  </span>
                  <h3 style={{ margin: 0, fontSize: 22 }}>
                    {String(portNum).padStart(2, '0')}
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  {/* Status badge */}
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    padding: '4px 12px', borderRadius: 20,
                    background: cfg.bg, color: cfg.color,
                    border: `1px solid ${cfg.color}44`
                  }}>
                    {cfg.icon} {cfg.label}
                  </span>

                  {/* ON / OFF controls — only when data is live */}
                  {(state === 'idle' || state === 'charging') && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => sendCommand(portNum, 'ON')}  className="btn-on">ON</button>
                      <button onClick={() => sendCommand(portNum, 'OFF')} className="btn-off">OFF</button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── NO DATA ── */}
              {state === 'no-data' && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: 32 }}>📡</div>
                  <div style={{ marginTop: 8 }}>No data received</div>
                  <small>Waiting for hardware...</small>
                </div>
              )}

              {/* ── MQTT DISCONNECTED ── */}
              {state === 'stale' && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#EF4444' }}>
                  <div style={{ fontSize: 32 }}>⚠️</div>
                  <div style={{ fontWeight: 600, marginTop: 8 }}>MQTT Connection Lost</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    Last received: {timeAgo(r.receivedAt)}
                  </div>
                  <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
                    Hardware offline or network issue
                  </div>
                </div>
              )}

              {/* ── PORT OFF (relay open) ── */}
              {state === 'port-off' && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#6b7280' }}>
                  <div style={{ fontSize: 32 }}>⚫</div>
                  <div style={{ fontWeight: 600, marginTop: 8 }}>Port Switched OFF</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    Relay open — {r.voltage.toFixed(1)} V output
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                    Last update: {timeAgo(r.receivedAt)}
                  </div>
                  <button
                    onClick={() => sendCommand(portNum, 'ON')}
                    className="btn-on"
                    style={{ marginTop: 10 }}
                  >
                    Turn ON
                  </button>
                </div>
              )}

              {/* ── FAULT (brownout / over-voltage) ── */}
              {state === 'fault' && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#F97316' }}>
                  <div style={{ fontSize: 32 }}>🔴</div>
                  <div style={{ fontWeight: 600, marginTop: 8 }}>
                    {r.voltage < V_MIN ? 'Brownout / Low Voltage' : 'Over-Voltage'}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, margin: '8px 0', color: '#F97316' }}>
                    {r.voltage.toFixed(1)} V
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    Normal range: {V_MIN}–{V_MAX} V &nbsp;|&nbsp; {timeAgo(r.receivedAt)}
                  </div>
                </div>
              )}

              {/* ── IDLE (available to charge) or CHARGING ── */}
              {(state === 'idle' || state === 'charging') && (
                <>
                  <div className="meter-data" style={{ marginTop: 12 }}>
                    <div className="meter-item">
                      <span className="label">Voltage</span>
                      <span className="value" style={{ color: '#3B82F6' }}>
                        {r.voltage.toFixed(1)} V
                      </span>
                    </div>
                    <div className="meter-item">
                      <span className="label">Current</span>
                      <span className="value" style={{ color: state === 'charging' ? '#10B981' : '#9ca3af' }}>
                        {r.current.toFixed(2)} A
                      </span>
                    </div>
                    <div className="meter-item">
                      <span className="label">Power</span>
                      <span className="value" style={{ color: state === 'charging' ? '#10B981' : '#9ca3af' }}>
                        {r.power.toFixed(1)} W
                      </span>
                    </div>
                    <div className="meter-item">
                      <span className="label">Energy</span>
                      <span className="value">{r.energy.toFixed(3)} kWh</span>
                    </div>
                  </div>

                  {state === 'idle' && (
                    <div style={{ fontSize: 12, color: '#F59E0B', textAlign: 'center', marginTop: 8 }}>
                      Port powered — ready to charge
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: '#9ca3af', padding: '8px 0 0', textAlign: 'right' }}>
                    Updated: {new Date(r.receivedAt).toLocaleTimeString()} · {timeAgo(r.receivedAt)}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
