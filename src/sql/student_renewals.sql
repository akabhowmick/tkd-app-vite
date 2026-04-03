-- renewal_periods
-- One row per enrollment block per student
CREATE TABLE public.renewal_periods
(
  period_id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  school_id uuid NULL,
  duration_months integer NULL,
  expiration_date date NULL,
  number_of_classes integer NULL,
  status text NOT NULL DEFAULT 'active',
  resolved_at timestamp NULL,
  resolution_notes text NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),

  CONSTRAINT renewal_periods_pkey PRIMARY KEY (period_id),
  CONSTRAINT renewal_periods_student_fkey
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT renewal_periods_school_fkey
    FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT renewal_periods_status_check
    CHECK (status = ANY (ARRAY['active','expired','renewed','quit'])
)
);

CREATE UNIQUE INDEX one_active_period_per_student
  ON public.renewal_periods (student_id)
  WHERE status = 'active';

CREATE INDEX idx_periods_student    ON public.renewal_periods (student_id);
CREATE INDEX idx_periods_school     ON public.renewal_periods (school_id);
CREATE INDEX idx_periods_status     ON public.renewal_periods (status);
CREATE INDEX idx_periods_expiration ON public.renewal_periods (expiration_date);

-- renewal_payments
-- One row per installment within a period
CREATE TABLE public.renewal_payments
(
  payment_id uuid NOT NULL DEFAULT gen_random_uuid(),
  period_id uuid NOT NULL,
  student_id uuid NOT NULL,
  payment_date date NULL,
  amount_due numeric(10,2) NULL,
  amount_paid numeric(10,2) NULL,
  installment_number integer NOT NULL DEFAULT 1,
  paid_to text NULL,
  created_at timestamp NOT NULL DEFAULT now(),

  CONSTRAINT renewal_payments_pkey PRIMARY KEY (payment_id),
  CONSTRAINT renewal_payments_period_fkey
    FOREIGN KEY (period_id) REFERENCES renewal_periods(period_id) ON DELETE CASCADE,
  CONSTRAINT renewal_payments_student_fkey
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT renewal_payments_amount_check
    CHECK (amount_paid >= 0 AND amount_due >= 0)
);

CREATE INDEX idx_payments_period  ON public.renewal_payments (period_id);
CREATE INDEX idx_payments_student ON public.renewal_payments (student_id);
CREATE INDEX idx_payments_date    ON public.renewal_payments (payment_date);

-- Nightly cron job (pg_cron)
-- Flips active → expired after 7 day grace period
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