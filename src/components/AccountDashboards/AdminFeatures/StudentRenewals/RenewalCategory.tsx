import React from "react";
import { RenewalCategoryProps } from "../../../../types/student_renewal";

export const RenewalCategory: React.FC<RenewalCategoryProps> = ({
  title,
  icon,
  renewals,
  borderColor,
  children,
}) => {
  if (!renewals?.length) return null;

  return (
    <section className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${borderColor}`}>
      <header className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span>{icon}</span>
        {`${title} (${renewals.length})`}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
};
