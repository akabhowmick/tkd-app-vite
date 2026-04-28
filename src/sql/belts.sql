-- belt_ranks table
-- Custom belt ranking system per school
CREATE TABLE belt_ranks
(
  rank_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  rank_name TEXT NOT NULL,
  -- e.g., "White Belt", "Yellow Belt", "Black Belt"
  rank_order INTEGER NOT NULL,
  -- lower number = lower rank (for sorting)
  color_code TEXT DEFAULT '#000000',
  -- hex color for UI display
  stripe_color TEXT,
  -- optional stripe color for intermediate ranks
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: each school can't have duplicate rank orders
  CONSTRAINT unique_school_rank_order UNIQUE (school_id, rank_order)
);

CREATE INDEX idx_belt_ranks_school ON belt_ranks(school_id);
CREATE INDEX idx_belt_ranks_order ON belt_ranks(rank_order);

-- belt_promotions table
-- Full history of promotions for each student
CREATE TABLE belt_promotions
(
  promotion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  from_rank_id UUID REFERENCES belt_ranks(rank_id) ON DELETE SET NULL,
  to_rank_id UUID NOT NULL REFERENCES belt_ranks(rank_id) ON DELETE CASCADE,
  promotion_date DATE NOT NULL,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('manual', 'test')),
  test_score DECIMAL(5, 2),
  -- optional, only for test-based promotions
  notes TEXT,
  promoted_by TEXT,
  -- name of the instructor/admin
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure test_score is provided when promotion_type is 'test'
  CONSTRAINT check_test_score CHECK (
    promotion_type != 'test' OR test_score IS NOT NULL
  )
);

CREATE INDEX idx_promotions_student ON belt_promotions(student_id);
CREATE INDEX idx_promotions_school ON belt_promotions(school_id);
CREATE INDEX idx_promotions_date ON belt_promotions(promotion_date);
CREATE INDEX idx_promotions_to_rank ON belt_promotions(to_rank_id);

-- Add current_rank_id to students table
ALTER TABLE students
  ADD COLUMN
IF NOT EXISTS current_rank_id UUID REFERENCES belt_ranks
(rank_id) ON
DELETE
SET NULL;

CREATE INDEX
IF NOT EXISTS idx_students_rank ON students
(current_rank_id);

-- Trigger: Auto-update student's current_rank_id when promoted
CREATE OR REPLACE FUNCTION update_student_rank_on_promotion
()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE students
  SET current_rank_id = NEW.to_rank_id
  WHERE id = NEW.student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_student_rank
  AFTER
INSERT ON
belt_promotions
FOR
EACH
ROW
EXECUTE FUNCTION update_student_rank_on_promotion
();

-- Auto-update updated_at trigger for belt_ranks
CREATE OR REPLACE FUNCTION update_belt_ranks_updated_at
()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW
();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_belt_ranks_timestamp
  BEFORE
UPDATE ON belt_ranks
  FOR EACH ROW
EXECUTE FUNCTION update_belt_ranks_updated_at
();

-- Row Level Security
ALTER TABLE belt_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE belt_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view belt ranks for their school"
  ON belt_ranks FOR
SELECT
  USING (school_id IN (SELECT id
  FROM schools
  WHERE admin_id = auth.uid()));

CREATE POLICY "Admins can manage belt ranks for their school"
  ON belt_ranks FOR ALL
  USING
(school_id IN
(SELECT id
FROM schools
WHERE admin_id = auth.uid())
)
  WITH CHECK
(school_id IN
(SELECT id
FROM schools
WHERE admin_id = auth.uid())
);

CREATE POLICY "Admins can view promotions for their school"
  ON belt_promotions FOR
SELECT
  USING (school_id IN (SELECT id
  FROM schools
  WHERE admin_id = auth.uid()));

CREATE POLICY "Admins can manage promotions for their school"
  ON belt_promotions FOR ALL
  USING
(school_id IN
(SELECT id
FROM schools
WHERE admin_id = auth.uid())
)
  WITH CHECK
(school_id IN
(SELECT id
FROM schools
WHERE admin_id = auth.uid())
);
