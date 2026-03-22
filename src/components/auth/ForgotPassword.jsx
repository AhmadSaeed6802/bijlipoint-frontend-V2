import React, { useState } from 'react';
import API_URL from "../../apiConfig";


export default function ForgotPassword({ onClose, onSuccess }) {
  const [step, setStep] = useState('email'); // email, sent
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        setStep('sent');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send reset link');
      }
    } catch (err) {
      setError('Something went wrong');
    }

    setLoading(false);
  };

  return (
    <div className="forgot-password-modal" onClick={onClose}>
      <div className="forgot-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>

        {step === 'email' && (
          <>
            <div className="forgot-header">
              <div className="forgot-icon">🔑</div>
              <h2>Forgot Password?</h2>
              <p>Enter your email to receive a password reset link</p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="auth-footer">
              <button onClick={onClose} className="link-btn">
                Back to Login
              </button>
            </div>
          </>
        )}

        {step === 'sent' && (
          <div className="forgot-success">
            <div className="success-icon">✓</div>
            <h2>Check Your Email</h2>
            <p>We've sent a password reset link to:</p>
            <p className="email-sent">{email}</p>
            <p className="help-text">
              Click the link in the email to reset your password.
              If you don't see it, check your spam folder.
            </p>
            <button onClick={onClose} className="btn btn-primary">
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
