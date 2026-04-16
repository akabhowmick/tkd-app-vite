// Supabase Edge Function — send-renewal-reminders
//
// Runs on a daily cron (see config.toml). For each school with reminders
// enabled, it finds active renewal periods expiring within each configured
// window (e.g. 7 days) and sends a summary email to the school admin via
// Resend.
//
// Required secrets (set via `supabase secrets set`):
//   RESEND_API_KEY        — from resend.com
//   RESEND_FROM_EMAIL     — verified sender, e.g. reminders@yourdomain.com
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "reminders@resend.dev";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface NotificationSetting {
  school_id: string;
  reminders_enabled: boolean;
  reminder_days: number[];
  send_to_admin: boolean;
  schools: { name: string } | null;
}

interface RenewalPeriod {
  period_id: string;
  expiration_date: string;
  students: { name: string; email: string } | null;
}

interface SendResult {
  school: string;
  days: number;
  students: number;
  email_sent: boolean;
  error?: string;
}

Deno.serve(async () => {
  try {
    // 1. Load all schools that have reminders enabled
    const { data: settings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("school_id, reminders_enabled, reminder_days, send_to_admin, schools(name)")
      .eq("reminders_enabled", true);

    if (settingsError) throw settingsError;
    if (!settings || settings.length === 0) {
      return jsonResponse({ message: "No schools with reminders enabled", results: [] });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const results: SendResult[] = [];

    for (const setting of settings as NotificationSetting[]) {
      // 2. For each configured reminder window, find matching renewals
      for (const days of setting.reminder_days) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + days);
        const dateStr = targetDate.toISOString().split("T")[0];

        const { data: renewals, error: renewalsError } = await supabase
          .from("renewal_periods")
          .select("period_id, expiration_date, students(name, email)")
          .eq("school_id", setting.school_id)
          .eq("status", "active")
          .eq("expiration_date", dateStr);

        if (renewalsError) throw renewalsError;
        if (!renewals || renewals.length === 0) continue;

        // 3. Fetch admin email for this school
        const { data: adminUser } = await supabase
          .from("users")
          .select("email, name")
          .eq("school_id", setting.school_id)
          .eq("role", "Admin")
          .maybeSingle();

        if (!setting.send_to_admin || !adminUser?.email) {
          results.push({
            school: setting.schools?.name ?? setting.school_id,
            days,
            students: renewals.length,
            email_sent: false,
            error: "No admin email configured or send_to_admin disabled",
          });
          continue;
        }

        // 4. Build the email
        const schoolName = setting.schools?.name ?? "Your School";
        const expirationLabel = days === 1 ? "tomorrow" : `in ${days} days`;

        const studentRows = (renewals as RenewalPeriod[])
          .map(
            (r) =>
              `<tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">
                  ${r.students?.name ?? "Unknown"}
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #6b7280;">
                  ${r.expiration_date}
                </td>
              </tr>`,
          )
          .join("");

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="margin:0; padding:0; background:#f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.1);">

              <!-- Header -->
              <div style="background:#111827; padding:24px 32px; display:flex; align-items:center; gap:12px;">
                <span style="font-size:20px; font-weight:700; color:#ffffff; letter-spacing:-0.5px;">
                  TaeKwonTrack
                </span>
              </div>

              <!-- Body -->
              <div style="padding:32px;">
                <h2 style="margin:0 0 8px; font-size:20px; font-weight:600; color:#111827;">
                  ${renewals.length} renewal${renewals.length > 1 ? "s" : ""} expiring ${expirationLabel}
                </h2>
                <p style="margin:0 0 24px; color:#6b7280; font-size:14px;">
                  The following students at <strong>${schoolName}</strong> have memberships
                  expiring on <strong>${dateStr}</strong>.
                </p>

                <table style="width:100%; border-collapse:collapse; font-size:14px; color:#374151;">
                  <thead>
                    <tr style="background:#f9fafb;">
                      <th style="padding:8px 12px; text-align:left; font-weight:600; color:#6b7280; text-transform:uppercase; font-size:11px; letter-spacing:.05em;">
                        Student
                      </th>
                      <th style="padding:8px 12px; text-align:left; font-weight:600; color:#6b7280; text-transform:uppercase; font-size:11px; letter-spacing:.05em;">
                        Expiration Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    ${studentRows}
                  </tbody>
                </table>

                <div style="margin-top:28px; padding:16px; background:#fef3c7; border-radius:8px; border-left:4px solid #f59e0b;">
                  <p style="margin:0; font-size:13px; color:#92400e;">
                    <strong>Heads up:</strong> Students have a 7-day grace period after expiration
                    before their status changes to expired.
                  </p>
                </div>

                <div style="margin-top:28px;">
                  <a
                    href="https://taekwontrack.com/dashboard"
                    style="display:inline-block; background:#e11d48; color:#ffffff; font-weight:600; font-size:14px; padding:12px 24px; border-radius:8px; text-decoration:none;"
                  >
                    Manage Renewals →
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="padding:20px 32px; background:#f9fafb; border-top:1px solid #f0f0f0;">
                <p style="margin:0; font-size:12px; color:#9ca3af;">
                  You're receiving this because renewal reminders are enabled for ${schoolName}.
                  Manage your settings in TaeKwonTrack → Settings → Notifications.
                </p>
              </div>

            </div>
          </body>
          </html>
        `;

        // 5. Send via Resend
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `TaeKwonTrack <${RESEND_FROM_EMAIL}>`,
            to: adminUser.email,
            subject: `${renewals.length} renewal${renewals.length > 1 ? "s" : ""} expiring ${expirationLabel} — ${schoolName}`,
            html,
          }),
        });

        const resBody = await res.json().catch(() => null);

        results.push({
          school: schoolName,
          days,
          students: renewals.length,
          email_sent: res.ok,
          ...(res.ok ? {} : { error: resBody?.message ?? `HTTP ${res.status}` }),
        });
      }
    }

    return jsonResponse({ results });
  } catch (err) {
    console.error("[send-renewal-reminders]", err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
