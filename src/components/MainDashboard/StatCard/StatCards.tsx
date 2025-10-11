import { faWallet, faUser, faUserPlus, faChartLine } from "@fortawesome/free-solid-svg-icons";
import { StatCard } from "./StatCard";
import { useSchool } from "../../../context/SchoolContext";

const STAT_CARDS_CONFIG = [
  {
    icon: faWallet,
    title: "Today's Money",
    valueKey: "sales" as const,
    change: "+55% than last week",
    isPositive: true,
  },
  {
    icon: faUser,
    title: "Today's Attendance",
    valueKey: "attendance" as const,
    change: "+3% than last week",
    isPositive: true,
  },
  {
    icon: faUserPlus,
    title: "New Clients",
    valueKey: "clients" as const,
    change: "-2% than last month",
    isPositive: false,
  },
  {
    icon: faChartLine,
    title: "Sales",
    value: "sales" as const,
    change: "+5% than yesterday",
    isPositive: true,
  },
];

export const StatCards = () => {
  const schoolData = useSchool();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {STAT_CARDS_CONFIG.map((config, index) => (
        <StatCard
          key={index}   
          icon={config.icon}
          title={config.title}
          value={config.valueKey ? `${schoolData[config.valueKey]}` : config.value!}
          change={config.change}
          isPositive={config.isPositive}
        />
      ))}
    </div>
  );
};
