import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getNotificationSettings,
  upsertNotificationSettings,
} from "../../api/NotificationRequests/notificationRequests";
import { supabase } from "../../api/supabase";

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

const fakeSettings = {
  id: "ns1",
  school_id: "sc1",
  reminders_enabled: true,
  reminder_days: [7, 14] as const,
  send_to_admin: true,
  send_to_parent: false,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("getNotificationSettings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns settings when found", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: fakeSettings, error: null }),
    });
    const result = await getNotificationSettings("sc1");
    expect(result).toEqual(fakeSettings);
    expect(mockFrom).toHaveBeenCalledWith("notification_settings");
  });

  it("returns null when not found", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const result = await getNotificationSettings("sc1");
    expect(result).toBeNull();
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
    });
    await expect(getNotificationSettings("sc1")).rejects.toThrow("DB error");
  });
});

describe("upsertNotificationSettings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the upserted settings", async () => {
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeSettings, error: null }),
    });
    const result = await upsertNotificationSettings({
      school_id: "sc1",
      reminders_enabled: true,
      reminder_days: [7, 14],
      send_to_admin: true,
      send_to_parent: false,
    });
    expect(result).toEqual(fakeSettings);
    expect(mockFrom).toHaveBeenCalledWith("notification_settings");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Upsert failed") }),
    });
    await expect(
      upsertNotificationSettings({
        school_id: "sc1",
        reminders_enabled: false,
        reminder_days: [],
        send_to_admin: false,
        send_to_parent: false,
      }),
    ).rejects.toThrow("Upsert failed");
  });
});
