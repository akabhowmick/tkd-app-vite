// import AdminDashboard from "../components/AccountDashboards/AdminDashboard";
import InstructorDashboard from "../components/AccountDashboards/InstructorDashboard";
import ParentDashboard from "../components/AccountDashboards/ParentDashboard";
import { Profile } from "../components/AccountDashboards/Profile";
import RegularDashboard from "../components/AccountDashboards/RegularDashboard";
import StudentDashboard from "../components/AccountDashboards/StudentDashboard";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/user";

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case UserRole.Admin:
      return <RegularDashboard />;
    case UserRole.Instructor:
      return <InstructorDashboard />;
    case UserRole.Parent:
      return <ParentDashboard />;
    case UserRole.Student:
      return <StudentDashboard />;
    default:
      return <Profile />;
    // return <div>Invalid user role</div>;
  }
};

export default Dashboard;
