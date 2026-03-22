import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onLoginClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Check if running as standalone app
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Only capture install prompt if in browser
    if (isStandalone) return;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, [isStandalone]);

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    try {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } catch (err) {
      console.error('Install error:', err);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">
            Bijli<span className="logo-highlight">Point</span>
          </span>
        </div>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <li><a href="#home" onClick={() => setMenuOpen(false)}>Home</a></li>
          <li><a href="#about" onClick={() => setMenuOpen(false)}>About</a></li>
          <li><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a></li>
          <li><a href="#clients" onClick={() => setMenuOpen(false)}>Our Clients</a></li>
          <li><a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a></li>
          <li><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a></li>
          
          {/* ONLY SHOW IN BROWSER, NOT IN INSTALLED APP */}
          {!isStandalone && installPrompt && (
            <li>
              <button onClick={handleInstall} className="btn-install-nav">
                ⚡ Install App
              </button>
            </li>
          )}
          
          {user ? (
            <>
              <li>
                <button onClick={handleDashboard} className="btn-dashboard">
                  Dashboard
                </button>
              </li>
              <li>
                <button onClick={logout} className="btn-logout-nav">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <button onClick={onLoginClick} className="btn-login">
                Dashboard
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}