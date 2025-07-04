import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSchool } from "../context/SchoolContext";
import {
  AttendanceRecord,
  createAttendance,
  getAttendanceByDate,
} from "../api/Attendance/attendanceRequests";
import { getTodayDate } from "../utils/AttendanceUtils/DateUtils";

type AttendanceStatus = "present" | "absent";

export const useAttendance = () => {
  const { user } = useAuth();
  const { students } = useSchool();
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExistingAttendance = async () => {
      setIsLoading(true);

      if (!user?.schoolId || !selectedDate) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await getAttendanceByDate(user.schoolId, selectedDate);

        if (data) {
          const existing = data.reduce(
            (acc: Record<string, AttendanceStatus>, record: AttendanceRecord) => {
              acc[record.student_id] = record.status as AttendanceStatus;
              return acc;
            },
            {}
          );
          setAttendance(existing);
        } else if (error) {
          console.error("Error fetching attendance:", error);
          setAttendance({});
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
        setAttendance({});
      } finally {
        setIsLoading(false);
      }
    };

    if (students.length > 0) {
      fetchExistingAttendance();
    }
  }, [selectedDate, user?.schoolId, students.length]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    console.log(studentId, status);
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
    console.log(attendance)
  };

  const handleSubmit = async () => {
    if (!user?.schoolId) return;

    setIsSubmitting(true);

    try {
      const records = Object.entries(attendance).map(([student_id, status]) => ({
        student_id,
        status,
        school_id: user.schoolId!,
        date: selectedDate,
      }));

      const { error } = await createAttendance(records);

      if (error) {
        alert("Failed to save attendance.");
        console.error("Save error:", error);
      } else {
        alert("Attendance saved successfully.");
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Computed values
  const markedCount = Object.keys(attendance).length;
  const canSubmit = markedCount > 0 && !isSubmitting;

  return {
    // State
    attendance,
    selectedDate,
    isLoading,
    isSubmitting,

    // Computed values
    markedCount,
    canSubmit,

    // Handlers
    handleDateChange,
    handleAttendanceChange,
    handleSubmit,

    // Context data 
    students
  };
};
