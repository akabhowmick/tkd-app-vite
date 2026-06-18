import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../../../ui/tooltip";
import { RenewalCategoryProps } from "../../../../types/student_renewal";

export const RenewalCategory: React.FC<RenewalCategoryProps> = ({
  title,
  icon,
  periods,
  borderColor,
  children,
  description,
}) => {
  const [open, setOpen] = useState(false);

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
          {description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info
                    className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help"
                    onClick={(e) => e.stopPropagation()}
                  />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-sm">
                  {description}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
