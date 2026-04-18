import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getInventoryItems,
  getInventoryItemById,
  getLowStockItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createTransaction,
  deleteTransaction,
} from "../../api/InventoryRequests/inventoryRequests";
import { supabase } from "../../api/supabase";

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

const fakeItem = {
  item_id: "i1",
  school_id: "sc1",
  item_name: "Uniform",
  stock_quantity: 10,
  low_stock_threshold: 5,
  price: 50,
  category: "gear",
  created_at: "2025-01-01T00:00:00Z",
};

const fakeLowStockItem = { ...fakeItem, item_id: "i2", item_name: "Belt", stock_quantity: 2, low_stock_threshold: 5 };

const fakeTransaction = {
  transaction_id: "t1",
  school_id: "sc1",
  item_id: "i1",
  quantity_change: -1,
  transaction_type: "sale",
  transaction_date: "2025-01-01",
};

describe("getInventoryItems", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns items with is_low_stock computed", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [fakeItem, fakeLowStockItem], error: null }),
    });
    const result = await getInventoryItems("sc1");
    expect(result.find((i) => i.item_id === "i1")!.is_low_stock).toBe(false);
    expect(result.find((i) => i.item_id === "i2")!.is_low_stock).toBe(true);
  });

  it("returns empty array on null data", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const result = await getInventoryItems("sc1");
    expect(result).toEqual([]);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
    });
    await expect(getInventoryItems("sc1")).rejects.toThrow("DB error");
  });
});

describe("getInventoryItemById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the item", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeItem, error: null }),
    });
    const result = await getInventoryItemById("i1");
    expect(result).toEqual(fakeItem);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Not found") }),
    });
    await expect(getInventoryItemById("bad")).rejects.toThrow("Not found");
  });
});

describe("getLowStockItems", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only low-stock items", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [fakeItem, fakeLowStockItem], error: null }),
    });
    const result = await getLowStockItems("sc1");
    expect(result).toHaveLength(1);
    expect(result[0].item_id).toBe("i2");
  });
});

describe("createInventoryItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the created item", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeItem, error: null }),
    });
    const result = await createInventoryItem({ school_id: "sc1", item_name: "Uniform", stock_quantity: 10, low_stock_threshold: 5, price: 50, category: "gear" });
    expect(result).toEqual(fakeItem);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
    });
    await expect(
      createInventoryItem({ school_id: "sc1", item_name: "X", stock_quantity: 1, low_stock_threshold: 1, price: 0, category: "other" }),
    ).rejects.toThrow("Insert failed");
  });
});

describe("updateInventoryItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the updated item", async () => {
    const updated = { ...fakeItem, item_name: "Updated Uniform" };
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    });
    const result = await updateInventoryItem("i1", { item_name: "Updated Uniform" });
    expect(result.item_name).toBe("Updated Uniform");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Update failed") }),
    });
    await expect(updateInventoryItem("i1", {})).rejects.toThrow("Update failed");
  });
});

describe("deleteInventoryItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes without error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(deleteInventoryItem("i1")).resolves.toBeUndefined();
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Delete failed") }),
    });
    await expect(deleteInventoryItem("i1")).rejects.toThrow("Delete failed");
  });
});

describe("createTransaction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the created transaction", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeTransaction, error: null }),
    });
    const result = await createTransaction({
      school_id: "sc1",
      item_id: "i1",
      quantity_change: -1,
      transaction_type: "sale",
      transaction_date: "2025-01-01",
    });
    expect(result).toEqual(fakeTransaction);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
    });
    await expect(
      createTransaction({ school_id: "sc1", item_id: "i1", quantity_change: -1, transaction_type: "sale", transaction_date: "2025-01-01" }),
    ).rejects.toThrow("Insert failed");
  });
});

describe("deleteTransaction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes without error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(deleteTransaction("t1")).resolves.toBeUndefined();
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Delete failed") }),
    });
    await expect(deleteTransaction("t1")).rejects.toThrow("Delete failed");
  });
});
