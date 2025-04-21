import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard" onClick={handleLinkClick}>
          <img src="/chinar.png" alt="Farm Management Logo" className="logo" />
          <span className="brand-text">Farm Management</span>
        </Link>
      </div>
      
      <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
        {isMenuOpen ? '✕' : '☰'}
      </button>
      
      <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
        <Link 
          to="/dashboard" 
          onClick={handleLinkClick}
          className={location.pathname === '/dashboard' ? 'active' : ''}
        >
          Dashboard
        </Link>
        <Link 
          to="/add-milk" 
          onClick={handleLinkClick}
          className={location.pathname === '/add-milk' ? 'active' : ''}
        >
          Add Milk Data
        </Link>
        <Link 
          to="/view-daily" 
          onClick={handleLinkClick}
          className={location.pathname === '/view-daily' ? 'active' : ''}
        >
          View Daily Data
        </Link>
        <Link 
          to="/generate-report" 
          onClick={handleLinkClick}
          className={location.pathname === '/generate-report' ? 'active' : ''}
        >
          Generate Report
        </Link>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar; 