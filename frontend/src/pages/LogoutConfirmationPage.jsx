import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import './LogoutConfirmation.css';

const LogoutConfirmationPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogoutConfirm = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate inputs
    if (!email || !password) {
      setError('Please enter your email and password');
      setIsLoading(false);
      return;
    }

    try {
      const currentToken = localStorage.getItem('token');
      
      if (!currentToken) {
        setError('No active session found. Please login again.');
        setIsLoading(false);
        return;
      }

      // First, verify credentials by attempting login
      const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        setError(loginData.message || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Credentials verified, now call logout endpoint with current token to blacklist it
      console.log('[LOGOUT] Calling backend logout endpoint...');
      const logoutResponse = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      const logoutData = await logoutResponse.json();
      console.log('[LOGOUT] Backend response:', logoutData);

      if (logoutResponse.ok) {
        console.log('[LOGOUT] Token blacklisted successfully, clearing local context...');
        // Logout successful - clear token and context
        logout();
        // Redirect to logout success page
        navigate('/logout');
      } else {
        setError(logoutData.message || 'Logout failed');
        console.error('[LOGOUT] Logout response error:', logoutData);
        setIsLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('[LOGOUT] Logout error:', err);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back
  };

  return (
    <div className="logout-confirmation-container">
      <div className="logout-confirmation-card">
        <h2>Confirm Logout</h2>
        <p className="logout-confirmation-subtitle">
          For security, please verify your credentials to logout
        </p>

        {error && <div className="error-message">{error}</div>}

        <div className="user-info">
          <p><strong>Logged in as:</strong> {user?.email}</p>
        </div>

        <form onSubmit={handleLogoutConfirm}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Confirm Logout'}
            </button>
          </div>
        </form>

        <div className="logout-confirmation-info">
          <p>⚠️ This will end your current session and log you out from all devices.</p>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmationPage;
