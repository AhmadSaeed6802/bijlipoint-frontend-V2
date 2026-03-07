import React, { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    type: 'individual'
  });
  const [status, setStatus] = useState('');

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setStatus('sending');

  //   try {
  //     // Using Formspree - FREE email service (no backend needed!)
  //     const response = await fetch('https://formspree.io/f/xanykdew', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify(formData)
  //     });

  //     if (response.ok) {
  //       setStatus('success');
  //       setFormData({
  //         name: '',
  //         email: '',
  //         phone: '',
  //         company: '',
  //         message: '',
  //         type: 'individual'
  //       });
  //       setTimeout(() => setStatus(''), 3000);
  //     } else {
  //       setStatus('error');
  //     }
  //   } catch (error) {
  //     console.error('Error:', error);
  //     setStatus('error');
  //   }
  // };
  const handleSubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);

  const response = await fetch("https://formspree.io/f/mojnzakl", {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
  });

  if (response.ok) {
    alert("Message sent successfully!");
    e.target.reset();
  } else {
    alert("Something went wrong.");
  }
};

  return (
    <section id="contact" className="contact">
      <div className="section-header">
        <span className="section-badge">Get In Touch</span>
        <h2 className="section-title">Ready to Go Electric?</h2>
        <p className="section-subtitle">
          Contact us for charging station installation or partnership opportunities
        </p>
      </div>

      <div className="contact-container">
        <div className="contact-info">
          <div className="info-card">
            <div className="info-icon">📍</div>
            <div className="info-content">
              <h4>Visit Us</h4>
              <p>
                LUMS Research & Development<br/>
                Opposite Sector U, DHA<br/>
                Lahore, Pakistan
              </p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">📞</div>
            <div className="info-content">
              <h4>Call Us</h4>
              <p>
                +92 322 7190119<br/>
                Mon-Sat: 9AM - 6PM
              </p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">📧</div>
            <div className="info-content">
              <h4>Email Us</h4>
              <p>
                infobijlipoint1@gmail.com<br/>
                We reply within 24 hours
              </p>
            </div>
          </div>

          <div className="info-card social">
            <div className="info-icon">🌐</div>
            <div className="info-content">
              <h4>Follow Us</h4>
              <div className="social-links">
                <a href="#" aria-label="Facebook">📘</a>
                <a href="#" aria-label="Twitter">🐦</a>
                <a href="#" aria-label="LinkedIn">💼</a>
                <a href="#" aria-label="Instagram">📸</a>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-wrapper">
          <form className="contact-form" onSubmit={handleSubmit}>
            {status === 'success' && (
              <div className="alert success">
                ✓ Message sent successfully! We'll contact you soon.
              </div>
            )}
            {status === 'error' && (
              <div className="alert error">
                ✗ Failed to send message. Please try again or call us directly.
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter your name"
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  name='tel'
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="+92 322 7190119"
                />
              </div>
              <div className="form-group">
                <label>Company/Organization</label>
                <input
                  name='Company/Organization'
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="form-group">
              <label>I'm interested in:</label>
              <select
                name='type'
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="individual">Individual Charging</option>
                <option value="business">Business Partnership</option>
                <option value="station">Installing Charging Station</option>
                <option value="other">Other Inquiry</option>
              </select>
            </div>

            <div className="form-group">
              <label>Message *</label>
              <textarea
                name='message'
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                placeholder="Tell us about your requirements..."
                rows="5"
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
