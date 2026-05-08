import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { RenewalCategoryProps } from "../../../../types/student_renewal";

export const RenewalCategory: React.FC<RenewalCategoryProps> = ({
  title,
  icon,
  periods,
  borderColor,
  children,
}) => {
  const [open, setOpen] = useState(true);

  if (!periods?.length) return null;

  return (
    <section className={`bg-white rounded-xl shadow-lg border-l-4 ${borderColor}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <span className="text-2xl font-bold flex items-center gap-2 text-black">
          <span>{icon}</span>
          {`${title} (${periods.length})`}
        </span>
        {open ? (
          <FaChevronUp className="text-gray-400 shrink-0" />
        ) : (
          <FaChevronDown className="text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>
        </div>
      )}
    </section>
  );
};
