import { useState } from "react";
import { Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { InstructorSidebar, InstructorView } from "./InstructorSidebar";
import { InstructorHome } from "./InstructorHome";
import { TakeAttendance } from "../../AccountDashboards/AdminFeatures/AttendanceRecords/TakeAttendance";
import { StudentListPage } from "../../AccountDashboards/AdminFeatures/StudentView/StudentListPage";
import { AnnouncementsPage } from "../../../pages/AnnouncementsPage";
import { BeltTrackingPage } from "../../../pages/BeltTrackingPage";
import { StudentRenewalsPage } from "../../AccountDashboards/AdminFeatures/StudentRenewals/StudentRenewalsPage";
import { ViewErrorBoundary } from "../../ui/ViewErrorBoundary";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const VIEW_TITLES: Record<InstructorView, string> = {
  home: "Dashboard",
  attendance: "Take Attendance",
  students: "Students",
  announcements: "Announcements",
  belts: "Belt Tracking",
  renewals: "Renewal Management",
};

export const InstructorDashboard = () => {
  const [activeView, setActiveView] = useState<InstructorView>("home");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const renderContent = () => {
    if (activeView === "home") {
      return <InstructorHome onViewChange={(v) => setActiveView(v as InstructorView)} />;
    }
    const views: Partial<Record<InstructorView, React.ReactNode>> = {
      attendance: <TakeAttendance />,
      students: <StudentListPage />,
      announcements: <AnnouncementsPage />,
      belts: <BeltTrackingPage />,
      renewals: <StudentRenewalsPage />,
    };
    return (
      <ViewErrorBoundary viewName={VIEW_TITLES[activeView]}>
        {views[activeView] ?? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Coming soon.
          </div>
        )}
      </ViewErrorBoundary>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <InstructorSidebar setActive={setActiveView} activeView={activeView} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shrink-0 z-20">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-72">
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-500 w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <Bell size={18} />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                  {user?.name?.charAt(0) || "I"}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.name || "Instructor"}
                </span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={14} /> Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <span>Dashboard</span>
            {activeView !== "home" && (
              <>
                <span>/</span>
                <span>{VIEW_TITLES[activeView]}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">
            {VIEW_TITLES[activeView]}
          </h1>
        </div>

        <main className="flex-1 overflow-y-auto p-6">{renderContent()}</main>
      </div>
    </div>
  );
};
