import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import LogoutConfirmationPage from './pages/LogoutConfirmationPage';
import LogoutPage from './pages/LogoutPage';
import IndividualDashboard from './pages/IndividualDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import CandidateForm from './components/CandidateForm';
import ResultsDisplay from './components/ResultsDisplay';
import { useState } from 'react';

function HomePage() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
  }

  if (isAuthenticated && user) {
    // Redirect to appropriate dashboard based on user type
    if (user.userType === 'company') {
      return <Navigate to="/company-dashboard" replace />;
    }
    return <Navigate to="/individual-dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

function CandidateFormPage() {
  const [currentView, setCurrentView] = useState('form');
  const [candidateId, setCandidateId] = useState(null);

  const handleFormSubmitSuccess = (id) => {
    setCandidateId(id);
    setCurrentView('results');
  };

  const handleReset = () => {
    setCandidateId(null);
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

      <main style={{
        flex: 1,
        padding: '40px 20px',
        width: '100%',
        backgroundColor: '#f8f9fa'
      }}>
        {currentView === 'form' && (
          <CandidateForm onSubmitSuccess={handleFormSubmitSuccess} />
        )}

        {currentView === 'results' && (
          <ResultsDisplay
            candidateId={candidateId}
            onReset={handleReset}
          />
        )}
      </main>

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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route
        path="/logout-confirm"
        element={
          <ProtectedRoute>
            <LogoutConfirmationPage />
          </ProtectedRoute>
        }
      />
      <Route path="/logout" element={<LogoutPage />} />
      <Route path="/form" element={<CandidateFormPage />} />

      <Route
        path="/individual-dashboard"
        element={
          <ProtectedRoute allowedTypes={['individual']}>
            <IndividualDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/company-dashboard"
        element={
          <ProtectedRoute allowedTypes={['company']}>
            <CompanyDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
