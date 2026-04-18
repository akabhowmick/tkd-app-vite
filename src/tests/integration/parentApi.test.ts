import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createParent,
  getParents,
  updateParent,
  deleteParent,
} from "../../api/ParentRequests/parentRequests";
import { supabase } from "../../api/supabase";

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

const fakeParent = {
  id: "p1",
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "555-0100",
  role: "Parent" as const,
  school_id: "sc1",
};

describe("createParent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts without error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });
    const { id: _id, ...parentWithoutId } = fakeParent;
    await expect(createParent(parentWithoutId)).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith("parents");
  });

  it("throws on insert error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: new Error("Insert failed") }),
    });
    const { id: _id, ...parentWithoutId } = fakeParent;
    await expect(createParent(parentWithoutId)).rejects.toThrow("Insert failed");
  });
});

describe("getParents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns parents filtered by schoolId", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [fakeParent], error: null }),
    });
    const result = await getParents("sc1");
    expect(result).toEqual([fakeParent]);
    expect(mockFrom).toHaveBeenCalledWith("parents");
  });

  it("returns all parents when no schoolId provided", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [fakeParent], error: null }),
    });
    const result = await getParents();
    expect(result).toEqual([fakeParent]);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
    });
    await expect(getParents("sc1")).rejects.toThrow("DB error");
  });
});

describe("updateParent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates without error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(updateParent("p1", { name: "Jane Updated" })).resolves.toBeUndefined();
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Update failed") }),
    });
    await expect(updateParent("p1", { name: "X" })).rejects.toThrow("Update failed");
  });
});

describe("deleteParent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes without error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(deleteParent("p1")).resolves.toBeUndefined();
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Delete failed") }),
    });
    await expect(deleteParent("p1")).rejects.toThrow("Delete failed");
  });
});
