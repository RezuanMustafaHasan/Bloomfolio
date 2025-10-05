import React, { useState } from 'react';
import './Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TopNavbar = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white custom-navbar shadow-sm fixed-top">
      <div className="container-fluid">
        <a className="navbar-brand brand-logo" href="#">
          <span className="brand-text">Robinhood</span>
        </a>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          onClick={toggleNav}
          aria-controls="navbarNav" 
          aria-expanded={isNavOpen} 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link nav-item" to="/Dashboard">Dashboard</Link>
            </li>
            
          </ul>
          
          <form className="d-flex me-3">
            <input
              className="form-control search-input"
              type="search"
              placeholder="Search"
              aria-label="Search"
            />
          </form>
          
          <ul className="navbar-nav">
            {!isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link nav-item" to="/signup">Sign Up</Link>
                </li>
                <li className="nav-item">
                  <button className="btn btn-success login-btn" onClick={() => navigate('/login')}>
                    Log In
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <button className="btn btn-success login-btn" onClick={logout}>
                  Log Out
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;