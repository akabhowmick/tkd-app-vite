import { STATUS_STYLES } from "../utils/AttendanceUtils/AttendanceUtils";

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
