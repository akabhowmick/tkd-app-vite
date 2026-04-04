import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRanks = useCallback(async () => {
    if (!schoolId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getBeltRanks(schoolId);
      setRanks(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load belt ranks";
      setError(message);
      console.error("Error loading belt ranks:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const loadPromotions = useCallback(async () => {
    if (!schoolId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getPromotions(schoolId);
      setPromotions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load promotions";
      setError(message);
      console.error("Error loading promotions:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const createRank = useCallback(
    async (data: Omit<CreateBeltRankRequest, "school_id">): Promise<BeltRank> => {
      if (!schoolId) throw new Error("School ID required");

      try {
        setLoading(true);
        setError(null);
        const newRank = await apiCreateBeltRank({ ...data, school_id: schoolId });
        await loadRanks();
        return newRank;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create belt rank";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [schoolId, loadRanks]
  );

  const updateRank = useCallback(
    async (rankId: string, updates: UpdateBeltRankRequest): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        await apiUpdateBeltRank(rankId, updates);
        await loadRanks();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update belt rank";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadRanks]
  );

  const deleteRank = useCallback(
    async (rankId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        await apiDeleteBeltRank(rankId);
        await loadRanks();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete belt rank";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadRanks]
  );

  const promoteStudent = useCallback(
    async (data: Omit<CreatePromotionRequest, "school_id">): Promise<void> => {
      if (!schoolId) throw new Error("School ID required");

      try {
        setLoading(true);
        setError(null);
        await apiCreatePromotion({ ...data, school_id: schoolId });
        await loadPromotions();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to promote student";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [schoolId, loadPromotions]
  );

  const deletePromotionRecord = useCallback(
    async (promotionId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        await apiDeletePromotion(promotionId);
        await loadPromotions();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete promotion";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadPromotions]
  );

  const getStudentHistory = useCallback(async (studentId: string): Promise<PromotionWithRanks[]> => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentPromotions(studentId);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load student history";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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

export const useBelts = (): BeltContextType => {
  const context = useContext(BeltContext);
  if (!context) {
    throw new Error("useBelts must be used within BeltProvider");
  }
  return context;
};
