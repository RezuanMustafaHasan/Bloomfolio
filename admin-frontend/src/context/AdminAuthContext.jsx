import React, { createContext, useContext, useEffect, useState } from 'react';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = () => {
    try {
      const hasToken = typeof document !== 'undefined' && document.cookie.includes('admin_token=');
      setIsAuthenticated(hasToken);
    } catch (_) {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = () => setIsAuthenticated(true);
  const logout = () => {
    try { document.cookie = 'admin_token=; Max-Age=0; path=/;'; } catch (_) {}
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout, checkAuth }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);