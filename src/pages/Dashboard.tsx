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
import { InstructorDashboard } from "../components/MainDashboard/InstructorDashboard/InstructorDashboard";
import { PortalShell, PortalView } from "../components/Portal/PortalShell";
import { StudentPortal } from "../components/Portal/StudentPortal";
import { ParentPortal } from "../components/Portal/ParentPortal";
import { RenewalStatus } from "../components/Portal/RenewalStatus";
import { BeltHistory } from "../components/Portal/BeltHistory";
import { AnnouncementsPage } from "./AnnouncementsPage";

// Shared provider stack for all roles that need school + announcements data
const SchoolAnnouncementWrapper = ({ children }: { children: React.ReactNode }) => (
  <SchoolProvider>
    <AnnouncementProvider>{children}</AnnouncementProvider>
  </SchoolProvider>
);

// Full provider stack for instructors (needs renewals, attendance, belts)
const InstructorWrapper = ({ children }: { children: React.ReactNode }) => (
  <SchoolProvider>
    <ProgramProvider>
      <StudentRenewalsProvider>
        <AttendanceProvider>
          <BeltProvider>
            <AnnouncementProvider>{children}</AnnouncementProvider>
          </BeltProvider>
        </AttendanceProvider>
      </StudentRenewalsProvider>
    </ProgramProvider>
  </SchoolProvider>
);

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case UserRole.Admin:
      return (
        <SchoolProvider>
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

    case UserRole.Instructor:
      return (
        <InstructorWrapper>
          <InstructorDashboard />
        </InstructorWrapper>
      );

    case UserRole.Student:
      return (
        <SchoolAnnouncementWrapper>
          <PortalShell portalLabel="Student Portal">
            {(activeView: PortalView, _setActiveView) => {
              if (activeView === "home" || activeView === "attendance") {
                return <StudentPortal />;
              }
              if (activeView === "announcements") return <AnnouncementsPage />;
              if (activeView === "renewal") return <RenewalStatus studentId={user.id ?? ""} />;
              if (activeView === "belts") return <BeltHistory studentId={user.id ?? ""} />;
              return null;
            }}
          </PortalShell>
        </SchoolAnnouncementWrapper>
      );

    case UserRole.Parent:
      return (
        <SchoolAnnouncementWrapper>
          <PortalShell portalLabel="Parent Portal">
            {(activeView: PortalView) => {
              if (activeView === "home" || activeView === "announcements") {
                return <ParentPortal />;
              }
              return <ParentPortal />;
            }}
          </PortalShell>
        </SchoolAnnouncementWrapper>
      );

    default:
      return <Profile />;
  }
};

export default Dashboard;
