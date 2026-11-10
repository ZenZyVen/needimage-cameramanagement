import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('cinevault_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('cinevault_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('cinevault_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('cinevault_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out.');
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('cinevault_token', newToken);
      localStorage.setItem('cinevault_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed.');
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data?.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('cinevault_token', newToken);
      localStorage.setItem('cinevault_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return res.data;
    }
    throw new Error(res.data?.message || 'Registration failed.');
  };

  const logout = () => {
    localStorage.removeItem('cinevault_token');
    localStorage.removeItem('cinevault_user');
    setToken(null);
    setUser(null);
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('cinevault_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'ADMIN',
    isStockController: user?.role === 'STOCK_CONTROLLER',
    isStaff: user?.role === 'ADMIN' || user?.role === 'STOCK_CONTROLLER',
    isUser: user?.role === 'USER',
    login,
    register,
    logout,
    updateUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
