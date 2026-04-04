-- inventory_items table
CREATE TABLE inventory_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Uniforms', 'Gear', 'Belts', 'Merchandise')),
  sku TEXT, -- stock keeping unit (optional)
  size TEXT, -- e.g., "S", "M", "L", "XL"
  color TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 5,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_school ON inventory_items(school_id);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_inventory_sku ON inventory_items(sku);

-- inventory_transactions table
-- Tracks all stock movements (sales, restocks, adjustments)
CREATE TABLE inventory_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(item_id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'restock', 'adjustment')),
  quantity INTEGER NOT NULL, -- positive for restock, negative for sale
  price_per_unit DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL, -- only for sales to students
  notes TEXT,
  created_by TEXT,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_item ON inventory_transactions(item_id);
CREATE INDEX idx_transactions_school ON inventory_transactions(school_id);
CREATE INDEX idx_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX idx_transactions_student ON inventory_transactions(student_id);

-- Trigger: Auto-update inventory stock when transaction is created
CREATE OR REPLACE FUNCTION update_inventory_stock_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the stock quantity based on transaction type
  IF NEW.transaction_type = 'sale' THEN
    -- For sales, quantity should be negative
    UPDATE inventory_items
    SET stock_quantity = stock_quantity + NEW.quantity
    WHERE item_id = NEW.item_id;
  ELSIF NEW.transaction_type = 'restock' THEN
    -- For restocks, quantity should be positive
    UPDATE inventory_items
    SET stock_quantity = stock_quantity + NEW.quantity
    WHERE item_id = NEW.item_id;
  ELSIF NEW.transaction_type = 'adjustment' THEN
    -- For adjustments, can be positive or negative
    UPDATE inventory_items
    SET stock_quantity = stock_quantity + NEW.quantity
    WHERE item_id = NEW.item_id;
  END IF;

  -- Prevent negative stock
  UPDATE inventory_items
  SET stock_quantity = GREATEST(0, stock_quantity)
  WHERE item_id = NEW.item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_stock
  AFTER INSERT ON inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_stock_on_transaction();

-- Auto-update updated_at trigger for inventory_items
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_timestamp
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();

-- Row Level Security
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view inventory for their school"
  ON inventory_items FOR SELECT
  USING (school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid()));

CREATE POLICY "Admins can manage inventory for their school"
  ON inventory_items FOR ALL
  USING (school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid()));

CREATE POLICY "Admins can view transactions for their school"
  ON inventory_transactions FOR SELECT
  USING (school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid()));

CREATE POLICY "Admins can manage transactions for their school"
  ON inventory_transactions FOR ALL
  USING (school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid()));
