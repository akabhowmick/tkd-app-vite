import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAdd,
  faHome,
  faMoneyBill,
  faListUl,
  faListCheck,
  faSchool,
} from "@fortawesome/free-solid-svg-icons";
import { useSchool } from "../../context/SchoolContext";
import { SchoolManagement } from "./AdminFeatures/SchoolManagement/SchoolManagement";
import { TakeAttendance } from "./AdminFeatures/AttendanceRecords/TakeAttendance";
import { StudentListPage } from "./AdminFeatures/StudentView/StudentListPage";
import { AddStudentPage } from "../../pages/AddStudentPage";
import { StudentRenewalsPage } from "./AdminFeatures/StudentRenewals/StudentRenewalsPage";
// import other feature components...

const Sidebar = ({ setActive }: { setActive: (view: string) => void }) => (
  <div className="w-64 bg-white h-screen shadow-md text-black">
    <div className="p-6">
      <h1 className="text-xl font-bold">Taekwondo School</h1>
    </div>
    <nav className="mt-6 space-y-2">
      {[
        { icon: faHome, label: "Dashboard", view: "home" },
        { icon: faMoneyBill, label: "Renewals", view: "renewals" },
        { icon: faAdd, label: "Add Student", view: "add-student" },
        { icon: faListUl, label: "Student List", view: "students" },
        { icon: faListCheck, label: "Attendance", view: "attendance" },
        { icon: faSchool, label: "School Profile", view: "school" },
      ].map((item, index) => (
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
    <div className="flex items-center space-x-4">
      <div className="relative">
        <input
          className="bg-gray-100 h-10 px-5 pr-10 rounded-full text-sm focus:outline-none"
          placeholder="Search"
          type="text"
        />
        <button className="absolute right-0 top-0 mt-3 mr-4">
          <i className="fas fa-search"></i>
        </button>
      </div>
      <i className="fas fa-user text-gray-600"></i>
      <i className="fas fa-bell text-gray-600"></i>
      <i className="fas fa-cog text-gray-600"></i>
    </div>
  </div>
);

const StatCard = ({
  icon,
  title,
  value,
  change,
  isPositive,
}: {
  icon: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}) => (
  <div className="bg-white p-6 rounded-lg shadow-md text-black">
    <div className="flex items-center mb-4">
      <div className="bg-black p-3 rounded-full">
        <i className={icon}></i>
      </div>
      <div className="ml-4">
        <p className="text-gray-600">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
    <p className={isPositive ? "text-green-500" : "text-red-500"}>{change}</p>
  </div>
);

const RegularDashboard = () => {
  const { sales, clients, attendance } = useSchool();
  const [activeView, setActiveView] = useState("home");

  const renderMainContent = () => {
    switch (activeView) {
      case "home":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              icon="fas fa-wallet"
              title="Today's Money"
              value={`${sales}`}
              change="+55% than last week"
              isPositive={true}
            />
            <StatCard
              icon="fas fa-users"
              title="Today's Attendance"
              value={`${attendance}`}
              change="+3% than last week"
              isPositive={true}
            />
            <StatCard
              icon="fas fa-user-plus"
              title="New Clients"
              value={`${clients}`}
              change="-2% than last month"
              isPositive={false}
            />
            <StatCard
              icon="fas fa-chart-line"
              title="Sales"
              value="$103"
              change="+5% than yesterday"
              isPositive={true}
            />
          </div>
        );
      case "school":
        return <SchoolManagement />;
      case "renewals":
        return <StudentRenewalsPage/>
      case "add-student":
        return <AddStudentPage />;
      case "students":
        return <StudentListPage />;
      case "attendance":
        return <TakeAttendance />;
      default:
        return <div className="text-black">Not implemented</div>;
    }
  };

  return (
    <div className="flex">
      <Sidebar setActive={setActiveView} />
      <div className="flex-1 p-6">
        <Header title={activeView.replace("-", " ").toUpperCase()} />
        {renderMainContent()}
      </div>
    </div>
  );
};

export default RegularDashboard;
