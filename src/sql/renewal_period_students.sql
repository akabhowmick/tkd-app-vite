-- Migration: renewal_period_students
-- Enables linking multiple students to a single renewal period (family / sibling renewals).
-- Solo renewals are unaffected — they simply have zero rows in this table.

CREATE TABLE public.renewal_period_students (
  period_id  UUID NOT NULL,
  student_id UUID NOT NULL,

  CONSTRAINT renewal_period_students_pkey PRIMARY KEY (period_id, student_id),
  CONSTRAINT fk_rps_period  FOREIGN KEY (period_id)  REFERENCES public.renewal_periods(period_id) ON DELETE CASCADE,
  CONSTRAINT fk_rps_student FOREIGN KEY (student_id) REFERENCES public.students(id)              ON DELETE CASCADE
);

CREATE INDEX idx_rps_period  ON public.renewal_period_students(period_id);
CREATE INDEX idx_rps_student ON public.renewal_period_students(student_id);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────

ALTER TABLE public.renewal_period_students ENABLE ROW LEVEL SECURITY;

-- Admins can view linked students for renewals that belong to their school
CREATE POLICY "Admins can view linked students for their school"
  ON public.renewal_period_students
  FOR SELECT
  USING (
    period_id IN (
      SELECT period_id
      FROM public.renewal_periods
      WHERE school_id IN (
        SELECT id FROM public.schools WHERE admin_id = auth.uid()
      )
    )
  );

-- Admins can insert / update / delete linked students for renewals in their school
CREATE POLICY "Admins can manage linked students for their school"
  ON public.renewal_period_students
  FOR ALL
  USING (
    period_id IN (
      SELECT period_id
      FROM public.renewal_periods
      WHERE school_id IN (
        SELECT id FROM public.schools WHERE admin_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    period_id IN (
      SELECT period_id
      FROM public.renewal_periods
      WHERE school_id IN (
        SELECT id FROM public.schools WHERE admin_id = auth.uid()
      )
    )
  );
