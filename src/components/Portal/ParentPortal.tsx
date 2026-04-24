import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getLinkedStudentIds } from "../../api/PortalRequests/portalRequests";
import { supabase } from "../../api/supabase";
import { Student } from "../../types/user";
import { AttendanceHistory } from "./AttendanceHistory";
import { RenewalStatus } from "./RenewalStatus";
import { BeltHistory } from "./BeltHistory";
import { AnnouncementsPage } from "../../pages/AnnouncementsPage";
import { CalendarCheck, DollarSign, Award, Megaphone, Users } from "lucide-react";

type Tab = "announcements" | "attendance" | "renewal" | "belts";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "renewal", label: "Membership", icon: DollarSign },
  { id: "belts", label: "Belt History", icon: Award },
];

export const ParentPortal = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("announcements");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      try {
        setLoading(true);
        const ids = await getLinkedStudentIds(user.id!);
        if (ids.length === 0) {
          setChildren([]);
          return;
        }
        const { data, error: err } = await supabase
          .from("students")
          .select("*")
          .in("id", ids);

        if (err) throw err;
        const sorted = (data ?? []).sort((a: Student, b: Student) =>
          a.name.localeCompare(b.name),
        );
        setChildren(sorted);
        setSelectedChild(sorted[0] ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load children");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 max-w-md">
        {error}
      </p>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Welcome, {user?.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Parent dashboard</p>
      </div>

      {children.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Users size={22} className="text-primary" />
          </div>
          <p className="text-sm font-medium text-gray-700">No students linked yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Contact your school admin to link your child's account.
          </p>
        </div>
      ) : (
        <>
          {/* Child selector — only shown if more than one child */}
          {children.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedChild?.id === child.id
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          )}

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
          {selectedChild && (
            <div>
              {activeTab === "announcements" && <AnnouncementsPage />}
              {activeTab === "attendance" && (
                <AttendanceHistory
                  studentId={selectedChild.id!}
                  studentName={children.length > 1 ? selectedChild.name : undefined}
                />
              )}
              {activeTab === "renewal" && (
                <RenewalStatus
                  studentId={selectedChild.id!}
                  studentName={children.length > 1 ? selectedChild.name : undefined}
                />
              )}
              {activeTab === "belts" && (
                <BeltHistory
                  studentId={selectedChild.id!}
                  studentName={children.length > 1 ? selectedChild.name : undefined}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
