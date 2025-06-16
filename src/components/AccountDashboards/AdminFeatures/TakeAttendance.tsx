import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../api/supabase";
import { AttendanceRecord, createAttendance, getAttendanceByDate } from "../../../api/Attendance/attendanceRequests";

type AttendanceStatus = "present" | "absent";

interface Student {
  id: string;
  full_name: string;
}

export const TakeAttendance = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);

  // Load students on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.schoolId) return;
      
      setIsLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("school_id", user.schoolId)
        .eq("role", "student")
        .order("full_name");

      if (data) {
        setStudents(data);
      } else {
        console.error("Error fetching students:", error);
      }
      setIsLoading(false);
    };

    fetchStudents();
  }, [user?.schoolId]);

  // Load existing attendance when date changes
  useEffect(() => {
    const fetchExistingAttendance = async () => {
      if (!user?.schoolId || !selectedDate) return;
      
      const { data, error } = await getAttendanceByDate(user.schoolId, selectedDate);
      if (data) {
        const existing = data.reduce((acc: Record<string, AttendanceStatus>, record: AttendanceRecord) => {
          acc[record.student_id] = record.status as AttendanceStatus;
          return acc;
        }, {});
        setAttendance(existing);
      } else if (error) {
        console.error("Error fetching attendance:", error);
        // Reset attendance for new date
        setAttendance({});
      }
    };

    if (students.length > 0) {
      fetchExistingAttendance();
    }
  }, [selectedDate, user?.schoolId, students.length]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
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
    }

    setIsSubmitting(false);
  };

  const getAttendanceStats = () => {
    const present = Object.values(attendance).filter(status => status === "present").length;
    const absent = Object.values(attendance).filter(status => status === "absent").length;
    const unmarked = students.length - present - absent;
    
    return { present, absent, unmarked };
  };

  const generateCalendarDays = () => {
    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      days.push(dayDate.toISOString().split("T")[0]);
    }
    
    return days;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  const stats = getAttendanceStats();

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Take Attendance</h2>
        <div className="text-sm text-gray-600">
          {students.length} students enrolled
        </div>
      </div>

      {/* Date Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Date:</label>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
          </button>
        </div>
        
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <div className="mt-2 text-sm text-gray-600">
          {formatDate(selectedDate)}
        </div>

        {/* Calendar View */}
        {showCalendar && (
          <div className="mt-4 p-4 border rounded-lg bg-white">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-medium text-gray-600 p-2 text-sm">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((date, index) => (
                <button
                  key={index}
                  className={`
                    aspect-square flex items-center justify-center text-sm rounded
                    ${date ? 'hover:bg-blue-50 border border-gray-200' : ''}
                    ${date === selectedDate ? 'bg-blue-500 text-white' : ''}
                    ${date === new Date().toISOString().split("T")[0] ? 'border-blue-300 bg-blue-50' : ''}
                  `}
                  onClick={() => date && handleDateChange(date)}
                  disabled={!date}
                >
                  {date ? new Date(date).getDate() : ''}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
          <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          <div className="text-sm text-green-700">Present</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
          <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          <div className="text-sm text-red-700">Absent</div>
        </div>
       
        <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">{stats.unmarked}</div>
          <div className="text-sm text-gray-700">Unmarked</div>
        </div>
      </div>

      {/* Student List */}
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-3 mb-6">
          {students.map((student) => {
            const status = attendance[student.id];
            
            return (
              <div
                key={student.id}
                className={`
                  flex items-center justify-between p-4 rounded-lg border-2
                  ${status === 'present' ? 'border-green-200 bg-green-50' : 
                    status === 'absent' ? 'border-red-200 bg-red-50' : 
                    'border-gray-200 bg-gray-50'}
                `}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-blue-700">
                      {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-gray-800">{student.full_name}</span>
                </div>
                
                <div className="flex space-x-2">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name={student.id}
                      value="present"
                      checked={status === "present"}
                      onChange={() => handleAttendanceChange(student.id, "present")}
                      className="form-radio text-green-500 h-4 w-4"
                    />
                    <span className="ml-2 text-sm font-medium text-green-700">Present</span>
                  </label>
                  
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name={student.id}
                      value="absent"
                      checked={status === "absent"}
                      onChange={() => handleAttendanceChange(student.id, "absent")}
                      className="form-radio text-red-500 h-4 w-4"
                    />
                    <span className="ml-2 text-sm font-medium text-red-700">Absent</span>
                  </label>
                  
                  
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {Object.keys(attendance).length} of {students.length} students marked
          </div>
          
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || Object.keys(attendance).length === 0}
          >
            {isSubmitting ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </form>
    </div>
  );
};