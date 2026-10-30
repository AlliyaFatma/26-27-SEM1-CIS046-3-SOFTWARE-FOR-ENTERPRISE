import React from 'react';
import { GraduationCap, Users, Trophy, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LandingPage({ onGetStarted, onLogin, onStudentJoin }) {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <h1 className="hero-title">
            Banana Classroom
          </h1>
          <p className="hero-subtitle">
            Interactive math challenges for schools. Teachers create classroom codes and monitor real-time student leaderboards—no student accounts or passwords required.
          </p>

          <div className="hero-actions">
            <button 
              className="btn btn-primary btn-lg hero-cta-btn" 
              onClick={onStudentJoin}
            >
              <GraduationCap size={18} />
              <span>Enter Classroom Code</span>
              <ArrowRight size={16} />
            </button>

            <button 
              className="btn btn-outline btn-lg" 
              onClick={onLogin}
            >
              <Users size={16} />
              <span>Teacher Portal</span>
            </button>
          </div>
        </div>
      </section>

      {/* Product Highlights */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-header">
                <span className="feature-num">01</span>
                <h3>Classroom Codes</h3>
              </div>
              <p>
                Teachers generate instant classroom codes to share with students. Manage multiple classrooms from a single dashboard.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-header">
                <span className="feature-num">02</span>
                <h3>10 Puzzle Challenge</h3>
              </div>
              <p>
                Students join using only their nickname and code to solve 10 interactive Banana Math puzzles with live accuracy tracking.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-header">
                <span className="feature-num">03</span>
                <h3>Live Leaderboard</h3>
              </div>
              <p>
                Classroom rankings update in real time with scores, completion times, and question-by-question answer breakdowns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="page-footer">
        <div className="container footer-row">
          <span>Banana Classroom • Interactive Math Platform</span>
          <div className="footer-links">
            <button className="footer-link-btn" onClick={onStudentJoin}>Student Join</button>
            <button className="footer-link-btn" onClick={onLogin}>Teacher Login</button>
            <button className="footer-link-btn" onClick={onGetStarted}>Sign Up</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
