import { createContext, useContext, useState } from 'react';
import axios from 'axios';

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthRequest) {
      localStorage.removeItem('studymind_user');
      window.location.assign('/login');
    }

    return Promise.reject(error);
  }
);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const item = localStorage.getItem('studymind_user');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  });

  const login = ({ user: nextUser }) => {
    localStorage.setItem('studymind_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('studymind_user');
      setUser(null);
    }
  };

  const updateUser = (nextUser) => {
    if (!nextUser) {
      void logout();
      return;
    }

    localStorage.setItem('studymind_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  return <AuthContext.Provider value={{ user, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
