create table sales (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  amount numeric not null,
  description text,
  created_at timestamp with time zone default now(),
  school_id uuid references schools(id) on delete cascade
);


CREATE TABLE sales (
  sale_id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES students(student_id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'check', 'credit')),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category TEXT NOT NULL CHECK (category IN ('tuition', 'test_fee', 'demo_fee', 'kpop', 'other')),
  notes TEXT,
  processed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_sales_student_id ON sales(student_id);
CREATE INDEX idx_sales_payment_date ON sales(payment_date);
CREATE INDEX idx_sales_category ON sales(category);
CREATE INDEX idx_sales_payment_type ON sales(payment_type);
CREATE INDEX idx_sales_created_at ON sales(created_at);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sales_updated_at 
    BEFORE UPDATE ON sales 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add constraint to ensure notes are provided when category is 'other'
ALTER TABLE sales ADD CONSTRAINT check_other_category_notes 
CHECK (
  (category != 'other') OR 
  (category = 'other' AND notes IS NOT NULL AND length(trim(notes)) > 0)
);

/*
 Row Level Security (RLS) Policies
-- Enable RLS on the sales table
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Policy for reading sales (adjust based on your auth setup)
CREATE POLICY "Users can view sales" ON sales
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy for inserting sales
CREATE POLICY "Users can create sales" ON sales
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy for updating sales
CREATE POLICY "Users can update sales" ON sales
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy for deleting sales (might want to restrict this more)
CREATE POLICY "Users can delete sales" ON sales
  FOR DELETE
  USING (auth.role() = 'authenticated');
*/
