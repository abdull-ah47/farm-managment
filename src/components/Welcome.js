import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Welcome.css';

const Welcome = ({ user }) => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/dashboard/add-milk');
  };

  return (
    <div className="welcome-container">
      <div className="welcome-header">
        <img src="/logo.png" alt="Milk Management Logo" className="logo" />
      </div>
      <div className="welcome-content">
        <h1>Welcome to the World of Modern Farming, {user?.email.split('@')[0]}!</h1>
        <p>Manage your milk collection and reports efficiently with our modern solution.</p>
        <button onClick={handleGetStarted} className="get-started-button">
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Welcome;