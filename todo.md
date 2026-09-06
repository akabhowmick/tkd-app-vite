# TODO

## Multi-tenancy / admin onboarding — needs a decision
- [ ] **Self-serve "create a new school" flow is broken.** `CreateSchoolProfile.tsx` is a dead stub (submit handler just `console.log`s). The real `SchoolManagement.tsx` create-school form never sets `admin_id`, so the insert fails against RLS (`with_check admin_id = auth.uid()`). Nobody can currently become admin of a new school through the app.
  - Fix: set `admin_id: user.id` when calling `createSchool`, then immediately update the caller's own `users` row (`role: "admin"`, `school_id: <new school id>`) — the `prevent_self_role_escalation` trigger already allows this specific case (self-promoting to admin of a school you just created).
  - Until fixed, making someone admin requires a manual Supabase-side update (ask Claude, or via SQL editor).
- [ ] Decide what to do with the 3 non-bot-but-unclear `role=admin` accounts left over from the backfill (`adminuser@gmail.com`, `kimmichbenjamin18@gmail.com`, `usataekwonmaru@gmail.com`) — demote to `other` if they're not real staff, or confirm and give them `school_id`.
- [ ] Decide whether to delete the two confirmed bot accounts (`xuku.wabu.7.35@...`, `nuqup.ehu.k.o.s.78@...`) outright, or just leave them inert (they can't see or touch anything now).

## Security — critical/high
- [ ] Remove "Admin" as a self-signup option on `Signup.tsx` — it's the door the bot accounts used to grab the `admin` role label (harmless now data-wise, but still an open door).
- [ ] Read the user's role from `public.users` (or `app_metadata` via a custom access token hook) instead of `user_metadata` in `AuthContext`/`RoleRoute` — `user_metadata` is client-writable via `supabase.auth.updateUser()`, so today the UI's role gating can be spoofed (RLS still blocks real data access, but this is fragile defense-in-depth).
- [ ] Harden `create-user` edge function:
  - Reject `role: "admin"` outright (only student/parent/instructor should be creatable via invite).
  - Validate `school_id` matches the caller's own school before creating a user for it.
  - Don't return raw Supabase error text to the client.
  - Lock down CORS from `*` to the real app origin.
- [ ] Turn on Supabase Auth hardening: enable leaked-password protection (flagged by Supabase's own linter), enable email confirmation before login, add a captcha on signup, and confirm the server-side minimum password length matches the 10-char client-side rule.
- [ ] Audit + fix `npm audit` findings (2 critical, 8 high in prod deps — react-router/turbo-stream DoS, `ws`). Move `supabase` CLI out of runtime `dependencies` into `devDependencies`.

## Privacy / legal
- [ ] Add PostHog, Sentry, Resend, and Netlify to the Privacy Policy's third-party services list (currently only lists Supabase + Google).
- [ ] Disclose session recording explicitly (PostHog session replay + Sentry Replay are both on, capturing screens full of student names/phones/balances) and turn on text/input masking for both.
- [ ] Fix "Last updated" on `/privacy` and `/terms` — it's `new Date()`, so it always shows today's date regardless of when the policy actually changed. Use a fixed date constant.
- [ ] Resolve the Children's Privacy contradiction: policy says the platform isn't for direct use by children, but there's a live Student Portal and student invite flow. Needs a real minors/consent stance (and COPPA/state student-privacy-law review if under-13 students get logins).
- [ ] Add cookie/analytics consent if you'll have EU/UK/California users, plus CCPA "do not sell/share" language.
- [ ] Confirm `privacy@taekwontrack.com` / `legal@taekwontrack.com` are real, monitored inboxes.
- [ ] Document/build actual account-deletion handling (policy promises deletion within 30 days of request; no process exists yet).

## Accessibility
- [ ] Add `aria-label` to all show/hide-password icon buttons (Login, Signup, ResetPassword, CreateUserModal).
- [ ] Add `role="alert"` / `aria-live="polite"` to inline form error messages so screen readers announce them.
- [ ] Fix `text-gray-400` used as body/helper text on white backgrounds (~2.5:1 contrast, fails WCAG AA 4.5:1) — 171 occurrences across 42 files.
- [ ] Respect `prefers-reduced-motion` for Framer Motion animations (currently none do).
- [ ] Add a skip-to-content link and `aria-current` on active sidebar/nav items.
- [ ] Give the role-picker and invite/create toggle in `CreateUserModal` proper tab/radio semantics instead of plain buttons.

## Ops / hygiene
- [ ] Add CI (no `.github/workflows` exists) — at minimum run lint, typecheck, unit tests, and `npm audit` on PRs.
- [ ] Add security headers to `netlify.toml` (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy).
- [ ] Strip the 30+ `console.log` calls from production code (`CreateUserModal` currently logs name/email on every keystroke of the flow).
- [ ] Fix favicon/`og:image` paths in `index.html` — they point at `/src/assets/...`, which won't exist in the built `dist/` output.
- [ ] Create the `avatars` storage bucket in the production Supabase project (referenced by profile photo upload, doesn't exist yet — upload silently fails).

## Carried over from before (still open)
- [ ] Set real values for `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`, `VITE_SENTRY_DSN` in production `.env` — analytics/error tracking currently disabled (placeholders only).
- [ ] Google OAuth setup (Supabase side: enable provider, set site URL + redirect URLs; Google Cloud side: create project, configure consent screen with real Privacy Policy/Terms URLs, create OAuth credentials, publish out of Testing mode before launch).
- [ ] `send-renewal-reminders` edge function: set `RESEND_API_KEY` secret, update the hardcoded `reminders@yourdomain.com` sender to a verified domain, deploy the function, and run `notification_schedule.sql` in the SQL editor. (Not deployed yet — only `create-user` is live.)
  - Note: this function currently has no caller auth beyond the gateway JWT and drops student/school names into email HTML unescaped — fix before deploying.
- [ ] `Sale.student_id` type mismatch: `src/types/sales.ts` types it as `number` but Supabase stores a UUID string.

## Phased feature work (from earlier planning, still relevant)
- Phase 3 — Playwright E2E: auth flow, attendance flow, renewal creation flow.
- Phase 4 — In-app reporting dashboard: extend the Reporting sidebar section (currently "coming soon") with real trend data — attendance over time, revenue over time, renewal status breakdown.
