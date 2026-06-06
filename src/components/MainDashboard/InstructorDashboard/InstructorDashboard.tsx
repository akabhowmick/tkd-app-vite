import { useState, useEffect } from "react";
import { Search, Bell, ChevronDown, LogOut, ChevronRight, Menu } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { InstructorSidebar } from "./InstructorSidebar";
import { ViewErrorBoundary } from "../../ui/ViewErrorBoundary";
import { useAuth } from "../../../context/AuthContext";

const VIEW_TITLES: Record<string, string> = {
  home: "Dashboard",
  attendance: "Take Attendance",
  students: "Students",
  announcements: "Announcements",
  belts: "Belt Tracking",
  renewals: "Renewal Management",
};

const INSTRUCTOR_BASE = "/dashboard/instructor";

export const InstructorDashboard = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const relative = location.pathname.startsWith(INSTRUCTOR_BASE)
    ? location.pathname.slice(INSTRUCTOR_BASE.length).replace(/^\//, "")
    : "";
  const viewKey = relative.split("/")[0] || "home";
  const currentTitle = VIEW_TITLES[viewKey] ?? VIEW_TITLES["home"];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-primary focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      <InstructorSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-gray-200 shrink-0 z-20 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-full max-w-72">
              <Search size={16} className="text-gray-500 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                aria-label="Search"
                className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-500 w-full min-w-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Open user menu"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
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
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
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
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
            <Link to={INSTRUCTOR_BASE} className="hover:text-gray-800 transition-colors">
              Dashboard
            </Link>
            {viewKey !== "home" && (
              <>
                <ChevronRight size={14} className="text-gray-400" />
                <span className="text-gray-800 font-medium">{currentTitle}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">{currentTitle}</h1>
        </div>

        <main id="main-content" className="flex-1 overflow-y-auto p-6">
          <ViewErrorBoundary viewName={currentTitle}>
            <Outlet />
          </ViewErrorBoundary>
        </main>
      </div>
    </div>
  );
};
