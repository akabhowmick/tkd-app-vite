import { supabase } from "../supabase";
import { Sale, CreateSaleRequest } from "../../types/sales";

/**
 * Fetch all sales for a given school for today.
 * Requires school_id column on the sales table (added in updated sales.sql).
 */
export async function fetchTodaysSales(schoolId: string): Promise<Sale[]> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("school_id", schoolId)
    .gte("payment_date", `${today}T00:00:00`)
    .lte("payment_date", `${today}T23:59:59`)
    .order("payment_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Sale[];
}

/**
 * Create a new sale record in Supabase.
 */
export async function createSale(
  newSale: CreateSaleRequest & { school_id: string },
): Promise<Sale> {
  const { data, error } = await supabase.from("sales").insert(newSale).select().single();
  if (error) throw error;
  return data as Sale;
}
