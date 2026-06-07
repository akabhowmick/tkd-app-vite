import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSchool } from "../context/SchoolContext";
import { createAttendance, deleteAttendanceByDate, getAttendanceByDate, getAttendanceByStudent } from "../api/Attendance/attendanceRequests";
import { getTodayDate } from "../utils/AttendanceUtils/DateUtils";
import { AttendanceRecord } from "../types/attendance";
import { track } from "../analytics/posthog";
import { captureException } from "../analytics/sentry";
import { supabase } from "../api/supabase";

type AttendanceStatus = "present" | "absent";

interface AttendanceContextType {
  attendance: Record<string, AttendanceStatus>;
  selectedDate: string;
  calYear: number;
  calMonth: number;
  isLoading: boolean;
  isSubmitting: boolean;
  markedCount: number;
  canSubmit: boolean;
  markedDates: Map<string, number>;
  handleDateChange: (date: string) => void;
  setCalYear: React.Dispatch<React.SetStateAction<number>>;
  setCalMonth: React.Dispatch<React.SetStateAction<number>>;
  handleAttendanceChange: (studentId: string, status: AttendanceStatus) => void;
  handleAttendanceClear: (studentId: string) => void;
  handleSubmit: () => Promise<{ success: boolean; error?: string }>;
  getStudentAttendance: (studentId: string) => Promise<AttendanceRecord[]>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

// FIX #2 & #3: Converted from a plain hook to a proper context Provider.
// Also fixes the stuck isLoading state when students array is empty.
export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { students, schoolId } = useSchool();
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [selectedDate, setSelectedDate] = useState<string>(
    () => sessionStorage.getItem("attendance_selectedDate") ?? getTodayDate(),
  );
  const [calYear, setCalYear] = useState<number>(() => {
    const stored = sessionStorage.getItem("attendance_calYear");
    return stored ? parseInt(stored) : new Date().getFullYear();
  });
  const [calMonth, setCalMonth] = useState<number>(() => {
    const stored = sessionStorage.getItem("attendance_calMonth");
    return stored ? parseInt(stored) : new Date().getMonth();
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState<Map<string, number>>(new Map());

  const fetchMarkedDates = useCallback(async () => {
    if (!schoolId) return;
    const PAGE_SIZE = 1000;
    let from = 0;
    const counts = new Map<string, number>();

    while (true) {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("date")
        .eq("school_id", schoolId)
        .eq("status", "present")
        .range(from, from + PAGE_SIZE - 1);

      if (error || !data || data.length === 0) break;
      data.forEach((r: { date: string }) => {
        counts.set(r.date, (counts.get(r.date) ?? 0) + 1);
      });
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    setMarkedDates(counts);
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId || !user) return;
    fetchMarkedDates();
  }, [schoolId, user?.id, fetchMarkedDates]);

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
          console.error("[Attendance] Fetch error:", error);
          setAttendance({});
        }
      } catch (error) {
        console.error("[Attendance] Fetch exception:", error);
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
    sessionStorage.setItem("attendance_selectedDate", date);
  };

  const persistCalYear: React.Dispatch<React.SetStateAction<number>> = (value) => {
    setCalYear((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      sessionStorage.setItem("attendance_calYear", String(next));
      return next;
    });
  };

  const persistCalMonth: React.Dispatch<React.SetStateAction<number>> = (value) => {
    setCalMonth((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      sessionStorage.setItem("attendance_calMonth", String(next));
      return next;
    });
  };

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleAttendanceClear = (studentId: string) => {
    setAttendance((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const handleSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!schoolId || !user) {
      return { success: false, error: "Not authenticated." };
    }
    setIsSubmitting(true);

    try {
      const records = Object.entries(attendance).map(([student_id, status]) => ({
        student_id,
        status,
        school_id: schoolId,
        date: selectedDate,
      }));

      // Delete existing records for this date first so cleared students are removed
      const { error: deleteError } = await deleteAttendanceByDate(schoolId, selectedDate);
      if (deleteError) {
        console.error("[Attendance] Delete error:", deleteError);
        captureException(deleteError, { feature: "attendance", action: "deleteAttendance" });
        return { success: false, error: "Failed to save attendance." };
      }

      if (records.length === 0) {
        await fetchMarkedDates();
        track("attendance_saved", { studentCount: 0, date: selectedDate });
        return { success: true };
      }

      const { error } = await createAttendance(records);

      if (error) {
        console.error("[Attendance] Save error:", error);
        captureException(error, { feature: "attendance", action: "saveAttendance" });
        return { success: false, error: "Failed to save attendance." };
      }

      await fetchMarkedDates();
      track("attendance_saved", { studentCount: records.length, date: selectedDate });
      return { success: true };
    } catch (error) {
      console.error("[Attendance] Unexpected error saving attendance:", error);
      captureException(error, { feature: "attendance", action: "saveAttendance" });
      return { success: false, error: "Failed to save attendance." };
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStudentAttendance = useCallback(
    (studentId: string) => getAttendanceByStudent(schoolId!, studentId),
    [schoolId],
  );

  const markedCount = Object.keys(attendance).length;
  const canSubmit = !isSubmitting;

  return (
    <AttendanceContext.Provider
      value={{
        attendance,
        selectedDate,
        calYear,
        calMonth,
        setCalYear: persistCalYear,
        setCalMonth: persistCalMonth,
        isLoading,
        isSubmitting,
        markedCount,
        canSubmit,
        markedDates,
        handleDateChange,
        handleAttendanceChange,
        handleAttendanceClear,
        handleSubmit,
        getStudentAttendance,
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
