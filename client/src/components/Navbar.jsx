import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogIn, UserPlus, LogOut, LayoutDashboard } from 'lucide-react';

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
          <span className="brand-logo-icon">🍌</span>
          <span className="brand-title">Banana Classroom</span>
        </div>

        {/* Navigation Actions */}
        <div className="nav-actions">
          {/* Student Join Button */}
          <button 
            type="button"
            className={`nav-student-link ${currentView === 'student-challenge' ? 'nav-student-active' : ''}`}
            onClick={() => setCurrentView('student-challenge')}
          >
            <GraduationCap size={16} />
            <span>Student Join</span>
          </button>

          {isAuthenticated ? (
            <div className="user-nav-menu">
              <span className="role-tag-pill">
                {user?.role === 'teacher' ? 'Teacher' : 'Student'}
              </span>
              <span className="user-email-tag">{user?.email}</span>
              <button
                className={`btn btn-outline btn-sm ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                <LayoutDashboard size={14} />
                <span>Dashboard</span>
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  logout();
                  setCurrentView('landing');
                }}
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button 
                className={`btn btn-ghost btn-sm ${currentView === 'login' ? 'active' : ''}`}
                onClick={() => setCurrentView('login')}
              >
                Teacher Log In
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setCurrentView('signup')}
              >
                Teacher Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
