-- Supabase/PostgreSQL table definition following your conventions:
CREATE TABLE public.student_renewals
(
  id uuid not null default gen_random_uuid (),
  student_id uuid not null,
  duration_months integer null,
  payment_date date null,
  expiration_date date null,
  amount_due decimal(10,2) null,
  amount_paid decimal(10,2) null,
  number_of_payments integer null default 1,
  number_of_classes integer null,
  paid_to text null,
  created_at timestamp
  without time zone null default now
  (),
  updated_at timestamp without time zone null default now
  (),
  constraint student_renewals_pkey primary key
  (id),
  constraint student_renewals_student_id_fkey foreign key
  (student_id) references students
  (id) on
  delete cascade
) tablespace pg_default;

  CREATE TABLE renewal_periods
  (
    period_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    school_id uuid REFERENCES schools(id),
    duration_months integer,
    expiration_date date,
    number_of_classes integer,
    status text NOT NULL DEFAULT 'active'
      CHECK (status = ANY (ARRAY['active','expired','renewed','quit'])
  )
  ,
  resolved_at timestamp,
  resolution_notes text,
  created_at timestamp DEFAULT now
  (),
  updated_at timestamp DEFAULT now
  ()
);

  CREATE TABLE renewal_payments
  (
    payment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id uuid NOT NULL REFERENCES renewal_periods(period_id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    payment_date date,
    amount_due numeric(10,2),
    -- full balance for this installment
    amount_paid numeric(10,2),
    installment_number integer NOT NULL DEFAULT 1,
    paid_to text,
    created_at timestamp DEFAULT now()
  );

  -- The one active period per student constraint lives here now
  CREATE UNIQUE INDEX one_active_period_per_student
ON renewal_periods (student_id)
WHERE status = 'active';

ALTER TABLE public.renewal_periods  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_payments ENABLE ROW LEVEL SECURITY;

-- Periods: admin of the school can do everything
CREATE POLICY "Admin manages renewal periods"
  ON public.renewal_periods
  FOR ALL
  USING (
    school_id IN (
      SELECT id FROM schools WHERE admin_id = auth.uid()
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT id FROM schools WHERE admin_id = auth.uid()
    )
  );

-- Payments: same rule, scoped through the period's school
CREATE POLICY "Admin manages renewal payments"
  ON public.renewal_payments
  FOR ALL
  USING (
    period_id IN (
      SELECT rp.period_id
      FROM renewal_periods rp
      JOIN schools s ON s.id = rp.school_id
      WHERE s.admin_id = auth.uid()
    )
  )
  WITH CHECK (
    period_id IN (
      SELECT rp.period_id
      FROM renewal_periods rp
      JOIN schools s ON s.id = rp.school_id
      WHERE s.admin_id = auth.uid()
    )
  );