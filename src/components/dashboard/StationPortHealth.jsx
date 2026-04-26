import React, { useState, useEffect } from 'react';
import API_URL from '../../apiConfig';

const SEVERITY = {
  High:   { bg: '#FEF2F2', color: '#EF4444' },
  Medium: { bg: '#FFF7ED', color: '#F97316' },
  Low:    { bg: '#FFFBEB', color: '#D97706' },
};

export default function StationPortHealth({ stationId }) {
  const [data, setData]       = useState(null);
  const [days, setDays]       = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [days]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/sessions/station/${stationId}/port-health?days=${days}`);
      setData(await res.json());
    } catch {}
    setLoading(false);
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!data)   return <div style={{ padding: 20, color: '#EF4444' }}>Failed to load port health.</div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Check last:</span>
        {[7, 14, 30].map(d => (
          <button key={d} onClick={() => setDays(d)} style={{
            padding: '4px 12px', borderRadius: 20, border: '1px solid #d1d5db',
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: days === d ? '#10B981' : '#fff',
            color:      days === d ? '#fff'    : '#374151',
          }}>{d} days</button>
        ))}
      </div>

      <div className="dashboard-card">
        <h3>Port Health</h3>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          Ports with 2+ timeout sessions — indicates hardware, power, or network issues.
        </p>

        {data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#10B981' }}>
            <div style={{ fontSize: 32 }}>✅</div>
            <p style={{ marginTop: 8 }}>No problematic ports detected in this period.</p>
          </div>
        ) : data.map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                Port {String(p.portNumber).padStart(2, '0')}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {p.timeoutCount} timeout{p.timeoutCount !== 1 ? 's' : ''} in last {days} days
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{p.timeoutCount}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>timeouts</div>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: 12,
                background: SEVERITY[p.severity].bg,
                color:      SEVERITY[p.severity].color,
              }}>
                {p.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
