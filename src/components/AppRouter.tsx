import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Megaphone,
  CalendarCheck,
  DollarSign,
  Award,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAnalyticsPageTracking } from "../analytics/useAnalyticsPageTracking";
import { UserRole } from "../types/user";

// Providers
import { SchoolProvider } from "../context/SchoolContext";
import { StudentRenewalsProvider } from "../context/StudentRenewalContext";
import { AttendanceProvider } from "../context/AttendanceContext";
import { ClassProvider } from "../context/ClassContext";
import { BeltProvider } from "../context/BeltContext";
import { InventoryProvider } from "../context/InventoryContext";
import { ProgramProvider } from "../context/ProgramContext";
import { AnnouncementProvider } from "../context/AnnouncementContext";

// Layout components
import { MainDashboard } from "./MainDashboard/MainDashboard";
import { InstructorDashboard } from "./MainDashboard/InstructorDashboard/InstructorDashboard";
import { PortalShell, PortalNavItem } from "./Portal/PortalShell";

// Admin view components
import { StatCards } from "./MainDashboard/StatCard/StatCards";
import { TakeAttendance } from "./AccountDashboards/AdminFeatures/AttendanceRecords/TakeAttendance";
import { StudentRenewalsPage } from "./AccountDashboards/AdminFeatures/StudentRenewals/StudentRenewalsPage";
import { CreateRenewalPage } from "./AccountDashboards/AdminFeatures/StudentRenewals/CreateRenewalPage";
import { StudentListPage } from "./AccountDashboards/AdminFeatures/StudentView/StudentListPage";
import { StudentProfilePage } from "./AccountDashboards/AdminFeatures/StudentView/StudentProfilePage";
import { SchoolManagement } from "./AccountDashboards/AdminFeatures/SchoolManagement/SchoolManagement";
import { ClassSchedulingPage } from "../pages/ClassSchedulingPage";
import { BeltTrackingPage } from "../pages/BeltTrackingPage";
import { InventoryPage } from "../pages/InventoryPage";
import SalesTrackingPage from "./MainDashboard/Sales/SalesTrackingPage";
import { ReportingPage } from "../pages/ReportingPage";
import { ProfilePage } from "./MainDashboard/UserProfile/ProfilePage";
import { SettingsPage } from "./MainDashboard/UserProfile/SettingsPage";
import { NotificationSettings } from "./MainDashboard/NotificationSettings/NotificationSettings";
import { AnnouncementsPage } from "../pages/AnnouncementsPage";

// Instructor view components
import { InstructorHome } from "./MainDashboard/InstructorDashboard/InstructorHome";

// Student / Parent portal components
import { StudentPortal } from "./Portal/StudentPortal";
import { ParentPortal } from "./Portal/ParentPortal";
import { RenewalStatus } from "./Portal/RenewalStatus";
import { BeltHistory } from "./Portal/BeltHistory";

// Public pages
import Login from "../pages/Login";
import SignUp from "../pages/Signup";
import { Header } from "./Header";
import { Footer } from "./Footer";
import Dashboard from "../pages/Dashboard";
import FaqPage from "../pages/Faq";
import PricingPage from "../pages/Pricing";
import AboutPage from "../pages/About";
import AuthCallback from "../pages/AuthCallback";
import ResetPassword from "../pages/ResetPassword";
import Home from "../pages/Home";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import TermsOfService from "../pages/TermsOfService";

// ─── Provider stacks ────────────────────────────────────────────────────────

const AdminProviders = ({ children }: { children: React.ReactNode }) => (
  <SchoolProvider>
    <ProgramProvider>
      <StudentRenewalsProvider>
        <AttendanceProvider>
          <ClassProvider>
            <BeltProvider>
              <InventoryProvider>
                <AnnouncementProvider>{children}</AnnouncementProvider>
              </InventoryProvider>
            </BeltProvider>
          </ClassProvider>
        </AttendanceProvider>
      </StudentRenewalsProvider>
    </ProgramProvider>
  </SchoolProvider>
);

const InstructorProviders = ({ children }: { children: React.ReactNode }) => (
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

const SchoolAnnouncementProviders = ({ children }: { children: React.ReactNode }) => (
  <SchoolProvider>
    <AnnouncementProvider>{children}</AnnouncementProvider>
  </SchoolProvider>
);

// ─── Role guard ─────────────────────────────────────────────────────────────

const RoleRoute: React.FC<{ role: UserRole; children: React.ReactNode }> = ({
  role,
  children,
}) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// ─── Portal route helpers (need user.id from context) ───────────────────────

const StudentRenewalRoute = () => {
  const { user } = useAuth();
  return <RenewalStatus studentId={user?.id ?? ""} />;
};

const StudentBeltRoute = () => {
  const { user } = useAuth();
  return <BeltHistory studentId={user?.id ?? ""} />;
};

// ─── Portal nav item definitions ────────────────────────────────────────────

const STUDENT_NAV_ITEMS: PortalNavItem[] = [
  { icon: LayoutDashboard, label: "Home", path: "" },
  { icon: Megaphone, label: "Announcements", path: "announcements" },
  { icon: CalendarCheck, label: "Attendance", path: "attendance" },
  { icon: DollarSign, label: "Membership", path: "renewal" },
  { icon: Award, label: "Belt History", path: "belts" },
];

const PARENT_NAV_ITEMS: PortalNavItem[] = [
  { icon: LayoutDashboard, label: "Home", path: "" },
  { icon: Megaphone, label: "Announcements", path: "announcements" },
];

// ─── 404 ────────────────────────────────────────────────────────────────────

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

// ─── App content ────────────────────────────────────────────────────────────

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  useAnalyticsPageTracking();
  const isDashboard = location.pathname.startsWith("/dashboard");

  const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (loading) return null;
    return user ? <>{children}</> : <Navigate to="/login" replace />;
  };

  return (
    <>
      {!isDashboard && <Header />}
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── /dashboard → redirect to role-specific prefix ── */}
        <Route
          path="/dashboard"
          element={<PrivateRoute><Dashboard /></PrivateRoute>}
        />

        {/* ── Admin dashboard ── */}
        <Route
          path="/dashboard/admin"
          element={
            <RoleRoute role={UserRole.Admin}>
              <AdminProviders>
                <MainDashboard />
              </AdminProviders>
            </RoleRoute>
          }
        >
          <Route index element={<StatCards />} />
          <Route path="attendance" element={<TakeAttendance />} />
          <Route path="renewals" element={<StudentRenewalsPage />} />
          <Route path="renewals/new" element={<CreateRenewalPage />} />
          <Route path="students" element={<StudentListPage />} />
          <Route path="students/:studentId" element={<StudentProfilePage />} />
          <Route path="school" element={<SchoolManagement />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="classes" element={<ClassSchedulingPage />} />
          <Route path="belts" element={<BeltTrackingPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="sales" element={<SalesTrackingPage />} />
          <Route path="reporting" element={<ReportingPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="notifications" element={<NotificationSettings />} />
        </Route>

        {/* ── Instructor dashboard ── */}
        <Route
          path="/dashboard/instructor"
          element={
            <RoleRoute role={UserRole.Instructor}>
              <InstructorProviders>
                <InstructorDashboard />
              </InstructorProviders>
            </RoleRoute>
          }
        >
          <Route index element={<InstructorHome />} />
          <Route path="attendance" element={<TakeAttendance />} />
          <Route path="students" element={<StudentListPage />} />
          <Route path="students/:studentId" element={<StudentProfilePage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="belts" element={<BeltTrackingPage />} />
          <Route path="renewals" element={<StudentRenewalsPage />} />
          <Route path="renewals/new" element={<CreateRenewalPage />} />
        </Route>

        {/* ── Student portal ── */}
        <Route
          path="/dashboard/student"
          element={
            <RoleRoute role={UserRole.Student}>
              <SchoolAnnouncementProviders>
                <PortalShell
                  basePath="/dashboard/student"
                  portalLabel="Student Portal"
                  navItems={STUDENT_NAV_ITEMS}
                />
              </SchoolAnnouncementProviders>
            </RoleRoute>
          }
        >
          <Route index element={<StudentPortal />} />
          <Route path="attendance" element={<StudentPortal />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="renewal" element={<StudentRenewalRoute />} />
          <Route path="belts" element={<StudentBeltRoute />} />
        </Route>

        {/* ── Parent portal ── */}
        <Route
          path="/dashboard/parent"
          element={
            <RoleRoute role={UserRole.Parent}>
              <SchoolAnnouncementProviders>
                <PortalShell
                  basePath="/dashboard/parent"
                  portalLabel="Parent Portal"
                  navItems={PARENT_NAV_ITEMS}
                />
              </SchoolAnnouncementProviders>
            </RoleRoute>
          }
        >
          <Route index element={<ParentPortal />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
        </Route>

        {/* ── 404 — must be last ── */}
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
