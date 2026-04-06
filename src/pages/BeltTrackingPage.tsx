import { useState } from "react";
import { useBelts } from "../context/BeltContext";
import { useSchool } from "../context/SchoolContext";
import { PromotionType } from "../types/belts";
import Swal from "sweetalert2";
import { FaPlus, FaTrophy, FaTrash, FaMedal } from "react-icons/fa";

const BELT_COLORS = [
  "#FFFFFF", // White
  "#FFEB3B", // Yellow
  "#FF9800", // Orange
  "#4CAF50", // Green
  "#2196F3", // Blue
  "#9C27B0", // Purple
  "#F44336", // Red
  "#795548", // Brown
  "#000000", // Black
];

export const BeltTrackingPage = () => {
  const {
    ranks,
    promotions,
    loading,
    createRank,
    deleteRank,
    promoteStudent,
    deletePromotionRecord,
  } = useBelts();
  const { students } = useSchool();
  const [activeTab, setActiveTab] = useState<"ranks" | "promotions">("ranks");

  const handleCreateRank = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Create Belt Rank",
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left">
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Rank Name</label>
            <input id="rank-name" class="swal2-input" placeholder="e.g., White Belt" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Rank Order</label>
            <input id="rank-order" type="number" class="swal2-input" placeholder="1" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Color</label>
            <select id="color-code" class="swal2-input" style="margin:4px 0 0 0;padding:8px">
              ${BELT_COLORS.map((c) => `<option value="${c}" style="background:${c};color:${c === "#FFFFFF" ? "#000" : "#fff"}">${c}</option>`).join("")}
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Create",
      confirmButtonColor: "#3b82f6",
      preConfirm: () => ({
        rank_name: (document.getElementById("rank-name") as HTMLInputElement).value,
        rank_order: parseInt((document.getElementById("rank-order") as HTMLInputElement).value),
        color_code: (document.getElementById("color-code") as HTMLSelectElement).value,
      }),
    });

    if (formValues) {
      try {
        await createRank(formValues);
        Swal.fire("Success!", "Belt rank created successfully", "success");
      } catch (err) {
        Swal.fire("Error", err instanceof Error ? err.message : "Failed to create rank", "error");
      }
    }
  };

  const handlePromoteStudent = async () => {
    const { value: studentId } = await Swal.fire({
      title: "Select Student",
      input: "select",
      inputOptions: students.reduce<Record<string, string>>(
        (acc, s) => ({ ...acc, [String(s.id)]: s.name }),
        {},
      ),
      inputPlaceholder: "Choose a student",
      showCancelButton: true,
    });

    if (!studentId) return;

    const student = students.find((s) => s.id === studentId);
    const currentRank = student ? ranks.find((r) => r.rank_id === student.current_rank_id) : null;

    const { value: formValues } = await Swal.fire({
      title: `Promote ${student?.name}`,
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left">
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Current Rank</label>
            <input value="${currentRank?.rank_name || "None"}" disabled class="swal2-input" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Promote To</label>
            <select id="to-rank" class="swal2-input" style="margin:4px 0 0 0;padding:8px">
              ${ranks.map((r) => `<option value="${r.rank_id}">${r.rank_name}</option>`).join("")}
            </select>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Promotion Date</label>
            <input id="promo-date" type="date" value="${new Date().toISOString().split("T")[0]}" class="swal2-input" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Promotion Type</label>
            <select id="promo-type" class="swal2-input" style="margin:4px 0 0 0;padding:8px">
              <option value="manual">Manual</option>
              <option value="test">Test-based</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Test Score (optional)</label>
            <input id="test-score" type="number" step="0.01" class="swal2-input" placeholder="95.5" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Promoted By</label>
            <input id="promoted-by" class="swal2-input" placeholder="Master Lee" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Notes (optional)</label>
            <textarea id="promo-notes" class="swal2-textarea" placeholder="Additional notes..." style="margin:4px 0 0 0;padding:8px"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Promote",
      confirmButtonColor: "#10b981",
      preConfirm: () => {
        const promoType = (document.getElementById("promo-type") as HTMLSelectElement)
          .value as PromotionType;
        const testScoreInput = (document.getElementById("test-score") as HTMLInputElement).value;

        return {
          student_id: studentId,
          from_rank_id: currentRank?.rank_id,
          to_rank_id: (document.getElementById("to-rank") as HTMLSelectElement).value,
          promotion_date: (document.getElementById("promo-date") as HTMLInputElement).value,
          promotion_type: promoType,
          test_score: testScoreInput ? parseFloat(testScoreInput) : undefined,
          promoted_by: (document.getElementById("promoted-by") as HTMLInputElement).value,
          notes: (document.getElementById("promo-notes") as HTMLTextAreaElement).value || undefined,
        };
      },
    });

    if (formValues) {
      try {
        await promoteStudent(formValues);
        Swal.fire("Success!", "Student promoted successfully", "success");
      } catch (err) {
        Swal.fire(
          "Error",
          err instanceof Error ? err.message : "Failed to promote student",
          "error",
        );
      }
    }
  };

  const handleDeleteRank = async (rankId: string, rankName: string) => {
    const result = await Swal.fire({
      title: "Delete Rank?",
      text: `Are you sure you want to delete "${rankName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });

    if (result.isConfirmed) {
      try {
        await deleteRank(rankId);
        Swal.fire("Deleted!", "Rank deleted successfully", "success");
      } catch (err) {
        Swal.fire("Error", err instanceof Error ? err.message : "Failed to delete rank", "error");
      }
    }
  };

  const handleDeletePromotion = async (promotionId: string) => {
    const result = await Swal.fire({
      title: "Delete Promotion?",
      text: "Are you sure you want to delete this promotion record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });

    if (result.isConfirmed) {
      try {
        await deletePromotionRecord(promotionId);
        Swal.fire("Deleted!", "Promotion deleted successfully", "success");
      } catch (err) {
        Swal.fire(
          "Error",
          err instanceof Error ? err.message : "Failed to delete promotion",
          "error",
        );
      }
    }
  };

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
              onClick={handlePromoteStudent}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaTrophy /> Promote Student
            </button>
            <button
              onClick={handleCreateRank}
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
                    onClick={handleCreateRank}
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
                            onClick={() => handleDeleteRank(rank.rank_id, rank.rank_name)}
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
                            onClick={() => handleDeletePromotion(promo.promotion_id)}
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
    </div>
  );
};
