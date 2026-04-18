import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSchool,
  updateSchool,
  deleteSchool,
  getSchoolByAdmin,
} from "../../api/SchoolRequests/schoolRequests";
import { supabase } from "../../api/supabase";

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

const fakeSchool = {
  id: "sc1",
  name: "Tiger Dojo",
  address: "123 Main St",
  admin_id: "admin1",
  created_at: "2025-01-01T00:00:00Z",
};

describe("createSchool", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the created school", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeSchool, error: null }),
    });
    const result = await createSchool({ name: "Tiger Dojo", address: "123 Main St" });
    expect(result).toEqual(fakeSchool);
    expect(mockFrom).toHaveBeenCalledWith("schools");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
    });
    await expect(createSchool({ name: "X", address: "Y" })).rejects.toThrow("Insert failed");
  });
});

describe("updateSchool", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the updated school", async () => {
    const updated = { ...fakeSchool, name: "Dragon Dojo" };
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    });
    const result = await updateSchool("sc1", { name: "Dragon Dojo", address: "123 Main St" });
    expect(result.name).toBe("Dragon Dojo");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Update failed") }),
    });
    await expect(updateSchool("sc1", { name: "X", address: "Y" })).rejects.toThrow("Update failed");
  });
});

describe("deleteSchool", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes without error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(deleteSchool("sc1")).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith("schools");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Delete failed") }),
    });
    await expect(deleteSchool("sc1")).rejects.toThrow("Delete failed");
  });
});

describe("getSchoolByAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the school for the given admin", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeSchool, error: null }),
    });
    const result = await getSchoolByAdmin("admin1");
    expect(result).toEqual(fakeSchool);
  });

  it("returns undefined (not throwing) when school not found", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Not found") }),
    });
    const result = await getSchoolByAdmin("bad-admin");
    expect(result).toBeNull();
  });
});
