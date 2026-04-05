import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchTodaysSales, createSale } from "../../api/SalesRequests/salesApi";

// The supabase client is mocked in setup.ts — import it so we can configure
// per-test return values.
import { supabase } from "../../api/supabase";

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

describe("fetchTodaysSales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an array of sales on success", async () => {
    const fakeSales = [
      {
        sale_id: 1,
        amount: 50,
        payment_type: "cash",
        payment_date: "2025-08-20T10:00:00",
        category: "tuition",
        school_id: "sc1",
        created_at: "2025-08-20T10:00:00Z",
        updated_at: "2025-08-20T10:00:00Z",
      },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: fakeSales, error: null }),
    });

    const result = await fetchTodaysSales("sc1");
    expect(result).toEqual(fakeSales);
    expect(mockFrom).toHaveBeenCalledWith("sales");
  });

  it("throws when Supabase returns an error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
    });

    await expect(fetchTodaysSales("sc1")).rejects.toThrow("DB error");
  });

  it("returns empty array when no sales exist today", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const result = await fetchTodaysSales("sc1");
    expect(result).toEqual([]);
  });
});

describe("createSale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls from('sales') and returns the saved sale", async () => {
    const newSale = {
      amount: 75,
      payment_type: "check" as const,
      payment_date: "2025-08-20T12:00:00Z",
      category: "test_fee" as const,
      school_id: "sc1",
    };
    const saved = { ...newSale, sale_id: 99, created_at: "now", updated_at: "now" };

    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: saved, error: null }),
    });

    const result = await createSale(newSale);
    expect(result).toEqual(saved);
    expect(mockFrom).toHaveBeenCalledWith("sales");
  });

  it("throws when Supabase returns an error on create", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
    });

    await expect(
      createSale({
        amount: 50,
        payment_type: "cash",
        payment_date: "2025-08-20T12:00:00Z",
        category: "tuition",
        school_id: "sc1",
      }),
    ).rejects.toThrow("Insert failed");
  });
});
