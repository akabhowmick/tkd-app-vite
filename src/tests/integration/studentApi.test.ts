import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
} from "../../api/StudentRequests/studentRequests";
import { supabase } from "../../api/supabase";

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

describe("createStudent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts a student without error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(
      createStudent({ name: "Alice", email: "alice@dojo.com", phone: "", role: "Student", school_id: "sc1" }),
    ).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith("students");
  });

  it("throws when Supabase returns an error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: new Error("Insert failed") }),
    });
    await expect(
      createStudent({ name: "Bob", email: "bob@dojo.com", phone: "", role: "Student", school_id: "sc1" }),
    ).rejects.toThrow("Insert failed");
  });
});

describe("getStudents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns students sorted by last name", async () => {
    const raw = [
      { id: "1", name: "Charlie Kim", email: "", phone: "", role: "Student", school_id: "sc1" },
      { id: "2", name: "Alice Adams", email: "", phone: "", role: "Student", school_id: "sc1" },
    ];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: raw, error: null }),
    });
    const result = await getStudents("sc1");
    expect(result[0].name).toBe("Alice Adams");
    expect(result[1].name).toBe("Charlie Kim");
  });

  it("throws when Supabase returns an error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
    });
    await expect(getStudents("sc1")).rejects.toThrow("DB error");
  });
});

describe("updateStudent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates a student without error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(updateStudent("s1", { name: "Updated Name" })).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith("students");
  });

  it("throws when Supabase returns an error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Update failed") }),
    });
    await expect(updateStudent("s1", { name: "X" })).rejects.toThrow("Update failed");
  });
});

describe("deleteStudent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a student without error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(deleteStudent("s1")).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith("students");
  });

  it("throws when Supabase returns an error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Delete failed") }),
    });
    await expect(deleteStudent("s1")).rejects.toThrow("Delete failed");
  });
});
