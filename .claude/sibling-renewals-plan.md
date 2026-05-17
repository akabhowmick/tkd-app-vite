# Sibling Renewals Plan

## Overview

Students with no renewals and no programs were exported to a CSV. Many are sibling accounts — they share a parent email and sometimes the same last name. This plan covers how to identify sibling groups, create renewals for them, and avoid double-counting family payments in reports.

---

## Sibling Groups Identified

Grouped by shared email + last name. Exclude `usataekwonmaru@gmail.com` (school-wide email, not a family).

| Email | Students |
|-------|----------|
| `nbourdier7@gmail.com` | Isabella Bourdier, Ian Bourdier |
| `nargis15@yahoo.com` | Mateen Mir, Sakeenah Mir |
| `yoonhi@yahoo.com` | Khloe Hong, Molly Hong, Gemma Hong |
| `hhekmaty@gmail.com` | Sofia Hekmaty, Zaara Hekmaty |
| `skqueen@gmail.com` | Mikayl Ahmed, Shahzad Ahmed |
| `suzruiz@icloud.com` | Avery Ruiz, Jaxon Ruiz |
| `stacyfmontero@gmail.com` | Sheldon Montero, Sophia Montero |
| `joy4dworld@gmail.com` | Judah Kim, Joy Kim (Jun's sister) |
| `hemmyhere@gmail.com` | Sophia Cho, Emma Cho |

### Needs Manual Review

- **`usataekwonmaru@gmail.com`** — 9 students with different last names (Choi, Ruiz, Johnson, Mallow, Gregory, Park×3, Schmidt). Parks are likely siblings; others are probably just using the school email.
- **Tasnim Laghroudi** — two accounts exist:
  - `58f42970` — placeholder email
  - `730948c1` — real email (`samiratasnim74@gmail.com`)
  - **Action needed: merge or delete the duplicate before creating a renewal.**
- **Taha Laghroudi** — placeholder email, same last name as Tasnim — likely a sibling, confirm before linking.

---

## Schema Change Required

Add `family_group_id` to `renewal_periods` so sibling renewals can be grouped for deduplication in reports.

```sql
ALTER TABLE renewal_periods
  ADD COLUMN IF NOT EXISTS family_group_id UUID NULL;

CREATE INDEX idx_periods_family_group ON renewal_periods(family_group_id)
  WHERE family_group_id IS NOT NULL;
```

---

## SQL: Find Sibling Groups

```sql
WITH candidates AS (
  SELECT
    s.id,
    trim(s.name)                                          AS name,
    split_part(trim(s.name), ' ', -1)                     AS last_name,
    lower(trim(split_part(s.email, ';', 1)))               AS primary_email
  FROM students s
  WHERE s.school_id = '9384874f-fc11-45bc-95de-391a5768810c'
    AND s.email NOT LIKE '%placeholder%'
    AND lower(trim(split_part(s.email, ';', 1)))
          != 'usataekwonmaru@gmail.com'
),
sibling_groups AS (
  SELECT
    primary_email,
    count(*)                              AS member_count,
    array_agg(id   ORDER BY name)         AS student_ids,
    array_agg(name ORDER BY name)         AS student_names,
    count(DISTINCT split_part(trim(name), ' ', -1)) > 1 AS mixed_last_names
  FROM candidates
  GROUP BY primary_email
  HAVING count(*) > 1
)
SELECT * FROM sibling_groups ORDER BY member_count DESC, primary_email;
```

---

## SQL: Create Renewals for a Sibling Group

Run once per family. Each sibling gets their own `renewal_period` row (required by the unique-active-period constraint), but they share a `family_group_id` for deduplication.

Replace the `VALUES` block with the actual student IDs for each family.

```sql
WITH new_family_id AS (
  SELECT gen_random_uuid() AS fgid
),
sibling_ids (student_id) AS (
  VALUES
    ('322cadf9-e003-4222-84ba-c47d3a09b375'::uuid),  -- Isabella Bourdier
    ('a94e0734-7bba-49da-a20b-68325b9955d9'::uuid)   -- Ian Bourdier
)
INSERT INTO renewal_periods (
  student_id, school_id, program_id,
  duration_months, expiration_date, number_of_classes,
  status, family_group_id
)
SELECT
  s.student_id,
  '9384874f-fc11-45bc-95de-391a5768810c',
  '<program_id>',
  12,
  current_date + interval '12 months',
  0,
  'active',
  (SELECT fgid FROM new_family_id)
FROM sibling_ids s;
```

---

## SQL: Report Renewals Without Double-Counting

When a family_group_id is set, only count payments from the first-created sibling's period. Solo students (no family_group_id) are counted normally.

```sql
SELECT
  coalesce(rp.family_group_id::text, rp.period_id::text) AS billing_unit,
  min(s.name)                                             AS representative_student,
  sum(pay.amount_paid)                                    AS total_collected,
  sum(pay.amount_due)                                     AS total_due
FROM renewal_periods rp
JOIN students s        ON s.id         = rp.student_id
JOIN renewal_payments pay ON pay.period_id = rp.period_id
WHERE rp.school_id = '9384874f-fc11-45bc-95de-391a5768810c'
  AND (
    rp.family_group_id IS NULL
    OR rp.student_id = (
      SELECT rp2.student_id
      FROM renewal_periods rp2
      WHERE rp2.family_group_id = rp.family_group_id
      ORDER BY rp2.created_at
      LIMIT 1
    )
  )
GROUP BY billing_unit;
```

---

## Action Checklist

- [ ] Run the schema migration to add `family_group_id`
- [ ] Resolve the Tasnim Laghroudi duplicate account
- [ ] Confirm which `usataekwonmaru@gmail.com` students are actually siblings
- [ ] Confirm Taha Laghroudi is a sibling of Tasnim and link them
- [ ] Run sibling group detection query to verify groupings
- [ ] Create renewals family by family using the bulk insert template
