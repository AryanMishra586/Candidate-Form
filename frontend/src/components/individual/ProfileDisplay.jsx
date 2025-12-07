import React, { useState } from 'react';
import { API_BASE_URL } from '../../config';
import './ProfileDisplay.css';

const ProfileDisplay = ({ profileData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profileData?.firstName || '',
    lastName: profileData?.lastName || '',
    phone: profileData?.phone || '',
    location: profileData?.location || '',
    bio: profileData?.bio || ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      console.log('[PROFILE] Updating profile...');

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/individual/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      console.log('[PROFILE] Profile updated successfully');
      setSaving(false);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      onUpdate();
    } catch (err) {
      console.error('[PROFILE] Error:', err);
      setError(err.message);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: profileData?.firstName || '',
      lastName: profileData?.lastName || '',
      phone: profileData?.phone || '',
      location: profileData?.location || '',
      bio: profileData?.bio || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="profile-display">
      <div className="profile-container">
        <div className="profile-header">
          <h2>My Profile</h2>
          {!isEditing && (
            <button 
              className="edit-button"
              onClick={() => setIsEditing(true)}
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        {isEditing ? (
          <form className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91-XXXXXXXXXX"
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Bio / About You</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself, your interests, and career goals..."
                rows="5"
              />
            </div>

            <div className="form-actions">
              <button 
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <div className="profile-card">
              <div className="card-section">
                <h3>Personal Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Full Name</span>
                    <span className="value">
                      {profileData?.firstName} {profileData?.lastName}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Phone</span>
                    <span className="value">{profileData?.phone || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Location</span>
                    <span className="value">{profileData?.location || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Member Since</span>
                    <span className="value">
                      {new Date(profileData?.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {profileData?.bio && (
                <div className="card-section">
                  <h3>About You</h3>
                  <p className="bio-text">{profileData.bio}</p>
                </div>
              )}

              <div className="card-section">
                <h3>Profile Completeness</h3>
                <div className="completeness-bar">
                  <div 
                    className="completeness-fill" 
                    style={{ width: `${calculateCompletion(profileData)}%` }}
                  ></div>
                </div>
                <p className="completeness-text">{calculateCompletion(profileData)}% Complete</p>
              </div>
            </div>

            <div className="profile-tips">
              <h3>💡 Profile Tips</h3>
              <ul>
                <li>✓ Keep your basic information up to date</li>
                <li>✓ Add a professional photo</li>
                <li>✓ Upload and update your resume regularly</li>
                <li>✓ Complete background verification for better job matches</li>
                <li>✓ Write a compelling bio highlighting your strengths</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const calculateCompletion = (profileData) => {
  let completion = 0;
  
  if (profileData?.firstName && profileData?.lastName) completion += 25;
  if (profileData?.phone) completion += 25;
  if (profileData?.location) completion += 25;
  if (profileData?.bio) completion += 25;

  return completion;
};

export default ProfileDisplay;
