
-- class_sessions table
-- One row per class occurrence (either recurring weekly or one-off)
CREATE TABLE class_sessions
(
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('recurring', 'one-off')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  -- 0 = Sunday, 6 = Saturday (null for one-off)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  specific_date DATE,
  -- only for one-off sessions
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
