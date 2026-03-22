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
    const stored = sessionStorage.getItem('bijli_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // ✅ FIXED - Return actual error from backend
        return { success: false, error: data.error || 'Login failed' };
      }

      setUser(data.user);
      sessionStorage.setItem('bijli_user', JSON.stringify(data.user));
      sessionStorage.setItem('bijli_token', data.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        // ✅ FIXED - Return actual error from backend
        return { success: false, error: data.error || 'Registration failed' };
      }

      setUser(data.user);
      sessionStorage.setItem('bijli_user', JSON.stringify(data.user));
      sessionStorage.setItem('bijli_token', data.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('bijli_user');
    sessionStorage.removeItem('bijli_token');
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