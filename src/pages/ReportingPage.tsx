import { useEffect, useState } from "react";
import {
  getWeeklyAttendance,
  getRevenueByCategory,
  getRevenueByPaymentType,
  getStudentGrowth,
  getExpiringRenewals,
  WeeklyAttendance,
  CategoryRevenue,
  PaymentTypeRevenue,
  StudentGrowth,
  ExpiringRenewal,
} from "../api/ReportingRequests/reportingRequests";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useSchool } from "../context/SchoolContext";
import { AlertCircle, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";

const COLORS = ["#be123c", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2"];

const SectionCard = ({
  title,
  icon: Icon,
  children,
  loading,
  error,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  loading: boolean;
  error: string | null;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
    <div className="flex items-center gap-2">
      <Icon size={16} className="text-primary" />
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
    {loading ? (
      <div className="flex items-center justify-center h-48">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    ) : error ? (
      <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        <AlertCircle size={14} /> {error}
      </div>
    ) : (
      children
    )}
  </div>
);

export const ReportingPage = () => {
  const { schoolId, students } = useSchool();

  const [attendance, setAttendance] = useState<WeeklyAttendance[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([]);
  const [paymentRevenue, setPaymentRevenue] = useState<PaymentTypeRevenue[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  const [growth, setGrowth] = useState<StudentGrowth[]>([]);
  const [growthLoading, setGrowthLoading] = useState(true);
  const [growthError, setGrowthError] = useState<string | null>(null);

  const [expiring, setExpiring] = useState<ExpiringRenewal[]>([]);
  const [expiringLoading, setExpiringLoading] = useState(true);
  const [expiringError, setExpiringError] = useState<string | null>(null);

  // Student name lookup
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s.name]));

  useEffect(() => {
    if (!schoolId) return;

    getWeeklyAttendance(schoolId)
      .then(setAttendance)
      .catch((e) => setAttendanceError(e.message))
      .finally(() => setAttendanceLoading(false));

    Promise.all([getRevenueByCategory(schoolId), getRevenueByPaymentType(schoolId)])
      .then(([cat, pay]) => {
        setCategoryRevenue(cat);
        setPaymentRevenue(pay);
      })
      .catch((e) => setRevenueError(e.message))
      .finally(() => setRevenueLoading(false));

    getStudentGrowth(schoolId)
      .then(setGrowth)
      .catch((e) => setGrowthError(e.message))
      .finally(() => setGrowthLoading(false));

    getExpiringRenewals(schoolId, 30)
      .then(setExpiring)
      .catch((e) => setExpiringError(e.message))
      .finally(() => setExpiringLoading(false));
  }, [schoolId]);

  const totalRevenue = categoryRevenue.reduce((s, r) => s + r.total, 0);

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Students",
            value: students.length,
            icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Total Revenue",
            value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Expiring Soon",
            value: expiring.length,
            icon: AlertCircle,
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            label: "Weeks of Data",
            value: attendance.length,
            icon: Calendar,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
          >
            <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
              <card.icon size={16} className={card.color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Attendance trend */}
      <SectionCard
        title="Attendance Trend (Last 12 Weeks)"
        icon={Calendar}
        loading={attendanceLoading}
        error={attendanceError}
      >
        {attendance.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No attendance data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={attendance} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="present" name="Present" fill="#16a34a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill="#dc2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* Revenue charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard
          title="Revenue by Category"
          icon={DollarSign}
          loading={revenueLoading}
          error={revenueError}
        >
          {categoryRevenue.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No sales data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryRevenue}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(props) => {
                    const category = (props as { category?: string }).category ?? "";
                    const percent = props.percent ?? 0;
                    return `${category} ${(percent * 100).toFixed(0)}%`;
                  }}
                  labelLine={false}
                >
                  {categoryRevenue.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard
          title="Revenue by Payment Type"
          icon={DollarSign}
          loading={revenueLoading}
          error={revenueError}
        >
          {paymentRevenue.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No sales data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={paymentRevenue}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={56} />
                <Tooltip
                  formatter={(value) =>
                    `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                  }
                />
                <Bar dataKey="total" name="Revenue" fill="#2563eb" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Student growth */}
      <SectionCard
        title="Student Growth"
        icon={TrendingUp}
        loading={growthLoading}
        error={growthError}
      >
        {growth.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No student data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={growth} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                name="Students"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* Expiring renewals */}
      <SectionCard
        title="Expiring Renewals (Next 30 Days)"
        icon={AlertCircle}
        loading={expiringLoading}
        error={expiringError}
      >
        {expiring.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No renewals expiring in the next 30 days.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Student
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Expires
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Days Left
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {expiring.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium text-gray-800">
                      {studentMap[r.student_id] ?? r.student_id}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">
                      {new Date(r.expiration_date + "T12:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.daysLeft <= 7
                            ? "bg-red-100 text-red-700"
                            : r.daysLeft <= 14
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {r.daysLeft} day{r.daysLeft !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {r.balance > 0 ? (
                        <span className="text-red-600 font-medium">
                          ${r.balance.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};
