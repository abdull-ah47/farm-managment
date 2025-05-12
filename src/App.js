import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AddMilkData from './components/AddMilkData';
import ViewDailyData from './components/ViewDailyData';
import GenerateReport from './components/GenerateReport';
import Navbar from './components/Navbar';
import './styles/App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth(); 
  
  if (loading) {
    return <div>Loading...</div>; 
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

const PublicRoute = ({ children }) => {
  return (
    <div className="app-container">
      {children}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/add-milk" element={
            <PrivateRoute>
              <AddMilkData />
            </PrivateRoute>
          } />
          <Route path="/view-daily" element={
            <PrivateRoute>
              <ViewDailyData />
            </PrivateRoute>
          } />
          <Route path="/generate-report" element={
            <PrivateRoute>
              <GenerateReport />
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;