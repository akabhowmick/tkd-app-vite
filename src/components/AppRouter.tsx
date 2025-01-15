import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Home from '../pages/Home';
import Login from '../pages/Login';
import SignUp from '../pages/Signup';
import { Dashboard } from './Dashboard';
import { Header } from './Header';



const AppRouter: React.FC = () => {
  const { user } = useAuth();

  // Private Route Component
  const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return user ? (
      <>{children}</>
    ) : (
      <Navigate to="/login" replace />
    );
  };

  return (
    <Router>
      <Header />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;
