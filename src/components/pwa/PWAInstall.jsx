import React, { useState, useEffect } from 'react';

export default function PWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-install-banner">
      <div className="pwa-content">
        <div className="pwa-icon">📱</div>
        <div className="pwa-text">
          <h4>Install BijliPoint App</h4>
          <p>Get quick access from your home screen</p>
        </div>
        <div className="pwa-actions">
          <button onClick={handleInstall} className="btn-install">
            Install
          </button>
          <button onClick={() => setShowPrompt(false)} className="btn-dismiss">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
