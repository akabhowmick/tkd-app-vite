import { useEffect, useState } from "react";
import { CalendarCheck, CalendarX } from "lucide-react";
import { useAttendance } from "../../../../context/AttendanceContext";
import { AttendanceRecord } from "../../../../types/attendance";

function getPeriodBounds(period: "week" | "month" | "quarter" | "year"): [Date, Date] {
  const now = new Date();
  const start = new Date(now);
  if (period === "week") {
    start.setDate(now.getDate() - now.getDay()); // Sunday
  } else if (period === "month") {
    start.setDate(1);
  } else if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    start.setMonth(q * 3, 1);
  } else {
    start.setMonth(0, 1);
  }
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return [start, end];
}

function presentInPeriod(records: AttendanceRecord[], period: "week" | "month" | "quarter" | "year"): number {
  const [start, end] = getPeriodBounds(period);
  return records.filter((r) => {
    const d = new Date(r.date + "T12:00:00");
    return r.status === "present" && d >= start && d <= end;
  }).length;
}

const PERIOD_CARDS: { key: "week" | "month" | "quarter" | "year"; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "quarter", label: "This Quarter" },
  { key: "year", label: "This Year" },
];

export function AttendanceTab({ studentId }: { studentId: string }) {
  const { getStudentAttendance } = useAttendance();
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
  }, [studentId, getStudentAttendance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="h-5 w-5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PERIOD_CARDS.map(({ key, label }) => (
          <div key={key} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-black">{presentInPeriod(records, key)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No attendance records yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
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
                  year: "numeric",
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
}
