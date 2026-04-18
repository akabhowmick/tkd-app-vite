import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  signUpUserSupabase,
  signInUserSupabase,
  signOutUserSupabase,
  updateUserSupabase,
} from "../../api/AuthRequests/AuthRequests";
import { supabase } from "../../api/supabase";

const mockSignUp = supabase.auth.signUp as ReturnType<typeof vi.fn>;
const mockSignIn = supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>;
const mockSignOut = supabase.auth.signOut as ReturnType<typeof vi.fn>;
const mockUpdateUser = supabase.auth.updateUser as ReturnType<typeof vi.fn>;

describe("signUpUserSupabase", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns data and no error on success", async () => {
    const fakeUser = { id: "u1", email: "test@example.com" };
    mockSignUp.mockResolvedValue({ data: { user: fakeUser }, error: null });
    const result = await signUpUserSupabase("test@example.com", "password123");
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ user: fakeUser });
    expect(mockSignUp).toHaveBeenCalledWith({ email: "test@example.com", password: "password123" });
  });

  it("returns error when sign-up fails", async () => {
    const err = new Error("Email already in use");
    mockSignUp.mockResolvedValue({ data: null, error: err });
    const result = await signUpUserSupabase("taken@example.com", "pass");
    expect(result.error).toBe(err);
  });
});

describe("signInUserSupabase", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns session data on success", async () => {
    const fakeSession = { access_token: "tok", user: { id: "u1" } };
    mockSignIn.mockResolvedValue({ data: { session: fakeSession }, error: null });
    const result = await signInUserSupabase("user@example.com", "secret");
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ session: fakeSession });
    expect(mockSignIn).toHaveBeenCalledWith({ email: "user@example.com", password: "secret" });
  });

  it("returns error on invalid credentials", async () => {
    const err = new Error("Invalid login credentials");
    mockSignIn.mockResolvedValue({ data: null, error: err });
    const result = await signInUserSupabase("user@example.com", "wrong");
    expect(result.error).toBe(err);
  });
});

describe("signOutUserSupabase", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns no error on success", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    const result = await signOutUserSupabase();
    expect(result.error).toBeNull();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("returns error on failure", async () => {
    const err = new Error("Sign out failed");
    mockSignOut.mockResolvedValue({ error: err });
    const result = await signOutUserSupabase();
    expect(result.error).toBe(err);
  });
});

describe("updateUserSupabase", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns updated user data on success", async () => {
    const fakeUser = { id: "u1", email: "user@example.com" };
    mockUpdateUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    const result = await updateUserSupabase("newpassword123!");
    expect(result.error).toBeNull();
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "newpassword123!" });
  });

  it("returns error when update fails", async () => {
    const err = new Error("Weak password");
    mockUpdateUser.mockResolvedValue({ data: null, error: err });
    const result = await updateUserSupabase("weak");
    expect(result.error).toBe(err);
  });
});
