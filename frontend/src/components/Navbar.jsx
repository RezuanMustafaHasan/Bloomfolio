import React, { useState } from 'react';
import './Navbar.css';
import { Link } from 'react-router-dom';

const TopNavbar = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);

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
            <li className="nav-item">
              <a className="nav-link nav-item" href="#">Account</a>
            </li>
            <li className="nav-item">
              <button className="btn btn-success login-btn">
                Log In
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;