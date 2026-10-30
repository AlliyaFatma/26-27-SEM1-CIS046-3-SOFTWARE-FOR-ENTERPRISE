import React from 'react';

export default function LandingPage({ onGetStarted, onLogin }) {
  return (
    <div className="simple-landing">
      {/* Hero Section */}
      <section className="simple-hero">
        <div className="container">
          <div className="simple-hero-content">
            <h1 className="simple-title">Banana Classroom</h1>
            <p className="simple-subtitle">
              A clean and simple user authentication portal built with React, Node.js, Express, and MongoDB Atlas.
            </p>

            <div className="simple-actions">
              <button className="btn btn-primary btn-lg" onClick={onGetStarted}>
                Sign Up
              </button>
              <button className="btn btn-outline btn-lg" onClick={onLogin}>
                Log In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards Section */}
      <section className="simple-info-section">
        <div className="container">
          <div className="simple-cards-grid">
            <div className="simple-card">
              <h3>Secure Authentication</h3>
              <p>
                Sign up with your email and password. Passwords are securely hashed using bcrypt, and user sessions are managed with JSON Web Tokens (JWT).
              </p>
            </div>

            <div className="simple-card">
              <h3>MongoDB Atlas Database</h3>
              <p>
                User accounts and credentials are saved in MongoDB Atlas. Connect your cloud cluster easily through environment variables.
              </p>
            </div>

            <div className="simple-card">
              <h3>Express.js REST API</h3>
              <p>
                Lightweight and fast Node.js backend with clean endpoints for registration, login, and token verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="simple-footer">
        <div className="container">
          <p>© Banana Classroom • Full-Stack MERN Application</p>
        </div>
      </footer>
    </div>
  );
}
