import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Farm Management</h2>
      </div>
      <div className="sidebar-links">
        <Link to="/dashboard" className="sidebar-link">
          <span>📊</span>
          <span>Dashboard</span>
        </Link>
        <Link to="/add-milk" className="sidebar-link">
          <span>🥛</span>
          <span>Add Milk Data</span>
        </Link>
        <Link to="/view-daily" className="sidebar-link">
          <span>📅</span>
          <span>View Daily Data</span>
        </Link>
        <Link to="/generate-report" className="sidebar-link">
          <span>📋</span>
          <span>Generate Report</span>
        </Link>
      </div>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 