# Taekwondo Chat and Notification App

### Overview

The **Taekwondo Chat and Notification App** is a full-stack web application designed to facilitate communication among Taekwondo school members. The app aims to simplify interactions between instructors, students, and parents while ensuring user-friendly navigation for a diverse audience.

---

### Features

- **User Accounts**:
  - Authentication using email/password.
  - Role-based access (Parents, Students, Instructors).
- **Group-Specific Threads**:
  - Dedicated discussion boards for classes or groups.
  - Moderation tools for instructors.
- **Notifications**:
  - Real-time alerts for updates, events, or messages.
- **Profile Management**:
  - Editable user profiles with relevant information.
- **Subscription Model** (Future Release):
  - Premium features and customization options for schools.

---

### Tech Stack

#### Frontend

- Framework: [React](https://reactjs.org/)
- Styling: [TailwindCSS](https://tailwindcss.com/)

#### Backend

- Platform: [Supabase](https://supabase.com/)
- Database: PostgreSQL

#### Additional Tools

- Notifications: [Firebase Cloud Messaging](https://firebase.google.com/products/cloud-messaging)
- Deployment: https://taekwontrack.netlify.app/

---

### Installation

#### Prerequisites

- Node.js >= 16.x
- NPM or Yarn
- Supabase account

# TaeKwonTrack — Pre-Launch Audit

_Last updated: April 13, 2026_

Severity scale: 🔴 **Critical** (blocks launch or causes data loss) | 🟠 **High** (significantly hurts conversion or trust) | 🟡 **Medium** (polish/experience issue) | 🟢 **Low** (nice to have)

---

## 1. Missing Features / Incomplete Code

| #   | Issue                                                                                                                                                                                        | Severity | Fix                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | `attendance_mark_all` PostHog event is defined in the type catalogue but never called in `TakeAttendance.tsx`                                                                                | 🟡       | Add `track("attendance_mark_all", { status })` in the `markAll()` handler                                                                       |
| 1.2 | `SalesTrackingPage` is built but never wired into the sidebar or `VIEW_COMPONENTS` in `MainDashboard.tsx` — admins have no way to reach it                                                   | 🔴       | Add `sales: SalesTrackingPage` to `VIEW_COMPONENTS` and add a Sales item to `NAV_SECTIONS` in `SideBar.tsx`                                     |
| 1.3 | `AddSales.tsx` and `EditSales.tsx` are empty files                                                                                                                                           | 🟡       | Delete them or implement; empty files cause confusion during onboarding and code review                                                         |
| 1.4 | `InstructorManagement.tsx`, `StudentManagement.tsx`, `SchoolSettings.tsx`, and `SchoolSelector.tsx` are stub components returning only a `<div>` with text                                   | 🟠       | Either implement or remove the nav links that point to them — currently dead ends in the dashboard                                              |
| 1.5 | Renewal multi-payment next-due-date logic was discussed but not fully implemented. The `CreateRenewalForm` has no concept of installment schedule — only a single payment date               | 🟠       | Add `next_payment_date` to the renewal period or compute it from installments; display it on `RenewalCard`                                      |
| 1.6 | Renewal `program_type` (time-based vs milestone-based) was scoped in prior sessions but not built                                                                                            | 🟡       | Build `school_programs` table + program selector in `CreateRenewalForm` if you want to support milestone/black-belt-club renewals before launch |
| 1.7 | Parent portal is listed as a planned feature on the pricing page but does not exist                                                                                                          | 🟡       | Either remove the mention from pricing or add a "coming soon" label                                                                             |
| 1.8 | Belt tracking notes `BeltTrackingPage.tsx` and `ClassSchedulingPage.tsx` with `// TODO refactor` comments — both are monolithic 400+ line files with local state that should move to context | 🟡       | Not a blocker but track as a known tech debt item                                                                                               |

---

## 2. Authentication & Security

| #   | Issue                                                                                                                                                                 | Severity | Fix                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Google OAuth consent screen requires a live Privacy Policy URL and Terms of Service URL pointing to production — without them Google may flag or limit your OAuth app | 🔴       | Deploy `/privacy` and `/terms` routes and register both URLs in Google Cloud Console under "OAuth consent screen"    |
| 2.2 | `AuthCallback.tsx` navigates to `/dashboard` on any valid session, including a user who signed up as `Other` role — they get the wrong dashboard                      | 🟠       | After `getSession()`, check the user's role and redirect accordingly                                                 |
| 2.3 | `PrivateRoute` returns `null` while `loading` is true — unauthenticated users briefly see a blank page before redirect                                                | 🟡       | Return a loading spinner or skeleton instead of `null` during the loading state                                      |
| 2.4 | Session persistence relies on `sessionStorage.getItem("activeView")` — this is lost on page close and could expose internal state to XSS if the key is injected       | 🟡       | Not critical, but consider `localStorage` with a prefix or remove entirely; the default view is always "home" anyway |
| 2.5 | No CSRF protection discussion or `referrerPolicy` on Supabase fetch calls                                                                                             | 🟢       | Supabase JS client handles this internally; worth confirming version is up to date                                   |
| 2.6 | `signupAdmin` in `src/api/school.ts` uses `console.error` for failures but returns `{ success: false }` — errors are silent to the user in any UI that calls it       | 🟡       | Ensure all callers surface the error message to the user                                                             |

---

## 3. Payments & Monetization

| #   | Issue                                                                                                                                         | Severity | Fix                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | No Stripe integration — the pricing page exists but there is no subscription gating, billing, or plan enforcement anywhere in the app         | 🔴       | Integrate Stripe Checkout + webhooks before charging customers. Add a `subscription_status` field to the schools table and gate features accordingly |
| 3.2 | The free/paid tier distinction (Starter: 50 students, Growth: 200, Pro: unlimited) is stated on the pricing page but enforced nowhere in code | 🔴       | Add a student count check in `createStudent` server-side (Supabase function or edge function) that reads the school's plan                           |
| 3.3 | No trial period logic — the pricing page says "14-day free trial" but nothing starts or ends a trial                                          | 🟠       | Add `trial_ends_at` to schools table; gates are open until that date, then require payment                                                           |
| 3.4 | No email receipts or payment confirmation flow                                                                                                | 🟠       | Stripe handles receipts automatically if you configure it; turn that on                                                                              |
| 3.5 | The referral program is described on the pricing page but there is no referral tracking mechanism in the codebase                             | 🟡       | Add a `referred_by` field to schools table; track referral conversions; automate the credit — or remove the referral section from pricing until v2   |

---

## 4. Email & Notifications

| #   | Issue                                                                                                                                                        | Severity | Fix                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | No transactional email system — Supabase auth sends confirmation emails, but there are no renewal expiry reminders, payment confirmations, or welcome emails | 🟠       | Integrate Resend or SendGrid. At minimum: welcome email on signup, renewal expiry warning at 15 days, renewal overdue at 0 days |
| 4.2 | Supabase magic link / confirmation emails use Supabase's default sender domain — this looks unprofessional and may land in spam                              | 🟡       | Configure a custom SMTP sender in Supabase (Settings → Auth → SMTP) using your domain                                           |
| 4.3 | No in-app notification system — the bell icon in the header has a hard-coded red dot with no actual notifications                                            | 🟡       | Either remove the dot or wire it to real data (expiring renewals count would be a natural fit)                                  |

---

## 5. Accessibility (WCAG AA)

You committed to WCAG AA in the project kickoff. Here's the current state:

| #   | Issue                                                                                                                                                                                | Severity | Fix                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------- |
| 5.1 | Color is the only indicator of attendance status (green/red/yellow buttons) — colorblind users cannot distinguish them                                                               | 🟠       | Add text labels or icon indicators alongside colors on attendance buttons                                           |
| 5.2 | Many interactive buttons have no `aria-label` — e.g. the gear icon in `RenewalCard`, the chevrons in the sidebar collapse toggle                                                     | 🟠       | Add `aria-label` to all icon-only buttons                                                                           |
| 5.3 | Focus management is not handled when modals open — screen reader focus is not moved to the modal on open                                                                             | 🟡       | Radix `Dialog` handles this automatically if used correctly; verify `initialFocus` is not being overridden anywhere |
| 5.4 | The `<table>` in `StudentListPage` has no `scope` attributes on `<th>` elements                                                                                                      | 🟡       | Add `scope="col"` to each header cell                                                                               |
| 5.5 | The attendance radio buttons in `StudentAttendanceCard` use `form-radio` class but the label association is by element nesting, not `htmlFor`/`id` pair — fragile for screen readers | 🟡       | Add explicit `id` on each input and matching `htmlFor` on each label                                                |
| 5.6 | Color contrast on `text-red-100` and `text-red-200` text against the red header background is below 4.5:1                                                                            | 🟡       | Switch inactive nav link color to `text-white/80` or test contrast with a checker                                   |
| 5.7 | No `skip to main content` link at the top of the page                                                                                                                                | 🟢       | Add a visually-hidden skip link as the first focusable element                                                      |
| 5.8 | `<motion.div>` at the app root uses `initial={{ opacity: 0 }}` which can cause content flicker for users with motion sensitivity                                                     | 🟢       | Wrap in `prefers-reduced-motion` media query or use Framer Motion's `useReducedMotion` hook                         |

---

## 6. Performance

| #   | Issue                                                                                                                                                                    | Severity | Fix                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 6.1 | `getClassesWithSessions` makes N+1 Supabase queries (one per class to fetch sessions) — this will degrade as class count grows                                           | 🟠       | Rewrite with a single query using Supabase's nested select: `classes(*, sessions:class_sessions(*))`                              |
| 6.2 | `SchoolContext` fetches school metrics, students, and dashboard stats in three separate `useEffect` blocks — some fire simultaneously and some race                      | 🟠       | Consolidate into a single `Promise.all` call on `schoolId` change                                                                 |
| 6.3 | Students are cached in a `Map` keyed by `schoolId` with a 5-minute TTL, but the cache is never invalidated after a student is deleted — the deleted student can reappear | 🟡       | Call `loadStudents(schoolId, true)` (force refresh) after any mutation, or remove the cache and rely on the fast Supabase queries |
| 6.4 | No code splitting — all routes are eagerly imported in `AppRouter.tsx`                                                                                                   | 🟡       | Use `React.lazy` + `Suspense` for dashboard views that are large (BeltTrackingPage, ClassSchedulingPage, InventoryPage)           |
| 6.5 | `framer-motion` is imported in `App.tsx` and used for a single page transition — a large dependency for minimal value                                                    | 🟢       | Use a CSS transition instead, or keep if you expand animation use                                                                 |
| 6.6 | No image optimization — `ProfilePage` avatar upload stores and retrieves from Supabase storage with no size constraints or compression                                   | 🟢       | Add client-side image resizing before upload (e.g. `browser-image-compression`)                                                   |

---

## 7. SEO

| #   | Issue                                                                                                                    | Severity | Fix                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------- |
| 7.1 | No `<title>` or `<meta name="description">` tags — every page shares the Vite default `<title>Vite + React + TS</title>` | 🔴       | Install `react-helmet-async` or `@tanstack/react-router` meta support. Add unique title and description per page |
| 7.2 | No `<meta property="og:*">` Open Graph tags — links shared to Slack/iMessage/LinkedIn will show no preview               | 🟠       | Add OG image, title, description, and URL tags to the home/pricing/about pages                                   |
| 7.3 | No `robots.txt` or `sitemap.xml`                                                                                         | 🟡       | Add a `robots.txt` that disallows `/dashboard/*` and a sitemap covering public pages                             |
| 7.4 | No `canonical` URL tag — if the site is reachable at both `www.` and non-`www.`, search engines may split indexing       | 🟡       | Add `<link rel="canonical">` or enforce www/non-www redirect at the hosting level                                |
| 7.5 | All pages are client-rendered — Google can crawl them but initial index may be slow                                      | 🟢       | Consider pre-rendering public marketing pages with a tool like Vite SSG if SEO is a priority                     |

---

## 8. UI/UX

| #   | Issue                                                                                                                                                              | Severity | Fix                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8.1 | The `StudentListPage` table has Edit and Delete buttons with no spacing between them — easy to accidentally tap the wrong one on mobile                            | 🟠       | Add margin between action buttons; consider a single ellipsis dropdown for row actions                                                                            |
| 8.2 | The dashboard's active sidebar item uses `underline` as the only indicator — subtle and easy to miss; most dashboards use a background highlight                   | 🟡       | Change active state to `bg-gray-700 text-white rounded-md` to match standard sidebar patterns                                                                     |
| 8.3 | On mobile, the dashboard uses the same full-width layout as desktop — the sidebar and stat cards will overflow on small screens                                    | 🟠       | Add responsive breakpoints; collapse the sidebar to a hamburger on mobile; stack stat cards to a single column                                                    |
| 8.4 | The `TakeAttendance` page has a `Note` input per student but notes are stored only in local state (`useState`) — they are never submitted to the database          | 🟠       | Either wire notes to the `attendance_records.note` column on save, or remove the UI until it's backed by the DB                                                   |
| 8.5 | Empty state on `StudentListPage` shows "No students found" as a plain table row — the UX on other pages (like belt tracking) uses a proper illustrated empty state | 🟡       | Replace the table empty row with a centered empty state with a CTA to add the first student                                                                       |
| 8.6 | No loading state on the initial dashboard mount — users see a flash of empty stat cards before data loads                                                          | 🟡       | The skeleton pulse class exists in your UI lib; apply it to stat card values while `loading` is true (already partially implemented — verify it covers all cards) |
| 8.7 | `Profile.tsx` still has `bg-red-900` on the save button, a leftover from the old design system                                                                     | 🟢       | Change to `bg-primary` to match the rest of the design                                                                                                            |
| 8.8 | The pricing toggle (monthly/annual) switches price values but the CTA links always go to `/signup` with no plan pre-selection — users have to re-select on signup  | 🟡       | Pass the selected plan as a URL param (`/signup?plan=growth&billing=annual`) and pre-fill it after Stripe is wired                                                |
| 8.9 | No favicon beyond Vite's default — the browser tab shows the Vite logo                                                                                             | 🟠       | Replace `public/vite.svg` with a TaeKwonTrack favicon and update `index.html`                                                                                     |

---

## 9. Error Handling & Resilience

| #   | Issue                                                                                                                                                                                  | Severity | Fix                                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| 9.1 | `getSchoolByAdmin` in `schoolRequests.ts` swallows errors with `console.error` and returns `data as School` — if no school exists, `data` is `null` and callers may crash              | 🟠       | Return `null` explicitly and guard all callers                                                          |
| 9.2 | `SchoolContext.fetchSchool` and the metrics `useEffect` both set `loading: false` independently — if they race, loading can flicker                                                    | 🟡       | Merge into one fetch function                                                                           |
| 9.3 | `Sentry.ErrorBoundary` wraps the entire app in `App.tsx` — but the fallback only shows for top-level crashes; individual feature errors inside the dashboard will crash the whole page | 🟡       | Add feature-level `ErrorBoundary` wrappers around the main dashboard views (renewals, attendance, etc.) |
| 9.4 | No offline/network error handling — if Supabase is unreachable, users see a blank screen or an uncaught error                                                                          | 🟡       | Add a network error message to major data-loading hooks                                                 |
| 9.5 | `addBreadcrumb` is called on every navigation, but Sentry breadcrumbs only help if `captureException` fires — verify Sentry DSN is set in production env vars                          | 🟡       | Double-check `VITE_SENTRY_DSN` is set in your deployment environment                                    |

---

## 10. Legal & Compliance

| #    | Issue                                                                                                                                         | Severity | Fix                                                                                                                                                        |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10.1 | Privacy Policy and Terms of Service pages exist in code but the Sign Up form has no "By signing up you agree to our Terms" checkbox or notice | 🟠       | Google OAuth requires this to be visible. Add a legal notice line below the signup button                                                                  |
| 10.2 | GDPR/CCPA: you collect student names, emails, and phone numbers — you need a data deletion mechanism                                          | 🟠       | The delete student function exists; ensure it cascades to attendance, renewals, and payments (it does via `ON DELETE CASCADE` in SQL — verify in Supabase) |
| 10.3 | The Privacy Policy mentions a 30-day deletion window but there is no automated deletion — it relies on manual action                          | 🟡       | Add a Supabase Edge Function or pg_cron job to handle deletion requests, or document your manual process                                                   |
| 10.4 | Cookie consent banner — if you're targeting EU users, PostHog and Sentry set cookies that require consent                                     | 🟡       | Add a lightweight cookie banner or configure PostHog to use cookieless mode until consent is granted                                                       |

---

## 11. Testing Gaps

| #    | Issue                                                                                                                                   | Severity | Fix                                                                                       |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| 11.1 | E2E tests require `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD` env vars but there is no documentation on setting up a test Supabase account | 🟡       | Add a `CONTRIBUTING.md` or `.env.example` documenting required env vars for running tests |
| 11.2 | No test coverage for the `RenewalContext` async actions (createRenewal, renewPeriod, quitRenewal)                                       | 🟡       | Add integration tests for these critical paths                                            |
| 11.3 | The `attendance_mark_all` PostHog event is untested (and unfired — see item 1.1)                                                        | 🟢       | Fix the call site first, then add a test                                                  |

---

## 12. Infrastructure / Deployment

| #    | Issue                                                                                                                                                  | Severity | Fix                                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------- |
| 12.1 | No `.env.example` file — new developers or CI/CD pipelines have no reference for required environment variables                                        | 🟠       | Create `.env.example` listing all `VITE_*` keys with placeholder values                                  |
| 12.2 | The nightly pg_cron job (`expire-renewal-periods`) must be scheduled in Supabase manually — there is no documented step for this in a deployment guide | 🟠       | Document this as a required post-deploy step; better yet, add it to a `migrations/` or `scripts/` folder |
| 12.3 | The Supabase `avatars` storage bucket must be manually created (noted in a comment in `MainDashboard.tsx`) — not automated                             | 🟡       | Document as a required setup step or add to a `setup.md`                                                 |
| 12.4 | No `CHANGELOG.md` or versioning strategy                                                                                                               | 🟢       | Add before launch if you plan to communicate updates to paying customers                                 |

---

## Launch Priority Order

**Must-fix before charging customers:**

1. SEO meta tags (7.1) — basic professionalism
2. Stripe integration + plan gating (3.1, 3.2) — can't monetize without it
3. Sales page wired into dashboard (1.2) — core feature not reachable
4. Favicon (8.9) — looks unfinished
5. Google OAuth consent screen URLs (2.1) — can fail OAuth review
6. Legal notice on signup form (10.1)
7. Mobile responsive dashboard (8.3)
8. Attendance notes not persisted (8.4) — data loss bug

**Ship in the first week after launch:**

- Email reminders for renewals (4.1) — this is your stickiest feature
- Custom SMTP sender (4.2)
- Stripe trial logic (3.3)
- Error boundaries per feature (9.3)

**Backlog (v2):**

- Renewal multi-payment scheduling (1.5)
- School programs / milestone renewals (1.6)
- Parent portal
- Multi-location support
- Referral tracking
