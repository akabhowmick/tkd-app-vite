import { STATUS_STYLES } from "../utils/AttendanceUtils/AttendanceUtils";

export interface AttendanceRecordInsert {
  student_id: string; // UUID
  status: AttendanceStatus;
  school_id: string; // UUID
  date?: Date | null;
}

// Full attendance record interface 
export interface AttendanceRecord extends AttendanceRecordInsert {
  id: string; // UUID
  created_at: Date | null;
}

// Interface for database row (with string dates for JSON serialization)
export interface AttendanceRecordRow {
  id: string;
  student_id: string;
  status: AttendanceStatus;
  school_id: string;
  created_at: string | null; // ISO string
  date: string | null; // ISO string (YYYY-MM-DD)
}

// Update interface (all fields optional except where business logic requires)
export interface AttendanceRecordUpdate {
  student_id?: string;
  status?: AttendanceStatus;
  school_id?: string;
  date?: Date | null;
}

// Query/filter interface
export interface AttendanceRecordFilter {
  student_id?: string;
  status?: AttendanceStatus;
  school_id?: string;
  date?: Date;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export type AttendanceStatus = "present" | "absent";

export interface AttendanceStats {
  present: number;
  absent: number;
  unmarked: number;
}

export interface StudentAttendanceCardProps {
  student: { id?: string; name: string };
  status: AttendanceStatus | undefined;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
}

export interface AttendanceRadioProps {
  studentId: string;
  currentStatus: AttendanceStatus | undefined;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
}

export interface CalendarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export interface StatCardProps {
  label: string;
  value: number;
  type: keyof typeof STATUS_STYLES;
}

export interface LoadingSpinnerProps {
  message?: string;
}
