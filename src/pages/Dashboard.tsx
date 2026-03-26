import { MainDashboard } from "../components/MainDashboard/MainDashboard";
import { useAuth } from "../context/AuthContext";
import { SchoolProvider } from "../context/SchoolContext";
import { StudentRenewalsProvider } from "../context/StudentRenewalContext";
import { AttendanceProvider } from "../context/AttendanceContext";
import { UserRole } from "../types/user";
import { Profile } from "../components/AccountDashboards/AdminFeatures/Profile/Profile";

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case UserRole.Admin:
      return (
        <SchoolProvider>
          <StudentRenewalsProvider>
            <AttendanceProvider>
              <MainDashboard />
            </AttendanceProvider>
          </StudentRenewalsProvider>
        </SchoolProvider>
      );
    default:
      return <Profile />;
  }
};

export default Dashboard;
