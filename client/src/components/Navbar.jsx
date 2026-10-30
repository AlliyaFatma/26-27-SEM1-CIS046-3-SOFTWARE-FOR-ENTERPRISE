import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentView, setCurrentView }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="container nav-container">
        {/* Brand */}
        <div 
          className="brand"
          onClick={() => setCurrentView('landing')}
          role="button"
          tabIndex={0}
        >
          <span className="brand-title">Banana Classroom</span>
        </div>

        {/* Navigation / Auth Actions */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="user-nav-menu">
              <span className="user-score-pill">🍌 {user?.score || 0} pts</span>
              <span className="user-email-tag">{user?.email}</span>
              <button
                className={`btn btn-outline btn-sm ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                Dashboard
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  logout();
                  setCurrentView('landing');
                }}
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button 
                className={`btn btn-link ${currentView === 'landing' ? 'active-link' : ''}`}
                onClick={() => setCurrentView('landing')}
              >
                Home
              </button>
              <button 
                className={`btn btn-outline btn-sm ${currentView === 'login' ? 'active' : ''}`}
                onClick={() => setCurrentView('login')}
              >
                Log In
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setCurrentView('signup')}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
