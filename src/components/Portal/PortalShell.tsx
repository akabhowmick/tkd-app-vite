import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Search, Bell, ChevronDown, LogOut, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ViewErrorBoundary } from "../ui/ViewErrorBoundary";

export interface PortalNavItem {
  icon: React.ElementType;
  label: string;
  path: string; // relative path from basePath ('' for home/index)
}

interface Props {
  basePath: string;
  portalLabel: string;
  navItems: PortalNavItem[];
}

export const PortalShell = ({ basePath, portalLabel, navItems }: Props) => {
  const [collapsed, setCollapsed] = useState(false);
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

  const relative = location.pathname.startsWith(basePath)
    ? location.pathname.slice(basePath.length).replace(/^\//, "")
    : "";
  const firstSegment = relative.split("/")[0] || "";
  const currentNavItem = navItems.find((n) => n.path === firstSegment) ?? navItems[0];
  const currentTitle = currentNavItem?.label ?? "Home";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-primary focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col h-screen bg-gray-900 text-gray-200 border-r border-gray-800 transition-[width,transform] duration-300 ease-in-out flex-shrink-0
          md:relative md:z-auto md:translate-x-0
          w-64 md:${collapsed ? "w-16" : "w-64"}
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        aria-label="Portal navigation"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          {!collapsed && (
            <span className="text-white font-bold font-heading text-lg tracking-wide">
              TaeKwonTrack
            </span>
          )}
          {collapsed && <span className="text-primary font-bold text-xl mx-auto">T</span>}
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-5 z-10 hidden md:flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600 shadow"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {!collapsed && (
          <div className="px-4 py-2 border-b border-gray-800">
            <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
              {portalLabel}
            </span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1" aria-label={`${portalLabel} navigation`}>
          {navItems.map((item) => (
            <div key={item.path} className="relative group">
              <NavLink
                to={item.path ? `${basePath}/${item.path}` : basePath}
                end={!item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gray-800 text-white"
                      : "text-gray-200 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
              {collapsed && (
                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow group-hover:opacity-100 whitespace-nowrap z-50">
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      </aside>

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
                  {user?.name?.charAt(0) || "?"}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.name}
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
            <Link to={basePath} className="hover:text-gray-800 transition-colors">
              Dashboard
            </Link>
            {currentNavItem?.path && (
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
