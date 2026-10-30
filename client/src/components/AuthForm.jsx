import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';

export default function AuthForm({ initialMode = 'login', onAuthSuccess, onSwitchToMode }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const { login, register, authError, setAuthError } = useAuth();

  // Form Fields (Email & Password)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  // Sync mode when initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
    setLocalError('');
    setAuthError(null);
  }, [initialMode, setAuthError]);

  const handleTabChange = (newMode) => {
    setMode(newMode);
    setLocalError('');
    setAuthError(null);
    if (onSwitchToMode) {
      onSwitchToMode(newMode);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setAuthError(null);

    // Validation
    if (!email.trim() || !password) {
      setLocalError('Please enter both your email address and password');
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      if (mode === 'login') {
        result = await login(email.trim(), password);
      } else {
        result = await register(email.trim(), password, 'teacher');
      }

      if (result.success) {
        if (onAuthSuccess) {
          onAuthSuccess();
        }
      } else {
        setLocalError(result.message || 'Operation failed');
      }
    } catch (err) {
      setLocalError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="auth-card-wrapper">
      <div className="auth-card">
        {/* Header Tabs */}
        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => handleTabChange('login')}
          >
            Log In
          </button>
          <button 
            type="button"
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => handleTabChange('signup')}
          >
            Sign Up
          </button>
        </div>

        <div className="auth-card-body">
          <div className="auth-header">
            <h2>{mode === 'login' ? 'Welcome Back!' : 'Create Your Account'}</h2>
            <p>
              {mode === 'login'
                ? 'Enter your email and password to access your dashboard'
                : 'Sign up with your email and password to get started'}
            </p>
          </div>

          {/* Error Message Alert */}
          {displayError && (
            <div className="alert alert-error">
              <AlertCircle size={18} className="alert-icon" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="label-with-hint">
                <label className="form-label" htmlFor="password">Password</label>
                {mode === 'signup' && <span className="label-hint">Min 6 characters</span>}
              </div>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder={mode === 'signup' ? 'Enter a password (min 6 chars)' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-block submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  <span>{mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Sign Up'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Switch Footer */}
          <div className="auth-footer-note">
            {mode === 'login' ? (
              <p>
                Don't have an account yet?{' '}
                <button 
                  type="button" 
                  className="link-btn" 
                  onClick={() => handleTabChange('signup')}
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button 
                  type="button" 
                  className="link-btn" 
                  onClick={() => handleTabChange('login')}
                >
                  Log in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
