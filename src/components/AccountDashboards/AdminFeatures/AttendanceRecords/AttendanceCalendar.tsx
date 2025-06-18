import { CalendarProps } from "../../../../types/attendance";
import { getTodayDate, WEEKDAYS } from "../../../../utils/AttendanceUtils/DateUtils";

const generateCalendarDays = (selectedDate: string): (string | null)[] => {
  const date = new Date(selectedDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days: (string | null)[] = [];

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

const getCalendarButtonClasses = (date: string | null, selectedDate: string, today: string): string => {
  const baseClasses = "aspect-square flex items-center justify-center text-sm rounded";
  
  if (!date) return baseClasses;
  
  const conditionalClasses = [
    "hover:bg-blue-50 border border-gray-200",
    date === selectedDate ? "bg-blue-500 text-white" : "",
    date === today ? "border-blue-300 bg-blue-50" : "",
  ].filter(Boolean).join(" ");

  return `${baseClasses} ${conditionalClasses}`;
};

export const Calendar = ({ selectedDate, onDateChange }: CalendarProps) => {
  const today = getTodayDate();
  const calendarDays = generateCalendarDays(selectedDate);

  return (
    <div className="mt-4 p-4 border rounded-lg bg-white text-black">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center font-medium text-gray-600 p-2 text-sm">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => (
          <button
            key={index}
            className={getCalendarButtonClasses(date, selectedDate, today)}
            onClick={() => date && onDateChange(date)}
            disabled={!date}
          >
            {date ? new Date(date).getDate() : ""}
          </button>
        ))}
      </div>
    </div>
  );
};