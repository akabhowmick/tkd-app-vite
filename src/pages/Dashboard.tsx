// import AdminDashboard from "../components/AccountDashboards/AdminDashboard";
// import InstructorDashboard from "../components/AccountDashboards/OtherUserDashboards/InstructorDashboard";
// import ParentDashboard from "../components/AccountDashboards/OtherUserDashboards/ParentDashboard";
// import StudentDashboard from "../components/AccountDashboards/OtherUserDashboards/StudentDashboard";

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
            <MainDashboard />;
          </StudentRenewalsProvider>
        </SchoolProvider>
      );
    // TODO implement in the future
    // case UserRole.Instructor:
    //   return <InstructorDashboard />;
    // case UserRole.Parent:
    //   return <ParentDashboard />;
    // case UserRole.Student:
    //   return <StudentDashboard />;
    default:
      return <Profile />;
    // return <div>Invalid user role</div>;
  }
};

export default Dashboard;
