CREATE TABLE attendance_records
(
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  school_id UUID NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW
  ()
);

  -- Indexes for query performance
  CREATE INDEX idx_attendance_student_id ON attendance_records(student_id);
  CREATE INDEX idx_attendance_school_id ON attendance_records(school_id);
  CREATE INDEX idx_attendance_date ON attendance_records(date);
  CREATE INDEX idx_attendance_school_date ON attendance_records(school_id, date);

  -- Unique constraint: one record per student per day
  -- This is what the upsert onConflict targets
  CREATE UNIQUE INDEX idx_attendance_unique_student_date
ON attendance_records(student_id, date);

  -- Enable Row Level Security
  ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Admins can view attendance for their school"
ON attendance_records
FOR
  SELECT
    USING (
  school_id IN (
    SELECT id
    FROM schools
    WHERE admin_id = auth.uid()
  )
);

  CREATE POLICY "Admins can manage attendance for their school"
ON attendance_records
FOR ALL
USING
  (
  school_id IN
  (
    SELECT id
  FROM schools
  WHERE admin_id = auth.uid()
  )
  )
WITH CHECK
  (
  school_id IN
  (
    SELECT id
  FROM schools
  WHERE admin_id = auth.uid()
  )
  );