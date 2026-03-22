import React, { useState } from 'react';

export default function OTPVerification({ phoneNumber, onVerified, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // DUMMY OTP - Accept 123456 or any 6 digits
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (otpCode === '123456' || otpCode.length === 6) {
        onVerified();
      } else {
        setError('Invalid OTP. Use 123456 for testing');
      }
    } catch (err) {
      setError('Verification failed');
    }

    setLoading(false);
  };

  const handleResend = () => {
    alert(`OTP sent to ${phoneNumber}\n\nFor testing, use: 123456`);
  };

  return (
    <div className="otp-verification">
      <div className="otp-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>Verify Phone Number</h2>
        <p>Enter the 6-digit code sent to</p>
        <p className="phone-number">{phoneNumber}</p>
        <p className="test-hint">For testing: Use 123456</p>
      </div>

      {error && <div className="otp-error">{error}</div>}

      <div className="otp-inputs">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digit && index > 0) {
                document.getElementById(`otp-${index - 1}`)?.focus();
              }
            }}
            className="otp-input"
          />
        ))}
      </div>

      <button 
        onClick={handleVerify} 
        disabled={loading}
        className="btn btn-primary btn-block"
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>

      <div className="otp-footer">
        <p>
          Didn't receive code? 
          <button onClick={handleResend} className="link-btn">
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );
}
