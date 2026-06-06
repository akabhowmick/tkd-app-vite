import { useState } from "react";
import { track } from "../../../analytics/posthog";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Megaphone,
  Award,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS: { icon: React.ElementType; label: string; view: string }[] = [
  { icon: LayoutDashboard, label: "Dashboard", view: "home" },
  { icon: CalendarCheck, label: "Take Attendance", view: "attendance" },
  { icon: Users, label: "Students", view: "students" },
  { icon: Megaphone, label: "Announcements", view: "announcements" },
  { icon: Award, label: "Belt Tracking", view: "belts" },
  { icon: DollarSign, label: "Renewals", view: "renewals" },
];

const toPath = (view: string) =>
  view === "home" ? "/dashboard/instructor" : `/dashboard/instructor/${view}`;

interface InstructorSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const InstructorSidebar = ({ mobileOpen = false, onMobileClose }: InstructorSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

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
        aria-label="Instructor navigation"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          {!collapsed && (
            <span className="text-white font-bold font-heading text-lg tracking-wide">
              TaeKwonTrack
            </span>
          )}
          {collapsed && (
            <span className="text-primary font-bold text-xl mx-auto">T</span>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed((c) => { track("sidebar_collapsed", { collapsed: !c }); return !c; })}
          className="absolute -right-3 top-5 z-10 hidden md:flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600 shadow"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1" aria-label="Instructor navigation">
          {NAV_ITEMS.map((item) => (
            <div key={item.view} className="relative group">
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
    </>
  );
};
