import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Home from "../pages/Home";
import Login from "../pages/Login";
import SignUp from "../pages/Signup";
import { Header } from "./Header";
import { Footer } from "./Footer";
import Dashboard from "../pages/Dashboard";
import { TakeAttendance } from "./AccountDashboards/AdminFeatures/AttendanceRecords/TakeAttendance";
import { StudentListPage } from "./AccountDashboards/AdminFeatures/StudentView/StudentListPage";
import { SchoolManagement } from "./AccountDashboards/AdminFeatures/SchoolManagement/SchoolManagement";
import FaqPage from "../pages/Faq";
import PricingPage from "../pages/Pricing";
import AboutPage from "../pages/About";

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return user ? <>{children}</> : <Navigate to="/login" replace />;
  };

  return (
    <>
      {!isDashboard && <Header />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/admin/take-attendance"
          element={
            <PrivateRoute>
              <TakeAttendance />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/admin/students"
          element={
            <PrivateRoute>
              <StudentListPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/admin/school"
          element={
            <PrivateRoute>
              <SchoolManagement />
            </PrivateRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={<div className="p-12 text-center text-gray-500">Page not found.</div>}
        />
      </Routes>
      {!isDashboard && <Footer />}
    </>
  );
};

// Outer component — just provides the Router context
const AppRouter: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default AppRouter;
