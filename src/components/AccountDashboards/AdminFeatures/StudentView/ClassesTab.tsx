import { useEffect, useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import { Trash2 } from "lucide-react";
import { useClasses } from "../../../../context/ClassContext";
import { Checkbox } from "../../../ui/checkbox";
import { Class, ClassEnrollment } from "../../../../types/classes";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(t?: string) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

const AGE_BADGE: Record<string, string> = {
  Kids: "bg-blue-100 text-blue-700",
  Adults: "bg-purple-100 text-purple-700",
  All: "bg-gray-100 text-gray-600",
};

type EnrollmentWithClass = ClassEnrollment & { class: Class };

export function ClassesTab({ studentId }: { studentId: string }) {
  const { classes, loadClasses, getStudentEnrollments, enrollStudent, unenrollStudent } = useClasses();

  const [enrollments, setEnrollments] = useState<EnrollmentWithClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [removeLoadingId, setRemoveLoadingId] = useState<string | null>(null);

  const fetchEnrollments = () => {
    setLoading(true);
    getStudentEnrollments(studentId)
      .then((data) => setEnrollments(data as EnrollmentWithClass[]))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!studentId) return;
    fetchEnrollments();
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (classes.length === 0) loadClasses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const enrolledClassIds = new Set(enrollments.map((e) => e.class_id));
  const availableClasses = classes.filter((c) => !enrolledClassIds.has(c.class_id));

  const toggleSelect = (classId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(classId) ? next.delete(classId) : next.add(classId);
      return next;
    });

  const handleEnroll = async () => {
    if (selected.size === 0) return;
    setEnrollError(null);
    setEnrollLoading(true);
    const failed: string[] = [];
    for (const classId of selected) {
      try {
        await enrollStudent(classId, studentId);
      } catch {
        const cls = classes.find((c) => c.class_id === classId);
        failed.push(cls?.class_name ?? classId);
      }
    }
    fetchEnrollments();
    setEnrollLoading(false);
    setSelected(new Set());
    if (failed.length > 0) {
      setEnrollError(`Failed to enroll in: ${failed.join(", ")}`);
    } else {
      setEnrollOpen(false);
    }
  };

  const handleRemove = async (enrollmentId: string) => {
    setRemoveLoadingId(enrollmentId);
    try {
      await unenrollStudent(enrollmentId);
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
    } finally {
      setRemoveLoadingId(null);
    }
  };

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
      {/* Enrolled classes */}
      {enrollments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Not enrolled in any classes yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {enrollments.map((enrollment) => {
            const cls = enrollment.class;
            return (
              <div
                key={enrollment.id}
                className="flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-black">{cls?.class_name ?? "Unknown class"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {cls?.day_of_week != null && `${DAYS[cls.day_of_week]} · `}
                      {formatTime(cls?.start_time)}
                      {cls?.start_time && cls?.end_time && " – "}
                      {formatTime(cls?.end_time)}
                    </p>
                  </div>
                  {cls?.age_group && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${AGE_BADGE[cls.age_group] ?? "bg-gray-100 text-gray-600"}`}>
                      {cls.age_group}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(enrollment.id)}
                  disabled={removeLoadingId === enrollment.id}
                  className="flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add to class button */}
      {!enrollOpen && (
        <button
          onClick={() => { setEnrollOpen(true); setEnrollError(null); setSelected(new Set()); }}
          className="self-start flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800 transition-colors"
        >
          <FaPlus size={11} /> Add to Class
        </button>
      )}

      {/* Inline enrollment panel */}
      {enrollOpen && (
        <div className="bg-white border border-blue-200 rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Enroll in a Class</h3>
            <button onClick={() => setEnrollOpen(false)} className="text-gray-400 hover:text-gray-600">
              <FaTimes size={14} />
            </button>
          </div>

          {availableClasses.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">
              {classes.length === 0
                ? "No classes have been created for this school."
                : "This student is already enrolled in all available classes."}
            </p>
          ) : (
            <div className="flex flex-col gap-2 mb-4 max-h-56 overflow-y-auto">
              {availableClasses.map((cls) => (
                <label
                  key={cls.class_id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(cls.class_id)}
                    onCheckedChange={() => toggleSelect(cls.class_id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black">{cls.class_name}</p>
                    <p className="text-xs text-gray-500">
                      {cls.day_of_week != null && `${DAYS[cls.day_of_week]} · `}
                      {formatTime(cls.start_time)}
                      {cls.start_time && cls.end_time && " – "}
                      {formatTime(cls.end_time)}
                    </p>
                  </div>
                  {cls.age_group && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${AGE_BADGE[cls.age_group] ?? "bg-gray-100 text-gray-600"}`}>
                      {cls.age_group}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}

          {enrollError && <p className="text-sm text-red-600 mb-3">{enrollError}</p>}

          {availableClasses.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleEnroll}
                disabled={selected.size === 0 || enrollLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800 transition-colors disabled:opacity-50"
              >
                {enrollLoading ? "Enrolling…" : `Enroll in ${selected.size || 0} Class${selected.size !== 1 ? "es" : ""}`}
              </button>
              <button
                onClick={() => setEnrollOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
