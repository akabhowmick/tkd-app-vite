import {
  DollarSign,
  Users,
  CalendarCheck,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
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
    changeKey: "salesChange" as const,
    format: (v: number) => `$${v.toLocaleString()}`,
  },
  {
    icon: CalendarCheck,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    title: "Today's Attendance",
    key: "attendance" as const,
    changeKey: "attendanceChange" as const,
    format: (v: number) => String(v),
  },
  {
    icon: Users,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    title: "Total Students",
    key: "clients" as const,
    changeKey: "clientsChange" as const,
    format: (v: number) => String(v),
  },
  {
    icon: AlertCircle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    title: "Expiring Renewals",
    key: "expiring" as const,
    changeKey: null,
    format: (v: number) => String(v),
  },
];

const ChangeBadge = ({ change }: { change: number | null | undefined }) => {
  if (change == null) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full text-gray-400 bg-gray-100">
        <Minus size={12} />
        N/A
      </span>
    );
  }

  const positive = change >= 0;
  const TrendIcon = positive ? TrendingUp : TrendingDown;
  const label = `${positive ? "+" : ""}${change}%`;

  return (
    <span
      className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
        positive ? "text-green-700 bg-green-100" : "text-red-600 bg-red-100"
      }`}
    >
      <TrendIcon size={12} />
      {label}
    </span>
  );
};

export const StatCards = () => {
  const schoolData = useSchool();
  const { grouped, recentActivity } = useStudentRenewals();

  const expiringCount = grouped.expiring_soon.length + grouped.grace_period.length;

  return (
    <div className="space-y-6">
      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        {CARDS.map((card, i) => {
          const raw =
            card.key === "expiring"
              ? expiringCount
              : (schoolData[card.key as keyof typeof schoolData] as number);

          const value = card.format(raw);
          const Icon = card.icon;

          // Pull change from real data; null means unavailable
          const change: number | null =
            card.changeKey != null
              ? ((schoolData[card.changeKey as keyof typeof schoolData] as number | null) ?? null)
              : null;

          return (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${card.iconBg}`}>
                  <Icon size={20} className={card.iconColor} />
                </div>

                {card.key === "expiring" ? (
                  expiringCount > 0 ? (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full text-red-600 bg-red-100">
                      Needs attention
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full text-green-700 bg-green-100">
                      All clear
                    </span>
                  )
                ) : (
                  <ChangeBadge change={change} />
                )}
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

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>

        {!recentActivity || recentActivity.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No recent activity to show.</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${item.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{item.text}</p>
                  <p className="text-xs text-gray-400">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
