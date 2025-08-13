import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faMoneyBill,
  faListUl,
  faListCheck,
  faSchool,
  faWallet,
  faUser,
  faUserPlus,
  faChartLine,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { useSchool } from "../../context/SchoolContext";
import { SchoolManagement } from "../AccountDashboards/AdminFeatures/SchoolManagement/SchoolManagement";
import { TakeAttendance } from "../AccountDashboards/AdminFeatures/AttendanceRecords/TakeAttendance";
import { StudentListPage } from "../AccountDashboards/AdminFeatures/StudentView/StudentListPage";
import { StudentRenewalsPage } from "../AccountDashboards/AdminFeatures/StudentRenewals/StudentRenewalsPage";

// Constants
const SIDEBAR_CONFIG = [
  { icon: faHome, label: "Dashboard", view: "home" },
  { icon: faMoneyBill, label: "Renewals", view: "renewals" },
  { icon: faListUl, label: "Student List", view: "students" },
  { icon: faListCheck, label: "Attendance", view: "attendance" },
  { icon: faSchool, label: "School Profile", view: "school" },
];

const STAT_CARDS_CONFIG = [
  {
    icon: faWallet,
    title: "Today's Money",
    valueKey: "sales" as const,
    change: "+55% than last week",
    isPositive: true,
  },
  {
    icon: faUser,
    title: "Today's Attendance",
    valueKey: "attendance" as const,
    change: "+3% than last week",
    isPositive: true,
  },
  {
    icon: faUserPlus,
    title: "New Clients",
    valueKey: "clients" as const,
    change: "-2% than last month",
    isPositive: false,
  },
  {
    icon: faChartLine,
    title: "Sales",
    value: "$103",
    change: "+5% than yesterday",
    isPositive: true,
  },
];

const VIEW_COMPONENTS = {
  school: SchoolManagement,
  renewals: StudentRenewalsPage,
  students: StudentListPage,
  attendance: TakeAttendance,
} as const;

// Types
interface SidebarProps {
  setActive: (view: string) => void;
}

interface StatCardProps {
  icon: IconDefinition;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

// Utility functions
const formatTitle = (view: string): string => view.replace("-", " ").toUpperCase();

// Components
const Sidebar = ({ setActive }: SidebarProps) => (
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

const Header = ({ title }: { title: string }) => (
  <div className="flex justify-between items-center mb-6 text-black">
    <div>
      <h2 className="text-gray-600">Dashboard / {title}</h2>
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  </div>
);

const StatCard = ({ icon, title, value, change, isPositive }: StatCardProps) => (
  <div className="bg-white p-6 rounded-lg shadow-md text-black">
    <div className="flex items-center mb-4">
      <FontAwesomeIcon icon={icon} />
      <div className="ml-4">
        <p className="text-gray-600">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
    <p className={isPositive ? "text-green-500" : "text-red-500"}>{change}</p>
  </div>
);

export const MainDashboard = () => {
  const schoolData = useSchool();
  const [activeView, setActiveView] = useState("home");

  const renderMainContent = () => {
    if (activeView === "home") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {STAT_CARDS_CONFIG.map((config, index) => (
            <StatCard
              key={index}
              icon={config.icon}
              title={config.title}
              value={config.valueKey ? `${schoolData[config.valueKey]}` : config.value!}
              change={config.change}
              isPositive={config.isPositive}
            />
          ))}
        </div>
      );
    }

    const Component = VIEW_COMPONENTS[activeView as keyof typeof VIEW_COMPONENTS];
    return Component ? <Component /> : <div className="text-black">Not implemented</div>;
  };

  return (
    <div className="flex">
      <Sidebar setActive={setActiveView} />
      <div className="flex-1 p-6">
        <Header title={formatTitle(activeView)} />
        {renderMainContent()}
      </div>
    </div>
  );
};
