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

  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    days.push(dayDate.toISOString().split("T")[0]);
  }

  return days;
};

const getCalendarButtonClasses = (
  date: string | null,
  selectedDate: string,
  today: string,
): string => {
  const baseClasses = "aspect-square flex items-center justify-center text-lg rounded";

  if (!date) return baseClasses;

  const conditionalClasses = [
    "hover:bg-blue-50 border border-gray-200",
    date === selectedDate ? "bg-blue-500 text-white" : "",
    date === today && date !== selectedDate ? "border-blue-300 bg-blue-50" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `${baseClasses} ${conditionalClasses}`;
};

const getMonthYearDisplay = (selectedDate: string): string => {
  const date = new Date(selectedDate);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

// FIX #1: Removed the erroneous +1 offset. getMonth() is already 0-indexed,
// so direction simply adds or subtracts 1 directly.
const navigateMonth = (selectedDate: string, direction: "prev" | "next"): string => {
  const date = new Date(selectedDate);
  const newDate = new Date(
    date.getFullYear(),
    date.getMonth() + (direction === "next" ? 1 : -1),
    1,
  );
  return newDate.toISOString().split("T")[0];
};

export const Calendar = ({ selectedDate, onDateChange }: CalendarProps) => {
  const today = getTodayDate();
  const calendarDays = generateCalendarDays(selectedDate);

  const handlePreviousMonth = () => {
    const newDate = navigateMonth(selectedDate, "prev");
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = navigateMonth(selectedDate, "next");
    onDateChange(newDate);
  };

  return (
    <div className="mt-4 p-4 border rounded-lg bg-white text-black">
      <div className="flex items-center justify-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{getMonthYearDisplay(selectedDate)}</h3>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center font-medium text-gray-600 p-2 text-sm">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {calendarDays.map((date, index) => (
          <button
            key={index}
            className={getCalendarButtonClasses(date, selectedDate, today)}
            onClick={() => date && onDateChange(date)}
            disabled={!date}
            aria-label={date ? `Select ${date}` : undefined}
            aria-pressed={date === selectedDate}
          >
            {date ? parseInt(date.split("-")[2]) : ""}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={handlePreviousMonth}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          aria-label="Previous month"
        >
          ← Previous Month
        </button>

        <button
          onClick={handleNextMonth}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          aria-label="Next month"
        >
          Next Month →
        </button>
      </div>
    </div>
  );
};
