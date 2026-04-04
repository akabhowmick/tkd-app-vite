import { Sale } from "../../types/sales";
import { supabase } from "../supabase";

export async function fetchTodaysSales(schoolId: string): Promise<Sale[]> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("school_id", schoolId)
    .gte("payment_date", today)
    .order("payment_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchAllSales(schoolId: string): Promise<Sale[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("school_id", schoolId)
    .order("payment_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createSale(newSale: Omit<Sale, "sale_id" | "created_at" | "updated_at">): Promise<Sale> {
  const { data, error } = await supabase
    .from("sales")
    .insert(newSale)
    .select()
    .single();

  if (error) throw error;
  return data;
}
