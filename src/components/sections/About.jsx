import React from 'react';
import chargingImg from "../../assets/charging-station.jpg";


export default function About() {
  return (
    <section id="about" className="about">
      <div className="section-header">
        <span className="section-badge">About BijliPoint</span>
        <h2 className="section-title">
          Revolutionizing EV Charging in Pakistan
        </h2>
        <p className="section-subtitle">
          We're building Pakistan's most reliable and accessible EV charging infrastructure
        </p>
      </div>
      
      <div className="about-content">
        {/* <div className="about-image">
          <img 
            src={chargingImg} 
            alt="Professional EV Charging Station" 
            className="about-img"
          />
          <div className="image-overlay">
            <div className="overlay-text">
              <h3>9 Charging Plugs</h3>
              <p>Available 24/7</p>
            </div>
          </div>
        </div> */}
        
        <div className="about-features">
          <div className="feature-card">
            <div className="feature-icon green">🌱</div>
            <div className="feature-content">
              <h3>Eco-Friendly Solution</h3>
              <p>
                100% clean energy charging solutions helping reduce Pakistan's 
                carbon footprint. Our charging stations use renewable energy sources.
              </p>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon blue">⚡</div>
            <div className="feature-content">
              <h3>Fast Charging Technology</h3>
              <p>
                Quick charge technology gets you 80% charge in just 30 minutes. 
                Compatible with all major electric bike brands in Pakistan.
              </p>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon orange">💰</div>
            <div className="feature-content">
              <h3>Cost Effective</h3>
              <p>
                Pay per use with transparent pricing starting from Rs. 15 per unit. 
                No hidden charges, no subscription required.
              </p>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon purple">📱</div>
            <div className="feature-content">
              <h3>Smart QR Payment</h3>
              <p>
                Simply scan QR code, pay via JazzCash/Easypaisa/Card, and start charging. 
                Real-time monitoring through mobile app.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mission-statement">
        <div className="mission-content">
          <h3>Our Mission</h3>
          <p>
            In collaboration with LUMS Research & Development, we're accelerating 
            Pakistan's transition to electric mobility. Our goal is to install 
            charging stations across major cities, making EV adoption accessible 
            to everyone. We believe in a greener future where clean transportation 
            is the norm, not the exception.
          </p>
          <div className="mission-stats">
            <div className="mission-stat">
              <strong>2023</strong>
              <span>Founded at LUMS</span>
            </div>
            <div className="mission-stat">
              <strong>50+</strong>
              <span>Cities Coverage</span>
            </div>
            <div className="mission-stat">
              <strong>10K+</strong>
              <span>Happy Riders</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
