import { useAuth } from "../../../context/AuthContext";
import { useSchool } from "../../../context/SchoolContext";
import { CalendarCheck, Users, Megaphone, Award } from "lucide-react";

interface Props {
  onViewChange: (view: string) => void;
}

export const InstructorHome = ({ onViewChange }: Props) => {
  const { user } = useAuth();
  const { students } = useSchool();

  const quickActions = [
    { label: "Take Attendance", color: "bg-blue-600 hover:bg-blue-700", view: "attendance", icon: CalendarCheck },
    { label: "View Students", color: "bg-green-600 hover:bg-green-700", view: "students", icon: Users },
    { label: "Announcements", color: "bg-purple-600 hover:bg-purple-700", view: "announcements", icon: Megaphone },
    { label: "Belt Tracking", color: "bg-yellow-600 hover:bg-yellow-700", view: "belts", icon: Award },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Welcome, {user?.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Instructor dashboard</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Students</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => onViewChange(action.view)}
              className={`${action.color} text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2`}
            >
              <action.icon size={15} />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
