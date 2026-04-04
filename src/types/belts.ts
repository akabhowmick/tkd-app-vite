export type PromotionType = 'manual' | 'test';

export interface BeltRank {
  rank_id: string;
  school_id: string;
  rank_name: string;
  rank_order: number;
  color_code: string;
  created_at: string;
  updated_at: string;
}

export interface BeltPromotion {
  promotion_id: string;
  student_id: string;
  school_id: string;
  from_rank_id?: string;
  to_rank_id: string;
  promotion_date: string;
  promotion_type: PromotionType;
  test_score?: number;
  notes?: string;
  promoted_by: string;
  created_at: string;
}

export interface PromotionWithRanks extends BeltPromotion {
  from_rank?: BeltRank;
  to_rank: BeltRank;
  student_name?: string;
}

export interface CreateBeltRankRequest {
  school_id: string;
  rank_name: string;
  rank_order: number;
  color_code?: string;
}

export interface UpdateBeltRankRequest {
  rank_name?: string;
  rank_order?: number;
  color_code?: string;
}

export interface CreatePromotionRequest {
  student_id: string;
  school_id: string;
  from_rank_id?: string;
  to_rank_id: string;
  promotion_date: string;
  promotion_type: PromotionType;
  test_score?: number;
  notes?: string;
  promoted_by: string;
}

export interface StudentWithRank {
  id: string;
  name: string;
  current_rank?: BeltRank;
}
