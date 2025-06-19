import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import {
  AttendanceRecord,
  getAttendanceByDate,
} from "../../../../api/Attendance/attendanceRequests";
import { useSchool } from "../../../../context/SchoolContext";
import { calculateAttendanceStats } from "./AttendanceStats";
import { LoadingSpinnerProps, AttendanceStatus } from "../../../../types/attendance";
import { formatDate } from "../../../../utils/AttendanceUtils/DateUtils";
import { Calendar } from "./AttendanceCalendar";
import { StatCard, StudentAttendanceCard } from "./StudentAttendanceCard";
import { useAttendance } from "../../../../context/AttendanceContext";

const LoadingSpinner = ({ message = "Loading..." }: LoadingSpinnerProps) => (
  <div className="flex items-center justify-center min-h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

export const TakeAttendance = () => {
  const { user } = useAuth();
  const { students } = useSchool();
  const { handleDateChange, handleAttendanceChange, handleSubmit, selectedDate, isSubmitting } =
    useAttendance();
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const fetchExistingAttendance = async () => {
      setIsLoading(false);
      if (!user?.schoolId || !selectedDate) {
        setIsLoading(false);
        return;
      }

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
    };
    if (students.length > 0) {
      fetchExistingAttendance();
    }
  }, [selectedDate, user?.schoolId!, students.length]);

  if (isLoading) {
    return <LoadingSpinner message="Loading students..." />;
  }

  const stats = calculateAttendanceStats(attendance, students.length);
  const markedCount = Object.keys(attendance).length;

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Take Attendance</h2>
        <div className="text-sm text-gray-600">{students.length} students enrolled</div>
      </div>

      {/* Date Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Date:</label>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            {showCalendar ? "Hide Calendar" : "Show Calendar"}
          </button>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        <div className="mt-2 text-sm text-gray-600">{formatDate(selectedDate)}</div>

        {showCalendar && <Calendar selectedDate={selectedDate} onDateChange={handleDateChange} />}
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Present" value={stats.present} type="present" />
        <StatCard label="Absent" value={stats.absent} type="absent" />
        <StatCard label="Unmarked" value={stats.unmarked} type="unmarked" />
      </div>

      {/* Student List */}
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-3 mb-6">
          {students.map((student) => (
            <StudentAttendanceCard
              key={student.id}
              student={student}
              status={attendance[student.id!]}
              onStatusChange={handleAttendanceChange}
            />
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {markedCount} of {students.length} students marked
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || markedCount === 0}
          >
            {isSubmitting ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </form>
    </div>
  );
};
