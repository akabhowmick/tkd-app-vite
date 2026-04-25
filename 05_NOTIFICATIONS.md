# Renewal Reminder Notification Emails

The notification settings UI and database table already exist.
This file wires up the Edge Function that sends the actual emails via Resend.

Follow every step in order. Do not skip or combine steps.

---

## Prerequisites

You need:
1. A free Resend account at https://resend.com — grab your API key from the dashboard
2. A verified sending domain in Resend (or use their sandbox domain for testing)
3. Supabase CLI installed: `npm install -g supabase`
4. Supabase CLI logged in: `supabase login`

---

## Step 1 — Add the Resend API key to Supabase secrets

Run this in your terminal (replace with your actual key):

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
```

Confirm it was set:
```bash
supabase secrets list
```

---

## Step 2 — Create the Edge Function

Create `supabase/functions/send-renewal-reminders/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Days we consider "expiring soon" thresholds
const GRACE_PERIOD_DAYS = 7;

interface NotificationSettings {
  school_id: string;
  reminders_enabled: boolean;
  reminder_days: number[];
  send_to_admin: boolean;
}

interface School {
  id: string;
  name: string;
  email: string | null;
  admin_id: string;
}

interface RenewalPeriod {
  period_id: string;
  student_id: string;
  expiration_date: string;
  school_id: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface AdminUser {
  id: string;
  email: string;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "TaeKwonTrack <reminders@yourdomain.com>", // update to your verified domain
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error: ${text}`);
  }
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr + "T12:00:00");
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
}

function buildEmailHtml(
  schoolName: string,
  studentName: string,
  expirationDate: string,
  daysLeft: number,
): string {
  const formattedDate = new Date(expirationDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const urgencyColor = daysLeft <= 7 ? "#dc2626" : daysLeft <= 14 ? "#d97706" : "#2563eb";
  const urgencyLabel =
    daysLeft <= 7 ? "Urgent" : daysLeft <= 14 ? "Expiring Soon" : "Reminder";

  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <div style="background: ${urgencyColor}; color: white; padding: 8px 16px; border-radius: 6px; display: inline-block; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
        ${urgencyLabel}
      </div>
      <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 8px;">
        Membership Expiring in ${daysLeft} Day${daysLeft !== 1 ? "s" : ""}
      </h2>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
        This is an automated reminder from ${schoolName}.
      </p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 14px;">
          <strong>Student:</strong> ${studentName}
        </p>
        <p style="margin: 0; font-size: 14px;">
          <strong>Membership expires:</strong> ${formattedDate}
        </p>
      </div>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">
        Log in to TaeKwonTrack to renew this membership or contact the school for more information.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 11px; margin: 0;">
        Sent by TaeKwonTrack · Renewal reminder system
      </p>
    </div>
  `;
}

serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch all schools with reminders enabled
    const { data: settings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("school_id, reminders_enabled, reminder_days, send_to_admin")
      .eq("reminders_enabled", true);

    if (settingsError) throw settingsError;
    if (!settings || settings.length === 0) {
      return new Response("No schools with reminders enabled", { status: 200 });
    }

    const schoolIds = (settings as NotificationSettings[]).map((s) => s.school_id);

    // Fetch schools
    const { data: schools } = await supabase
      .from("schools")
      .select("id, name, email, admin_id")
      .in("id", schoolIds);

    const schoolMap = Object.fromEntries(
      ((schools ?? []) as School[]).map((s) => [s.id, s]),
    );

    // Fetch admin emails
    const adminIds = ((schools ?? []) as School[]).map((s) => s.admin_id);
    const { data: adminUsers } = await supabase.auth.admin.listUsers();
    const adminEmailMap: Record<string, string> = {};
    (adminUsers?.users ?? []).forEach((u) => {
      if (adminIds.includes(u.id) && u.email) {
        adminEmailMap[u.id] = u.email;
      }
    });

    // Fetch active renewal periods for these schools
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDays = Math.max(...(settings as NotificationSettings[]).flatMap((s) => s.reminder_days));
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + maxDays + GRACE_PERIOD_DAYS);

    const { data: periods } = await supabase
      .from("renewal_periods")
      .select("period_id, student_id, expiration_date, school_id")
      .in("school_id", schoolIds)
      .eq("status", "active")
      .not("expiration_date", "is", null)
      .lte("expiration_date", maxDate.toISOString().split("T")[0]);

    if (!periods || periods.length === 0) {
      return new Response("No expiring renewals found", { status: 200 });
    }

    // Fetch student names
    const studentIds = (periods as RenewalPeriod[]).map((p) => p.student_id);
    const { data: students } = await supabase
      .from("students")
      .select("id, name, email")
      .in("id", studentIds);

    const studentMap = Object.fromEntries(
      ((students ?? []) as Student[]).map((s) => [s.id, s]),
    );

    let emailsSent = 0;
    const errors: string[] = [];

    for (const setting of settings as NotificationSettings[]) {
      const school = schoolMap[setting.school_id];
      if (!school) continue;

      const schoolPeriods = (periods as RenewalPeriod[]).filter(
        (p) => p.school_id === setting.school_id,
      );

      for (const period of schoolPeriods) {
        const days = daysUntil(period.expiration_date);

        // Check if today matches one of the configured reminder windows
        const shouldRemind = setting.reminder_days.some((window) => days === window);
        if (!shouldRemind) continue;

        const student = studentMap[period.student_id];
        if (!student) continue;

        const subject = `Membership Reminder: ${student.name} — ${days} day${days !== 1 ? "s" : ""} left`;
        const html = buildEmailHtml(school.name, student.name, period.expiration_date, days);

        // Send to admin
        if (setting.send_to_admin) {
          const adminEmail = adminEmailMap[school.admin_id] ?? school.email;
          if (adminEmail) {
            try {
              await sendEmail(adminEmail, subject, html);
              emailsSent++;
            } catch (err) {
              errors.push(`Admin email failed for ${student.name}: ${err}`);
            }
          }
        }
      }
    }

    const summary = `Sent ${emailsSent} email${emailsSent !== 1 ? "s" : ""}.${
      errors.length > 0 ? ` Errors: ${errors.join("; ")}` : ""
    }`;

    console.log(summary);
    return new Response(summary, { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(`Error: ${err instanceof Error ? err.message : "Unknown"}`, {
      status: 500,
    });
  }
});
```

---

## Step 3 — Update the from address in the Edge Function

Open `supabase/functions/send-renewal-reminders/index.ts` and find this line:

```typescript
from: "TaeKwonTrack <reminders@yourdomain.com>",
```

Replace `yourdomain.com` with your Resend-verified domain. If you're still testing, Resend lets you use `onboarding@resend.dev` as the from address for sandbox emails.

---

## Step 4 — Deploy the Edge Function

```bash
supabase functions deploy send-renewal-reminders
```

---

## Step 5 — Schedule the function to run daily via pg_cron

Open your Supabase dashboard → SQL Editor → run:

```sql
-- Runs every day at 7:00 AM UTC
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
```

If `net.http_post` is not available, enable the `pg_net` extension first:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

---

## Step 6 — Test the function manually

You can trigger it immediately from the terminal to verify emails are sending:

```bash
supabase functions invoke send-renewal-reminders
```

Or via curl using your project URL and anon key (both found in Supabase dashboard → Settings → API):

```bash
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/send-renewal-reminders \
  -H "Authorization: Bearer <your-anon-key>"
```

---

## Step 7 — Verify notification settings are configured in the app

1. Log in as admin
2. Go to Notification Settings in the sidebar
3. Enable reminders
4. Select at least one reminder window (7, 14, or 30 days)
5. Make sure "School Admin" is checked under recipients
6. Click Save Settings

The function will only send emails for schools where `reminders_enabled = true`.

---

## Verification checklist

- [ ] Resend account created and API key obtained
- [ ] `RESEND_API_KEY` secret set in Supabase (`supabase secrets list` confirms it)
- [ ] `supabase/functions/send-renewal-reminders/index.ts` exists
- [ ] From address updated to your verified domain
- [ ] Function deployed successfully (`supabase functions deploy send-renewal-reminders`)
- [ ] `pg_net` extension enabled in Supabase
- [ ] pg_cron job scheduled (`SELECT cron.job_run_details` shows the job)
- [ ] Manual invocation (`supabase functions invoke send-renewal-reminders`) returns success
- [ ] Test email received for a student with an expiring renewal
- [ ] Notification settings page in the app correctly saves and loads preferences
