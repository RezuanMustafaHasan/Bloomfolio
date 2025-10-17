import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const TopNavbar = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const { isAuthenticated, logout, userId } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`http://localhost:8080/users/${userId}`, { withCredentials: true });
        if (!cancelled) setUser(data);
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, userId]);

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
{/*           
          <form className="d-flex me-3">
            <input
              className="form-control search-input"
              type="search"
              placeholder="Search"
              aria-label="Search"
            />
          </form> */}
          
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
              <>
              {/* <li className="nav-item ">
                <Link className="nav-link nav-item" to="/Profile">Purchase Power: {user?.purchasePower || '0'}</Link>
              </li> */}
              <li className="nav-item">
                <Link className="nav-link nav-item" to="/Profile">{user?.name || 'Profile'}</Link>
              </li>
              <li className="nav-item">
                <button className="btn btn-success login-btn" onClick={logout}>
                  Log Out
                </button>
              </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;