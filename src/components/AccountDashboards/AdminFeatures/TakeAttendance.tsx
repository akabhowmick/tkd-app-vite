import { useEffect, useState } from "react";
import { supabase } from "../../../api/supabase";
import { useAuth } from "../../../context/AuthContext";

type Student = {
  id: string;
  full_name: string;
};

export const TakeAttendance = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.schoolId) return;

      const { data, error } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("role", "student")
        .eq("school_id", user.schoolId);

      if (error) {
        console.error("Error fetching students:", error.message);
      } else {
        setStudents(data || []);
        const defaultAttendance = data?.reduce((acc, student) => {
          acc[student.id] = true; // default to present
          return acc;
        }, {} as Record<string, boolean>);
        setAttendance(defaultAttendance);
      }
    };

    fetchStudents();
  }, [user?.schoolId]);

  const handleCheckboxChange = (id: string) => {
    setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");

    const entries = Object.entries(attendance).map(([student_id, isPresent]) => ({
      student_id,
      status: isPresent ? "present" : "absent",
      date: new Date().toISOString().split("T")[0],
      school_id: user?.schoolId,
    }));

    const { error } = await supabase.from("attendance").insert(entries);

    if (error) {
      console.error(error);
      setMessage("Error saving attendance.");
    } else {
      setMessage("Attendance saved successfully!");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Take Attendance</h2>

      {students.length === 0 && <p>No students found.</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <ul className="space-y-2">
          {students.map((student) => (
            <li key={student.id} className="flex justify-between items-center">
              <span>{student.full_name}</span>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={attendance[student.id]}
                  onChange={() => handleCheckboxChange(student.id)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span>{attendance[student.id] ? "Present" : "Absent"}</span>
              </label>
            </li>
          ))}
        </ul>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Submit Attendance"}
        </button>
      </form>

      {message && <p className="mt-2 text-green-600">{message}</p>}
    </div>
  );
};
