import { MainDashboard } from "../components/MainDashboard/MainDashboard";
import { useAuth } from "../context/AuthContext";
import { SchoolProvider } from "../context/SchoolContext";
import { StudentRenewalsProvider } from "../context/StudentRenewalContext";
import { AttendanceProvider } from "../context/AttendanceContext";
import { ClassProvider } from "../context/ClassContext";
import { BeltProvider } from "../context/BeltContext";
import { InventoryProvider } from "../context/InventoryContext";
import { ProgramProvider } from "../context/ProgramContext";
import { AnnouncementProvider } from "../context/AnnouncementContext";
import { UserRole } from "../types/user";
import { Profile } from "../components/AccountDashboards/AdminFeatures/Profile/Profile";

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case UserRole.Admin:
      return (
        <SchoolProvider>
          {/* ProgramProvider must be inside SchoolProvider (needs schoolId)
              but outside StudentRenewalsProvider (which consumes programs) */}
          <ProgramProvider>
            <StudentRenewalsProvider>
              <AttendanceProvider>
                <ClassProvider>
                  <BeltProvider>
                    <InventoryProvider>
                      <AnnouncementProvider>
                        <MainDashboard />
                      </AnnouncementProvider>
                    </InventoryProvider>
                  </BeltProvider>
                </ClassProvider>
              </AttendanceProvider>
            </StudentRenewalsProvider>
          </ProgramProvider>
        </SchoolProvider>
      );
    default:
      return <Profile />;
  }
};

export default Dashboard;
