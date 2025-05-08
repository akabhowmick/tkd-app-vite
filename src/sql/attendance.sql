create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references users(id) on delete cascade,
  school_id uuid references schools(id) on delete cascade,
  date date not null,
  status text check (status in ('present', 'absent')) not null,
  inserted_at timestamp with time zone default now()
);

-- Optional: Create unique constraint to prevent duplicate attendance per student per day
create unique index attendance_unique_per_day on attendance (student_id, date);


