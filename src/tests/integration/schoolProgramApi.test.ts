import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSchoolPrograms,
  createSchoolProgram,
  updateSchoolProgram,
  deleteSchoolProgram,
  getProgramRenewalCount,
  ensureDefaultProgram,
} from "../../api/SchoolProgramRequests/schoolProgramRequests";
import { supabase } from "../../api/supabase";

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

const fakeProgram = {
  program_id: "prog1",
  school_id: "sc1",
  name: "Regular",
  program_type: "time_based",
  description: "Standard membership",
  created_at: "2025-01-01T00:00:00Z",
};

describe("getSchoolPrograms", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns programs sorted by name", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [fakeProgram], error: null }),
    });
    const result = await getSchoolPrograms("sc1");
    expect(result).toEqual([fakeProgram]);
    expect(mockFrom).toHaveBeenCalledWith("school_programs");
  });

  it("returns empty array on null data", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const result = await getSchoolPrograms("sc1");
    expect(result).toEqual([]);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
    });
    await expect(getSchoolPrograms("sc1")).rejects.toThrow("DB error");
  });
});

describe("createSchoolProgram", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the created program", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeProgram, error: null }),
    });
    const result = await createSchoolProgram({ school_id: "sc1", name: "Regular", program_type: "time_based" });
    expect(result).toEqual(fakeProgram);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
    });
    await expect(
      createSchoolProgram({ school_id: "sc1", name: "X", program_type: "time_based" }),
    ).rejects.toThrow("Insert failed");
  });
});

describe("updateSchoolProgram", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the updated program", async () => {
    const updated = { ...fakeProgram, name: "Advanced" };
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    });
    const result = await updateSchoolProgram("prog1", { name: "Advanced" });
    expect(result.name).toBe("Advanced");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Update failed") }),
    });
    await expect(updateSchoolProgram("prog1", {})).rejects.toThrow("Update failed");
  });
});

describe("deleteSchoolProgram", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes without error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(deleteSchoolProgram("prog1")).resolves.toBeUndefined();
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Delete failed") }),
    });
    await expect(deleteSchoolProgram("prog1")).rejects.toThrow("Delete failed");
  });
});

describe("getProgramRenewalCount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the renewal count", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
    });
    const result = await getProgramRenewalCount("prog1");
    expect(result).toBe(5);
  });

  it("returns 0 when count is null", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: null, error: null }),
    });
    const result = await getProgramRenewalCount("prog1");
    expect(result).toBe(0);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: null, error: new Error("DB error") }),
    });
    await expect(getProgramRenewalCount("prog1")).rejects.toThrow("DB error");
  });
});

describe("ensureDefaultProgram", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upserts and returns the default program", async () => {
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeProgram, error: null }),
    });
    const result = await ensureDefaultProgram("sc1");
    expect(result).toEqual(fakeProgram);
    expect(mockFrom).toHaveBeenCalledWith("school_programs");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Upsert failed") }),
    });
    await expect(ensureDefaultProgram("sc1")).rejects.toThrow("Upsert failed");
  });
});
