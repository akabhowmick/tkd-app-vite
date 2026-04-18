CREATE TABLE announcements
(
  announcement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_school ON announcements(school_id);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- All authenticated users in the school can read
CREATE POLICY "School members can view announcements"
  ON announcements FOR
SELECT
  USING (
    school_id IN (
            SELECT id
    FROM schools
    WHERE admin_id = auth.uid()
  UNION
    SELECT school_id
    FROM students
    WHERE id = auth.uid()
  UNION
    SELECT school_id
    FROM users
    WHERE id = auth.uid()
    )
  );

-- Only admins and instructors can write
CREATE POLICY "Admins and instructors can manage announcements"
  ON announcements FOR ALL
  USING
(
    school_id IN
(SELECT id
FROM schools
WHERE admin_id = auth.uid())
OR
    school_id IN
(
      SELECT school_id
FROM users
WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
)
  WITH CHECK
(
    school_id IN
(SELECT id
FROM schools
WHERE admin_id = auth.uid())
OR
    school_id IN
(
      SELECT school_id
FROM users
WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_announcements_updated_at
()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now
();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER announcements_updated_at
  BEFORE
UPDATE ON announcements
  FOR EACH ROW
EXECUTE FUNCTION update_announcements_updated_at
();