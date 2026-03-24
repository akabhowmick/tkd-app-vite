import { MainDashboard } from "../components/MainDashboard/MainDashboard";
import { useAuth } from "../context/AuthContext";
import { SchoolProvider } from "../context/SchoolContext";
import { StudentRenewalsProvider } from "../context/StudentRenewalContext";
import { UserRole } from "../types/user";
import { Profile } from "../components/AccountDashboards/AdminFeatures/Profile/Profile";

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case UserRole.Admin:
      return (
        <SchoolProvider>
          <StudentRenewalsProvider>
            <MainDashboard />
          </StudentRenewalsProvider>
        </SchoolProvider>
      );
    case UserRole.Instructor:
    case UserRole.Parent:
    case UserRole.Student:
      return <Profile />;
    default:
      return <Profile />;
  }
};

export default Dashboard;
