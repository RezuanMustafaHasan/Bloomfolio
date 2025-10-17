import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);

  const getCookie = (name) => {
    if (typeof document === 'undefined') return null;
    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  };

  const checkAuth = () => {
    try {
      const token = getCookie('token');

      if (token) {
        let uid = null;
        try {
          const payload = jwtDecode(token);
          uid = payload.id;
        } catch (_) {}
        setUserId(uid);
        setIsAuthenticated(true);
      } else {
        setUserId(null);
        setIsAuthenticated(false);
      }
    } catch (_) {
      setUserId(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = () => {
    // backend sets the token cookie on successful login
    checkAuth();
  };

  const logout = () => {
    try {
      document.cookie = 'token=; Max-Age=0; path=/;';
    } catch (_) {}
    setUserId(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);