import React from "react";
import { BrowserRouter as Router, Route, Routes, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Home from "../pages/Home";
import Login from "../pages/Login";
import SignUp from "../pages/Signup";
import { Header } from "./Header";
import Dashboard from "../pages/Dashboard";
import { AddStudentPage } from "../pages/AddStudentPage";
import { TakeAttendance } from "./AccountDashboards/AdminFeatures/AttendanceRecords/TakeAttendance";
import { StudentListPage } from "./AccountDashboards/AdminFeatures/StudentListPage";
import { SchoolManagement } from "./AccountDashboards/AdminFeatures/SchoolManagement/SchoolManagement";

const AppRouter: React.FC = () => {
  const { user } = useAuth();

  const activeClassName = "text-blue-500 font-bold"; // Define active link style

  // Private Route Component
  const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return user ? (
      <>{children}</>
    ) : (
      <NavLink
        to="/login"
        className={({ isActive }) =>
          isActive ? activeClassName : "text-gray-500 hover:text-gray-700"
        }
        replace
      />
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
        <Route
          path="/dashboard/admin/take-attendance"
          element={
            <PrivateRoute>
              <TakeAttendance />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/admin/add-student"
          element={
            <PrivateRoute>
              <AddStudentPage />
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
      </Routes>
    </Router>
  );
};

export default AppRouter;
