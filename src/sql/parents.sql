-- ─────────────────────────────────────────────
-- Parent Students (junction table)
-- Links parent user accounts to their children
-- (students) within a school.
-- ─────────────────────────────────────────────

CREATE TABLE public.parent_students
(
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id)   ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id)    ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT parent_students_pkey   PRIMARY KEY (id),
  CONSTRAINT parent_students_unique UNIQUE (parent_id, student_id)
);

CREATE INDEX idx_parent_students_parent  ON public.parent_students(parent_id);
CREATE INDEX idx_parent_students_student ON public.parent_students(student_id);
CREATE INDEX idx_parent_students_school  ON public.parent_students(school_id);

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────

ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

-- Admins can manage all parent-student links for their school
CREATE POLICY "Admins can manage parent_students"
  ON public.parent_students FOR ALL
  USING
(
    school_id IN
(SELECT id
FROM schools
WHERE admin_id = auth.uid())
)
  WITH CHECK
(
    school_id IN
(SELECT id
FROM schools
WHERE admin_id = auth.uid())
);

-- Parents can read their own links
CREATE POLICY "Parents can view their own links"
  ON public.parent_students FOR
SELECT
  USING (parent_id = auth.uid());