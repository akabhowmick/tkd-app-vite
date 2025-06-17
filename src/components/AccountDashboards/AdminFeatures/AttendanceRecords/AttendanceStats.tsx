import { AttendanceStatus, AttendanceStats } from "../../../../types/attendance";

export const calculateAttendanceStats = (
  attendance: Record<string, AttendanceStatus>,
  totalStudents: number
): AttendanceStats => {
  const present = Object.values(attendance).filter((status) => status === "present").length;
  const absent = Object.values(attendance).filter((status) => status === "absent").length;
  const unmarked = totalStudents - present - absent;

  return { present, absent, unmarked };
};