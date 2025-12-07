import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import './VerifyEmail.css';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState('');

  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }

    // Auto-verify if token is present
    if (token && emailParam) {
      verifyEmail(token, emailParam);
    } else {
      setLoading(false);
    }
  }, [token, emailParam]);

  const verifyEmail = async (verificationToken, userEmail) => {
    try {
      setLoading(true);
      setError('');

      console.log('[VERIFY EMAIL] Sending verification request...');
      console.log('[VERIFY EMAIL] API URL:', `${API_BASE_URL}/auth/verify-email`);
      console.log('[VERIFY EMAIL] Token (first 20 chars):', verificationToken?.substring(0, 20));
      console.log('[VERIFY EMAIL] Email:', userEmail);

      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: verificationToken,
          email: userEmail
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      setSuccess(true);
      console.log('[VERIFY EMAIL] ✓ Email verified successfully');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('[VERIFY EMAIL] ✗ Verification error:', err);
      setError(err.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setResendLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend email');
      }

      setSuccess(false);
      setError('');
      alert('Verification email sent! Check your inbox.');
      console.log('[VERIFY EMAIL] Resent verification email to:', email);
    } catch (err) {
      console.error('[VERIFY EMAIL] Resend error:', err);
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <h2>Verifying your email...</h2>
            <p>Please wait while we verify your email address.</p>
          </div>
        ) : success ? (
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h2>Email Verified!</h2>
            <p>Your email has been successfully verified.</p>
            <p className="redirect-text">Redirecting to login page...</p>
          </div>
        ) : (
          <div className="verification-state">
            <h2>Verify Your Email</h2>
            
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            <div className="verification-content">
              <p>Enter your email address to verify your account:</p>
              
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="email-input"
              />

              <button
                onClick={() => verifyEmail(token || '', email)}
                disabled={!email || (!token && !email)}
                className="verify-button"
              >
                Verify Email
              </button>

              <div className="or-divider">
                <span>or</span>
              </div>

              <button
                onClick={handleResendEmail}
                disabled={!email || resendLoading}
                className="resend-button"
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>

              <p className="help-text">
                Didn't receive the email? Check your spam folder or request a new verification link.
              </p>
            </div>

            <div className="footer-links">
              <a href="/login">Back to Login</a>
              <a href="/signup">Sign Up Again</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
