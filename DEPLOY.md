# Deployment Guide

Step-by-step checklist for standing up a fresh TaekwonTrack environment.

---

## 1. Environment variables

Create a `.env` file at the project root (copy from `.env.example`):

| Variable | Description |
|---|---|
| `VITE_SUPABASE_API_URL` | Your Supabase project URL (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_API_KEY` | Supabase `anon` public key |
| `VITE_POSTHOG_KEY` | PostHog project API key (analytics) |
| `VITE_POSTHOG_HOST` | PostHog ingest host (default: `https://app.posthog.com`) |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking |
| `VITE_APP_VERSION` | Semver string shown in the UI (e.g. `1.0.0`) |
| `E2E_TEST_EMAIL` | Email for Playwright e2e tests |
| `E2E_TEST_PASSWORD` | Password for Playwright e2e tests |

For Netlify, add these under **Site → Environment variables**. They are injected at build time by Vite.

---

## 2. Supabase database setup

Run the SQL files in `src/sql/` in this order in the **Supabase SQL Editor**:

```
src/sql/classes.sql
src/sql/class_sessions.sql
src/sql/attendance.sql
src/sql/belts.sql
src/sql/school_programs.sql
src/sql/student_renewals.sql
src/sql/sales.sql
src/sql/inventory.sql
src/sql/notification_settings.sql
```

Each file creates its table, indexes, and Row Level Security policies.

---

## 3. Supabase Storage bucket

The profile photo upload feature requires an `avatars` bucket.

1. Go to **Storage** in your Supabase dashboard.
2. Click **New bucket**, name it `avatars`, and enable **Public bucket**.
3. No additional policies are needed — public buckets allow anonymous reads, and uploads are gated by the client-side auth check.

---

## 4. pg_cron — nightly renewal expiry job

`src/sql/student_renewals.sql` includes a `cron.schedule` call that flips `active → expired` after the 7-day grace period. To activate it:

1. Enable the **pg_cron** extension in your Supabase project:
   - Go to **Database → Extensions** and enable `pg_cron`.
2. Re-run (or manually execute) the cron block from `student_renewals.sql`:

```sql
SELECT cron.schedule(
  'expire-renewal-periods',
  '0 2 * * *',
  $$
    UPDATE public.renewal_periods
    SET status = 'expired', updated_at = now()
    WHERE status = 'active'
      AND expiration_date < CURRENT_DATE - INTERVAL '7 days';
  $$
);
```

This runs at 2 AM UTC daily. Adjust the schedule string as needed.

---

## 5. Supabase Edge Function — renewal email reminders

The `send-renewal-reminders` function sends daily reminder emails via [Resend](https://resend.com).

### Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- A verified sender domain (or use `onboarding@resend.dev` for testing) in Resend

### Deploy

```bash
# Link to your Supabase project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Set required secrets
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set RESEND_FROM_EMAIL=reminders@yourdomain.com

# Deploy the function
supabase functions deploy send-renewal-reminders
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — do not set them manually.

### Schedule

The cron schedule is defined in `supabase/functions/send-renewal-reminders/config.toml`:

```toml
[functions.send-renewal-reminders]
schedule = "0 9 * * *"   # 9 AM UTC daily
```

Adjust the time to match your schools' timezone (e.g. `0 14 * * *` for 9 AM EST).

### Enabling reminders per school

An admin must toggle reminders on in **Dashboard → Settings → Notifications**. The Edge Function only emails schools where `notification_settings.reminders_enabled = true`.

---

## 6. Netlify — SPA redirect rule

React Router requires all paths to serve `index.html`. Add this to `netlify.toml` (already present, listed here for reference):

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

If this rule is absent, direct URL access and browser refreshes on non-root routes will return a 404 from Netlify's CDN.

---

## 7. Local development

```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # Production build → dist/
npm run test       # Vitest unit tests
npm run test:e2e   # Playwright e2e (requires E2E_TEST_* vars)
```
