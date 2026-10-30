import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('banana_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('banana_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });
        const data = await response.json();

        if (response.ok && data.success) {
          setUser(data.user);
          setToken(storedToken);
        } else {
          // Token expired or invalid
          localStorage.removeItem('banana_token');
          localStorage.removeItem('banana_user');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error('Failed to verify token:', err);
        // Fallback to cached user if network temporarily failed
        const cachedUser = localStorage.getItem('banana_user');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token and user
      localStorage.setItem('banana_token', data.token);
      localStorage.setItem('banana_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Register handler (email, password, role)
  const register = async (email, password, role = 'teacher') => {
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      // Save token and user
      localStorage.setItem('banana_token', data.token);
      localStorage.setItem('banana_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Refresh user profile from server
  const refreshUser = async () => {
    const storedToken = localStorage.getItem('banana_token') || token;
    if (!storedToken) return null;
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('banana_user', JSON.stringify(data.user));
        return data.user;
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
    return null;
  };

  // Update user in state and localStorage
  const updateUser = (fields) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...fields };
      localStorage.setItem('banana_user', JSON.stringify(updated));
      return updated;
    });
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('banana_token');
    localStorage.removeItem('banana_user');
    setUser(null);
    setToken(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authError,
        setAuthError,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

