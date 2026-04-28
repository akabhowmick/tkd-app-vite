import React from "react";
import { ProgramType } from "../../../../types/programs";
import { Clock, Trophy } from "lucide-react";

export const PROGRAM_TYPE_LABELS: Record<
  ProgramType,
  { label: string; description: string; icon: React.ReactNode }
> = {
  time_based: {
    label: "Time-based",
    description: "Renewal expires after a set duration (e.g. 3 months)",
    icon: <Clock size={14} />,
  },
  milestone_based: {
    label: "Milestone-based",
    description: "Renewal continues until a goal is reached (e.g. Black Belt)",
    icon: <Trophy size={14} />,
  },
};

type Props = {
  value: ProgramType;
  onChange: (type: ProgramType) => void;
};

export const ProgramTypeSelector: React.FC<Props> = ({ value, onChange }) => (
  <div className="grid grid-cols-2 gap-3">
    {(["time_based", "milestone_based"] as ProgramType[]).map((type) => {
      const info = PROGRAM_TYPE_LABELS[type];
      const isSelected = value === type;
      return (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`flex flex-col gap-1.5 p-3 rounded-lg border-2 text-left transition-colors ${
            isSelected
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div
            className={`flex items-center gap-1.5 text-sm font-semibold ${
              isSelected ? "text-primary" : "text-gray-700"
            }`}
          >
            {info.icon}
            {info.label}
          </div>
          <p className="text-xs text-gray-500 leading-snug">{info.description}</p>
        </button>
      );
    })}
  </div>
);
