import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSchool } from "../context/SchoolContext";
import { createAttendance, getAttendanceByDate } from "../api/Attendance/attendanceRequests";
import { getTodayDate } from "../utils/AttendanceUtils/DateUtils";
import { AttendanceRecord } from "../types/attendance";
import Swal from "sweetalert2";

type AttendanceStatus = "present" | "absent";

export const useAttendance = () => {
  const { user } = useAuth();
  const { students, schoolId } = useSchool();
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExistingAttendance = async () => {
      setIsLoading(true);

      if (!schoolId || !selectedDate) {
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await getAttendanceByDate(schoolId, selectedDate);

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
  }, [selectedDate, schoolId, students.length]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!schoolId || !user) return;
    setIsSubmitting(true);
    try {
      const records = Object.entries(attendance).map(([student_id, status]) => ({
        student_id,
        status,
        school_id: schoolId,
        date: selectedDate,
      }));

      console.log(records);

      const { error } = await createAttendance(records);

      if (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to save attendance.",
          confirmButtonText: "OK",
        });
        console.error("Save error:", error);
      } else {
        Swal.fire({
          icon: "success",
          title: "Attendance saved successfully.",
          showConfirmButton: false,
          timer: 1000, 
        });
      }
    } catch (error) {
      console.error("Error saving attendance:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save attendance.",
        confirmButtonText: "OK",
      });
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
    students,
  };
};
