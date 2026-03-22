import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import OTPVerification from './OTPVerification';
import ForgotPassword from './ForgotPassword';

export default function AuthModal({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showOTP, setShowOTP] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    cnic: '',
    role: 'Rider'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      // Direct login
      setLoading(true);
      const result = await login(formData.email, formData.password);
      setLoading(false);

      if (result.success) {
        onClose();
        window.location.href = '/dashboard';
      } else {
        setError(result.error || 'Login failed');
      }
    } else {
      // Signup validation
      if (!formData.phone.startsWith('+92')) {
        setError('Phone must start with +92');
        return;
      }
      
      // CNIC validation
      if (!formData.cnic || formData.cnic.length < 13) {
        setError('Valid CNIC is required (13-15 digits)');
        return;
      }
      
      setShowOTP(true);
    }
  };

  const handleOTPVerified = async () => {
    setLoading(true);
    setError(''); // ✅ Clear any previous errors
    
    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      onClose();
      window.location.href = '/dashboard';
    } else {
      setShowOTP(false);
      // ✅ FIXED - Now shows actual backend error
      setError(result.error || 'Registration failed');
    }
  };

  if (showForgot) {
    return <ForgotPassword onClose={() => setShowForgot(false)} />;
  }

  if (showOTP) {
    return (
      <div className="auth-modal" onClick={onClose}>
        <div className="auth-content" onClick={(e) => e.stopPropagation()}>
          <OTPVerification
            phoneNumber={formData.phone}
            onVerified={handleOTPVerified}
            onBack={() => setShowOTP(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-modal" onClick={onClose}>
      <div className="auth-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>
        
        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Login to access your dashboard' : 'Join BijliPoint today'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="+92 300 1234567"
                  pattern="^\+92[0-9]{10}$"
                />
                <small>Format: +92 followed by 10 digits</small>
              </div>

              <div className="form-group">
                <label>CNIC Number *</label>
                <input
                  type="text"
                  value={formData.cnic}
                  onChange={(e) => {
                    // Auto-format CNIC with dashes
                    let value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length > 5) {
                      value = value.slice(0, 5) + '-' + value.slice(5);
                    }
                    if (value.length > 13) {
                      value = value.slice(0, 13) + '-' + value.slice(13);
                    }
                    if (value.length > 15) {
                      value = value.slice(0, 15);
                    }
                    setFormData({ ...formData, cnic: value });
                  }}
                  required
                  placeholder="12345-1234567-1"
                  maxLength="15"
                  minLength="13"
                />
                <small>Format: 12345-1234567-1 (13 or 15 characters)</small>
              </div>

              <div className="form-group">
                <label>I am a: *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="Rider">EV Bike Rider</option>
                  <option value="StationOwner">Charging Station Owner</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Enter password"
              minLength="6"
            />
          </div>

          {isLogin && (
            <div className="forgot-link">
              <button 
                type="button" 
                onClick={() => setShowForgot(true)}
                className="link-btn"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Continue to OTP')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setIsLogin(!isLogin)} className="link-btn">
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}