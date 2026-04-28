export const BELT_COLORS = [
  { value: "#FFFFFF", label: "White" },
  { value: "#FFEB3B", label: "Yellow" },
  { value: "#FF9800", label: "Orange" },
  { value: "#4CAF50", label: "Green" },
  { value: "#2196F3", label: "Blue" },
  { value: "#9C27B0", label: "Purple" },
  { value: "#F44336", label: "Red" },
  { value: "#795548", label: "Brown" },
  { value: "#000000", label: "Black" },
];

export const BeltPreview = ({ color, stripe }: { color: string; stripe?: string | null }) => (
  <div className="h-8 w-8 rounded-md border border-border shrink-0 overflow-hidden flex flex-col">
    {stripe ? (
      <>
        <div className="flex-1" style={{ backgroundColor: color }} />
        <div className="flex-1" style={{ backgroundColor: stripe }} />
        <div className="flex-1" style={{ backgroundColor: color }} />
      </>
    ) : (
      <div className="h-full w-full" style={{ backgroundColor: color }} />
    )}
  </div>
);
