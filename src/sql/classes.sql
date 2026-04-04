-- classes table
-- One row per class (e.g., "Kids Beginners", "Adults Advanced")
CREATE TABLE classes (
  class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  age_group TEXT NOT NULL CHECK (age_group IN ('Kids', 'Adults', 'All')),
  instructor TEXT,
  color TEXT DEFAULT '#3b82f6', -- hex color for UI display
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_classes_school ON classes(school_id);

-- class_sessions table
-- One row per class occurrence (either recurring weekly or one-off)
CREATE TABLE class_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('recurring', 'one-off')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday (null for one-off)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  specific_date DATE, -- only for one-off sessions
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: recurring sessions must have day_of_week, one-off must have specific_date
  CONSTRAINT check_session_type_fields CHECK (
    (session_type = 'recurring' AND day_of_week IS NOT NULL AND specific_date IS NULL) OR
    (session_type = 'one-off' AND specific_date IS NOT NULL)
  )
);

CREATE INDEX idx_sessions_class ON class_sessions(class_id);
CREATE INDEX idx_sessions_school ON class_sessions(school_id);
CREATE INDEX idx_sessions_type ON class_sessions(session_type);
CREATE INDEX idx_sessions_date ON class_sessions(specific_date);

-- Update attendance_records to link with classes
-- Add class_id and session_id columns (nullable for backward compatibility)
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(class_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES class_sessions(session_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance_records(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);

-- Auto-update updated_at trigger for classes
CREATE OR REPLACE FUNCTION update_classes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_classes_timestamp
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_classes_updated_at();

-- Auto-update updated_at trigger for class_sessions
CREATE TRIGGER update_sessions_timestamp
  BEFORE UPDATE ON class_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_classes_updated_at();

-- Row Level Security
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view classes for their school"
  ON classes FOR SELECT
  USING (school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid()));

CREATE POLICY "Admins can manage classes for their school"
  ON classes FOR ALL
  USING (school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid()));

CREATE POLICY "Admins can view sessions for their school"
  ON class_sessions FOR SELECT
  USING (school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid()));

CREATE POLICY "Admins can manage sessions for their school"
  ON class_sessions FOR ALL
  USING (school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid()));
