import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../../api/AppUserRequests/UserService";
import { supabase } from "../../api/supabase";

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

const fakeUser = {
  id: "u1",
  name: "Alice",
  email: "alice@dojo.com",
  phone: "",
  role: "Admin" as const,
  school_id: "sc1",
  created_at: "2025-01-01T00:00:00Z",
};

describe("createUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the created user", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeUser, error: null }),
    });
    const { id: _id, created_at: _ca, ...userInput } = fakeUser;
    const result = await createUser(userInput);
    expect(result).toEqual(fakeUser);
    expect(mockFrom).toHaveBeenCalledWith("users");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
    });
    const { id: _id, created_at: _ca, ...userInput } = fakeUser;
    await expect(createUser(userInput)).rejects.toThrow("Insert failed");
  });
});

describe("getUsers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all users when no role filter", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [fakeUser], error: null }),
    });
    const result = await getUsers();
    expect(result).toEqual([fakeUser]);
  });

  it("filters by role when provided", async () => {
    const eqMock = vi.fn().mockResolvedValue({ data: [fakeUser], error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: eqMock,
    });
    const result = await getUsers("Admin");
    expect(result).toEqual([fakeUser]);
    expect(eqMock).toHaveBeenCalledWith("role", "Admin");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
    });
    await expect(getUsers()).rejects.toThrow("DB error");
  });
});

describe("getUserById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the user", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeUser, error: null }),
    });
    const result = await getUserById("u1");
    expect(result).toEqual(fakeUser);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Not found") }),
    });
    await expect(getUserById("bad")).rejects.toThrow("Not found");
  });
});

describe("updateUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the updated user", async () => {
    const updated = { ...fakeUser, name: "Alice Updated" };
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    });
    const result = await updateUser("u1", { name: "Alice Updated" });
    expect(result.name).toBe("Alice Updated");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Update failed") }),
    });
    await expect(updateUser("u1", {})).rejects.toThrow("Update failed");
  });
});

describe("deleteUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true on success", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const result = await deleteUser("u1");
    expect(result).toBe(true);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Delete failed") }),
    });
    await expect(deleteUser("u1")).rejects.toThrow("Delete failed");
  });
});
