import { useMemo } from "react";
import { ExpiringRenewal } from "../api/ReportingRequests/reportingRequests";
import { useReporting } from "../context/ReportingContext";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useSchool } from "../context/SchoolContext";
import { useBelts } from "../context/BeltContext";
import { AlertCircle, TrendingUp, Users, DollarSign, Calendar, Award } from "lucide-react";

const COLORS = ["#be123c", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2"];
const MONEY_FMT = (v: unknown) =>
  `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

// ── Shared card wrapper ───────────────────────────────────────────────────────

const SectionCard = ({
  title, icon: Icon, children, loading, error,
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
    ) : children}
  </div>
);

// ── Sub-components ────────────────────────────────────────────────────────────

const ExpiringRenewalsTable = ({
  expiring,
  studentMap,
}: {
  expiring: ExpiringRenewal[];
  studentMap: Record<string, string>;
}) => {
  if (expiring.length === 0)
    return <p className="text-sm text-gray-400 text-center py-8">No renewals expiring in the next 30 days.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["Student", "Expires", "Days Left"].map((h) => (
              <th key={h} scope="col" className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
            <th scope="col" className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Balance</th>
          </tr>
        </thead>
        <tbody>
          {expiring.map((r, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="py-2.5 px-3 font-medium text-gray-800">{studentMap[r.student_id] ?? r.student_id}</td>
              <td className="py-2.5 px-3 text-gray-600">
                {new Date(r.expiration_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </td>
              <td className="py-2.5 px-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  r.daysLeft <= 7 ? "bg-red-100 text-red-700" : r.daysLeft <= 14 ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {r.daysLeft} day{r.daysLeft !== 1 ? "s" : ""}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right">
                {r.balance > 0
                  ? <span className="text-red-600 font-medium">${r.balance.toFixed(2)}</span>
                  : <span className="text-green-600 font-medium">Paid</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export const ReportingPage = () => {
  const { students } = useSchool();
  const { ranks, loading: beltsLoading } = useBelts();
  const {
    attendance, attendanceLoading, attendanceError,
    categoryRevenue, paymentRevenue, revenueLoading, revenueError,
    growth, growthLoading, growthError,
    expiring, expiringLoading, expiringError,
  } = useReporting();

  const studentMap = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s.name])),
    [students],
  );

  const beltDistribution = useMemo(() => {
    const countMap: Record<string, number> = {};
    students.forEach((s) => {
      const key = s.current_rank_id ?? "__unranked__";
      countMap[key] = (countMap[key] ?? 0) + 1;
    });
    const rows = [...ranks]
      .sort((a, b) => a.rank_order - b.rank_order)
      .map((r) => ({ name: r.rank_name, count: countMap[r.rank_id] ?? 0, color: r.color_code }));
    const unranked = countMap["__unranked__"] ?? 0;
    if (unranked > 0) rows.push({ name: "Unranked", count: unranked, color: "#9ca3af" });
    return rows;
  }, [ranks, students]);

  const totalRevenue = categoryRevenue.reduce((s, r) => s + r.total, 0);

  const summaryCards = [
    { label: "Total Students", value: students.length, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Revenue", value: MONEY_FMT(totalRevenue), icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Expiring Soon", value: expiring.length, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Weeks of Data", value: attendance.length, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
              <card.icon size={16} className={card.color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <SectionCard title="Expiring Renewals (Next 30 Days)" icon={AlertCircle} loading={expiringLoading} error={expiringError}>
        <ExpiringRenewalsTable expiring={expiring} studentMap={studentMap} />
      </SectionCard>

      <SectionCard title="Attendance Trend (Last 12 Weeks)" icon={Calendar} loading={attendanceLoading} error={attendanceError}>
        {attendance.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No attendance data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={attendance} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="present" name="Present" fill="#16a34a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Revenue by Category" icon={DollarSign} loading={revenueLoading} error={revenueError}>
          {categoryRevenue.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No sales data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryRevenue} dataKey="total" nameKey="category"
                  cx="50%" cy="50%" outerRadius={80} labelLine={false}
                  label={(props) => {
                    const category = (props as { category?: string }).category ?? "";
                    return `${category} ${((props.percent ?? 0) * 100).toFixed(0)}%`;
                  }}
                >
                  {categoryRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={MONEY_FMT} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Revenue by Payment Type" icon={DollarSign} loading={revenueLoading} error={revenueError}>
          {paymentRevenue.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No sales data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={paymentRevenue} layout="vertical" margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={56} />
                <Tooltip formatter={MONEY_FMT} />
                <Bar dataKey="total" name="Revenue" fill="#2563eb" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Student Growth" icon={TrendingUp} loading={growthLoading} error={growthError}>
        {growth.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No student data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={growth} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="total" name="Students" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      <SectionCard title="Students by Belt Rank" icon={Award} loading={beltsLoading && ranks.length === 0} error={null}>
        {beltDistribution.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No belt ranks configured yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <ResponsiveContainer width="100%" height={Math.max(180, beltDistribution.length * 36)}>
              <BarChart data={beltDistribution} layout="vertical" margin={{ top: 4, right: 32, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={96} />
                <Tooltip formatter={(value) => [value, "Students"]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                <Bar dataKey="count" name="Students" radius={[0, 3, 3, 0]} label={{ position: "right", fontSize: 11 }}>
                  {beltDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
              {beltDistribution.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}</span>
                  <span className="font-semibold text-gray-800">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
};
