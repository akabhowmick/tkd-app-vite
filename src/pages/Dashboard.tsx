import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/user";

const Dashboard = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  switch (user?.role) {
    case UserRole.Admin:
      return <Navigate to="/dashboard/admin" replace />;
    case UserRole.Instructor:
      return <Navigate to="/dashboard/instructor" replace />;
    case UserRole.Student:
      return <Navigate to="/dashboard/student" replace />;
    case UserRole.Parent:
      return <Navigate to="/dashboard/parent" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default Dashboard;
