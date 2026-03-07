import React, { createContext, useState, useContext, useEffect } from 'react';
import API_URL from "../apiConfig";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('bijli_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('bijli_user', JSON.stringify(data.user));
      localStorage.setItem('bijli_token', data.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!response.ok) throw new Error('Registration failed');

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('bijli_user', JSON.stringify(data.user));
      localStorage.setItem('bijli_token', data.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bijli_user');
    localStorage.removeItem('bijli_token');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'SuperAdmin',
    isAdmin: user?.role === 'Admin',
    isStationOwner: user?.role === 'StationOwner',
    isRider: user?.role === 'Rider'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
