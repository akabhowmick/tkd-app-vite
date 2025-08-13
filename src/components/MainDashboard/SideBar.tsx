import {
  faHome,
  faMoneyBill,
  faListUl,
  faListCheck,
  faSchool,
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
}

export const Sidebar = ({ setActive }: SidebarProps) => (
  <div className="w-64 bg-white h-screen text-black">
    <nav className="mt-6 space-y-2">
      {SIDEBAR_CONFIG.map((item, index) => (
        <button
          key={index}
          onClick={() => setActive(item.view)}
          className="flex items-center gap-3 p-4 text-gray-700 hover:bg-gray-200 w-full text-left"
        >
          <FontAwesomeIcon icon={item.icon} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  </div>
);
