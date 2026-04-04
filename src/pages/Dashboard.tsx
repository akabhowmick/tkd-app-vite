import { MainDashboard } from "../components/MainDashboard/MainDashboard";
import { useAuth } from "../context/AuthContext";
import { SchoolProvider } from "../context/SchoolContext";
import { StudentRenewalsProvider } from "../context/StudentRenewalContext";
import { AttendanceProvider } from "../context/AttendanceContext";
import { ClassProvider } from "../context/ClassContext";
import { BeltProvider } from "../context/BeltContext";
import { InventoryProvider } from "../context/InventoryContext";
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
              <ClassProvider>
                <BeltProvider>
                  <InventoryProvider>
                    <MainDashboard />
                  </InventoryProvider>
                </BeltProvider>
              </ClassProvider>
            </AttendanceProvider>
          </StudentRenewalsProvider>
        </SchoolProvider>
      );
    default:
      return <Profile />;
  }
};

export default Dashboard;
