import React, { useState } from 'react';
import { API_BASE_URL } from '../../config';
import './ResumeUpload.css';

const ResumeUpload = ({ resumeData, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file.name.endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    await uploadResume(file);
  };

  const uploadResume = async (file) => {
    try {
      setUploading(true);
      setError('');

      console.log('[RESUME UPLOAD] Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      console.log('[RESUME UPLOAD] API URL:', `${API_BASE_URL}/api/individual/upload-resume`);

      const formData = new FormData();
      formData.append('resume', file);

      const token = localStorage.getItem('token');
      console.log('[RESUME UPLOAD] Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_BASE_URL}/api/individual/upload-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('[RESUME UPLOAD] Response status:', response.status);

      const data = await response.json();
      console.log('[RESUME UPLOAD] Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      console.log('[RESUME UPLOAD] Success:', data);
      setUploading(false);
      onSuccess(data.resume);
    } catch (err) {
      console.error('[RESUME UPLOAD] Error:', err);
      console.error('[RESUME UPLOAD] Error message:', err.message);
      setError(err.message || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="resume-upload">
      <div className="resume-container">
        {!resumeData ? (
          <div className="upload-section">
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h2>No Resume Uploaded Yet</h2>
              <p className="empty-description">Upload your resume to get started. We'll analyze it and match you with relevant opportunities.</p>

              <div
                className={`upload-area ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="upload-content">
                  <div className="upload-icon">⬆️</div>
                  <h3>Drag and drop your resume</h3>
                  <p className="or-divider">or</p>
                  <label className="upload-button">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleChange}
                      disabled={uploading}
                      style={{ display: 'none' }}
                    />
                    <span className="button-text">Choose File</span>
                  </label>
                  <p className="file-info">📋 PDF format only • Max 10MB</p>
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              {uploading && (
                <div className="uploading">
                  <div className="spinner-small"></div>
                  <p>Analyzing your resume...</p>
                </div>
              )}

              <div className="upload-benefits">
                <div className="benefit">
                  <span className="benefit-icon">✨</span>
                  <span>ATS Score Analysis</span>
                </div>
                <div className="benefit">
                  <span className="benefit-icon">🎯</span>
                  <span>Skill Extraction</span>
                </div>
                <div className="benefit">
                  <span className="benefit-icon">📊</span>
                  <span>Job Matching</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="resume-preview">
            <h2>Resume Details</h2>
            
            <div className="resume-info">
              <div className="info-item">
                <span className="label">File Name:</span>
                <span className="value">{resumeData.fileName}</span>
              </div>
              <div className="info-item">
                <span className="label">Uploaded:</span>
                <span className="value">
                  {new Date(resumeData.uploadedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="info-item ats-score">
                <span className="label">ATS Score:</span>
                <span className="value score">{resumeData.atsScore}/100</span>
              </div>
            </div>

            {/* Skills */}
            {resumeData.extractedData?.skills && resumeData.extractedData.skills.length > 0 && (
              <div className="section">
                <h3>Skills ({resumeData.extractedData.skills.length})</h3>
                <div className="skills-list">
                  {resumeData.extractedData.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {resumeData.extractedData?.experience && resumeData.extractedData.experience.length > 0 && (
              <div className="section">
                <h3>Experience ({resumeData.extractedData.experience.length})</h3>
                <div className="experience-list">
                  {resumeData.extractedData.experience.map((exp, idx) => (
                    <div key={idx} className="experience-item">
                      <div className="exp-header">
                        <h4>{exp.title}</h4>
                        <span className="company">{exp.company}</span>
                      </div>
                      <p className="period">{exp.period}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {resumeData.extractedData?.education && resumeData.extractedData.education.length > 0 && (
              <div className="section">
                <h3>Education</h3>
                <ul className="education-list">
                  {resumeData.extractedData.education.map((edu, idx) => (
                    <li key={idx}>{edu}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Projects */}
            {resumeData.extractedData?.projects && resumeData.extractedData.projects.length > 0 && (
              <div className="section">
                <h3>Projects</h3>
                <ul className="projects-list">
                  {resumeData.extractedData.projects.map((project, idx) => (
                    <li key={idx}>{project}</li>
                  ))}
                </ul>
              </div>
            )}

            <button 
              className="upload-new-btn"
              onClick={() => {
                // Call parent's onSuccess with null to reset resumeData
                onSuccess(null);
              }}
            >
              Upload Different Resume
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUpload;
