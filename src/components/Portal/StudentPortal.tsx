import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AttendanceHistory } from "./AttendanceHistory";
import { RenewalStatus } from "./RenewalStatus";
import { BeltHistory } from "./BeltHistory";
import { AnnouncementsPage } from "../../pages/AnnouncementsPage";
import { CalendarCheck, DollarSign, Award, Megaphone } from "lucide-react";

type Tab = "announcements" | "attendance" | "renewal" | "belts";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "renewal", label: "Membership", icon: DollarSign },
  { id: "belts", label: "Belt History", icon: Award },
];

export const StudentPortal = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("announcements");

  if (!user?.id) return null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Welcome back, {user.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your student dashboard</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === "announcements" && <AnnouncementsPage />}
        {activeTab === "attendance" && (
          <AttendanceHistory studentId={user.id} />
        )}
        {activeTab === "renewal" && (
          <RenewalStatus studentId={user.id} />
        )}
        {activeTab === "belts" && (
          <BeltHistory studentId={user.id} />
        )}
      </div>
    </div>
  );
};
