import { useState } from 'react';

export default function CandidateForm({ onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    aadhar: ''
  });

  const [files, setFiles] = useState({
    resume: null,
    aadhar: null,
    marksheet10: null,
    marksheet12: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (fileList && fileList[0]) {
      setFiles(prev => ({
        ...prev,
        [name]: fileList[0]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      return;
    }

    if (!files.resume || !files.aadhar || !files.marksheet10 || !files.marksheet12) {
      setError('All documents are required');
      return;
    }

    setIsLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('aadhar', formData.aadhar);
      data.append('resume', files.resume);
      data.append('aadhar', files.aadhar);
      data.append('marksheet10', files.marksheet10);
      data.append('marksheet12', files.marksheet12);

      console.log('📤 Submitting form...');
      const response = await fetch('http://localhost:3000/api/candidates/submit', {
        method: 'POST',
        body: data
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', response.status, errorText);
        throw new Error(`Failed to submit form: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Form submitted, candidate ID:', result.candidateId);
      
      if (result.candidateId) {
        // IMPORTANT: Trigger verification immediately after form submission
        console.log('🔄 Triggering verification process...');
        try {
          const verifyResponse = await fetch(
            `http://localhost:3000/api/candidates/${result.candidateId}/verify`,
            { method: 'POST' }
          );
          console.log('✅ Verification triggered');
        } catch (verifyError) {
          console.warn('⚠️ Verification trigger failed (non-critical):', verifyError.message);
        }
        
        // Go to results page
        onSubmitSuccess(result.candidateId);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '100%',
      margin: '0 auto',
      padding: '0',
      width: '100%'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '0px',
        boxShadow: 'none',
        border: 'none'
      }}>
        <h2 style={{ color: '#333', marginTop: 0, marginBottom: '30px', fontSize: '24px' }}>
           Candidate Information
        </h2>

        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '8px',
            border: '1px solid #fcc',
            fontSize: '14px'
          }}>
             {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Personal Information Section */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#667eea', fontSize: '16px', marginBottom: '15px', borderBottom: '2px solid #667eea', paddingBottom: '8px' }}>
              Personal Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    marginTop: '0',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  style={{ 
                    width: '100%', 
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  style={{ 
                    width: '100%', 
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>Aadhar Number</label>
                <input
                  type="text"
                  name="aadhar"
                  value={formData.aadhar}
                  onChange={handleInputChange}
                  placeholder="Enter your aadhar number"
                  style={{ 
                    width: '100%', 
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#667eea', fontSize: '16px', marginBottom: '15px', borderBottom: '2px solid #667eea', paddingBottom: '8px' }}>
               Upload Documents
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {/* Resume */}
              <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>Resume (PDF) *</label>
                <input
                  type="file"
                  name="resume"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ fontSize: '12px', marginTop: '5px' }}
                />
                {files.resume && <p style={{ color: '#28a745', marginTop: '8px', fontSize: '13px', fontWeight: '600' }}> {files.resume.name}</p>}
              </div>

              {/* Aadhar Document */}
              <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>Aadhar Document (PDF) *</label>
                <input
                  type="file"
                  name="aadhar"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ fontSize: '12px', marginTop: '5px' }}
                />
                {files.aadhar && <p style={{ color: '#28a745', marginTop: '8px', fontSize: '13px', fontWeight: '600' }}> {files.aadhar.name}</p>}
              </div>

              {/* Marksheet 10th */}
              <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>10th Marksheet (PDF) *</label>
                <input
                  type="file"
                  name="marksheet10"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ fontSize: '12px', marginTop: '5px' }}
                />
                {files.marksheet10 && <p style={{ color: '#28a745', marginTop: '8px', fontSize: '13px', fontWeight: '600' }}> {files.marksheet10.name}</p>}
              </div>

              {/* Marksheet 12th */}
              <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>12th Marksheet (PDF) *</label>
                <input
                  type="file"
                  name="marksheet12"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ fontSize: '12px', marginTop: '5px' }}
                />
                {files.marksheet12 && <p style={{ color: '#28a745', marginTop: '8px', fontSize: '13px', fontWeight: '600' }}> {files.marksheet12.name}</p>}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: isLoading ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: isLoading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
            onMouseOver={(e) => !isLoading && (e.target.style.backgroundColor = '#5568d3')}
            onMouseOut={(e) => !isLoading && (e.target.style.backgroundColor = '#667eea')}
          >
            {isLoading ? ' Submitting...' : ' Submit Form'}
          </button>
        </form>
      </div>
    </div>
  );
}
