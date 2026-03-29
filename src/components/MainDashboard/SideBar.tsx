import { useState } from "react";
import {
  LayoutDashboard,
  DollarSign,
  Users,
  CalendarCheck,
  School,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Settings,
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
      {
        icon: DollarSign,
        label: "Renewals",
        view: "renewals",
      },
      {
        icon: Users,
        label: "Students",
        view: "students",
        children: [{ label: "Student List", view: "students" }],
      },
      {
        icon: School,
        label: "School Profile",
        view: "school",
      },
    ],
  },
  {
    heading: "REPORTING",
    items: [{ icon: BarChart2, label: "Overview", view: "reporting" }],
  },
  {
    heading: "SETTINGS",
    items: [{ icon: Settings, label: "Settings", view: "settings" }],
  },
];

interface SidebarProps {
  setActive: (view: string) => void;
  activeView?: string;
}

export const Sidebar = ({ setActive, activeView = "home" }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleItemClick = (item: NavItem) => {
    if (item.children) {
      toggleSubmenu(item.label);
    } else {
      setActive(item.view);
    }
  };

  return (
    <aside
      className={`relative flex flex-col h-screen bg-gray-900 text-gray-300 border-r border-gray-800 transition-[width] duration-300 ease-in-out flex-shrink-0 ${
        collapsed ? "w-16" : "w-64"
      }`}
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

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 shadow"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {/* Section heading */}
            {section.heading && !collapsed && (
              <p className="px-3 pt-4 pb-1 text-xs font-semibold tracking-widest text-gray-500 uppercase">
                {section.heading}
              </p>
            )}
            {section.heading && collapsed && <div className="my-2 mx-3 border-t border-gray-700" />}

            {section.items.map((item) => {
              const isActive =
                activeView === item.view ||
                (item.children ? item.children.some((c) => c.view === activeView) : false);
              const isOpen = openSubmenus[item.label];

              return (
                <div key={item.view}>
                  {/* Main nav item */}
                  <div className="relative group">
                    <button
                      onClick={() => handleItemClick(item)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <item.icon size={18} className="shrink-0" />
                      {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                      {!collapsed &&
                        item.children &&
                        (isOpen ? (
                          <ChevronUp size={14} className="text-gray-500" />
                        ) : (
                          <ChevronDown size={14} className="text-gray-500" />
                        ))}
                    </button>

                    {/* Tooltip when collapsed */}
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow group-hover:opacity-100 whitespace-nowrap z-50">
                        {item.label}
                      </span>
                    )}
                  </div>

                  {/* Submenu */}
                  {item.children && isOpen && !collapsed && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <button
                          key={child.view}
                          onClick={() => setActive(child.view)}
                          className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            activeView === child.view
                              ? "text-primary font-medium"
                              : "text-gray-400 hover:text-white hover:bg-gray-800"
                          }`}
                        >
                          {child.label}
                        </button>
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
  );
};
