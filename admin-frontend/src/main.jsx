import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import AdminNavbar from './ui/AdminNavbar.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import UsersPage from './pages/UsersPage.jsx';
import AdminRequests from './pages/AdminRequests.jsx';
import AssignStock from './pages/AssignStock.jsx';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext.jsx';

const RequireAdmin = ({ children }) => {
  const { isAuthenticated, checkAuth, ready } = useAdminAuth();
  // Ensure auth is checked on mount
  useEffect(() => { checkAuth && checkAuth(); }, []);
  if (!ready) return <div className="container mt-4">Checking session...</div>;
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminAuthProvider>
      <BrowserRouter>
        <AdminNavbar />
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin/users" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
          <Route path="/admin/requests" element={<RequireAdmin><AdminRequests /></RequireAdmin>} />
          <Route path="/admin/assign-stock" element={<RequireAdmin><AssignStock /></RequireAdmin>} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  </StrictMode>
);