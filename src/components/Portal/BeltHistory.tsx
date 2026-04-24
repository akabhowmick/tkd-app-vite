import { useEffect, useState } from "react";
import { getStudentBeltHistory } from "../../api/PortalRequests/portalRequests";
import { PromotionWithRanks } from "../../types/belts";
import { Award } from "lucide-react";

interface Props {
  studentId: string;
  studentName?: string;
}

const BeltSwatch = ({ color, stripe }: { color: string; stripe?: string | null }) => (
  <div className="h-5 w-5 rounded border border-gray-200 overflow-hidden flex flex-col shrink-0">
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

export const BeltHistory = ({ studentId, studentName }: Props) => {
  const [history, setHistory] = useState<PromotionWithRanks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    getStudentBeltHistory(studentId)
      .then(setHistory)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {studentName && (
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {studentName}
        </p>
      )}

      {/* Current belt */}
      {history.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <BeltSwatch
            color={history[0].to_rank.color_code}
            stripe={history[0].to_rank.stripe_color}
          />
          <div>
            <p className="text-xs text-gray-400">Current Belt</p>
            <p className="text-sm font-semibold text-gray-900">{history[0].to_rank.rank_name}</p>
          </div>
        </div>
      )}

      {/* Full history */}
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Award size={28} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No promotions recorded yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((p) => (
            <div
              key={p.promotion_id}
              className="bg-white border border-gray-100 rounded-lg px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <BeltSwatch
                  color={p.to_rank.color_code}
                  stripe={p.to_rank.stripe_color}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.to_rank.rank_name}</p>
                  <p className="text-xs text-gray-400">
                    {p.from_rank ? `from ${p.from_rank.rank_name}` : "First rank"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {new Date(p.promotion_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-400 capitalize">{p.promotion_type}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
