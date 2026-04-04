-- renewal_periods
-- One row per enrollment block per student.
-- Primary key is period_id to match all API calls and TypeScript types.

CREATE TABLE public.renewal_periods
(
  period_id UUID NOT NULL DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  school_id UUID,
  duration_months INTEGER,
  expiration_date DATE,
  number_of_classes INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),

  CONSTRAINT renewal_periods_pkey PRIMARY KEY (period_id),
  CONSTRAINT renewal_periods_student_fkey
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  CONSTRAINT renewal_periods_school_fkey
    FOREIGN KEY (school_id) REFERENCES schools (id),
  CONSTRAINT renewal_periods_status_check
    CHECK (status = ANY (ARRAY['active', 'expired', 'renewed', 'quit'])
)
);

-- Only one active period per student at a time
CREATE UNIQUE INDEX one_active_period_per_student
  ON public.renewal_periods (student_id)
  WHERE status = 'active';

CREATE INDEX idx_periods_student    ON public.renewal_periods (student_id);
CREATE INDEX idx_periods_school     ON public.renewal_periods (school_id);
CREATE INDEX idx_periods_status     ON public.renewal_periods (status);
CREATE INDEX idx_periods_expiration ON public.renewal_periods (expiration_date);

-- RLS
ALTER TABLE public.renewal_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage renewal periods for their school"
  ON public.renewal_periods
  FOR ALL
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


-- renewal_payments
-- One row per installment within a period.
-- Uses period_id (not period_renewal_id) to match app code.

CREATE TABLE public.renewal_payments
(
  payment_id UUID NOT NULL DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL,
  student_id UUID NOT NULL,
  payment_date DATE,
  amount_due NUMERIC(10, 2),
  amount_paid NUMERIC(10, 2),
  installment_number INTEGER NOT NULL DEFAULT 1,
  paid_to TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),

  CONSTRAINT renewal_payments_pkey PRIMARY KEY (payment_id),
  CONSTRAINT renewal_payments_period_fkey
    FOREIGN KEY (period_id) REFERENCES renewal_periods (period_id) ON DELETE CASCADE,
  CONSTRAINT renewal_payments_student_fkey
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  CONSTRAINT renewal_payments_amount_check
    CHECK (amount_paid >= 0 AND amount_due >= 0)
);

CREATE INDEX idx_payments_period  ON public.renewal_payments (period_id);
CREATE INDEX idx_payments_student ON public.renewal_payments (student_id);
CREATE INDEX idx_payments_date    ON public.renewal_payments (payment_date);

-- RLS
ALTER TABLE public.renewal_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage renewal payments for their school"
  ON public.renewal_payments
  FOR ALL
  USING
(
    student_id IN
(
      SELECT s.id
FROM students s
  JOIN schools sc ON sc.id = s.school_id
WHERE sc.admin_id = auth.uid()
    )
)
  WITH CHECK
(
    student_id IN
(
      SELECT s.id
FROM students s
  JOIN schools sc ON sc.id = s.school_id
WHERE sc.admin_id = auth.uid()
    )
);


-- Nightly cron job (pg_cron)
-- Flips active → expired after the 7-day grace period
SELECT cron.schedule(
  'expire-renewal-periods',
  '0 2 * * *',
  $
$
UPDATE public.renewal_periods
    SET status = 'expired', updated_at = now()
    WHERE status = 'active'
  AND expiration_date < CURRENT_DATE - INTERVAL
'7 days';
  $$
);