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
