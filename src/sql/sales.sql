-- Single sales table definition.
-- The first draft (using user_id) has been removed.
-- school_id added so revenue can be scoped per school.

CREATE TABLE sales (
  sale_id      BIGSERIAL    PRIMARY KEY,
  school_id    UUID         NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  student_id   UUID         REFERENCES students (id) ON DELETE SET NULL,
  amount       DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payment_type TEXT         NOT NULL CHECK (payment_type IN ('cash', 'check', 'credit')),
  payment_date TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  category     TEXT         NOT NULL CHECK (category IN ('tuition', 'test_fee', 'demo_fee', 'kpop', 'other')),
  notes        TEXT,
  processed_by TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Notes required when category is 'other'
  CONSTRAINT check_other_category_notes CHECK (
    category != 'other' OR (notes IS NOT NULL AND length(trim(notes)) > 0)
  )
);

-- Indexes
CREATE INDEX idx_sales_school_id    ON sales (school_id);
CREATE INDEX idx_sales_student_id   ON sales (student_id);
CREATE INDEX idx_sales_payment_date ON sales (payment_date);
CREATE INDEX idx_sales_category     ON sales (category);
CREATE INDEX idx_sales_payment_type ON sales (payment_type);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sales for their school"
  ON sales
  FOR SELECT
  USING (
    school_id IN (
      SELECT id FROM schools WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage sales for their school"
  ON sales
  FOR ALL
  USING (
    school_id IN (
      SELECT id FROM schools WHERE admin_id = auth.uid()
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT id FROM schools WHERE admin_id = auth.uid()
    )
  );
