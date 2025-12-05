import { useState } from 'react';
import CandidateForm from './components/CandidateForm';
import ResultsDisplay from './components/ResultsDisplay';

export default function App() {
  // State to track which view to show ('form' or 'results')
  const [currentView, setCurrentView] = useState('form');

  // State to store the candidate ID returned from form submission
  const [candidateId, setCandidateId] = useState(null);

  // Function called when form is successfully submitted
  // Receives the candidate ID from the form component
  const handleFormSubmitSuccess = (id) => {
    // Store the ID
    setCandidateId(id);

    // Switch to results view
    setCurrentView('results');
  };

  // Function called when user clicks "Submit Another Form" button
  const handleReset = () => {
    // Clear the candidate ID
    setCandidateId(null);

    // Switch back to form view
    setCurrentView('form');
  };

  return (
    <div style={{
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      backgroundColor: '#ffffff',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Navigation Header */}
      <header style={{
        backgroundColor: '#667eea',
        color: 'white',
        padding: '30px 20px',
        textAlign: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        width: '100%'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: 'bold' }}>
          Candidate Form & Verification System
        </h1>     
        <p style={{ margin: 0, opacity: 0.95, fontSize: '16px', fontWeight: 500 }}>
          {currentView === 'form' ? ' Submit your information' : ' Your Submission Results'}
        </p>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        padding: '40px 20px',
        width: '100%',
        backgroundColor: '#f8f9fa'
      }}>
        {/* Show Form View */}
        {currentView === 'form' && (
          <CandidateForm onSubmitSuccess={handleFormSubmitSuccess} />
        )}

        {/* Show Results View */}
        {currentView === 'results' && (
          <ResultsDisplay 
            candidateId={candidateId} 
            onReset={handleReset} 
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '25px 20px',
        textAlign: 'center',
        fontSize: '14px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <p style={{ margin: 0 }}> 2025 Candidate Form System. All rights reserved.</p>
      </footer>
    </div>
  );
}
