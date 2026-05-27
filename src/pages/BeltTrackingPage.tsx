import { useState } from "react";
import { useBelts } from "../context/BeltContext";
import { useSchool } from "../context/SchoolContext";
import { BeltRank, PromotionType } from "../types/belts";
import { FaPlus, FaTrophy, FaTrash, FaMedal, FaPencilAlt, FaTimes } from "react-icons/fa";
import { AppConfirmModal } from "../components/ui/modal";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { BeltPreview, BELT_COLORS } from "../components/AccountDashboards/AdminFeatures/BeltTracking/beltUtils";

// ── Types ─────────────────────────────────────────────────────────────────────
type ActivePanel = "rank" | "promote" | null;

type RankForm = { rank_name: string; rank_order: string; color_code: string; stripe_color: string };
const emptyRankForm = (): RankForm => ({ rank_name: "", rank_order: "1", color_code: "#FFFFFF", stripe_color: "" });
const rankFormFrom = (r: BeltRank): RankForm => ({
  rank_name: r.rank_name, rank_order: String(r.rank_order),
  color_code: r.color_code, stripe_color: r.stripe_color ?? "",
});

type PromoForm = {
  student_id: string; to_rank_id: string; promotion_date: string;
  promotion_type: PromotionType; test_score: string; promoted_by: string; notes: string;
};
const emptyPromoForm = (): PromoForm => ({
  student_id: "", to_rank_id: "",
  promotion_date: new Date().toISOString().split("T")[0],
  promotion_type: "manual", test_score: "", promoted_by: "", notes: "",
});

// ── Skeleton ──────────────────────────────────────────────────────────────────
const BeltTrackingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-9 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40" /><Skeleton className="h-9 w-28" />
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
                <Skeleton className="h-5 w-32" /><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ── Color option ──────────────────────────────────────────────────────────────
const ColorOption = ({ value, label }: { value: string; label: string }) => (
  <SelectItem value={value}>
    <span className="flex items-center gap-2">
      <span className="inline-block h-3 w-3 rounded-sm border border-border" style={{ backgroundColor: value }} />
      {label}
    </span>
  </SelectItem>
);

// ── Main component ────────────────────────────────────────────────────────────
export const BeltTrackingPage = () => {
  const { ranks, promotions, loading, deleteRank, deletePromotionRecord, createRank, updateRank, promoteStudent } = useBelts();
  const { students } = useSchool();
  const [activeTab, setActiveTab] = useState<"ranks" | "promotions">("ranks");

  // ── Panel state ────────────────────────────────────────────────────────────
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [editingRank, setEditingRank] = useState<BeltRank | null>(null);

  const [rankForm, setRankForm] = useState<RankForm>(emptyRankForm());
  const [rankLoading, setRankLoading] = useState(false);
  const [rankError, setRankError] = useState<string | null>(null);

  const [promoForm, setPromoForm] = useState<PromoForm>(emptyPromoForm());
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // ── Delete state ───────────────────────────────────────────────────────────
  const [deleteRankConfirm, setDeleteRankConfirm] = useState<{
    open: boolean; rankId: string; rankName: string; loading: boolean;
  }>({ open: false, rankId: "", rankName: "", loading: false });
  const [deletePromoConfirm, setDeletePromoConfirm] = useState<{
    open: boolean; promotionId: string; loading: boolean;
  }>({ open: false, promotionId: "", loading: false });

  // ── Panel helpers ──────────────────────────────────────────────────────────
  const openNewRank = () => {
    setEditingRank(null);
    setRankForm(emptyRankForm());
    setRankError(null);
    setActivePanel("rank");
  };
  const openEditRank = (rank: BeltRank) => {
    setEditingRank(rank);
    setRankForm(rankFormFrom(rank));
    setRankError(null);
    setActivePanel("rank");
  };
  const openPromote = () => {
    setPromoForm(emptyPromoForm());
    setPromoError(null);
    setActivePanel("promote");
  };
  const closePanel = () => { setActivePanel(null); setEditingRank(null); };

  const setRF = <K extends keyof RankForm>(k: K, v: RankForm[K]) => setRankForm((f) => ({ ...f, [k]: v }));
  const setPF = <K extends keyof PromoForm>(k: K, v: PromoForm[K]) => setPromoForm((f) => ({ ...f, [k]: v }));

  const rankConflict = ranks.find(
    (r) => r.rank_order === parseInt(rankForm.rank_order) && r.rank_id !== editingRank?.rank_id,
  );

  const selectedStudent = students.find((s) => s.id === promoForm.student_id);
  const currentRank = selectedStudent ? ranks.find((r) => r.rank_id === selectedStudent.current_rank_id) : null;

  // ── Submit handlers ────────────────────────────────────────────────────────
  const handleRankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRankError(null);
    if (!rankForm.rank_name.trim()) return setRankError("Rank name is required.");
    if (rankConflict) return setRankError(`Order ${rankForm.rank_order} is already taken by "${rankConflict.rank_name}".`);
    setRankLoading(true);
    try {
      const payload = {
        rank_name: rankForm.rank_name.trim(),
        rank_order: parseInt(rankForm.rank_order) || 1,
        color_code: rankForm.color_code,
        stripe_color: rankForm.stripe_color || undefined,
      };
      if (editingRank) {
        await updateRank(editingRank.rank_id, payload);
      } else {
        await createRank(payload);
      }
      closePanel();
    } catch (err) {
      setRankError(err instanceof Error ? err.message : `Failed to ${editingRank ? "update" : "create"} rank.`);
    } finally {
      setRankLoading(false);
    }
  };

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    if (!promoForm.student_id) return setPromoError("Please select a student.");
    if (!promoForm.to_rank_id) return setPromoError("Please select a target rank.");
    if (!promoForm.promoted_by.trim()) return setPromoError("Promoted By is required.");
    setPromoLoading(true);
    try {
      await promoteStudent({
        student_id: promoForm.student_id,
        from_rank_id: currentRank?.rank_id,
        to_rank_id: promoForm.to_rank_id,
        promotion_date: promoForm.promotion_date,
        promotion_type: promoForm.promotion_type,
        test_score: promoForm.test_score ? parseFloat(promoForm.test_score) : undefined,
        promoted_by: promoForm.promoted_by.trim(),
        notes: promoForm.notes.trim() || undefined,
      });
      closePanel();
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : "Failed to promote student.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleDeleteRank = async () => {
    setDeleteRankConfirm((s) => ({ ...s, loading: true }));
    try { await deleteRank(deleteRankConfirm.rankId); }
    finally { setDeleteRankConfirm({ open: false, rankId: "", rankName: "", loading: false }); }
  };
  const handleDeletePromotion = async () => {
    setDeletePromoConfirm((s) => ({ ...s, loading: true }));
    try { await deletePromotionRecord(deletePromoConfirm.promotionId); }
    finally { setDeletePromoConfirm({ open: false, promotionId: "", loading: false }); }
  };

  if (loading && ranks.length === 0) return <BeltTrackingSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Belt Tracking</h1>
          <div className="flex gap-2">
            {activePanel !== "promote" && (
              <button
                onClick={openPromote}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <FaTrophy /> Promote Student
              </button>
            )}
            {activePanel !== "rank" && (
              <button
                onClick={openNewRank}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus /> New Rank
              </button>
            )}
          </div>
        </div>

        {/* ── Inline Rank form panel ── */}
        {activePanel === "rank" && (
          <div className="bg-white border border-blue-200 rounded-lg shadow-sm p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{editingRank ? "Edit Belt Rank" : "New Belt Rank"}</h2>
              <button onClick={closePanel} className="text-gray-400 hover:text-gray-600"><FaTimes size={16} /></button>
            </div>
            <form onSubmit={handleRankSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rank Name <span className="text-red-500">*</span></label>
                  <Input placeholder="e.g., White Belt" value={rankForm.rank_name} onChange={(e) => setRF("rank_name", e.target.value)} autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rank Order <span className="text-red-500">*</span></label>
                  <Input
                    type="number" min={1} placeholder="1"
                    value={rankForm.rank_order}
                    onChange={(e) => setRF("rank_order", e.target.value)}
                    className={rankConflict ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {rankConflict && (
                    <p className="mt-1 text-xs text-red-600">Taken by "{rankConflict.rank_name}"</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <BeltPreview color={rankForm.color_code} stripe={rankForm.stripe_color} />
                    <Select value={rankForm.color_code} onValueChange={(v) => setRF("color_code", v)}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BELT_COLORS.map((c) => <ColorOption key={c.value} {...c} />)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Stripe <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <Select value={rankForm.stripe_color || "none"} onValueChange={(v) => setRF("stripe_color", v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="No stripe" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No stripe</SelectItem>
                      {BELT_COLORS.map((c) => <ColorOption key={c.value} {...c} />)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {rankError && <p className="text-sm text-red-600 mb-3">{rankError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closePanel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={rankLoading || !!rankConflict} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {rankLoading ? "Saving…" : editingRank ? "Save Changes" : "Create Rank"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Inline Promote panel ── */}
        {activePanel === "promote" && (
          <div className="bg-white border border-green-200 rounded-lg shadow-sm p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Promote Student</h2>
              <button onClick={closePanel} className="text-gray-400 hover:text-gray-600"><FaTimes size={16} /></button>
            </div>
            <form onSubmit={handlePromoSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Student <span className="text-red-500">*</span></label>
                  <Select value={promoForm.student_id} onValueChange={(v) => setPF("student_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Choose a student" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={String(s.id)} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStudent && (
                    <p className="text-xs text-gray-500 mt-1">Current rank: <span className="font-medium">{currentRank?.rank_name ?? "None"}</span></p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Promote To <span className="text-red-500">*</span></label>
                  <Select value={promoForm.to_rank_id} onValueChange={(v) => setPF("to_rank_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select rank" /></SelectTrigger>
                    <SelectContent>
                      {ranks.map((r) => (
                        <SelectItem key={r.rank_id} value={r.rank_id}>{r.rank_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Promoted By <span className="text-red-500">*</span></label>
                  <Input placeholder="Master Lee" value={promoForm.promoted_by} onChange={(e) => setPF("promoted_by", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Promotion Date <span className="text-red-500">*</span></label>
                  <Input type="date" value={promoForm.promotion_date} onChange={(e) => setPF("promotion_date", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Promotion Type <span className="text-red-500">*</span></label>
                  <Select value={promoForm.promotion_type} onValueChange={(v) => setPF("promotion_type", v as PromotionType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="test">Test-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Test Score <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Input type="number" step="0.01" placeholder="95.5" value={promoForm.test_score} onChange={(e) => setPF("test_score", e.target.value)} />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Textarea placeholder="Additional notes..." rows={2} value={promoForm.notes} onChange={(e) => setPF("notes", e.target.value)} />
                </div>
              </div>
              {promoError && <p className="text-sm text-red-600 mb-3">{promoError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closePanel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={promoLoading} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                  {promoLoading ? "Promoting…" : "Promote"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            {(["ranks", "promotions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-3 font-medium transition-colors capitalize ${
                  activeTab === tab ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
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
                  <button onClick={openNewRank} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Create First Rank</button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {ranks.map((rank) => {
                    const mainLabel = BELT_COLORS.find((c) => c.value === rank.color_code)?.label;
                    const stripeLabel = rank.stripe_color ? BELT_COLORS.find((c) => c.value === rank.stripe_color)?.label : null;
                    return (
                      <div key={rank.rank_id} className="border rounded-lg overflow-hidden">
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
                              {mainLabel}{stripeLabel ? ` · ${stripeLabel} stripe` : ""}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openEditRank(rank)} className="text-blue-500 hover:text-blue-700"><FaPencilAlt /></button>
                            <button
                              onClick={() => setDeleteRankConfirm({ open: true, rankId: rank.rank_id, rankName: rank.rank_name, loading: false })}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTrash />
                            </button>
                          </div>
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
                    <div key={promo.promotion_id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">{student?.name || "Unknown Student"}</h3>
                        <p className="text-sm text-gray-600">
                          {promo.from_rank?.rank_name || "No rank"} → <span className="font-medium">{promo.to_rank.rank_name}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(promo.promotion_date).toLocaleDateString()} · {promo.promotion_type}
                          {promo.test_score && ` · Score: ${promo.test_score}`} · by {promo.promoted_by}
                        </p>
                        {promo.notes && <p className="text-xs text-gray-400 mt-1 italic">{promo.notes}</p>}
                      </div>
                      <button
                        onClick={() => setDeletePromoConfirm({ open: true, promotionId: promo.promotion_id, loading: false })}
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

      <AppConfirmModal
        open={deleteRankConfirm.open}
        onOpenChange={(open) => !deleteRankConfirm.loading && setDeleteRankConfirm((s) => ({ ...s, open }))}
        title="Delete Rank?"
        description={`Are you sure you want to delete "${deleteRankConfirm.rankName}"?`}
        onConfirm={handleDeleteRank}
        loading={deleteRankConfirm.loading}
        confirmLabel="Delete Rank"
      />
      <AppConfirmModal
        open={deletePromoConfirm.open}
        onOpenChange={(open) => !deletePromoConfirm.loading && setDeletePromoConfirm((s) => ({ ...s, open }))}
        title="Delete Promotion?"
        description="Are you sure you want to delete this promotion record?"
        onConfirm={handleDeletePromotion}
        loading={deletePromoConfirm.loading}
        confirmLabel="Delete"
      />
    </div>
  );
};
