The existing `one_active_period_per_student` partial unique index on `renewal_periods(student_id)` is **not changed** — it still enforces one active period per primary student. Active-period conflicts for linked (sibling) students are enforced at the app level in the context.

---

## How to Create a Family Renewal (UI)

1. Go to **Renewal Management → Register Renewal**.
2. Select the **primary student** (e.g., Isabella Bourdier).
3. Click **"+ Add sibling"** — a second student search row appears.
4. Search for and select the sibling (e.g., Ian Bourdier). Repeat for additional siblings.
5. Fill out program, duration, dates, and payment schedule as normal.
6. Submit — one `renewal_period` row is created with Isabella as the primary student; Ian is linked via `renewal_period_students`.

## Action Checklist

- [ ] Run the schema migration to add `renewal_period_students`
- [ ] Resolve the Tasnim Laghroudi duplicate account
- [ ] Confirm which `usataekwonmaru@gmail.com` students are actually siblings
- [ ] Run sibling group detection query to verify groupings
- [ ] Implement junction-table changes in TypeScript (types, API, context, form, card)
- [ ] Create family renewals for each sibling group via the updated UI
