import { useState, useEffect } from "react";
import { Search, Bell, ChevronDown, LogOut, User, UserPlus } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./SideBar";
import { useAuth } from "../../context/AuthContext";
import { ViewErrorBoundary } from "../ui/ViewErrorBoundary";
import { CreateUserModal } from "../AccountDashboards/AdminFeatures/UserManagement/CreateUserModal";
import { SearchModal } from "./Search/SearchModal";

const VIEW_TITLES: Record<string, string> = {
  home: "Dashboard",
  school: "School Profile",
  renewals: "Renewal Management",
  students: "Students",
  attendance: "Take Attendance",
  classes: "Class Scheduling",
  belts: "Belt Tracking",
  inventory: "Inventory Management",
  sales: "Sales Tracking",
  reporting: "Reporting",
  profile: "My Profile",
  settings: "Settings",
  notifications: "Notification Settings",
  announcements: "Announcements",
};

const ADMIN_BASE = "/dashboard/admin";

export const MainDashboard = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Derive current view label from URL for breadcrumb/title
  const relative = location.pathname.startsWith(ADMIN_BASE)
    ? location.pathname.slice(ADMIN_BASE.length).replace(/^\//, "")
    : "";
  const viewKey = relative.split("/")[0] || "home";
  const currentTitle = VIEW_TITLES[viewKey] ?? VIEW_TITLES["home"];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shrink-0 z-20">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-72 hover:bg-gray-200 transition-colors text-left"
          >
            <Search size={16} className="text-gray-500 shrink-0" />
            <span className="text-sm text-gray-400 flex-1">Search...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-400 border border-gray-300 rounded bg-white">
              ⌘K
            </kbd>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateUserOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <UserPlus size={14} /> Add User
            </button>
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>

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
                      <button
                        onClick={() => {
                          navigate(`${ADMIN_BASE}/profile`);
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User size={14} /> My Profile
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

        {/* Breadcrumb + title */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <span>Dashboard</span>
            {viewKey !== "home" && (
              <>
                <span>/</span>
                <span className="text-gray-600">{currentTitle}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">{currentTitle}</h1>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <ViewErrorBoundary viewName={currentTitle}>
            <Outlet />
          </ViewErrorBoundary>
        </main>
      </div>

      <CreateUserModal
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
      />

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(view) => navigate(`${ADMIN_BASE}/${view}`)}
      />
    </div>
  );
};
