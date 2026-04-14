-- ─────────────────────────────────────────────
-- Migration: School Programs
-- ─────────────────────────────────────────────

-- 1. Create school_programs table
CREATE TABLE IF NOT EXISTS public.school_programs (
  program_id   UUID        NOT NULL DEFAULT gen_random_uuid(),
  school_id    UUID        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  program_type TEXT        NOT NULL DEFAULT 'time_based'
                           CHECK (program_type IN ('time_based', 'milestone_based')),
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT school_programs_pkey PRIMARY KEY (program_id),
  -- Each school can't have two programs with the same name
  CONSTRAINT school_programs_unique_name UNIQUE (school_id, name)
);

CREATE INDEX idx_school_programs_school ON public.school_programs(school_id);

-- RLS
ALTER TABLE public.school_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view programs for their school"
  ON public.school_programs FOR SELECT
  USING (school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid()));

CREATE POLICY "Admins can manage programs for their school"
  ON public.school_programs FOR ALL
  USING (school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid()));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_school_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_school_programs_timestamp
  BEFORE UPDATE ON public.school_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_school_programs_updated_at();


-- 2. Add program_id to renewal_periods (nullable — existing rows unaffected)
ALTER TABLE public.renewal_periods
  ADD COLUMN IF NOT EXISTS program_id UUID
  REFERENCES public.school_programs(program_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_renewal_periods_program
  ON public.renewal_periods(program_id);


-- 3. Auto-create "Regular" program for every existing school
-- (Safe to run multiple times — the UNIQUE constraint prevents duplicates)
INSERT INTO public.school_programs (school_id, name, program_type, description)
SELECT id, 'Regular', 'time_based', 'Standard time-based membership'
FROM schools
ON CONFLICT (school_id, name) DO NOTHING;


-- 4. Backfill existing renewal_periods to use the "Regular" program
-- Only updates rows that don't already have a program_id set
UPDATE public.renewal_periods rp
SET program_id = (
  SELECT program_id
  FROM public.school_programs sp
  WHERE sp.school_id = rp.school_id
    AND sp.name = 'Regular'
  LIMIT 1
)
WHERE rp.program_id IS NULL;