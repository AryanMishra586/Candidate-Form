import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LogoutPage.css';

const LogoutPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to home after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="logout-container">
      <div className="logout-card">
        <div className="logout-icon">✓</div>
        <h1>You've Been Logged Out</h1>
        <p className="logout-message">
          Your session has been securely ended. Thank you for using our platform!
        </p>

        <div className="logout-actions">
          <Link to="/login" className="btn btn-primary">
            Sign In Again
          </Link>
          <Link to="/form" className="btn btn-secondary">
            Submit Form
          </Link>
        </div>

        <p className="logout-footer">
          Redirecting to home in <span id="countdown">5</span> seconds...
        </p>
      </div>
    </div>
  );
};

export default LogoutPage;
