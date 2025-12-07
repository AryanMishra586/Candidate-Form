import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import ResumeUpload from '../components/individual/ResumeUpload';
import BackgroundVerification from '../components/individual/BackgroundVerification';
import ProfileDisplay from '../components/individual/ProfileDisplay';
import './IndividualDashboard.css';

const IndividualDashboard = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [backgroundStatus, setBackgroundStatus] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch profile data on component mount
  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoadingData(true);
      setError('');

      console.log('[INDIVIDUAL DASHBOARD] Fetching profile data...');

      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch all data in parallel
      const [profileRes, resumeRes, backgroundRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/individual/profile`, { headers }),
        fetch(`${API_BASE_URL}/api/individual/resume`, { headers }),
        fetch(`${API_BASE_URL}/api/individual/background-status`, { headers })
      ]);

      // Process profile
      if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
        const data = await profileRes.value.json();
        setProfileData(data.profile);
        console.log('[INDIVIDUAL DASHBOARD] Profile fetched:', data.profile);
      } else if (profileRes.status === 'fulfilled') {
        const errorData = await profileRes.value.json();
        console.error('[INDIVIDUAL DASHBOARD] Profile error:', errorData);
      }

      // Process resume
      if (resumeRes.status === 'fulfilled' && resumeRes.value.ok) {
        const data = await resumeRes.value.json();
        setResumeData(data.resume);
        console.log('[INDIVIDUAL DASHBOARD] Resume fetched:', data.resume);
      } else {
        console.log('[INDIVIDUAL DASHBOARD] No resume found');
      }

      // Process background status
      if (backgroundRes.status === 'fulfilled' && backgroundRes.value.ok) {
        const data = await backgroundRes.value.json();
        setBackgroundStatus(data.backgroundStatus);
        console.log('[INDIVIDUAL DASHBOARD] Background status:', data.backgroundStatus);
      }

      setLoadingData(false);
    } catch (err) {
      console.error('[INDIVIDUAL DASHBOARD] Fetch error:', err);
      setError('Failed to load profile data');
      setLoadingData(false);
    }
  };

  const handleResumeUploadSuccess = (newResumeData) => {
    setResumeData(newResumeData);
    setSuccessMessage('Resume uploaded and parsed successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleBackgroundUploadSuccess = () => {
    fetchProfileData();
    setSuccessMessage('Document uploaded successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  if (loading || loadingData) {
    return (
      <div className="individual-dashboard loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="individual-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Welcome, {user?.firstName || 'Candidate'}!</h1>
            <p className="subtitle">Build your profile to get matched with jobs</p>
          </div>
          <div className="header-stats">
            <div className="stat">
              <span className="stat-label">Profile Completion</span>
              <span className="stat-value">{calculateProfileCompletion(profileData, resumeData, backgroundStatus)}%</span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="tab-icon">👤</span>
            Profile
          </button>
          <button
            className={`tab ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => setActiveTab('resume')}
          >
            <span className="tab-icon">📄</span>
            Resume
            {resumeData && <span className="badge">✓</span>}
          </button>
          <button
            className={`tab ${activeTab === 'verification' ? 'active' : ''}`}
            onClick={() => setActiveTab('verification')}
          >
            <span className="tab-icon">🔐</span>
            Verification
            {backgroundStatus?.overallVerificationStatus === 'fully_verified' && <span className="badge">✓</span>}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'profile' && (
          <ProfileDisplay 
            profileData={profileData} 
            onUpdate={fetchProfileData}
          />
        )}

        {activeTab === 'resume' && (
          <ResumeUpload 
            resumeData={resumeData}
            onSuccess={handleResumeUploadSuccess}
          />
        )}

        {activeTab === 'verification' && (
          <BackgroundVerification 
            backgroundStatus={backgroundStatus}
            onSuccess={handleBackgroundUploadSuccess}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Calculate profile completion percentage
 */
function calculateProfileCompletion(profileData, resumeData, backgroundStatus) {
  let completion = 0;
  let totalSections = 0;

  // Basic info (20%)
  totalSections += 1;
  if (profileData?.firstName && profileData?.lastName && profileData?.phone) {
    completion += 20;
  }

  // Resume (40%)
  totalSections += 1;
  if (resumeData && resumeData.atsScore) {
    completion += 40;
  }

  // Background verification (40%)
  totalSections += 1;
  if (backgroundStatus?.overallVerificationStatus === 'fully_verified') {
    completion += 40;
  } else if (backgroundStatus?.overallVerificationStatus === 'partially_verified') {
    completion += 20;
  }

  return Math.round(completion);
}

export default IndividualDashboard;
