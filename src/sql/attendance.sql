CREATE TABLE attendance_records (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID        NOT NULL,
  status     TEXT        NOT NULL CHECK (status IN ('present', 'absent', 'tardy')),
  school_id  UUID        NOT NULL,
  date       DATE        NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX idx_attendance_student_id    ON attendance_records (student_id);
CREATE INDEX idx_attendance_school_id     ON attendance_records (school_id);
CREATE INDEX idx_attendance_date          ON attendance_records (date);
CREATE INDEX idx_attendance_school_date   ON attendance_records (school_id, date);

-- Unique constraint: one record per student per day (used by upsert onConflict)
CREATE UNIQUE INDEX idx_attendance_unique_student_date
  ON attendance_records (student_id, date);

-- Enable Row Level Security
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Admins can read attendance for their own school
-- Uses schools table (not user_profiles, which doesn't exist)
CREATE POLICY "Admins can view attendance for their school"
  ON attendance_records
  FOR SELECT
  USING (
    school_id IN (
      SELECT id FROM schools WHERE admin_id = auth.uid()
    )
  );

-- Admins can insert / update / delete attendance for their own school
CREATE POLICY "Admins can manage attendance for their school"
  ON attendance_records
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
