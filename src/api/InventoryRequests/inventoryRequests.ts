import { supabase } from "../supabase";
import {
  InventoryItem,
  InventoryTransaction,
  CreateInventoryItemRequest,
  CreateTransactionRequest,
  UpdateInventoryItemRequest,
  InventoryItemWithAlert,
} from "../../types/inventory";

// ─────────────────────────────────────────────
// Inventory Items
// ─────────────────────────────────────────────

export async function getInventoryItems(schoolId: string): Promise<InventoryItemWithAlert[]> {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("school_id", schoolId)
    .order("item_name");

  if (error) throw error;

  return (data || []).map((item) => ({
    ...item,
    is_low_stock: item.stock_quantity <= item.low_stock_threshold,
  }));
}

export async function getInventoryItemById(itemId: string): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("item_id", itemId)
    .single();

  if (error) throw error;
  return data;
}

export async function getLowStockItems(schoolId: string): Promise<InventoryItemWithAlert[]> {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("school_id", schoolId)
    .order("stock_quantity");

  if (error) throw error;

  return (data || [])
    .map((item) => ({
      ...item,
      is_low_stock: item.stock_quantity <= item.low_stock_threshold,
    }))
    .filter((item) => item.is_low_stock);
}

export async function createInventoryItem(
  itemData: CreateInventoryItemRequest,
): Promise<InventoryItem> {
  const { data, error } = await supabase.from("inventory_items").insert(itemData).select().single();

  if (error) throw error;
  return data;
}

export async function updateInventoryItem(
  itemId: string,
  updates: UpdateInventoryItemRequest,
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from("inventory_items")
    .update(updates)
    .eq("item_id", itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInventoryItem(itemId: string): Promise<void> {
  const { error } = await supabase.from("inventory_items").delete().eq("item_id", itemId);

  if (error) throw error;
}

// ─────────────────────────────────────────────
// Inventory Transactions
// ─────────────────────────────────────────────

export async function getTransactions(schoolId: string): Promise<InventoryTransaction[]> {
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select("*")
    .eq("school_id", schoolId)
    .order("transaction_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getItemTransactions(itemId: string): Promise<InventoryTransaction[]> {
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select("*")
    .eq("item_id", itemId)
    .order("transaction_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createTransaction(
  transactionData: CreateTransactionRequest,
): Promise<InventoryTransaction> {
  const { data, error } = await supabase
    .from("inventory_transactions")
    .insert(transactionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const { error } = await supabase
    .from("inventory_transactions")
    .delete()
    .eq("transaction_id", transactionId);

  if (error) throw error;
}
