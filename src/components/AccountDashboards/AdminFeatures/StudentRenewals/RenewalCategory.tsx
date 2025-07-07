import { RenewalCategoryProps } from "../../../../types/student_renewal";

export const RenewalCategory: React.FC<RenewalCategoryProps> = ({ title, icon, renewals, borderColor, children }) => {
  if (renewals.length === 0) return null;

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${borderColor}`}>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        {title} ({renewals.length})
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};