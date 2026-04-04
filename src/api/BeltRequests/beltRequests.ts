import { supabase } from "../supabase";
import {
  BeltRank,
  BeltPromotion,
  PromotionWithRanks,
  CreateBeltRankRequest,
  CreatePromotionRequest,
  UpdateBeltRankRequest,
} from "../../types/belts";

// ─────────────────────────────────────────────
// Belt Ranks
// ─────────────────────────────────────────────

export async function getBeltRanks(schoolId: string): Promise<BeltRank[]> {
  const { data, error } = await supabase
    .from("belt_ranks")
    .select("*")
    .eq("school_id", schoolId)
    .order("rank_order");

  if (error) throw error;
  return data || [];
}

export async function getBeltRankById(rankId: string): Promise<BeltRank> {
  const { data, error } = await supabase
    .from("belt_ranks")
    .select("*")
    .eq("rank_id", rankId)
    .single();

  if (error) throw error;
  return data;
}

export async function createBeltRank(rankData: CreateBeltRankRequest): Promise<BeltRank> {
  const { data, error } = await supabase
    .from("belt_ranks")
    .insert(rankData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBeltRank(rankId: string, updates: UpdateBeltRankRequest): Promise<BeltRank> {
  const { data, error } = await supabase
    .from("belt_ranks")
    .update(updates)
    .eq("rank_id", rankId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBeltRank(rankId: string): Promise<void> {
  const { error } = await supabase
    .from("belt_ranks")
    .delete()
    .eq("rank_id", rankId);

  if (error) throw error;
}

// ─────────────────────────────────────────────
// Belt Promotions
// ─────────────────────────────────────────────

export async function getPromotions(schoolId: string): Promise<PromotionWithRanks[]> {
  const { data, error } = await supabase
    .from("belt_promotions")
    .select(`
      *,
      from_rank:belt_ranks!belt_promotions_from_rank_id_fkey(*),
      to_rank:belt_ranks!belt_promotions_to_rank_id_fkey(*)
    `)
    .eq("school_id", schoolId)
    .order("promotion_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getStudentPromotions(studentId: string): Promise<PromotionWithRanks[]> {
  const { data, error } = await supabase
    .from("belt_promotions")
    .select(`
      *,
      from_rank:belt_ranks!belt_promotions_from_rank_id_fkey(*),
      to_rank:belt_ranks!belt_promotions_to_rank_id_fkey(*)
    `)
    .eq("student_id", studentId)
    .order("promotion_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createPromotion(promotionData: CreatePromotionRequest): Promise<BeltPromotion> {
  const { data, error } = await supabase
    .from("belt_promotions")
    .insert(promotionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePromotion(promotionId: string): Promise<void> {
  const { error } = await supabase
    .from("belt_promotions")
    .delete()
    .eq("promotion_id", promotionId);

  if (error) throw error;
}
