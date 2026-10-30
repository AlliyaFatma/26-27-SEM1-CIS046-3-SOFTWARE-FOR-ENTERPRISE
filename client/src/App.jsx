import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import './App.css';

function MainApp() {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'login' | 'signup' | 'dashboard'

  // If user becomes authenticated, switch to dashboard
  useEffect(() => {
    if (isAuthenticated && (currentView === 'login' || currentView === 'signup')) {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated, currentView]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-dark"></div>
        <p>Loading Banana Classroom...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      <main className="main-content">
        {currentView === 'landing' && (
          <LandingPage 
            onGetStarted={() => setCurrentView('signup')}
            onLogin={() => setCurrentView('login')}
          />
        )}

        {(currentView === 'login' || currentView === 'signup') && (
          <div className="auth-view-container">
            <AuthForm 
              initialMode={currentView}
              onAuthSuccess={() => setCurrentView('dashboard')}
              onSwitchToMode={(mode) => setCurrentView(mode)}
            />
          </div>
        )}

        {currentView === 'dashboard' && (
          isAuthenticated ? (
            <Dashboard onLogout={() => setCurrentView('landing')} />
          ) : (
            <div className="auth-view-container">
              <AuthForm 
                initialMode="login" 
                onAuthSuccess={() => setCurrentView('dashboard')}
                onSwitchToMode={(mode) => setCurrentView(mode)}
              />
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

