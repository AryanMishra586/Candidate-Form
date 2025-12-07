import React, { useState } from 'react';
import { API_BASE_URL } from '../../config';
import './BackgroundVerification.css';

const BackgroundVerification = ({ backgroundStatus, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState({});

  const documents = [
    {
      type: 'aadhar',
      label: 'Aadhar Card',
      icon: '🆔',
      description: 'Upload a clear copy of your Aadhar card for identity verification'
    },
    {
      type: 'marksheet10',
      label: '10th Marksheet',
      icon: '📋',
      description: 'Upload your 10th grade marksheet'
    },
    {
      type: 'marksheet12',
      label: '12th Marksheet',
      icon: '📋',
      description: 'Upload your 12th grade marksheet'
    }
  ];

  const handleDrag = (e, docType) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(prev => ({ ...prev, [docType]: true }));
    } else if (e.type === 'dragleave') {
      setDragActive(prev => ({ ...prev, [docType]: false }));
    }
  };

  const handleDrop = (e, docType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [docType]: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0], docType);
    }
  };

  const handleChange = (e, docType) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0], docType);
    }
  };

  const handleFile = async (file, docType) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (!validTypes.includes(file.type)) {
      setError('Please upload PDF or image files only');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    await uploadDocument(file, docType);
  };

  const uploadDocument = async (file, docType) => {
    try {
      setUploading(true);
      setUploadingType(docType);
      setError('');

      console.log('[BACKGROUND] Uploading', docType);

      const formData = new FormData();
      formData.append('document', file);
      formData.append('docType', docType);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/individual/upload-background-docs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      console.log('[BACKGROUND] Upload success:', data);
      setUploading(false);
      setUploadingType(null);
      onSuccess();
    } catch (err) {
      console.error('[BACKGROUND] Error:', err);
      setError(err.message);
      setUploading(false);
      setUploadingType(null);
    }
  };

  const getDocumentStatus = (docType) => {
    const doc = backgroundStatus?.[docType];
    if (!doc?.uploaded) return 'not-uploaded';
    if (doc.verified) return 'verified';
    return 'pending';
  };

  return (
    <div className="background-verification">
      <div className="verification-container">
        <h2>Background Verification</h2>
        <p className="subtitle">
          Upload your documents to verify your identity and educational background
        </p>

        {/* Overall Status */}
        <div className="overall-status">
          <div className="status-indicator">
            <span className="status-label">Overall Status:</span>
            <span className={`status-badge ${backgroundStatus?.overallVerificationStatus || 'not-verified'}`}>
              {formatStatus(backgroundStatus?.overallVerificationStatus)}
            </span>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Documents Upload */}
        <div className="documents-grid">
          {documents.map((doc) => {
            const status = getDocumentStatus(doc.type);
            const isCurrentlyUploading = uploading && uploadingType === doc.type;

            return (
              <div key={doc.type} className={`document-card status-${status}`}>
                <div className="card-header">
                  <span className="icon">{doc.icon}</span>
                  <h3>{doc.label}</h3>
                  <span className={`status-indicator ${status}`}>
                    {getStatusIcon(status)}
                  </span>
                </div>

                <p className="description">{doc.description}</p>

                {status === 'not-uploaded' && (
                  <div
                    className={`upload-dropzone ${dragActive[doc.type] ? 'active' : ''}`}
                    onDragEnter={(e) => handleDrag(e, doc.type)}
                    onDragLeave={(e) => handleDrag(e, doc.type)}
                    onDragOver={(e) => handleDrag(e, doc.type)}
                    onDrop={(e) => handleDrop(e, doc.type)}
                  >
                    {isCurrentlyUploading ? (
                      <div className="uploading">
                        <div className="spinner-small"></div>
                        <p>Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <div className="dropzone-content">
                          <p>Drag file here or</p>
                          <label className="upload-btn">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleChange(e, doc.type)}
                              disabled={uploading}
                              style={{ display: 'none' }}
                            />
                            Click to browse
                          </label>
                        </div>
                        <p className="file-hint">PDF or Image, max 10MB</p>
                      </>
                    )}
                  </div>
                )}

                {status === 'verified' && (
                  <div className="verified-status">
                    <div className="checkmark">✓</div>
                    <p>Verified on {new Date(backgroundStatus[doc.type].verifiedAt).toLocaleDateString()}</p>
                  </div>
                )}

                {status === 'pending' && (
                  <div className="pending-status">
                    <div className="hourglass">⏳</div>
                    <p>Pending verification</p>
                    <p className="small">Our team will review your document soon</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Verification Benefits */}
        <div className="verification-benefits">
          <h3>Benefits of Complete Verification</h3>
          <ul>
            <li>🏆 <strong>Higher Profile Ranking</strong> - Get recommended more often</li>
            <li>✓ <strong>Verified Badge</strong> - Show employers you're authentic</li>
            <li>🎯 <strong>Better Matches</strong> - More job opportunities</li>
            <li>⚡ <strong>Faster Hiring</strong> - Reduce verification delays in hiring process</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'verified':
      return '✓';
    case 'pending':
      return '⏳';
    default:
      return '○';
  }
};

const formatStatus = (status) => {
  switch (status) {
    case 'fully_verified':
      return 'Fully Verified';
    case 'partially_verified':
      return 'Partially Verified';
    default:
      return 'Not Verified';
  }
};

export default BackgroundVerification;
