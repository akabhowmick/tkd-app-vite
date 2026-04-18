import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getBeltRanks,
  getBeltRankById,
  createBeltRank,
  updateBeltRank,
  deleteBeltRank,
  createPromotion,
  deletePromotion,
} from "../../api/BeltRequests/beltRequests";
import { supabase } from "../../api/supabase";

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

const fakeRank = { rank_id: "r1", school_id: "sc1", rank_name: "White Belt", rank_order: 1, color: "#fff" };
const fakePromotion = { promotion_id: "pr1", student_id: "s1", school_id: "sc1", from_rank_id: "r1", to_rank_id: "r2", promotion_date: "2025-01-01" };

describe("getBeltRanks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns ranks ordered by rank_order", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [fakeRank], error: null }),
    });
    const result = await getBeltRanks("sc1");
    expect(result).toEqual([fakeRank]);
    expect(mockFrom).toHaveBeenCalledWith("belt_ranks");
  });

  it("returns empty array when data is null", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const result = await getBeltRanks("sc1");
    expect(result).toEqual([]);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
    });
    await expect(getBeltRanks("sc1")).rejects.toThrow("DB error");
  });
});

describe("getBeltRankById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the rank by id", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeRank, error: null }),
    });
    const result = await getBeltRankById("r1");
    expect(result).toEqual(fakeRank);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Not found") }),
    });
    await expect(getBeltRankById("bad")).rejects.toThrow("Not found");
  });
});

describe("createBeltRank", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the created rank", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeRank, error: null }),
    });
    const result = await createBeltRank({ school_id: "sc1", rank_name: "White Belt", rank_order: 1 });
    expect(result).toEqual(fakeRank);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
    });
    await expect(createBeltRank({ school_id: "sc1", rank_name: "X", rank_order: 1 })).rejects.toThrow("Insert failed");
  });
});

describe("updateBeltRank", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the updated rank", async () => {
    const updated = { ...fakeRank, rank_name: "Yellow Belt" };
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    });
    const result = await updateBeltRank("r1", { rank_name: "Yellow Belt" });
    expect(result.rank_name).toBe("Yellow Belt");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Update failed") }),
    });
    await expect(updateBeltRank("r1", {})).rejects.toThrow("Update failed");
  });
});

describe("deleteBeltRank", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes without error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(deleteBeltRank("r1")).resolves.toBeUndefined();
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Delete failed") }),
    });
    await expect(deleteBeltRank("r1")).rejects.toThrow("Delete failed");
  });
});

describe("createPromotion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the created promotion", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakePromotion, error: null }),
    });
    const result = await createPromotion({
      student_id: "s1",
      school_id: "sc1",
      from_rank_id: "r1",
      to_rank_id: "r2",
      promotion_date: "2025-01-01",
      promotion_type: "manual",
      promoted_by: "Instructor",
    });
    expect(result).toEqual(fakePromotion);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
    });
    await expect(
      createPromotion({
        student_id: "s1",
        school_id: "sc1",
        from_rank_id: "r1",
        to_rank_id: "r2",
        promotion_date: "2025-01-01",
        promotion_type: "manual",
        promoted_by: "Instructor",
      }),
    ).rejects.toThrow("Insert failed");
  });
});

describe("deletePromotion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes without error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(deletePromotion("pr1")).resolves.toBeUndefined();
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Delete failed") }),
    });
    await expect(deletePromotion("pr1")).rejects.toThrow("Delete failed");
  });
});
