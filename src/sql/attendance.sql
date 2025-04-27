create table sales (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  amount numeric not null,
  description text,
  created_at timestamp with time zone default now(),
  school_id uuid references schools(id) on delete cascade
);
