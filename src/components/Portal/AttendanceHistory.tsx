import { useEffect, useState } from "react";
import { getStudentAttendance } from "../../api/PortalRequests/portalRequests";
import { AttendanceRecord } from "../../types/attendance";
import { CalendarCheck, CalendarX } from "lucide-react";

interface Props {
  studentId: string;
  studentName?: string;
}

export const AttendanceHistory = ({ studentId, studentName }: Props) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    getStudentAttendance(studentId)
      .then(setRecords)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const rate = records.length > 0 ? Math.round((present / records.length) * 100) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {studentName && (
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {studentName}
        </p>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{present}</p>
          <p className="text-xs text-green-600 mt-0.5">Present</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{absent}</p>
          <p className="text-xs text-red-500 mt-0.5">Absent</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{rate !== null ? `${rate}%` : "—"}</p>
          <p className="text-xs text-blue-600 mt-0.5">Rate</p>
        </div>
      </div>

      {/* Record list */}
      {records.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No attendance records yet.</p>
      ) : (
        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
          {records.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-gray-100"
            >
              <span className="text-sm text-gray-700">
                {new Date(r.date + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {r.status === "present" ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-700">
                  <CalendarCheck size={13} /> Present
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                  <CalendarX size={13} /> Absent
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
