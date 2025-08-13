import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface StatCardProps {
  icon: IconDefinition;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}
export const StatCard = ({ icon, title, value, change, isPositive }: StatCardProps) => (
  <div className="bg-white p-6 rounded-lg shadow-md text-black">
    <div className="flex items-center mb-4">
      <FontAwesomeIcon icon={icon} />
      <div className="ml-4">
        <p className="text-gray-600">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
    <p className={isPositive ? "text-green-500" : "text-red-500"}>{change}</p>
  </div>
);
