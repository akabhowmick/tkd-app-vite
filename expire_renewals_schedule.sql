-- Automatically marks renewal periods as 'expired' in the DB when their
-- expiration_date has passed and status is still 'active'.
--
-- The frontend derives expiry status from the expiration_date column, but the
-- DB status column never updates on its own. This job keeps them in sync so
-- that DB-level unique constraints (which key on status) don't block new
-- renewals for students with lapsed periods.
--
-- Run this SQL once in the Supabase SQL editor to register the cron job.
-- Requires the pg_cron extension (Dashboard → Database → Extensions → pg_cron).
--
-- To verify: SELECT * FROM cron.job WHERE jobname = 'expire-stale-renewals';
-- To remove: SELECT cron.unschedule('expire-stale-renewals');

SELECT cron.schedule(
  'expire-stale-renewals',
  '0 2 * * *',  -- daily at 2:00 AM UTC
  $$
    UPDATE renewal_periods
    SET
      status     = 'expired',
      updated_at = now()
    WHERE status          = 'active'
      AND expiration_date < current_date;
  $$
);
