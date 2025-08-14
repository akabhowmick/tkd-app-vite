import { useState } from "react";
import { SchoolManagement } from "../AccountDashboards/AdminFeatures/SchoolManagement/SchoolManagement";
import { TakeAttendance } from "../AccountDashboards/AdminFeatures/AttendanceRecords/TakeAttendance";
import { StudentListPage } from "../AccountDashboards/AdminFeatures/StudentView/StudentListPage";
import { StudentRenewalsPage } from "../AccountDashboards/AdminFeatures/StudentRenewals/StudentRenewalsPage";
import { Sidebar } from "./SideBar";
import { StatCards } from "./StatCard/StatCards";

const VIEW_COMPONENTS = {
  school: SchoolManagement,
  renewals: StudentRenewalsPage,
  students: StudentListPage,
  attendance: TakeAttendance,
} as const;

const formatTitle = (view: string): string => view.replace("-", " ").toUpperCase();

const Header = ({ title }: { title: string }) => (
  <div className="flex justify-between items-center mb-6 text-black">
    <div>
      <h2 className="text-gray-600">Dashboard / {title}</h2>
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  </div>
);

export const MainDashboard = () => {
  const [activeView, setActiveView] = useState("home");

  const renderMainContent = () => {
    if (activeView === "home") {
      return <StatCards />;
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
