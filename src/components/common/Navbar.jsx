import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onLoginClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDashboard = () => {
    window.location.href = '/dashboard';
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
                Dashboard{/* Login / Sign Up */}
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
