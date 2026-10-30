import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ onLogout }) {
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    logout();
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="simple-dashboard-wrapper">
      <div className="simple-dashboard-card">
        <div className="simple-card-header">
          <h2>User Dashboard</h2>
          <p className="text-muted">You are successfully logged in.</p>
        </div>

        <div className="simple-user-details">
          <div className="simple-detail-row">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{user?.email || 'N/A'}</span>
          </div>
          <div className="simple-detail-row">
            <span className="detail-label">Account ID:</span>
            <span className="detail-value text-mono">{user?.id || 'N/A'}</span>
          </div>
          <div className="simple-detail-row">
            <span className="detail-label">Status:</span>
            <span className="detail-value status-active">Authenticated (Active)</span>
          </div>
          <div className="simple-detail-row">
            <span className="detail-label">Database:</span>
            <span className="detail-value">MongoDB Atlas</span>
          </div>
        </div>

        <div className="simple-card-actions">
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
