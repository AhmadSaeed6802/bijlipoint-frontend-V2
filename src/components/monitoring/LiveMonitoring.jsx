import React, { useState, useEffect } from 'react';
import API_URL from '../../apiConfig';

export default function LiveMonitoring({ stationId }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestReadings();
    // Refresh every 2 seconds
    const interval = setInterval(fetchLatestReadings, 2000);// ✅ Poll every 2 sec
    return () => clearInterval(interval);
  }, [stationId]);

  const fetchLatestReadings = async () => {
    try {
      const res = await fetch(`${API_URL}/mqtt/latest/${stationId}`);
      const data = await res.json();
      setReadings(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching readings:', err);
    }
  };

  const controlPort = async (portNumber, command) => {
    const user = JSON.parse(sessionStorage.getItem('bijli_user'));
    
    try {
      const res = await fetch(`${API_URL}/mqtt/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId,
          portNumber,
          command,
          userId: user.id
        })
      });
      
      const data = await res.json();
      alert(data.message);
      fetchLatestReadings();
    } catch (err) {
      alert('Failed to control port');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="live-monitoring">
      <h2>Live Monitoring - Station {stationId}</h2>
      
      <div className="ports-grid">
        {readings.map((reading) => (
          <div key={reading.portNumber} className="port-card">
            <div className="port-header">
              <h3>Port {reading.portNumber}</h3>
              <div className="port-controls">
                <button 
                  onClick={() => controlPort(reading.portNumber, 'ON')}
                  className="btn-on"
                >
                  ON
                </button>
                <button 
                  onClick={() => controlPort(reading.portNumber, 'OFF')}
                  className="btn-off"
                >
                  OFF
                </button>
              </div>
            </div>

            <div className="meter-data">
              <div className="meter-item">
                <span className="label">Voltage:</span>
                <span className="value">{reading.voltage.toFixed(1)} V</span>
              </div>
              <div className="meter-item">
                <span className="label">Current:</span>
                <span className="value">{reading.current.toFixed(2)} A</span>
              </div>
              <div className="meter-item">
                <span className="label">Power:</span>
                <span className="value">{reading.power.toFixed(1)} W</span>
              </div>
              <div className="meter-item">
                <span className="label">Energy:</span>
                <span className="value">{reading.energy.toFixed(2)} kWh</span>
              </div>
            </div>

            <div className="last-update">
              Last update: {new Date(reading.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
