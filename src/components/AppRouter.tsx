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
import AuthCallback from "../pages/AuthCallback";
import ResetPassword from "../pages/ResetPassword";

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
    <h1 className="text-2xl font-semibold text-gray-700 mb-2">Page not found</h1>
    <p className="text-gray-500 mb-6">That page doesn't exist or may have moved.</p>
    <a
      href="/"
      className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
    >
      Back to Home
    </a>
  </div>
);

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Navigate (not NavLink) properly redirects unauthenticated users
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
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />

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

        {/* 404 — must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isDashboard && <Footer />}
    </>
  );
};

const AppRouter: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default AppRouter;
