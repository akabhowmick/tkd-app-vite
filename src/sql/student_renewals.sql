create table public.renewal_payments (
  payment_id uuid not null default gen_random_uuid (),
  period_id uuid not null,
  student_id uuid not null,
  payment_date date null,
  amount_due numeric(10, 2) null,
  amount_paid numeric(10, 2) null,
  installment_number integer not null default 1,
  paid_to text null,
  created_at timestamp without time zone not null default now(),
  constraint renewal_payments_pkey primary key (payment_id),
  constraint renewal_payments_period_fkey foreign KEY (period_id) references renewal_periods (period_id) on delete CASCADE,
  constraint renewal_payments_student_fkey foreign KEY (student_id) references students (id) on delete CASCADE,
  constraint renewal_payments_amount_check check (
    (
      (amount_paid >= (0)::numeric)
      and (amount_due >= (0)::numeric)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_payments_period on public.renewal_payments using btree (period_id) TABLESPACE pg_default;

create index IF not exists idx_payments_student on public.renewal_payments using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_payments_date on public.renewal_payments using btree (payment_date) TABLESPACE pg_default;


create table public.renewal_periods (
  period_id uuid not null default gen_random_uuid (),
  student_id uuid not null,
  school_id uuid null,
  duration_months integer null,
  expiration_date date null,
  number_of_classes integer null,
  status text not null default 'active'::text,
  resolved_at timestamp without time zone null,
  resolution_notes text null,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  program_id uuid null,
  constraint renewal_periods_pkey primary key (period_id),
  constraint renewal_periods_program_id_fkey foreign KEY (program_id) references school_programs (program_id) on delete set null,
  constraint renewal_periods_school_fkey foreign KEY (school_id) references schools (id),
  constraint renewal_periods_student_fkey foreign KEY (student_id) references students (id) on delete CASCADE,
  constraint renewal_periods_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'expired'::text,
          'renewed'::text,
          'quit'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_renewal_periods_program on public.renewal_periods using btree (program_id) TABLESPACE pg_default;

create unique INDEX IF not exists one_active_period_per_student on public.renewal_periods using btree (student_id) TABLESPACE pg_default
where
  (status = 'active'::text);

create index IF not exists idx_periods_student on public.renewal_periods using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_periods_school on public.renewal_periods using btree (school_id) TABLESPACE pg_default;

create index IF not exists idx_periods_status on public.renewal_periods using btree (status) TABLESPACE pg_default;

create index IF not exists idx_periods_expiration on public.renewal_periods using btree (expiration_date) TABLESPACE pg_default;