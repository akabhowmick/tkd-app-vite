import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSchool } from "../context/SchoolContext";
import { createAttendance, getAttendanceByDate } from "../api/Attendance/attendanceRequests";
import { getTodayDate } from "../utils/AttendanceUtils/DateUtils";
import { AttendanceRecord } from "../types/attendance";
import Swal from "sweetalert2";
import { track } from "../analytics/posthog";
import { captureException } from "../analytics/sentry";

type AttendanceStatus = "present" | "absent";

interface AttendanceContextType {
  attendance: Record<string, AttendanceStatus>;
  selectedDate: string;
  isLoading: boolean;
  isSubmitting: boolean;
  markedCount: number;
  canSubmit: boolean;
  handleDateChange: (date: string) => void;
  handleAttendanceChange: (studentId: string, status: AttendanceStatus) => void;
  handleSubmit: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

// FIX #2 & #3: Converted from a plain hook to a proper context Provider.
// Also fixes the stuck isLoading state when students array is empty.
export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
            {},
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

    // FIX #2: If students haven't loaded yet, still clear the loading state
    // so the page doesn't hang on the spinner forever.
    if (students.length > 0) {
      fetchExistingAttendance();
    } else {
      setIsLoading(false);
    }
  }, [selectedDate, schoolId, students.length]);

  const handleDateChange = (date: string) => {
    setAttendance({});
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

      // FIX #3: Added explicit onConflict to ensure re-saving the same
      // date updates existing records instead of attempting duplicate inserts.
      const { error } = await createAttendance(records);

      if (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to save attendance.",
          confirmButtonText: "OK",
        });
        console.error("Save error:", error);
        captureException(error, { feature: "attendance", action: "saveAttendance" });
      } else {
        track("attendance_saved", { studentCount: records.length, date: selectedDate });
        Swal.fire({
          icon: "success",
          title: "Attendance saved successfully.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      captureException(error, { feature: "attendance", action: "saveAttendance" });
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

  const markedCount = Object.keys(attendance).length;
  const canSubmit = markedCount > 0 && !isSubmitting;

  return (
    <AttendanceContext.Provider
      value={{
        attendance,
        selectedDate,
        isLoading,
        isSubmitting,
        markedCount,
        canSubmit,
        handleDateChange,
        handleAttendanceChange,
        handleSubmit,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAttendance = (): AttendanceContextType => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
};
