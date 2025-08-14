import { useEffect, useState } from "react";
import {
  faHome,
  faMoneyBill,
  faListUl,
  faListCheck,
  faSchool,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const SIDEBAR_CONFIG = [
  { icon: faHome, label: "Dashboard", view: "home" },
  { icon: faMoneyBill, label: "Renewals", view: "renewals" },
  { icon: faListUl, label: "Student List", view: "students" },
  { icon: faListCheck, label: "Attendance", view: "attendance" },
  { icon: faSchool, label: "School Profile", view: "school" },
];

interface SidebarProps {
  setActive: (view: string) => void;
  activeView?: string; // optional: highlight current
}

export const Sidebar = ({ setActive, activeView }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  // persist state
  useEffect(() => {
    const saved = localStorage.getItem("sidebar:collapsed");
    if (saved) setCollapsed(saved === "true");
  }, []);
  useEffect(() => {
    localStorage.setItem("sidebar:collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <aside
      className={`relative h-screen bg-white text-black border-r border-gray-200 transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Edge chevron toggle (like Google Docs) */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow hover:bg-gray-50"
        aria-label={collapsed ? "Show tabs & outlines" : "Hide tabs & outlines"}
        title={collapsed ? "Expand" : "Collapse"}
      >
        <FontAwesomeIcon
          icon={collapsed ? faChevronRight : faChevronLeft}
          className="h-4 w-4"
        />
      </button>

      {/* Header (hidden when collapsed) */}
      <div
        className={`px-4 pt-4 pb-2 font-semibold text-gray-900 transition-opacity duration-200 ${
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        Menu
      </div>

      {/* Nav */}
      <nav className="mt-1 px-2 space-y-1">
        {SIDEBAR_CONFIG.map((item) => {
          const isActive = activeView === item.view;
          return (
            <div key={item.view} className="relative group">
              <button
                onClick={() => setActive(item.view)}
                className={`flex w-full items-center gap-3 rounded-md p-3 text-left hover:bg-gray-100 focus:outline-none ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-700"
                }`}
                aria-label={item.label}
                title={collapsed ? item.label : undefined} // native tooltip fallback
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className="h-4 w-4 shrink-0"
                />

                {/* Text label (hidden when collapsed) */}
                <span
                  className={`whitespace-nowrap transition-all duration-200 ${
                    collapsed
                      ? "w-0 opacity-0 overflow-hidden"
                      : "w-auto opacity-100"
                  }`}
                >
                  {item.label}
                </span>
              </button>

              {/* Custom hover tooltip shown only when collapsed */}
              {collapsed && (
                <span
                  className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
                  role="tooltip"
                >
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};
