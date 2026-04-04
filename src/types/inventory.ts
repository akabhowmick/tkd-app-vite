export type InventoryCategory = 'Uniforms' | 'Gear' | 'Belts' | 'Merchandise';
export type TransactionType = 'sale' | 'restock' | 'adjustment';

export interface InventoryItem {
  item_id: string;
  school_id: string;
  item_name: string;
  category: InventoryCategory;
  sku?: string;
  size?: string;
  color?: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  transaction_id: string;
  item_id: string;
  school_id: string;
  transaction_type: TransactionType;
  quantity: number;
  price_per_unit?: number;
  total_amount?: number;
  student_id?: string;
  notes?: string;
  created_by?: string;
  transaction_date: string;
  created_at: string;
}

export interface TransactionWithItem extends InventoryTransaction {
  item: InventoryItem;
  student_name?: string;
}

export interface CreateInventoryItemRequest {
  school_id: string;
  item_name: string;
  category: InventoryCategory;
  sku?: string;
  size?: string;
  color?: string;
  price: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  description?: string;
}

export interface UpdateInventoryItemRequest {
  item_name?: string;
  category?: InventoryCategory;
  sku?: string;
  size?: string;
  color?: string;
  price?: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  description?: string;
}

export interface CreateTransactionRequest {
  item_id: string;
  school_id: string;
  transaction_type: TransactionType;
  quantity: number;
  price_per_unit?: number;
  total_amount?: number;
  student_id?: string;
  notes?: string;
  created_by?: string;
  transaction_date?: string;
}

export interface InventoryItemWithAlert extends InventoryItem {
  is_low_stock: boolean;
}
