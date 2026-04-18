import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getClassById,
  getClasses,
  getClassesWithSessions,
  createClass,
  updateClass,
  deleteClass,
  createSession,
  deleteSession,
} from "../../api/ClassRequests/classRequests";
import { supabase } from "../../api/supabase";

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

const fakeClass = { class_id: "c1", school_id: "sc1", class_name: "Beginner", day_of_week: 1, start_time: "09:00", end_time: "10:00" };
const fakeSession = { session_id: "ses1", class_id: "c1", day_of_week: 1, start_time: "09:00", end_time: "10:00" };

describe("getClassById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the class", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeClass, error: null }),
    });
    const result = await getClassById("c1");
    expect(result).toEqual(fakeClass);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Not found") }),
    });
    await expect(getClassById("bad")).rejects.toThrow("Not found");
  });
});

describe("getClasses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns classes", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    });
    // chain order twice then resolve
    const orderMock = vi.fn().mockReturnThis();
    orderMock.mockReturnValueOnce({ order: vi.fn().mockResolvedValue({ data: [fakeClass], error: null }) });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: orderMock,
    });
    // simpler: final order call resolves
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn()
        .mockReturnValueOnce({ order: vi.fn().mockResolvedValue({ data: [fakeClass], error: null }) })
        .mockResolvedValue({ data: [fakeClass], error: null }),
    });
    const result = await getClasses("sc1");
    expect(result).toEqual([fakeClass]);
  });

  it("returns empty array on null data", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn()
        .mockReturnValueOnce({ order: vi.fn().mockResolvedValue({ data: null, error: null }) })
        .mockResolvedValue({ data: null, error: null }),
    });
    const result = await getClasses("sc1");
    expect(result).toEqual([]);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn()
        .mockReturnValueOnce({ order: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }) })
        .mockResolvedValue({ data: null, error: new Error("DB error") }),
    });
    await expect(getClasses("sc1")).rejects.toThrow("DB error");
  });
});

describe("getClassesWithSessions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns classes with their sessions attached", async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [fakeClass], error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [fakeSession], error: null }),
      });
    const result = await getClassesWithSessions("sc1");
    expect(result).toHaveLength(1);
    expect(result[0].sessions).toEqual([fakeSession]);
  });

  it("throws when classes query fails", async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error("Classes error") }),
    });
    await expect(getClassesWithSessions("sc1")).rejects.toThrow("Classes error");
  });
});

describe("createClass", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the created class", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeClass, error: null }),
    });
    const result = await createClass({ school_id: "sc1", class_name: "Beginner", age_group: "Kids" });
    expect(result).toEqual(fakeClass);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
    });
    await expect(createClass({ school_id: "sc1", class_name: "X", age_group: "Adults" })).rejects.toThrow("Insert failed");
  });
});

describe("updateClass", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns updated class", async () => {
    const updated = { ...fakeClass, class_name: "Advanced" };
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    });
    const result = await updateClass("c1", { class_name: "Advanced" });
    expect(result.class_name).toBe("Advanced");
  });
});

describe("deleteClass", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes without error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(deleteClass("c1")).resolves.toBeUndefined();
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Delete failed") }),
    });
    await expect(deleteClass("c1")).rejects.toThrow("Delete failed");
  });
});

describe("createSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the created session", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeSession, error: null }),
    });
    const result = await createSession({ class_id: "c1", school_id: "sc1", session_type: "recurring" as const, day_of_week: 1, start_time: "09:00", end_time: "10:00" });
    expect(result).toEqual(fakeSession);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
    });
    await expect(
      createSession({ class_id: "c1", school_id: "sc1", session_type: "recurring" as const, day_of_week: 1, start_time: "09:00", end_time: "10:00" }),
    ).rejects.toThrow("Insert failed");
  });
});

describe("deleteSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes without error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(deleteSession("ses1")).resolves.toBeUndefined();
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Delete failed") }),
    });
    await expect(deleteSession("ses1")).rejects.toThrow("Delete failed");
  });
});
