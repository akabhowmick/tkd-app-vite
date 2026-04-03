import {
  DollarSign,
  Users,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { useSchool } from "../../../context/SchoolContext";
import { useStudentRenewals } from "../../../context/StudentRenewalContext";

const CARDS = [
  {
    icon: DollarSign,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    title: "Today's Revenue",
    key: "sales" as const,
    format: (v: number) => `$${v.toLocaleString()}`,
    change: "+5%",
    positive: true,
  },
  {
    icon: CalendarCheck,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    title: "Today's Attendance",
    key: "attendance" as const,
    format: (v: number) => String(v),
    change: "+3%",
    positive: true,
  },
  {
    icon: Users,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    title: "Total Students",
    key: "clients" as const,
    format: (v: number) => String(v),
    change: "-2%",
    positive: false,
  },
  {
    icon: AlertCircle,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    title: "Expiring Renewals",
    key: "expiring" as const,
    format: (v: number) => String(v),
    change: "",
    positive: false,
  },
];

export const StatCards = () => {
  const schoolData = useSchool();
  const { grouped } = useStudentRenewals();

  const expiringCount = grouped.expiring_soon.length + grouped.grace_period.length;

  return (
    <div className="space-y-6">
      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {CARDS.map((card, i) => {
          const value =
            card.key === "expiring"
              ? card.format(expiringCount)
              : card.format(schoolData[card.key] as number);
          const Icon = card.icon;
          const TrendIcon = card.positive ? TrendingUp : TrendingDown;

          return (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${card.iconBg}`}>
                  <Icon size={20} className={card.iconColor} />
                </div>
                <span
                  className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                    card.positive ? "text-green-700 bg-green-100" : "text-red-600 bg-red-100"
                  }`}
                >
                  <TrendIcon size={12} />
                  {card.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.title}</p>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Take Attendance", color: "bg-blue-600 hover:bg-blue-700" },
            { label: "Add Student", color: "bg-green-600 hover:bg-green-700" },
            { label: "New Renewal", color: "bg-purple-600 hover:bg-purple-700" },
            { label: "View Reports", color: "bg-gray-700 hover:bg-gray-800" },
          ].map((action) => (
            <button
              key={action.label}
              className={`${action.color} text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Placeholder recent activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            {
              text: "Attendance recorded for Taekwondo class",
              time: "2 min ago",
              dot: "bg-green-500",
            },
            { text: "New student added: Jane Smith", time: "1 hr ago", dot: "bg-blue-500" },
            { text: "Renewal expiring: John Doe", time: "3 hr ago", dot: "bg-yellow-500" },
            { text: "Payment received: $120.00", time: "Yesterday", dot: "bg-purple-500" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${item.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{item.text}</p>
                <p className="text-xs text-gray-400">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
