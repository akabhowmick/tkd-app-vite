import { useState } from "react";
import { useBelts } from "../context/BeltContext";
import { useSchool } from "../context/SchoolContext";
import { FaPlus, FaTrophy, FaTrash, FaMedal } from "react-icons/fa";
import { AppConfirmModal } from "../components/ui/modal";
import { Skeleton } from "../components/ui/skeleton";
import { CreateRankModal } from "../components/AccountDashboards/AdminFeatures/BeltTracking/CreateRankModal";
import { PromoteStudentModal } from "../components/AccountDashboards/AdminFeatures/BeltTracking/PromoteStudentModal";
import { BELT_COLORS } from "../components/AccountDashboards/AdminFeatures/BeltTracking/beltUtils";

const BeltTrackingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-9 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <Skeleton className="flex-1 h-11 rounded-none rounded-tl-lg" />
          <Skeleton className="flex-1 h-11 rounded-none rounded-tr-lg" />
        </div>
        <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <Skeleton className="h-14 w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const BeltTrackingPage = () => {
  const { ranks, promotions, loading, deleteRank, deletePromotionRecord } = useBelts();
  const { students } = useSchool();
  const [activeTab, setActiveTab] = useState<"ranks" | "promotions">("ranks");
  const [rankModalOpen, setRankModalOpen] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);

  const [deleteRankConfirm, setDeleteRankConfirm] = useState<{
    open: boolean;
    rankId: string;
    rankName: string;
    loading: boolean;
  }>({ open: false, rankId: "", rankName: "", loading: false });

  const [deletePromoConfirm, setDeletePromoConfirm] = useState<{
    open: boolean;
    promotionId: string;
    loading: boolean;
  }>({ open: false, promotionId: "", loading: false });

  const handleDeleteRank = async () => {
    setDeleteRankConfirm((s) => ({ ...s, loading: true }));
    try {
      await deleteRank(deleteRankConfirm.rankId);
    } finally {
      setDeleteRankConfirm({ open: false, rankId: "", rankName: "", loading: false });
    }
  };

  const handleDeletePromotion = async () => {
    setDeletePromoConfirm((s) => ({ ...s, loading: true }));
    try {
      await deletePromotionRecord(deletePromoConfirm.promotionId);
    } finally {
      setDeletePromoConfirm({ open: false, promotionId: "", loading: false });
    }
  };

  if (loading && ranks.length === 0) return <BeltTrackingSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Belt Tracking</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setPromoModalOpen(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaTrophy /> Promote Student
            </button>
            <button
              onClick={() => setRankModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus /> New Rank
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            {(["ranks", "promotions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-3 font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab === "ranks" ? "Belt Ranks" : "Promotion History"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "ranks" ? (
              ranks.length === 0 ? (
                <div className="text-center py-12">
                  <FaMedal className="mx-auto text-gray-300 text-5xl mb-4" />
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">No Belt Ranks Yet</h2>
                  <p className="text-gray-500 mb-4">Create your first belt rank to get started</p>
                  <button
                    onClick={() => setRankModalOpen(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create First Rank
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {ranks.map((rank) => {
                    const mainLabel = BELT_COLORS.find((c) => c.value === rank.color_code)?.label;
                    const stripeLabel = rank.stripe_color
                      ? BELT_COLORS.find((c) => c.value === rank.stripe_color)?.label
                      : null;
                    return (
                      <div key={rank.rank_id} className="border rounded-lg overflow-hidden">
                        {/* Full-width belt color band */}
                        <div className="h-14 w-full overflow-hidden flex flex-col border-b">
                          {rank.stripe_color ? (
                            <>
                              <div className="flex-1" style={{ backgroundColor: rank.color_code }} />
                              <div className="h-3.5" style={{ backgroundColor: rank.stripe_color }} />
                              <div className="flex-1" style={{ backgroundColor: rank.color_code }} />
                            </>
                          ) : (
                            <div className="h-full w-full" style={{ backgroundColor: rank.color_code }} />
                          )}
                        </div>
                        <div className="p-4 flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{rank.rank_name}</h3>
                            <p className="text-sm text-gray-500">Order: {rank.rank_order}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {mainLabel}
                              {stripeLabel ? ` · ${stripeLabel} stripe` : ""}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setDeleteRankConfirm({
                                open: true,
                                rankId: rank.rank_id,
                                rankName: rank.rank_name,
                                loading: false,
                              })
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : promotions.length === 0 ? (
              <div className="text-center py-12">
                <FaTrophy className="mx-auto text-gray-300 text-5xl mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">No Promotions Yet</h2>
                <p className="text-gray-500">Promotion history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {promotions.map((promo) => {
                  const student = students.find((s) => s.id === promo.student_id);
                  return (
                    <div
                      key={promo.promotion_id}
                      className="border rounded-lg p-4 flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {student?.name || "Unknown Student"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {promo.from_rank?.rank_name || "No rank"} →{" "}
                          <span className="font-medium">{promo.to_rank.rank_name}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(promo.promotion_date).toLocaleDateString()} ·{" "}
                          {promo.promotion_type}
                          {promo.test_score && ` · Score: ${promo.test_score}`} · by{" "}
                          {promo.promoted_by}
                        </p>
                        {promo.notes && (
                          <p className="text-xs text-gray-400 mt-1 italic">{promo.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setDeletePromoConfirm({
                            open: true,
                            promotionId: promo.promotion_id,
                            loading: false,
                          })
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateRankModal open={rankModalOpen} onOpenChange={setRankModalOpen} ranks={ranks} />
      <PromoteStudentModal open={promoModalOpen} onOpenChange={setPromoModalOpen} />

      <AppConfirmModal
        open={deleteRankConfirm.open}
        onOpenChange={(open) =>
          !deleteRankConfirm.loading && setDeleteRankConfirm((s) => ({ ...s, open }))
        }
        title="Delete Rank?"
        description={`Are you sure you want to delete "${deleteRankConfirm.rankName}"?`}
        onConfirm={handleDeleteRank}
        loading={deleteRankConfirm.loading}
        confirmLabel="Delete Rank"
      />

      <AppConfirmModal
        open={deletePromoConfirm.open}
        onOpenChange={(open) =>
          !deletePromoConfirm.loading && setDeletePromoConfirm((s) => ({ ...s, open }))
        }
        title="Delete Promotion?"
        description="Are you sure you want to delete this promotion record?"
        onConfirm={handleDeletePromotion}
        loading={deletePromoConfirm.loading}
        confirmLabel="Delete"
      />
    </div>
  );
};
