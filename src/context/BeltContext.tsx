import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { track } from "../analytics/posthog";
import { captureException } from "../analytics/sentry";
import { useAsyncState } from "../hooks/useAsyncState";
import {
  BeltRank,
  PromotionWithRanks,
  CreateBeltRankRequest,
  CreatePromotionRequest,
  UpdateBeltRankRequest,
} from "../types/belts";
import {
  getBeltRanks,
  createBeltRank as apiCreateBeltRank,
  updateBeltRank as apiUpdateBeltRank,
  deleteBeltRank as apiDeleteBeltRank,
  getPromotions,
  getStudentPromotions,
  createPromotion as apiCreatePromotion,
  deletePromotion as apiDeletePromotion,
} from "../api/BeltRequests/beltRequests";
import { useSchool } from "./SchoolContext";

interface BeltContextType {
  ranks: BeltRank[];
  promotions: PromotionWithRanks[];
  loading: boolean;
  error: string | null;
  loadRanks: () => Promise<void>;
  loadPromotions: () => Promise<void>;
  createRank: (data: Omit<CreateBeltRankRequest, "school_id">) => Promise<BeltRank>;
  updateRank: (rankId: string, updates: UpdateBeltRankRequest) => Promise<void>;
  deleteRank: (rankId: string) => Promise<void>;
  promoteStudent: (data: Omit<CreatePromotionRequest, "school_id">) => Promise<void>;
  deletePromotionRecord: (promotionId: string) => Promise<void>;
  getStudentHistory: (studentId: string) => Promise<PromotionWithRanks[]>;
}

const BeltContext = createContext<BeltContextType | undefined>(undefined);

export const BeltProvider = ({ children }: { children: ReactNode }) => {
  const { schoolId } = useSchool();
  const [ranks, setRanks] = useState<BeltRank[]>([]);
  const [promotions, setPromotions] = useState<PromotionWithRanks[]>([]);
  const { loading, error, run, load } = useAsyncState();

  const loadRanks = useCallback(async () => {
    if (!schoolId) return;
    await load(async () => {
      const data = await getBeltRanks(schoolId);
      setRanks(data);
    }, "Failed to load belt ranks");
  }, [schoolId, load]);

  const loadPromotions = useCallback(async () => {
    if (!schoolId) return;
    await load(async () => {
      const data = await getPromotions(schoolId);
      setPromotions(data);
    }, "Failed to load promotions");
  }, [schoolId, load]);

  const createRank = useCallback(
    async (data: Omit<CreateBeltRankRequest, "school_id">): Promise<BeltRank> => {
      if (!schoolId) throw new Error("School ID required");
      try {
        return await run(async () => {
          const newRank = await apiCreateBeltRank({ ...data, school_id: schoolId });
          await loadRanks();
          track("belt_rank_created");
          return newRank;
        }, "Failed to create belt rank");
      } catch (err) {
        captureException(err, { feature: "belts", action: "createRank" });
        throw err;
      }
    },
    [schoolId, loadRanks, run],
  );

  const updateRank = useCallback(
    async (rankId: string, updates: UpdateBeltRankRequest): Promise<void> => {
      await run(async () => {
        await apiUpdateBeltRank(rankId, updates);
        await loadRanks();
      }, "Failed to update belt rank");
    },
    [loadRanks, run],
  );

  const deleteRank = useCallback(
    async (rankId: string): Promise<void> => {
      try {
        await run(async () => {
          await apiDeleteBeltRank(rankId);
          await loadRanks();
          track("belt_rank_deleted");
        }, "Failed to delete belt rank");
      } catch (err) {
        captureException(err, { feature: "belts", action: "deleteRank" });
        throw err;
      }
    },
    [loadRanks, run],
  );

  const promoteStudent = useCallback(
    async (data: Omit<CreatePromotionRequest, "school_id">): Promise<void> => {
      if (!schoolId) throw new Error("School ID required");
      try {
        await run(async () => {
          await apiCreatePromotion({ ...data, school_id: schoolId });
          await loadPromotions();
          track("student_promoted", {
            promotionType: data.promotion_type ?? "manual",
            fromRank: ranks.find((r) => r.rank_id === data.from_rank_id)?.rank_name,
            toRank: ranks.find((r) => r.rank_id === data.to_rank_id)?.rank_name,
          });
        }, "Failed to promote student");
      } catch (err) {
        captureException(err, { feature: "belts", action: "promoteStudent" });
        throw err;
      }
    },
    [schoolId, loadPromotions, ranks, run],
  );

  const deletePromotionRecord = useCallback(
    async (promotionId: string): Promise<void> => {
      try {
        await run(async () => {
          await apiDeletePromotion(promotionId);
          await loadPromotions();
          track("promotion_deleted");
        }, "Failed to delete promotion");
      } catch (err) {
        captureException(err, { feature: "belts", action: "deletePromotion" });
        throw err;
      }
    },
    [loadPromotions, run],
  );

  const getStudentHistory = useCallback(
    async (studentId: string): Promise<PromotionWithRanks[]> => {
      return run(async () => {
        const data = await getStudentPromotions(studentId);
        return data;
      }, "Failed to load student history");
    },
    [run],
  );

  useEffect(() => {
    if (schoolId) {
      loadRanks();
      loadPromotions();
    }
  }, [schoolId, loadRanks, loadPromotions]);

  return (
    <BeltContext.Provider
      value={{
        ranks,
        promotions,
        loading,
        error,
        loadRanks,
        loadPromotions,
        createRank,
        updateRank,
        deleteRank,
        promoteStudent,
        deletePromotionRecord,
        getStudentHistory,
      }}
    >
      {children}
    </BeltContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBelts = (): BeltContextType => {
  const context = useContext(BeltContext);
  if (!context) {
    throw new Error("useBelts must be used within BeltProvider");
  }
  return context;
};
