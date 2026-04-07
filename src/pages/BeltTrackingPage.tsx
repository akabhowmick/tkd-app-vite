import { useState } from "react";
import { useBelts } from "../context/BeltContext";
import { useSchool } from "../context/SchoolContext";
import { PromotionType } from "../types/belts";
import { FaPlus, FaTrophy, FaTrash, FaMedal } from "react-icons/fa";
import { AppFormModal, AppConfirmModal, ModalField, InfoBox } from "../components/ui/modal";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

const BELT_COLORS = [
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

type RankForm = { rank_name: string; rank_order: string; color_code: string };
type PromoForm = {
  student_id: string;
  to_rank_id: string;
  promotion_date: string;
  promotion_type: PromotionType;
  test_score: string;
  promoted_by: string;
  notes: string;
};

const emptyRankForm = (): RankForm => ({ rank_name: "", rank_order: "1", color_code: "#FFFFFF" });
const emptyPromoForm = (): PromoForm => ({
  student_id: "",
  to_rank_id: "",
  promotion_date: new Date().toISOString().split("T")[0],
  promotion_type: "manual",
  test_score: "",
  promoted_by: "",
  notes: "",
});

export const BeltTrackingPage = () => {
  const { ranks, promotions, loading, createRank, deleteRank, promoteStudent, deletePromotionRecord } =
    useBelts();
  const { students } = useSchool();
  const [activeTab, setActiveTab] = useState<"ranks" | "promotions">("ranks");

  // ── Create rank modal ──────────────────────────────────────────────────────
  const [rankModalOpen, setRankModalOpen] = useState(false);
  const [rankForm, setRankForm] = useState<RankForm>(emptyRankForm());
  const [rankLoading, setRankLoading] = useState(false);
  const [rankError, setRankError] = useState<string | null>(null);

  // ── Promote student modal ──────────────────────────────────────────────────
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [promoForm, setPromoForm] = useState<PromoForm>(emptyPromoForm());
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // ── Delete confirms ────────────────────────────────────────────────────────
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

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreateRank = async (e: React.FormEvent) => {
    e.preventDefault();
    setRankError(null);
    if (!rankForm.rank_name.trim()) {
      setRankError("Rank name is required.");
      return;
    }
    setRankLoading(true);
    try {
      await createRank({
        rank_name: rankForm.rank_name.trim(),
        rank_order: parseInt(rankForm.rank_order) || 1,
        color_code: rankForm.color_code,
      });
      setRankModalOpen(false);
      setRankForm(emptyRankForm());
    } catch (err) {
      setRankError(err instanceof Error ? err.message : "Failed to create rank.");
    } finally {
      setRankLoading(false);
    }
  };

  const handlePromoteStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    if (!promoForm.student_id) { setPromoError("Please select a student."); return; }
    if (!promoForm.to_rank_id) { setPromoError("Please select a target rank."); return; }
    if (!promoForm.promoted_by.trim()) { setPromoError("Promoted By is required."); return; }

    const student = students.find((s) => s.id === promoForm.student_id);
    const currentRank = student ? ranks.find((r) => r.rank_id === student.current_rank_id) : null;

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
      setPromoModalOpen(false);
      setPromoForm(emptyPromoForm());
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : "Failed to promote student.");
    } finally {
      setPromoLoading(false);
    }
  };

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

  const selectedStudent = students.find((s) => s.id === promoForm.student_id);
  const currentRank = selectedStudent
    ? ranks.find((r) => r.rank_id === selectedStudent.current_rank_id)
    : null;

  if (loading && ranks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading belt tracking...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Belt Tracking</h1>
          <div className="flex gap-2">
            <button
              onClick={() => { setPromoForm(emptyPromoForm()); setPromoError(null); setPromoModalOpen(true); }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaTrophy /> Promote Student
            </button>
            <button
              onClick={() => { setRankForm(emptyRankForm()); setRankError(null); setRankModalOpen(true); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus /> New Rank
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("ranks")}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === "ranks"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Belt Ranks
            </button>
            <button
              onClick={() => setActiveTab("promotions")}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === "promotions"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Promotion History
            </button>
          </div>

          <div className="p-6">
            {activeTab === "ranks" ? (
              ranks.length === 0 ? (
                <div className="text-center py-12">
                  <FaMedal className="mx-auto text-gray-300 text-5xl mb-4" />
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">No Belt Ranks Yet</h2>
                  <p className="text-gray-500 mb-4">Create your first belt rank to get started</p>
                  <button
                    onClick={() => { setRankForm(emptyRankForm()); setRankModalOpen(true); }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create First Rank
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {ranks.map((rank) => (
                    <div key={rank.rank_id} className="border rounded-lg overflow-hidden">
                      <div className="h-3" style={{ backgroundColor: rank.color_code }} />
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{rank.rank_name}</h3>
                            <p className="text-sm text-gray-500">Order: {rank.rank_order}</p>
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
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div>
                {promotions.length === 0 ? (
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
            )}
          </div>
        </div>
      </div>

      {/* ── Create Rank Modal ── */}
      <AppFormModal
        open={rankModalOpen}
        onOpenChange={setRankModalOpen}
        title="Create Belt Rank"
        size="compact"
        onSubmit={handleCreateRank}
        submitLabel="Create Rank"
        loading={rankLoading}
        error={rankError}
      >
        <ModalField label="Rank Name" required htmlFor="rank-name">
          <Input
            id="rank-name"
            placeholder="e.g., White Belt"
            value={rankForm.rank_name}
            onChange={(e) => setRankForm((f) => ({ ...f, rank_name: e.target.value }))}
          />
        </ModalField>
        <ModalField label="Rank Order" required htmlFor="rank-order">
          <Input
            id="rank-order"
            type="number"
            min={1}
            placeholder="1"
            value={rankForm.rank_order}
            onChange={(e) => setRankForm((f) => ({ ...f, rank_order: e.target.value }))}
          />
        </ModalField>
        <ModalField label="Color" required htmlFor="color-code">
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-md border border-border shrink-0"
              style={{ backgroundColor: rankForm.color_code }}
            />
            <Select
              value={rankForm.color_code}
              onValueChange={(v) => setRankForm((f) => ({ ...f, color_code: v }))}
            >
              <SelectTrigger id="color-code" className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BELT_COLORS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-sm border border-border"
                        style={{ backgroundColor: c.value }}
                      />
                      {c.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </ModalField>
      </AppFormModal>

      {/* ── Promote Student Modal ── */}
      <AppFormModal
        open={promoModalOpen}
        onOpenChange={setPromoModalOpen}
        title="Promote Student"
        size="default"
        onSubmit={handlePromoteStudent}
        submitLabel="Promote"
        loading={promoLoading}
        error={promoError}
      >
        <ModalField label="Student" required htmlFor="promo-student">
          <Select
            value={promoForm.student_id}
            onValueChange={(v) => setPromoForm((f) => ({ ...f, student_id: v }))}
          >
            <SelectTrigger id="promo-student">
              <SelectValue placeholder="Choose a student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={String(s.id)} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ModalField>

        {selectedStudent && (
          <InfoBox
            title="Current Rank"
            subtitle={currentRank?.rank_name ?? "None"}
          />
        )}

        <ModalField label="Promote To" required htmlFor="promo-to-rank">
          <Select
            value={promoForm.to_rank_id}
            onValueChange={(v) => setPromoForm((f) => ({ ...f, to_rank_id: v }))}
          >
            <SelectTrigger id="promo-to-rank">
              <SelectValue placeholder="Select rank" />
            </SelectTrigger>
            <SelectContent>
              {ranks.map((r) => (
                <SelectItem key={r.rank_id} value={r.rank_id}>
                  {r.rank_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ModalField>

        <div className="grid grid-cols-2 gap-4">
          <ModalField label="Promotion Date" required htmlFor="promo-date">
            <Input
              id="promo-date"
              type="date"
              value={promoForm.promotion_date}
              onChange={(e) => setPromoForm((f) => ({ ...f, promotion_date: e.target.value }))}
            />
          </ModalField>
          <ModalField label="Promotion Type" required htmlFor="promo-type">
            <Select
              value={promoForm.promotion_type}
              onValueChange={(v) => setPromoForm((f) => ({ ...f, promotion_type: v as PromotionType }))}
            >
              <SelectTrigger id="promo-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="test">Test-based</SelectItem>
              </SelectContent>
            </Select>
          </ModalField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ModalField label="Test Score" htmlFor="promo-score" helper="Optional">
            <Input
              id="promo-score"
              type="number"
              step="0.01"
              placeholder="95.5"
              value={promoForm.test_score}
              onChange={(e) => setPromoForm((f) => ({ ...f, test_score: e.target.value }))}
            />
          </ModalField>
          <ModalField label="Promoted By" required htmlFor="promo-by">
            <Input
              id="promo-by"
              placeholder="Master Lee"
              value={promoForm.promoted_by}
              onChange={(e) => setPromoForm((f) => ({ ...f, promoted_by: e.target.value }))}
            />
          </ModalField>
        </div>

        <ModalField label="Notes" htmlFor="promo-notes" helper="Optional">
          <Textarea
            id="promo-notes"
            placeholder="Additional notes..."
            rows={3}
            value={promoForm.notes}
            onChange={(e) => setPromoForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </ModalField>
      </AppFormModal>

      {/* ── Delete Rank Confirm ── */}
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

      {/* ── Delete Promotion Confirm ── */}
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
