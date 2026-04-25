-- ─────────────────────────────────────────────
-- Notification Email Scheduling
-- Run this in Supabase SQL Editor after deploying
-- the send-renewal-reminders Edge Function.
-- ─────────────────────────────────────────────

-- Enable pg_net extension (required for HTTP calls from pg_cron)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the reminder function to run every day at 7:00 AM UTC
-- Adjust the cron expression to match your preferred time
SELECT cron.schedule(
  'send-renewal-reminders',
  '0 7 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-renewal-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Confirm the job was created
-- SELECT * FROM cron.job;

-- To view run history after the first execution:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- To remove the job if needed:
-- SELECT cron.unschedule('send-renewal-reminders');
