import React from 'react';
import chargingImg from "../../assets/charging-station.jpg";

export default function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <div className="electric-lines"></div>
      </div>
      
      <div className="hero-content">
        <div className="hero-badge">
          🔋 Powering Pakistan's EV Future
        </div>
        
        <h1 className="hero-title">
          Charge Your Electric Vehicle<br/>
          <span className="gradient-text">Anywhere, Anytime</span>
        </h1>
        
        <p className="hero-subtitle">
          Pakistan's first smart EV charging network powered by LUMS R&D. 
          Find charging stations, pay seamlessly, and get charged on-the-go.
        </p>
        
        <div className="hero-cta">
          <a href="#contact" className="btn btn-primary">
            <span>Get Your Charging Station</span>
            <span className="arrow">→</span>
          </a>
          <a href="#how-it-works" className="btn btn-secondary">
            <span>How It Works</span>
            <span className="play-icon">▶</span>
          </a>
        </div>
        
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">500+</div>
            <div className="stat-label">Charging Points</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50+</div>
            <div className="stat-label">Partner Stations</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Support</div>
          </div>
        </div>
      </div>
      
      {/* <div className="hero-image">
        <img 
          src={chargingImg} 
          alt="EV Charging Station with 9 plugs" 
          className="charging-station-img"
        />
      </div> */}
    </section>
  );
}
