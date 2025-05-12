import React, { createContext, useState, useContext, useEffect } from 'react';

// API CONFIG
const API_BASE = 'http://localhost:5000/api';
const ENDPOINTS = {
  login: `${API_BASE}/user/login`,
  register: `${API_BASE}/user/register`,
};

// Create context
const AuthContext = createContext();

// Auth Fetch Helper
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { ...options, headers });
  console.log("the response is:",response)
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Request failed');
  }

  return response.json();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const storedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  if (storedUser && token) {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const isExpired = decoded.exp * 1000 < Date.now();
      
      if (isExpired) {
        logout();
      } else {
        
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (err) {
      logout(); 
    }
  }
  setLoading(false);
}, []);

  // LOGIN
  const login = async (email, password) => {
    try {
      const response = await fetch(ENDPOINTS.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    console.log("the response is:",response)
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      const userData = { ...data.user, token: data.token };

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', data.token);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  // REGISTER
  const register = async (name, email, username, password) => {
    try {
      const registerRes = await fetch(ENDPOINTS.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, username, password }),
      });

      if (!registerRes.ok) {
        const errorData = await registerRes.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      // Auto-login after register
      return await login(email, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{ user, login, logout, register, loading, isAdmin, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
