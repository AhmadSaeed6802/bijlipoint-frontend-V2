import React, { useState, useEffect } from 'react';

export default function ChargingSession({ userId, onClose }) {
  const [step, setStep] = useState('select'); // select, charging, payment, complete
  const [sessionId, setSessionId] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [finalData, setFinalData] = useState(null);

  useEffect(() => {
    if (step !== 'charging') return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`https://localhost:49597/api/breaker/status/${sessionId}`);
        const data = await res.json();
        setLiveData(data);
      } catch (err) {
        console.log('Status fetch error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [step, sessionId]);

  const startCharging = async () => {
    try {
      const res = await fetch('https://localhost:49597/api/breaker/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderId: userId,
          stationId: 1 // Default station for now
        })
      });
      
      const data = await res.json();
      setSessionId(data.sessionId);
      setStep('charging');
    } catch (err) {
      alert('Failed to start charging: ' + err.message);
    }
  };

  const stopCharging = async () => {
    try {
      const res = await fetch('https://localhost:49597/api/breaker/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      
      const data = await res.json();
      setFinalData(data);
      setStep('payment');
    } catch (err) {
      alert('Failed to stop charging: ' + err.message);
    }
  };

  const makePayment = () => {
    // Dummy payment - just mark as paid
    setStep('complete');
  };

  return (
    <div className="charging-overlay" onClick={onClose}>
      <div className="charging-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>

        {step === 'select' && (
          <div className="charging-step">
            <div className="charging-icon">🔌</div>
            <h2>Start Charging Session</h2>
            <p>Connect your EV to any available charging point</p>
            <div className="station-info">
              <p><strong>Station:</strong> Test Station (Any Plug)</p>
              <p><strong>Rate:</strong> Rs 15/kWh</p>
              <p><strong>Available:</strong> Ready</p>
            </div>
            <button onClick={startCharging} className="btn btn-primary btn-large">
              ⚡ Start Charging
            </button>
          </div>
        )}

        {step === 'charging' && (
          <div className="charging-step">
            <div className="charging-active">
              <div className="pulse-animation">⚡</div>
              <h2>Charging Active</h2>
            </div>
            
            {liveData && (
              <div className="live-stats">
                <div className="live-stat">
                  <span className="stat-label">Energy</span>
                  <span className="stat-value">{liveData.energyKwh?.toFixed(3) || '0.000'} kWh</span>
                </div>
                <div className="live-stat">
                  <span className="stat-label">Power</span>
                  <span className="stat-value">{liveData.activePowerW?.toFixed(0) || '0'} W</span>
                </div>
                <div className="live-stat">
                  <span className="stat-label">Voltage</span>
                  <span className="stat-value">{liveData.voltageL1?.toFixed(1) || '0'} V</span>
                </div>
                <div className="live-stat">
                  <span className="stat-label">Current</span>
                  <span className="stat-value">{liveData.currentL1?.toFixed(2) || '0'} A</span>
                </div>
                <div className="live-stat estimated">
                  <span className="stat-label">Estimated Cost</span>
                  <span className="stat-value">Rs {((liveData.energyKwh || 0) * 15).toFixed(0)}</span>
                </div>
              </div>
            )}

            <button onClick={stopCharging} className="btn btn-danger btn-large">
              ⏹ Stop Charging
            </button>
          </div>
        )}

        {step === 'payment' && finalData && (
          <div className="charging-step">
            <div className="charging-icon">💰</div>
            <h2>Charging Complete!</h2>
            
            <div className="final-summary">
              <div className="summary-row">
                <span>Energy Consumed:</span>
                <strong>{finalData.unitsConsumed?.toFixed(3)} kWh</strong>
              </div>
              <div className="summary-row">
                <span>Duration:</span>
                <strong>{Math.round(finalData.duration)} minutes</strong>
              </div>
              <div className="summary-row">
                <span>Rate:</span>
                <strong>Rs 15/kWh</strong>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <strong>Rs {finalData.totalCost?.toFixed(0)}</strong>
              </div>
            </div>

            <button onClick={makePayment} className="btn btn-primary btn-large">
              💳 Pay Now (Dummy)
            </button>
          </div>
        )}

        {step === 'complete' && (
          <div className="charging-step">
            <div className="success-icon">✓</div>
            <h2>Payment Successful!</h2>
            <p>Your charging session has been completed and saved.</p>
            <button onClick={onClose} className="btn btn-primary">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
