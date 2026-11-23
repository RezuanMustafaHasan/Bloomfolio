import React, { createContext, useContext, useEffect, useState } from 'react';
import { verify, logout as logoutApi } from '../services/adminAuth';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  const checkAuth = async () => {
    try {
      const res = await verify();
      if (res?.status) {
        setIsAuthenticated(true);
        setUser(res?.user || null);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (_) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = () => setIsAuthenticated(true);
  const logout = async () => {
    try { await logoutApi(); } catch (_) {}
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout, checkAuth, ready, user }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);