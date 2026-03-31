# TaeKwonTrack — Unresolved Issues

## 🔴 Critical / High

- [ ] **#12** — PrivateRoute renders a NavLink instead of redirecting unauthenticated users
  - `src/components/AppRouter.tsx`
  - Replace `<NavLink to="/login" replace />` with `<Navigate to="/login" replace />`

- [ ] **#14** — RLS policies in attendance.sql reference a non-existent table
  - `src/sql/attendance.sql`
  - Policies reference `user_profiles` which doesn't exist in the schema — update to match actual auth pattern

- [ ] **#16** — Two `CREATE TABLE sales` statements in the same migration file
  - `src/sql/sales.sql`
  - First definition uses `user_id`, second uses `student_id` — delete the first, keep the detailed second version

- [ ] **#17** — Primary key column mismatch between SQL and app code
  - `src/sql/student_renewals.sql`
  - SQL defines `id` as primary key but every API call and type uses `renewal_id`
  - Confirm migration ran the updated version with `renewal_id` as the column name

---

## 🟡 Medium

- [ ] **#8** — "Today's Money" stat card always shows 0
  - `src/context/SchoolContext.tsx`
  - `sales` table has no `school_id` column so the query always fails — currently hardcoded to `setSales(0)`
  - Needs `school_id` added to the sales table schema before this can be wired up

- [ ] **#9** — `loadStudents` fetches every student across all schools then filters client-side
  - `src/context/SchoolContext.tsx`
  - `getStudents()` already accepts a `schoolId` param — pass `targetSchoolId` directly instead of filtering after

- [ ] **#13** — `console.error(error)` fires on every successful login
  - `src/context/AuthContext.tsx`
  - Change `console.error(error)` to `if (error) console.error(error)`

- [ ] **#15** — Duplicate API files with conflicting exports
  - `src/api/AppUserRequests/AppUserRequests.ts` and `src/api/AppUserRequests/UserService.ts`
  - Both export `createUser`, `updateUser`, `deleteUser` with different type signatures
  - Neither is actively used — consolidate or delete both

- [ ] **#18** — Stat cards always show 0 (downstream of #4 and #8)
  - `src/components/MainDashboard/StatCard/StatCards.tsx`
  - Will resolve automatically once the attendance table name fix (#4) and sales `school_id` fix (#8) are done

- [ ] **#19** — `<a href>` on homepage causes full page reload instead of client-side navigation
  - `src/pages/Home.tsx`
  - Replace `<a href="/signup">` with `<Link to="/signup">` from react-router-dom

- [ ] **#20** — Mobile nav has no outside-click close on iOS Safari
  - `src/components/Header.tsx`
  - Add a backdrop overlay div behind the open menu that calls `setMobileOpen(false)` on click

- [ ] **#21** — No error or empty state on SchoolManagement when school isn't found
  - `src/components/AccountDashboards/AdminFeatures/SchoolManagement/SchoolManagement.tsx`
  - Fresh signups see a blank page with no guidance — add an empty state with a prompt to create their school

- [ ] **#25** — No 404 catch-all route
  - `src/components/AppRouter.tsx`
  - Add `<Route path="*" element={<NotFound />} />` at the bottom of the Routes block

---

## 🟢 Low / Pre-Launch

- [ ] **#22** — Footer has placeholder contact info
  - `src/components/Footer.tsx`
  - Phone, email, and address are placeholder strings — update before real users see it

- [ ] **#23** — Announcements not wired to Supabase
  - `src/components/AccountDashboards/AdminFeatures/Admin/Annoucements/`
  - All announcement UI reads from `dummyInfo.ts` — Create/Edit/Delete only call `console.log`

- [ ] **#24** — Sales still using mock data in production path
  - `src/api/SalesRequests/salesApi.ts`
  - Simulates API calls with `setTimeout` and in-memory state
  - Supabase sales table and schema exist but the API layer hasn't been wired up
