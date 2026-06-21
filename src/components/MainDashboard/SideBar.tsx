import { useState } from "react";
import { track } from "../../analytics/posthog";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  DollarSign,
  Users,
  CalendarCheck,
  School,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Settings,
  Calendar,
  Award,
  Package,
  Bell,
  Megaphone,
  UserCog,
} from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  view: string;
  children?: { label: string; view: string }[];
}

const NAV_SECTIONS: { heading: string | null; items: NavItem[] }[] = [
  {
    heading: null,
    items: [{ icon: LayoutDashboard, label: "Dashboard", view: "home" }],
  },
  {
    heading: "ATTENDANCE",
    items: [{ icon: CalendarCheck, label: "Take Attendance", view: "attendance" }],
  },
  {
    heading: "MANAGEMENT",
    items: [
      { icon: DollarSign, label: "Renewals", view: "renewals" },
      { icon: Users, label: "Students", view: "students" },
      { icon: UserCog, label: "Instructors", view: "instructors" },
      { icon: School, label: "School Profile", view: "school" },
      { icon: Megaphone, label: "Announcements", view: "announcements" },
    ],
  },
  {
    heading: "PROGRAMS",
    items: [
      { icon: Calendar, label: "Class Scheduling", view: "classes" },
      { icon: Award, label: "Belt Tracking", view: "belts" },
      { icon: Package, label: "Inventory", view: "inventory" },
    ],
  },
  {
    heading: "REPORTING",
    items: [{ icon: BarChart2, label: "Overview", view: "reporting" }],
  },
  {
    heading: "SETTINGS",
    items: [
      { icon: Settings, label: "Settings", view: "settings" },
      { icon: Bell, label: "Notifications", view: "notifications" },
    ],
  },
];

const toPath = (view: string) =>
  view === "home" ? "/dashboard/admin" : `/dashboard/admin/${view}`;

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar = ({ mobileOpen = false, onMobileClose }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col h-screen bg-gray-900 text-gray-200 border-r border-gray-800 transition-[width,transform] duration-300 ease-in-out flex-shrink-0
          md:relative md:z-auto md:translate-x-0
          w-64 md:${collapsed ? "w-16" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        aria-label="Main navigation"
      >
        {/* Logo */}
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
          onClick={() => setCollapsed((c) => { track("sidebar_collapsed", { collapsed: !c }); return !c; })}
          className="absolute -right-3 top-5 z-10 hidden md:flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600 shadow"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1" aria-label="Admin navigation">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si}>
              {section.heading && !collapsed && (
                <p className="px-3 pt-4 pb-1 text-xs font-semibold tracking-widest text-gray-500 uppercase">
                  {section.heading}
                </p>
              )}
              {section.heading && collapsed && <div className="my-2 mx-3 border-t border-gray-700" />}

              {section.items.map((item) => {
                const isOpen = openSubmenus[item.label];

                return (
                  <div key={item.view}>
                    <div className="relative group">
                      {item.children ? (
                        <button
                          onClick={() => toggleSubmenu(item.label)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors text-gray-200 hover:bg-gray-800 hover:text-white"
                        >
                          <item.icon size={18} className="shrink-0" />
                          {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                        </button>
                      ) : (
                        <NavLink
                          to={toPath(item.view)}
                          end={item.view === "home"}
                          onClick={onMobileClose}
                          className={({ isActive }) =>
                            `flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                              isActive
                                ? "bg-gray-800 text-white"
                                : "text-gray-200 hover:bg-gray-800 hover:text-white"
                            }`
                          }
                        >
                          <item.icon size={18} className="shrink-0" />
                          {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                        </NavLink>
                      )}

                      {collapsed && (
                        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow group-hover:opacity-100 whitespace-nowrap z-50">
                          {item.label}
                        </span>
                      )}
                    </div>

                    {item.children && isOpen && !collapsed && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.view}
                            to={toPath(child.view)}
                            onClick={onMobileClose}
                            className={({ isActive }) =>
                              `block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                isActive
                                  ? "text-primary font-medium"
                                  : "text-gray-300 hover:text-white hover:bg-gray-800"
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};
