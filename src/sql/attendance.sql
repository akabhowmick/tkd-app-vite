-- Create attendance_records table
CREATE TABLE attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  school_id TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
);

-- Create indexes for better query performance
CREATE INDEX idx_attendance_student_id ON attendance_records(student_id);
CREATE INDEX idx_attendance_school_id ON attendance_records(school_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_school_date ON attendance_records(school_id, date);

-- Create unique constraint to prevent duplicate records for same student on same date
CREATE UNIQUE INDEX idx_attendance_unique_student_date 
ON attendance_records(student_id, date);

-- Enable Row Level Security (RLS)
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (adjust based on your needs)
-- Policy to allow users to read records for their school
CREATE POLICY "Users can view attendance for their school" ON attendance_records
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to insert/update records for their school
CREATE POLICY "Users can manage attendance for their school" ON attendance_records
  FOR ALL USING (
    school_id IN (
      SELECT school_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );