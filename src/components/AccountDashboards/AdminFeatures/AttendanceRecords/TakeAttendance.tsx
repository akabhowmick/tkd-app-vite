import { useState, useEffect } from "react";
import { useSchool } from "../../../../context/SchoolContext";
import { useAttendance } from "../../../../context/AttendanceContext";
import { ChevronLeft, ChevronRight, FileText, ChevronDown } from "lucide-react";
import { UserProfile } from "../../../../types/user";

type AttendanceStatus = "present" | "absent" | "tardy";

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-green-500 hover:bg-green-600 text-white border-green-500",
  absent: "bg-red-500 hover:bg-red-600 text-white border-red-500",
  tardy: "bg-yellow-400 hover:bg-yellow-500 text-white border-yellow-400",
};

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildCalendarDays(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return days;
}

const MARK_ALL_OPTIONS: AttendanceStatus[] = ["present", "absent", "tardy"];

export const TakeAttendance = () => {
  const { students } = useSchool();
  const { handleDateChange, handleSubmit, selectedDate, isSubmitting, isLoading } = useAttendance();

  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [markAllOpen, setMarkAllOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const today = getTodayStr();

  const calDays = buildCalendarDays(calYear, calMonth);
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    // reset local attendance when date changes
    setAttendance({});
  }, [selectedDate]);

  const setStatus = (id: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [id]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      if (s.id) next[s.id] = status;
    });
    setAttendance(next);
    setMarkAllOpen(false);
  };

  const navMonth = (dir: "prev" | "next") => {
    setCalMonth((m) => {
      const next = m + (dir === "next" ? 1 : -1);
      if (next > 11) {
        setCalYear((y) => y + 1);
        return 0;
      }
      if (next < 0) {
        setCalYear((y) => y - 1);
        return 11;
      }
      return next;
    });
  };

  const markedCount = Object.keys(attendance).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Left: Calendar ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{monthLabel}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const d = new Date();
                  setCalYear(d.getFullYear());
                  setCalMonth(d.getMonth());
                  handleDateChange(today);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
              >
                today
              </button>
              <button
                onClick={() => navMonth("prev")}
                className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-600"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => navMonth("next")}
                className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-600"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((date, i) => {
              if (!date) return <div key={i} />;
              const isSelected = date === selectedDate;
              const isToday = date === today;
              const dayNum = parseInt(date.split("-")[2]);

              return (
                <button
                  key={date}
                  onClick={() => handleDateChange(date)}
                  className={`relative flex flex-col items-center justify-start py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[56px] ${
                    isSelected
                      ? "bg-gray-800 text-white"
                      : isToday
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span>{dayNum}</span>
                  {/* Attendance badge placeholder */}
                  {markedCount > 0 && isSelected && (
                    <span className="mt-0.5 text-[10px] bg-green-500 text-white rounded px-1">
                      P:{markedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right: Student List ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-800 shrink-0">
            Attendance for {selectedDate}
          </h3>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {/* Note button */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors">
              <FileText size={14} /> Note
            </button>

            {/* Mark All dropdown */}
            <div className="relative">
              <button
                onClick={() => setMarkAllOpen(!markAllOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors"
              >
                Mark All <ChevronDown size={14} />
              </button>
              {markAllOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMarkAllOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden min-w-[120px]">
                    {MARK_ALL_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => markAll(s)}
                        className="block w-full text-left px-4 py-2 text-sm capitalize text-gray-700 hover:bg-gray-50"
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-px bg-gray-100 border-b border-gray-100">
          {[
            {
              label: "Present",
              count: Object.values(attendance).filter((s) => s === "present").length,
              color: "text-green-600",
            },
            {
              label: "Absent",
              count: Object.values(attendance).filter((s) => s === "absent").length,
              color: "text-red-600",
            },
            {
              label: "Tardy",
              count: Object.values(attendance).filter((s) => s === "tardy").length,
              color: "text-yellow-600",
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white px-4 py-3 text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Student list */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">
              No students found. Add students to your school first.
            </p>
          ) : (
            students.map((student: UserProfile) => {
              const id = student.id!;
              const currentStatus = attendance[id];
              const hasNote = !!notes[id];

              return (
                <div
                  key={id}
                  className="flex items-center gap-3 px-6 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Checkbox-style indicator */}
                  <div
                    className={`h-8 w-8 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      currentStatus ? "border-primary bg-primary/10" : "border-gray-300"
                    }`}
                  >
                    {currentStatus && <div className="h-3 w-3 rounded-sm bg-primary" />}
                  </div>

                  {/* Name */}
                  <span className="flex-1 text-sm font-medium text-gray-800">{student.name}</span>

                  {/* Note indicator */}
                  {hasNote && <span className="text-xs text-primary mr-1">📝</span>}

                  {/* Status buttons */}
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1">
                      {(["present", "absent"] as AttendanceStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(id, s)}
                          className={`px-3 py-1 text-xs font-semibold rounded border transition-all ${
                            currentStatus === s
                              ? STATUS_STYLES[s]
                              : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setStatus(id, "tardy")}
                        className={`px-3 py-1 text-xs font-semibold rounded border transition-all ${
                          currentStatus === "tardy"
                            ? STATUS_STYLES.tardy
                            : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        Tardy
                      </button>
                      <button
                        onClick={() => setNoteOpen(noteOpen === id ? null : id)}
                        className="px-3 py-1 text-xs font-semibold rounded border border-gray-300 text-gray-500 hover:border-gray-400 bg-white transition-all"
                      >
                        Note
                      </button>
                    </div>

                    {/* Inline note input */}
                    {noteOpen === id && (
                      <input
                        autoFocus
                        type="text"
                        value={notes[id] || ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [id]: e.target.value }))}
                        onBlur={() => setNoteOpen(null)}
                        placeholder="Add a note..."
                        className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded outline-none focus:border-primary w-full"
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer save bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-500">
            {markedCount} of {students.length} students marked
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || markedCount === 0}
            className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
};
