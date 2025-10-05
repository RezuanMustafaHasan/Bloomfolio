import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = () => {
    try {
      const hasToken = typeof document !== 'undefined' && document.cookie.includes('token=');
      setIsAuthenticated(hasToken);
    } catch (_) {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Remove token cookie (httpOnly is false per backend)
    try {
      document.cookie = 'token=; Max-Age=0; path=/;';
    } catch (_) {}
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);