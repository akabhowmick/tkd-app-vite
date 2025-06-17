import {
  AttendanceRadioProps,
  AttendanceStatus,
  StatCardProps,
  StudentAttendanceCardProps,
} from "../../../../types/attendance";
import { STATUS_STYLES } from "../../../../utils/AttendanceUtils/AttendanceUtils";

const ATTENDANCE_STATUSES: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "present", label: "Present", color: "green" },
  { value: "absent", label: "Absent", color: "red" },
];

const AttendanceRadio = ({ studentId, currentStatus, onStatusChange }: AttendanceRadioProps) => (
  <div className="flex space-x-2">
    {ATTENDANCE_STATUSES.map(({ value, label }) => {
      const styles = STATUS_STYLES[value];
      return (
        <label key={value} className="inline-flex items-center cursor-pointer">
          <input
            type="radio"
            name={studentId}
            value={value}
            checked={currentStatus === value}
            onChange={() => onStatusChange(studentId, value)}
            className={`form-radio h-4 w-4 ${styles.radio}`}
          />
          <span className={`ml-2 text-sm font-medium ${styles.text}`}>{label}</span>
        </label>
      );
    })}
  </div>
);

const getStudentCardClasses = (status: AttendanceStatus | undefined): string => {
  const baseClasses = "flex items-center justify-between p-4 rounded-lg border-2";
  const statusStyle = status ? STATUS_STYLES[status] : STATUS_STYLES.unmarked;
  return `${baseClasses} ${statusStyle.border} ${statusStyle.bg}`;
};

export const StudentAttendanceCard = ({
  student,
  status,
  onStatusChange,
}: StudentAttendanceCardProps) => (
  <div className={getStudentCardClasses(status)}>
    <div className="flex items-center">
      <span className="font-medium text-gray-800">{student.name}</span>
    </div>
    <AttendanceRadio
      studentId={student.id!}
      currentStatus={status}
      onStatusChange={onStatusChange}
    />
  </div>
);


export const StatCard = ({ label, value, type }: StatCardProps) => {
  const styles = STATUS_STYLES[type];
  return (
    <div className={`p-4 rounded-lg text-center border ${styles.statBg} ${styles.statBorder}`}>
      <div className={`text-2xl font-bold ${styles.statText}`}>{value}</div>
      <div className={`text-sm ${styles.text}`}>{label}</div>
    </div>
  );
};