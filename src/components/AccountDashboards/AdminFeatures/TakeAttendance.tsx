import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../api/supabase";
import { createAttendance, getAttendanceByDate } from "../../../api/Attendance/attendance";

type AttendanceStatus = "present" | "absent";

interface Student {
  id: string;
  full_name: string;
}

export const TakeAttendance = () => {
  const { user } = useAuth(); // assumes user has schoolId
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("school_id", user?.schoolId)
        .eq("role", "student");

      if (data) {
        setStudents(data);
      } else {
        console.error(error);
      }
    };

    const fetchExistingAttendance = async () => {
      if (!user?.schoolId) return;
      const { data, error } = await getAttendanceByDate(user.schoolId, today);
      if (data) {
        const existing = data.reduce((acc: Record<string, AttendanceStatus>, record: any) => {
          acc[record.student_id] = record.status;
          return acc;
        }, {});
        setAttendance(existing);
      } else {
        console.error(error);
      }
    };

    fetchStudents();
    fetchExistingAttendance();
  }, [today, user?.schoolId]);

  const handleChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!user?.schoolId) return;
    setIsSubmitting(true);

    const records = Object.entries(attendance).map(([student_id, status]) => ({
      student_id,
      status,
      schoolId: user.schoolId,
      date: today,
    }));

    const { error } = await createAttendance(records);
    if (error) {
      alert("Failed to save attendance.");
      console.error(error);
    } else {
      alert("Attendance saved.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-8 p-4 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Take Attendance - {today}</h2>

      <form onSubmit={(e) => e.preventDefault()}>
        {students.map((student) => (
          <div
            key={student.id}
            className="flex items-center justify-between border-b py-2"
          >
            <span>{student.full_name}</span>
            <div className="space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name={student.id}
                  value="present"
                  checked={attendance[student.id] === "present"}
                  onChange={() => handleChange(student.id, "present")}
                  className="form-radio text-green-500"
                />
                <span className="ml-1">Present</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name={student.id}
                  value="absent"
                  checked={attendance[student.id] === "absent"}
                  onChange={() => handleChange(student.id, "absent")}
                  className="form-radio text-red-500"
                />
                <span className="ml-1">Absent</span>
              </label>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleSubmit}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Attendance"}
        </button>
      </form>
    </div>
  );
};
