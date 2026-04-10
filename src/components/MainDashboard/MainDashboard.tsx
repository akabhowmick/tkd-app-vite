import { useState } from "react";
import { Search, Bell, ChevronDown, LogOut, User } from "lucide-react";
import { Sidebar } from "./SideBar";
import { StatCards } from "./StatCard/StatCards";
import { SchoolManagement } from "../AccountDashboards/AdminFeatures/SchoolManagement/SchoolManagement";
import { StudentRenewalsPage } from "../AccountDashboards/AdminFeatures/StudentRenewals/StudentRenewalsPage";
import { StudentListPage } from "../AccountDashboards/AdminFeatures/StudentView/StudentListPage";
import { TakeAttendance } from "../AccountDashboards/AdminFeatures/AttendanceRecords/TakeAttendance";
import { ClassSchedulingPage } from "../../pages/ClassSchedulingPage";
import { BeltTrackingPage } from "../../pages/BeltTrackingPage";
import { InventoryPage } from "../../pages/InventoryPage";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const VIEW_COMPONENTS = {
  school: SchoolManagement,
  renewals: StudentRenewalsPage,
  students: StudentListPage,
  attendance: TakeAttendance,
  classes: ClassSchedulingPage,
  belts: BeltTrackingPage,
  inventory: InventoryPage,
} as const;

const VIEW_TITLES: Record<string, string> = {
  home: "Dashboard",
  school: "School Profile",
  renewals: "Renewal Management",
  students: "Students",
  attendance: "Take Attendance",
  classes: "Class Scheduling",
  belts: "Belt Tracking",
  inventory: "Inventory Management",
  reporting: "Reporting",
  settings: "Settings",
};

export const MainDashboard = () => {
  const [activeView, setActiveView] = useState(
    () => sessionStorage.getItem("activeView") ?? "home",
  );
  const handleViewChange = (view: string) => {
    setActiveView(view);
    sessionStorage.setItem("activeView", view);
  };
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const renderContent = () => {
    if (activeView === "home") return <StatCards onViewChange={handleViewChange} />;
    const Component = VIEW_COMPONENTS[activeView as keyof typeof VIEW_COMPONENTS];
    return Component ? (
      <Component />
    ) : (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        This section is coming soon.
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar setActive={handleViewChange} activeView={activeView} />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Fixed top header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shrink-0 z-20">
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-72">
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-500 w-full"
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Bell */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                  {user?.name?.charAt(0) || "A"}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.name || "Admin"}
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
                      <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <User size={14} /> My Account
                      </button>
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

        {/* Page hero title bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <span>Dashboard</span>
            {activeView !== "home" && (
              <>
                <span>/</span>
                <span className="text-gray-600">{VIEW_TITLES[activeView]}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">
            {VIEW_TITLES[activeView] || "Dashboard"}
          </h1>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">{renderContent()}</main>
      </div>
    </div>
  );
};
