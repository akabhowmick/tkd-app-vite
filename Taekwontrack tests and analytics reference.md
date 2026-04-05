# TaeKwonTrack — Tests & Analytics Reference

> **Last updated:** April 2026  
> **Testing tools:** Vitest · React Testing Library · Playwright  
> **Analytics tools:** PostHog · Sentry

---

## Table of Contents

1. [Test Suite Overview](#1-test-suite-overview)
2. [Unit Tests](#2-unit-tests)
3. [Integration Tests](#3-integration-tests)
4. [End-to-End Tests](#4-end-to-end-tests)
5. [Analytics — PostHog Events](#5-analytics--posthog-events)
6. [Analytics — Sentry Error Tracking](#6-analytics--sentry-error-tracking)
7. [Running the Tests](#7-running-the-tests)

---

## 1. Test Suite Overview

| Layer       | Tool         | Files       | Assertions |
| ----------- | ------------ | ----------- | ---------- |
| Unit        | Vitest + RTL | 4 files     | 68         |
| Integration | Vitest + RTL | 2 files     | 13         |
| End-to-End  | Playwright   | 2 files     | 23         |
| **Total**   |              | **8 files** | **104**    |

All tests live under `src/tests/`. Supabase, PostHog, and Sentry are fully mocked in the test environment — no real network calls fire during any test run.

---

## 2. Unit Tests

Unit tests cover pure functions with no side effects. Time-sensitive tests pin `vi.setSystemTime()` so they never drift.

---

### `src/tests/unit/renewalHelpers.test.ts`

**24 assertions** — covers all date calculation and balance functions in `src/utils/RenewalsUtils/renewalHelpers.ts`

#### `calculateNewExpirationDate`

| Test                                      | What It Checks                      |
| ----------------------------------------- | ----------------------------------- |
| Adds correct months from day after expiry | Aug 20 expiry + 3 months = Nov 21   |
| Handles month-end edge cases              | Aug 31 + 3 months = Dec 1           |
| Crosses year boundary correctly           | Nov 30 + 3 months = Mar 1 next year |

#### `calculateExpirationFromStart`

| Test                          | What It Checks                 |
| ----------------------------- | ------------------------------ |
| Adds months from a start date | Jun 1 + 3 = Sep 1              |
| Handles 12-month duration     | Jan 15 + 12 = Jan 15 next year |

#### `calculateDaysUntilExpiration`

| Test                               | What It Checks       |
| ---------------------------------- | -------------------- |
| Returns 0 when expiry is today     | Pinned to 2025-08-20 |
| Returns positive for future expiry | Aug 25 = 5 days      |
| Returns negative for past expiry   | Aug 15 = -5 days     |
| Handles 30 days out                | Sep 19 = 30 days     |

#### `isInGracePeriod`

| Test                               | What It Checks                        |
| ---------------------------------- | ------------------------------------- |
| Returns true when 3 days overdue   | Within 7-day default                  |
| Returns false when 8 days overdue  | Past default grace period             |
| Returns false when not yet expired | Aug 25 is still active                |
| Accepts custom grace period days   | 8 days overdue + 14-day window = true |

#### `isExpiringSoon`

| Test                               | What It Checks               |
| ---------------------------------- | ---------------------------- |
| Returns true when 10 days away     | Within 15-day default window |
| Returns false when 20 days away    | Outside warning window       |
| Returns false when already expired | Aug 10 is past               |
| Returns true when expiry is today  | Day-zero case                |

#### `validateRenewalDates`

| Test                                     | What It Checks             |
| ---------------------------------------- | -------------------------- |
| Returns null for valid range             | Payment before expiry = ok |
| Returns error when dates are equal       | Same day is invalid        |
| Returns error when expiry before payment | Inverted range             |
| Returns error for invalid date string    | `"not-a-date"`             |

#### `determineRenewalStatus`

| Test                                           | What It Checks                |
| ---------------------------------------------- | ----------------------------- |
| Returns `"paid"` when balance is 0             | balance ≤ 0 AND total_due > 0 |
| Returns `"expired"` when 8+ days overdue       | Past grace period             |
| Returns `"grace_period"` when 1-7 days overdue | Within grace window           |
| Returns `"expiring_soon"` within 15 days       | Aug 28 from pinned today      |
| Returns `"active"` when 15+ days out           | Sep 15 from pinned today      |
| `"paid"` overrides `"expiring_soon"`           | Fully paid near-expiry period |

#### `calculateRemainingBalance`

| Test                                  | What It Checks      |
| ------------------------------------- | ------------------- |
| Returns correct difference            | 300 - 100 = 200     |
| Returns 0 when overpaid               | Never goes negative |
| Returns full amount when nothing paid | 300 - 0 = 300       |

#### `calculatePaymentPercentage`

| Test                           | What It Checks       |
| ------------------------------ | -------------------- |
| Returns 50 for half paid       | 150/300 = 50%        |
| Returns 100 for fully paid     | 300/300 = 100%       |
| Caps at 100 when overpaid      | 350/300 still = 100% |
| Returns 0 when amount_due is 0 | No divide-by-zero    |

---

### `src/tests/unit/renewalGrouping.test.ts`

**17 assertions** — tests `deriveUiStatus` and `groupPeriods` from `src/context/StudentRenewalContext.tsx`

> These functions are the most business-critical logic in the app. A bug here would show students in the wrong renewal bucket, so they are tested exhaustively.

#### `deriveUiStatus`

| Test                                                 | What It Checks                       |
| ---------------------------------------------------- | ------------------------------------ |
| Returns `"paid"` when balance is 0 and total_due > 0 | Core paid logic                      |
| Does NOT return `"paid"` when total_due is also 0    | No-renewal-created guard             |
| Returns `"renewed"` regardless of dates              | DB status takes priority             |
| Returns `"quit"` for quit status                     | DB status takes priority             |
| Returns `"expired"` for expired DB status            | DB status takes priority             |
| Returns `"expired"` when 8+ days past expiry         | Calculated from date                 |
| Returns `"grace_period"` when 1-7 days past expiry   | Calculated from date                 |
| Returns `"grace_period"` on exactly day 7            | Boundary condition                   |
| Returns `"expiring_soon"` when expiry is today       | Day-zero boundary                    |
| Returns `"expiring_soon"` when 15 days out           | Outer boundary                       |
| Returns `"active"` when 16+ days out                 | Normal active state                  |
| `"paid"` overrides `"expiring_soon"`                 | Balance check runs before date check |

#### `groupPeriods`

| Test                                       | What It Checks                 |
| ------------------------------------------ | ------------------------------ |
| Routes active period to active bucket      | Normal active assignment       |
| Routes paid period to paid bucket          | Balance-based routing          |
| Excludes renewed periods from all buckets  | Resolved periods are invisible |
| Excludes quit periods from all buckets     | Resolved periods are invisible |
| Routes expired period correctly            | Date-based routing             |
| Handles a mixed bag of 6 periods correctly | All 5 buckets + 1 excluded     |
| Returns empty buckets for empty input      | No crash on empty array        |

---

### `src/tests/unit/formAndAttendance.test.ts`

**14 assertions** — covers `validateFormData` and `calculateAttendanceStats`

#### `validateFormData` (from `src/utils/formValidation.ts`)

| Test                                           | What It Checks                                    |
| ---------------------------------------------- | ------------------------------------------------- |
| Returns null for valid data                    | Happy path                                        |
| Returns error when name is empty               | Required field                                    |
| Returns error when name is only spaces         | Whitespace-only is invalid                        |
| Returns error when name is 1 character         | Minimum 2 chars                                   |
| Returns null when name is exactly 2 characters | Boundary pass                                     |
| Returns error for missing email                | Required field                                    |
| Returns error for invalid email formats        | `not-an-email`, `missing@domain`, `@nodomain.com` |
| Accepts valid complex email format             | `user.name+tag@example.co.uk`                     |
| Phone is optional — returns null when empty    | Optional field                                    |
| Returns error for phone number too short       | Under 10 digits                                   |
| Accepts phone with formatting characters       | `(555) 123-4567`                                  |

#### `calculateAttendanceStats` (from `AttendanceStats.tsx`)

| Test                                                        | What It Checks                           |
| ----------------------------------------------------------- | ---------------------------------------- |
| Calculates correct counts for a typical class               | 2 present, 1 absent, 2 unmarked out of 5 |
| Returns all unmarked when attendance is empty               | 0 marked of 10 = 10 unmarked             |
| Returns 0 unmarked when all students are marked             | Fully marked class                       |
| Handles a class with zero students                          | No crash on empty                        |
| `present + absent + unmarked` always equals `totalStudents` | Sum invariant                            |

---

### `src/tests/unit/salesHelpers.test.ts`

**13 assertions** — covers `formatCurrency`, `getCategoryLabel`, `validateSaleForm`

#### `formatCurrency` (from `src/utils/SaleHelperFunc.ts`)

| Test                                            | What It Checks          |
| ----------------------------------------------- | ----------------------- |
| Formats whole dollar amounts                    | `100` → `$100.00`       |
| Formats amounts with cents                      | `99.99` → `$99.99`      |
| Formats zero                                    | `0` → `$0.00`           |
| Formats large amounts with thousands separators | `1234.56` → `$1,234.56` |
| Rounds to 2 decimal places                      | `10.005` → `$10.01`     |

#### `getCategoryLabel` (from `src/utils/SaleHelperFunc.ts`)

| Test                                           | What It Checks            |
| ---------------------------------------------- | ------------------------- |
| Returns `"Tuition"` for `tuition`              | Known category            |
| Returns `"Test Fee"` for `test_fee`            | Known category            |
| Returns `"Other"` for `other`                  | Known category            |
| Falls back to raw value for unknown categories | Unknown input passthrough |

#### `validateSaleForm` (from `src/utils/SaleHelperFunc.ts`)

| Test                                                 | What It Checks                       |
| ---------------------------------------------------- | ------------------------------------ |
| Returns empty array for valid form                   | Happy path                           |
| Returns error when amount is empty                   | Required field                       |
| Returns error when amount is zero                    | Must be positive                     |
| Returns error when amount is negative                | Must be positive                     |
| Returns error when payment_type is missing           | Required field                       |
| Returns error when payment_date is missing           | Required field                       |
| Returns error when category is missing               | Required field                       |
| Requires notes when category is `"other"`            | Conditional required                 |
| Passes when category is `"other"` and notes provided | Conditional satisfied                |
| Can return multiple errors at once                   | All errors collected, not just first |

---

## 3. Integration Tests

Integration tests exercise the API layer and component rendering with Supabase fully mocked via `vi.mock`.

---

### `src/tests/integration/salesApi.test.ts`

**4 assertions** — tests `fetchTodaysSales` and `createSale` from `src/api/SalesRequests/salesApi.ts`

| Test                                                  | What It Checks           |
| ----------------------------------------------------- | ------------------------ |
| `fetchTodaysSales` returns array on success           | Happy path return shape  |
| `fetchTodaysSales` calls `supabase.from("sales")`     | Correct table targeted   |
| `fetchTodaysSales` throws when Supabase returns error | Error propagation        |
| `createSale` calls `supabase.from("sales")`           | Correct table for insert |
| `createSale` throws on insertion failure              | Error propagation        |

---

### `src/tests/integration/RenewalCard.test.tsx`

**9 assertions** — renders `RenewalCard` with all badge states and verifies UI output

| Test                                              | What It Checks                           |
| ------------------------------------------------- | ---------------------------------------- |
| Renders student name                              | `"Jane Smith"` appears in card           |
| Renders duration months                           | `"3M"` label visible                     |
| Renders total due amount                          | `$300.00` displayed                      |
| Renders total paid amount                         | `$200.00` displayed                      |
| Shows balance owed when positive                  | `"Balance Owed"` and `$100.00` visible   |
| Hides balance owed when fully paid                | `"Balance Owed"` absent for paid periods |
| Shows `"Paid"` badge for `paid` ui_status         | Green paid badge renders                 |
| Shows `"Expiring Soon"` badge for `expiring_soon` | Yellow badge renders                     |
| Shows `"Grace Period"` badge for `grace_period`   | Orange badge renders                     |
| Shows `"Expired"` badge for `expired`             | Red badge renders                        |
| Shows `"Unknown Student"` fallback                | Student not in school list               |
| Payment history toggles on click                  | Toggle interaction works                 |
| Renders `status_message` in subtitle              | Subtitle text populated                  |

---

## 4. End-to-End Tests

E2E tests run against a live Vite dev server using a real browser (Chromium). They also run on Mobile Safari to catch iOS-specific issues. A dedicated test Supabase account is used — never a real admin account.

---

### `src/tests/e2e/auth.spec.ts`

**9 tests** — covers the full authentication flow without logging in

| Test                                           | What It Checks                                       |
| ---------------------------------------------- | ---------------------------------------------------- |
| Login page renders correctly                   | Heading, email input, and sign-in button are visible |
| Shows error for empty form submission          | Validation fires before any network call             |
| Shows friendly error for wrong credentials     | Supabase error is translated to human language       |
| Password show/hide toggle works                | Input type switches between `password` and `text`    |
| Forgot password link navigates correctly       | Goes to `/reset-password`                            |
| Sign up link navigates correctly               | Goes to `/signup`                                    |
| Signup page validates password requirements    | Indicators appear while typing                       |
| Unauthenticated user redirected from dashboard | `/dashboard` → `/login`                              |
| Navigating to unknown route shows 404          | 404 text and back link visible                       |

---

### `src/tests/e2e/dashboard.spec.ts`

**14 tests** — covers the main dashboard and attendance flow after login

| Test                                              | What It Checks                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Dashboard renders stat cards after login          | All 4 stat cards visible within 10s                                                         |
| Sidebar is visible with expected nav items        | Take Attendance, Students, Renewals, Class Scheduling, Belt Tracking, Inventory all present |
| Sidebar collapses and expands                     | Logo text hides when collapsed, reappears on expand                                         |
| Navigating to Students shows student list         | `"Student Management"` heading visible                                                      |
| Navigating to Renewals shows renewal management   | `"Renewal Management"` heading visible                                                      |
| Navigating to Belt Tracking shows belt page       | `"Belt Tracking"` heading visible                                                           |
| Navigating to Inventory shows inventory page      | `"Inventory Management"` heading visible                                                    |
| User dropdown shows name and logout option        | Log Out button in dropdown                                                                  |
| Logging out redirects to home page                | URL becomes `/` after logout                                                                |
| Attendance page renders calendar and student list | Both columns visible                                                                        |
| Today button is visible on calendar               | Navigation control present                                                                  |
| Mark All dropdown shows all 3 options             | Present, Absent, Tardy all visible                                                          |
| Save button disabled when no students marked      | Cannot submit empty attendance                                                              |
| Stat counters update when student marked          | Present count changes from 0 to 1                                                           |

---

## 5. Analytics — PostHog Events

All events are fired via the typed `track()` function in `src/analytics/posthog.ts`. TypeScript will error at compile time if you pass the wrong event name or wrong property shape.

PostHog also automatically captures `$pageview` on every React Router route change via the `useAnalyticsPageTracking` hook in `src/components/AppRouter.tsx`.

---

### Auth Events

Fired from `src/context/AuthContext.tsx`

| Event             | When                                    | Properties                        |
| ----------------- | --------------------------------------- | --------------------------------- |
| `user_logged_in`  | Successful email/password login         | `{ method: "email" \| "google" }` |
| `user_signed_up`  | New account created and session started | `{ role: string }`                |
| `user_logged_out` | User clicks Log Out anywhere in the app | none                              |

---

### Attendance Events

Fired from `src/context/AttendanceContext.tsx`

| Event                 | When                                                       | Properties                                     |
| --------------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| `attendance_saved`    | Admin clicks Save Attendance and Supabase confirms success | `{ studentCount: number, date: string }`       |
| `attendance_mark_all` | Admin uses the Mark All dropdown                           | `{ status: "present" \| "absent" \| "tardy" }` |

> **Note:** `attendance_mark_all` is defined in the event catalogue but the call site in `TakeAttendance.tsx` has not been wired yet. Add `track("attendance_mark_all", { status })` inside the `markAll` function in that component.

---

### Renewal Events

Fired from `src/context/StudentRenewalContext.tsx`

| Event                         | When                                         | Properties                   |
| ----------------------------- | -------------------------------------------- | ---------------------------- |
| `renewal_created`             | New renewal period successfully created      | `{ durationMonths: number }` |
| `renewal_payment_added`       | New payment installment added to a period    | none                         |
| `renewal_payment_marked_paid` | Next unpaid installment marked as fully paid | none                         |
| `renewal_student_quit`        | Student marked as quit                       | none                         |
| `renewal_renewed`             | Period renewed for another term              | `{ durationMonths: number }` |
| `renewal_deleted`             | Renewal period deleted                       | none                         |

---

### Class Events

Fired from `src/context/ClassContext.tsx`

| Event                   | When                           | Properties                                  |
| ----------------------- | ------------------------------ | ------------------------------------------- |
| `class_created`         | New class successfully created | `{ ageGroup: "Kids" \| "Adults" \| "All" }` |
| `class_deleted`         | Class deleted                  | none                                        |
| `class_session_added`   | Session added to a class       | `{ sessionType: "recurring" \| "one-off" }` |
| `class_session_deleted` | Session removed from a class   | none                                        |

---

### Belt Events

Fired from `src/context/BeltContext.tsx`

| Event               | When                                 | Properties                              |
| ------------------- | ------------------------------------ | --------------------------------------- |
| `belt_rank_created` | New belt rank defined for the school | none                                    |
| `belt_rank_deleted` | Belt rank deleted                    | none                                    |
| `student_promoted`  | Student promoted to a new rank       | `{ promotionType: "manual" \| "test" }` |
| `promotion_deleted` | Promotion record removed             | none                                    |

---

### Inventory Events

Fired from `src/context/InventoryContext.tsx`

| Event                        | When                                      | Properties             |
| ---------------------------- | ----------------------------------------- | ---------------------- |
| `inventory_item_created`     | New item added to inventory               | `{ category: string }` |
| `inventory_item_deleted`     | Item deleted                              | none                   |
| `inventory_sale_recorded`    | Sale transaction recorded against an item | `{ category: string }` |
| `inventory_restock_recorded` | Restock transaction recorded              | none                   |

---

### Navigation Events

Fired from `src/components/MainDashboard/MainDashboard.tsx` and `src/components/MainDashboard/SideBar.tsx`

| Event                  | When                                        | Properties                 |
| ---------------------- | ------------------------------------------- | -------------------------- |
| `sidebar_view_changed` | Admin clicks a sidebar item to switch views | `{ view: string }`         |
| `sidebar_collapsed`    | Sidebar collapse/expand toggle clicked      | `{ collapsed: boolean }`   |
| `$pageview`            | Every React Router route change (automatic) | `{ $current_url: string }` |

---

### Identity Tracking

When a user logs in, signs up, or refreshes the page with an active session, PostHog receives an `identify()` call with:

| Property   | Source                               |
| ---------- | ------------------------------------ |
| `id`       | Supabase user UUID                   |
| `email`    | User's email address                 |
| `name`     | Display name from user metadata      |
| `role`     | User role (`admin`, `student`, etc.) |
| `schoolId` | Linked school UUID                   |

On logout, `posthog.reset()` is called to clear the identity and start a new anonymous session.

---

## 6. Analytics — Sentry Error Tracking

Sentry captures unhandled exceptions and tagged errors from throughout the app.

---

### Error Boundary

`src/App.tsx` wraps the entire application in `<Sentry.ErrorBoundary>`. Any unhandled React render error is caught, sent to Sentry, and replaced with a friendly fallback UI rather than a blank white screen.

---

### User Context

When a user logs in, `setSentryUser()` attaches their identity to all subsequent Sentry events:

| Field      | Value              |
| ---------- | ------------------ |
| `id`       | Supabase user UUID |
| `email`    | Email address      |
| `role`     | User role tag      |
| `schoolId` | Linked school UUID |

On logout, `clearSentryUser()` removes the identity so errors after logout are anonymous.

---

### Tagged Exception Capture

The following contexts call `captureException(error, { feature, action })` on failure, which means every error in Sentry is filterable by feature area:

| Context File            | Feature Tag  | Action Tags                                                                                                                       |
| ----------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `AttendanceContext.tsx` | `attendance` | `save`                                                                                                                            |
| `BeltContext.tsx`       | `belts`      | `loadRanks`, `loadPromotions`, `createRank`, `updateRank`, `deleteRank`, `promoteStudent`, `deletePromotion`, `getStudentHistory` |
| `InventoryContext.tsx`  | `inventory`  | `loadItems`, `loadTransactions`, `createItem`, `updateItem`, `deleteItem`, `recordTransaction`, `deleteTransaction`               |
| `ClassContext.tsx`      | `classes`    | `loadClasses`, `createClass`, `updateClass`, `deleteClass`, `createSession`, `updateSession`, `deleteSession`                     |

`StudentRenewalContext.tsx` and `AuthContext.tsx` surface errors through their own state management but do not call `captureException` directly — errors propagate through the `withAsync` wrapper and are rethrown to the component layer.

---

### Sentry Breadcrumbs

Every React Router route change adds a Sentry breadcrumb via `useAnalyticsPageTracking`. This means Sentry error reports include a navigation trail showing which pages the user visited before the crash.

---

## 7. Running the Tests

```bash
# Run all unit and integration tests
npm run test

# Run with live UI (watch mode + browser interface)
npm run test:ui

# Run with coverage report (output: coverage/index.html)
npm run test:coverage

# Run all E2E tests (requires npm run dev running in another terminal)
npm run test:e2e

# Run E2E with Playwright's visual UI for debugging
npm run test:e2e:ui

# Run E2E in headed mode (watch the browser)
npm run test:e2e:headed
```

### Environment variables required for E2E tests

```
E2E_TEST_EMAIL=testadmin@taekwontrack.com
E2E_TEST_PASSWORD=TestAdmin123!
VITE_SUPABASE_API_URL=your_supabase_url
VITE_SUPABASE_ANON_API_KEY=your_supabase_anon_key
```

> E2E tests should always use a dedicated test Supabase account, never a real school admin account. The test account's data will be read and modified by the tests.

---

### Adding a new test

**Unit test** — add a file to `src/tests/unit/` following the existing pattern. Import the function directly. Use `vi.setSystemTime()` if the function involves dates.

**Integration test** — add a file to `src/tests/integration/`. Mock Supabase return values per-test using `vi.clearAllMocks()` in `beforeEach` and configuring the mock chain per assertion.

**E2E test** — add a file to `src/tests/e2e/` with a `.spec.ts` extension. Use `loginAs()` in `beforeEach` for any test that requires authentication.

---

### Adding a new analytics event

1. Open `src/analytics/posthog.ts`
2. Add the new event to the `AnalyticsEvent` union type
3. Call `track("your_event_name", { props })` at the appropriate place in a context or component

TypeScript will catch missing or incorrect properties at compile time. The test mocks in `src/tests/setup.ts` will automatically silence the new event during tests — no setup needed.

posthog.ts — typed track() with 20+ events, identifyUser, resetIdentity, trackPageView, initPostHog
sentry.ts — initSentry, setSentryUser, clearSentryUser, captureException, addBreadcrumb, re-exports Sentry.ErrorBoundary
useAnalyticsPageTracking.ts — hook that fires pageview + Sentry breadcrumb on every route change
Config files

vitest.config.ts — jsdom, v8 coverage, E2E excluded
playwright.config.ts — Chromium + Mobile Safari, auto dev-server
Test infrastructure

src/tests/setup.ts — mocks Supabase, PostHog, Sentry, matchMedia, localStorage
101 passing tests across 6 files

4 unit test files (renewal helpers, renewal grouping, form+attendance, sales helpers)
2 integration test files (sales API, RenewalCard component)
Modified files

main.tsx — initSentry() + initPostHog() before createRoot
App.tsx — wrapped in <Sentry.ErrorBoundary> with friendly fallback
AppRouter.tsx — useAnalyticsPageTracking() in AppContent
AuthContext.tsx — track, identifyUser, setSentryUser on login/signup/logout
AttendanceContext.tsx — track("attendance_saved"), captureException on errors
StudentRenewalContext.tsx — track all 6 renewal events; exported deriveUiStatus + groupPeriods for testing
BeltContext.tsx — track belt/promotion events + captureException
InventoryContext.tsx — track inventory events + captureException
ClassContext.tsx — track class/session events + captureException
