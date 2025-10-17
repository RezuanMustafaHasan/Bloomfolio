import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

const AdminNavbar = () => {
  const { isAuthenticated, logout } = useAdminAuth();
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/admin">Bloomfolio Admin</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNavbar"
          aria-controls="adminNavbar" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="adminNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {isAuthenticated && (
              <>
                <li className="nav-item"><Link className="nav-link" to="/admin">Dashboard</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/admin/users">Users</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/admin/requests">Requests</Link></li>
              </>
            )}
          </ul>
          <div className="d-flex">
            {isAuthenticated ? (
              <button className="btn btn-outline-secondary" onClick={doLogout}>Logout</button>
            ) : (
              <Link className="btn btn-primary" to="/admin/login">Login</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;