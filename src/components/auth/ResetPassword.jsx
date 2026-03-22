import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from "../../apiConfig";

export default function ResetPassword() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get token from URL
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    
    if (!tokenParam) {
      setError('Invalid reset link');
    } else {
      setToken(tokenParam);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          newPassword: newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="reset-password-page">
      <div className="reset-container">
        {!success ? (
          <>
            <div className="reset-header">
              <div className="reset-icon">🔐</div>
              <h1>Reset Your Password</h1>
              <p>Enter your new password below</p>
            </div>

            {error && <div className="reset-error">{error}</div>}

            <form onSubmit={handleSubmit} className="reset-form">
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  minLength="6"
                  disabled={!token || loading}
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  minLength="6"
                  disabled={!token || loading}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={!token || loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <div className="reset-footer">
              <a href="/">Back to Home</a>
            </div>
          </>
        ) : (
          <div className="reset-success">
            <div className="success-icon">✓</div>
            <h2>Password Reset Successful!</h2>
            <p>Your password has been changed successfully.</p>
            <p className="redirect-text">Redirecting to login in 3 seconds...</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
