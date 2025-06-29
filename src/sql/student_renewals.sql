-- Supabase/PostgreSQL table definition following your conventions:
CREATE TABLE public.student_renewals (
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
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint student_renewals_pkey primary key (id),
  constraint student_renewals_student_id_fkey foreign key (student_id) references students (id) on delete cascade
) tablespace pg_default;

-- Student Renewals Dummy Data
-- Note: Using actual UUID student_id values from your CSV data

INSERT INTO public.student_renewals (student_id, duration_months, payment_date, expiration_date, amount_due, amount_paid, number_of_payments, number_of_classes, paid_to, created_at, updated_at) VALUES
-- Liam Smith
('215ece4b-c991-474a-894d-eb40f5c2457d', 6, '2025-01-15', '2025-07-15', 450.00, 450.00, 1, 24, 'Online Payment', '2025-01-15 10:30:00', '2025-01-15 10:30:00'),
('215ece4b-c991-474a-894d-eb40f5c2457d', 3, '2025-07-10', '2025-10-10', 225.00, 225.00, 1, 12, 'Credit Card', '2025-07-10 14:20:00', '2025-07-10 14:20:00'),

-- Olivia Brown
('cba12ba8-639c-4882-8cb0-e2f656d4cb2a', 12, '2024-12-01', '2025-12-01', 800.00, 800.00, 1, 48, 'Bank Transfer', '2024-12-01 09:15:00', '2024-12-01 09:15:00'),

-- Noah Davis
('baddc839-aa1e-4096-a953-85d226c8a92f', 3, '2025-02-20', '2025-05-20', 240.00, 240.00, 1, 12, 'Cash', '2025-02-20 16:45:00', '2025-02-20 16:45:00'),
('baddc839-aa1e-4096-a953-85d226c8a92f', 6, '2025-05-15', '2025-11-15', 480.00, 240.00, 2, 24, 'Payment Plan', '2025-05-15 11:30:00', '2025-05-15 11:30:00'),

-- Ava Wilson
('bfa78110-ce8e-45c9-9fc4-1bca81b9d907', 9, '2025-01-08', '2025-10-08', 675.00, 675.00, 1, 36, 'Online Payment', '2025-01-08 13:20:00', '2025-01-08 13:20:00'),

-- Elijah Miller
('9e46b368-e759-4576-a834-883c8084d1ea', 6, '2025-03-01', '2025-09-01', 420.00, 420.00, 1, 24, 'Credit Card', '2025-03-01 10:15:00', '2025-03-01 10:15:00'),

-- Sophia Moore
('0bf47fe1-6a34-422c-bfa6-d239d6bc611e', 12, '2024-11-15', '2025-11-15', 900.00, 450.00, 4, 48, 'Monthly Payment Plan', '2024-11-15 15:30:00', '2024-11-15 15:30:00'),

-- James Taylor
('df97ecd8-cba2-4b4f-8a7a-e1dcf3139054', 3, '2025-04-10', '2025-07-10', 210.00, 210.00, 1, 12, 'Cash', '2025-04-10 12:45:00', '2025-04-10 12:45:00'),

-- Isabella Anderson
('90afd1be-0dd6-4090-86cf-48c9879320f5', 6, '2025-02-05', '2025-08-05', 450.00, 450.00, 1, 24, 'Bank Transfer', '2025-02-05 14:10:00', '2025-02-05 14:10:00'),

-- Benjamin Thomas
('64a030a1-654c-46a7-8b71-e15ab321bf15', 9, '2025-01-20', '2025-10-20', 630.00, 630.00, 1, 36, 'Online Payment', '2025-01-20 11:25:00', '2025-01-20 11:25:00'),

-- Mia Jackson
('5694b86d-63f7-4770-a24c-38081d0ef0ea', 3, '2025-05-01', '2025-08-01', 225.00, 225.00, 1, 12, 'Credit Card', '2025-05-01 09:40:00', '2025-05-01 09:40:00'),

-- Lucas White
('df9ba992-112b-4e48-9525-aa27290afd64', 12, '2024-10-01', '2025-10-01', 840.00, 840.00, 1, 48, 'Annual Payment', '2024-10-01 16:20:00', '2024-10-01 16:20:00'),

-- Charlotte Harris
('e50091cd-27d3-4331-8e8b-738e1413005e', 6, '2025-03-15', '2025-09-15', 480.00, 240.00, 2, 24, 'Bi-annual Payment', '2025-03-15 13:50:00', '2025-03-15 13:50:00'),

-- Henry Martin
('5917e3fc-3751-496f-bf1d-8ed63ad80fb2', 3, '2025-04-20', '2025-07-20', 195.00, 195.00, 1, 12, 'Cash', '2025-04-20 10:35:00', '2025-04-20 10:35:00'),

-- Amelia Thompson
('9ec340d9-08d7-4648-acf2-85a462034a94', 9, '2025-01-10', '2025-10-10', 720.00, 720.00, 1, 36, 'Online Payment', '2025-01-10 15:15:00', '2025-01-10 15:15:00'),

-- Alexander Garcia
('3905b4b7-4f63-46b0-a15c-74ecf316414a', 6, '2025-02-28', '2025-08-28', 420.00, 420.00, 1, 24, 'Credit Card', '2025-02-28 12:05:00', '2025-02-28 12:05:00'),

-- Harper Martinez
('93164bbb-8a91-459a-8590-fd8bcb7691f3', 12, '2024-12-15', '2025-12-15', 960.00, 320.00, 3, 48, 'Quarterly Payment', '2024-12-15 14:40:00', '2024-12-15 14:40:00'),

-- Sebastian Robinson
('11fd319d-0089-48d5-9a13-3b058354c454', 3, '2025-05-10', '2025-08-10', 240.00, 240.00, 1, 12, 'Bank Transfer', '2025-05-10 11:55:00', '2025-05-10 11:55:00'),

-- Evelyn Clark
('a1dd0858-d98b-40b9-9231-51aa1dea48d7', 6, '2025-01-25', '2025-07-25', 450.00, 450.00, 1, 24, 'Online Payment', '2025-01-25 16:30:00', '2025-01-25 16:30:00'),

-- Jack Rodriguez
('153d34e8-c680-43f1-8456-818c65f8a8df', 9, '2025-03-05', '2025-12-05', 675.00, 675.00, 1, 36, 'Credit Card', '2025-03-05 09:20:00', '2025-03-05 09:20:00'),

-- Abigail Lewis
('7c710774-5a81-450d-8d5b-8b906dd36969', 3, '2025-04-15', '2025-07-15', 210.00, 210.00, 1, 12, 'Cash', '2025-04-15 13:25:00', '2025-04-15 13:25:00'),

-- Owen Lee
('101f9e86-fdb2-4762-928a-115cb06f7abd', 12, '2024-11-01', '2025-11-01', 800.00, 800.00, 1, 48, 'Annual Payment', '2024-11-01 10:45:00', '2024-11-01 10:45:00'),

-- Emily Walker
('9c51188b-c52c-4355-8157-911df7f2e8dc', 6, '2025-02-12', '2025-08-12', 480.00, 160.00, 3, 24, 'Monthly Payment Plan', '2025-02-12 15:10:00', '2025-02-12 15:10:00'),

-- Daniel Hall
('4fb16d8b-dec2-43aa-a833-515e4c153074', 3, '2025-05-05', '2025-08-05', 225.00, 225.00, 1, 12, 'Bank Transfer', '2025-05-05 12:15:00', '2025-05-05 12:15:00'),

-- Elizabeth Allen
('7c7934c9-ef72-40af-b9a0-5b84ed1c3b91', 9, '2025-01-30', '2025-10-30', 630.00, 630.00, 1, 36, 'Online Payment', '2025-01-30 14:25:00', '2025-01-30 14:25:00'),

-- Matthew Young
('f69d9bfd-b726-4442-8cfa-6379ee998b78', 6, '2025-03-20', '2025-09-20', 420.00, 420.00, 1, 24, 'Credit Card', '2025-03-20 11:40:00', '2025-03-20 11:40:00'),

-- Sofia Hernandez
('95f97a70-24e0-4094-833a-babd9b5c005a', 12, '2024-12-10', '2025-12-10', 840.00, 420.00, 2, 48, 'Semi-annual Payment', '2024-12-10 16:55:00', '2024-12-10 16:55:00'),

-- Jackson King
('494ac95a-ddec-453f-bc57-9db6b75aa26d', 3, '2025-04-25', '2025-07-25', 195.00, 195.00, 1, 12, 'Cash', '2025-04-25 09:30:00', '2025-04-25 09:30:00'),

-- Avery Wright
('68d1e779-aeb0-478a-b935-82962529c6c5', 6, '2025-02-18', '2025-08-18', 450.00, 450.00, 1, 24, 'Bank Transfer', '2025-02-18 13:05:00', '2025-02-18 13:05:00'),

-- Scarlett Lopez
('2f9818f3-d3a3-4804-9b87-1df86b69d1a6', 9, '2025-01-12', '2025-10-12', 720.00, 720.00, 1, 36, 'Online Payment', '2025-01-12 15:45:00', '2025-01-12 15:45:00'),

-- Emma Johanson
('6aad40ce-909e-4f56-be93-2a6ee2318955', 3, '2025-05-15', '2025-08-15', 240.00, 240.00, 1, 12, 'Credit Card', '2025-05-15 10:20:00', '2025-05-15 10:20:00'),

-- Rickie Hodkiewicz
('420b100c-52fa-45f2-a1aa-a48948a922ca', 6, '2025-06-01', '2025-12-01', 480.00, 0.00, 1, 24, 'Pending Payment', '2025-06-01 12:30:00', '2025-06-01 12:30:00');
