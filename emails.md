What you need to build

Email service setup (Resend is the easiest, free up to 3k emails/month)
A daily job that checks for expiring renewals and fires emails
Email templates (expiring soon, expired, grace period)
A simple settings page where admins can toggle reminders on/off and set how far in advance they want to be notified (e.g. 7 days, 14 days)

The logical flow
Renewal due date approaches → daily cron job runs → queries your renewals table for anything expiring within the admin's chosen window → sends email to the school admin (and optionally the parent if you have their contact) → logs that the reminder was sent so it doesn't spam them daily.
Where it hooks into your existing code
You already have getExpiringRenewals() and the grouped renewal logic. The cron job is basically just calling that same logic server-side on a schedule. Supabase has Edge Functions with cron support built in, so you don't need a separate service.
Rough timeline

Resend setup + first test email: half a day
Supabase Edge Function with cron: 1-2 days
Email templates (HTML): 1-2 days
Admin settings toggle: 1 day
Testing end to end: 2-3 days

Total: about 1 week
Want me to start with the Supabase Edge Function and the Resend integration, or the admin settings UI first?admin settings ui firstApr 1Let me pull up the relevant code before diving in.Searched memorySearched memoryI have enough context. The app uses Supabase, has a SchoolManagement section in the sidebar, and follows the dark dashboard style. Let me build the notification settings UI.
Here's the NotificationSettings.tsx component to drop into your dashboard. It'll live as a new view in the sidebar under SETTINGS.
tsx// src/components/NotificationSettings/NotificationSettings.tsx

import { useState } from "react";
import { Bell, Mail, Clock, ToggleLeft, ToggleRight, Save } from "lucide-react";

type ReminderWindow = 7 | 14 | 30;

interface NotificationConfig {
remindersEnabled: boolean;
reminderDays: ReminderWindow[];
sendToAdmin: boolean;
sendToParent: boolean;
}

const REMINDER_OPTIONS: { label: string; value: ReminderWindow }[] = [
{ label: "7 days before", value: 7 },
{ label: "14 days before", value: 14 },
{ label: "30 days before", value: 30 },
];

const NotificationSettings = () => {
const [config, setConfig] = useState<NotificationConfig>({
remindersEnabled: false,
reminderDays: [7],
sendToAdmin: true,
sendToParent: false,
});

const [saved, setSaved] = useState(false);

const toggleReminderDay = (day: ReminderWindow) => {
setConfig((prev) => ({
...prev,
reminderDays: prev.reminderDays.includes(day)
? prev.reminderDays.filter((d) => d !== day)
: [...prev.reminderDays, day],
}));
};

const handleSave = () => {
// TODO: persist to Supabase
console.log("Saving config:", config);
setSaved(true);
setTimeout(() => setSaved(false), 2500);
};

return (
<div className="p-6 max-w-2xl">
<div className="mb-6">
<h2 className="text-xl font-semibold text-white flex items-center gap-2">
<Bell size={20} className="text-primary" />
Notification Settings
</h2>
<p className="text-sm text-gray-400 mt-1">
Control when and how renewal reminders are sent.
</p>
</div>

      {/* Master toggle */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Renewal Reminders</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Automatically notify when memberships are expiring
          </p>
        </div>
        <button
          onClick={() =>
            setConfig((prev) => ({ ...prev, remindersEnabled: !prev.remindersEnabled }))
          }
          className="text-primary hover:opacity-80 transition-opacity"
        >
          {config.remindersEnabled ? (
            <ToggleRight size={32} />
          ) : (
            <ToggleLeft size={32} className="text-gray-500" />
          )}
        </button>
      </div>

      {/* Options — only shown when enabled */}
      {config.remindersEnabled && (
        <>
          {/* Reminder timing */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-primary" />
              <p className="text-sm font-medium text-white">Send reminders</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleReminderDay(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    config.reminderDays.includes(opt.value)
                      ? "bg-primary text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Select one or more. You can stack them.</p>
          </div>

          {/* Who gets the email */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Mail size={16} className="text-primary" />
              <p className="text-sm font-medium text-white">Send emails to</p>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-white">School Admin</p>
                  <p className="text-xs text-gray-400">Your account email</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.sendToAdmin}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, sendToAdmin: e.target.checked }))
                  }
                  className="accent-primary w-4 h-4"
                />
              </label>
              <div className="border-t border-gray-700" />
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-white">Parents</p>
                  <p className="text-xs text-gray-400">
                    Sent to parent contact on file (coming soon)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.sendToParent}
                  disabled
                  className="accent-primary w-4 h-4 opacity-40 cursor-not-allowed"
                />
              </label>
            </div>
          </div>
        </>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
      >
        <Save size={15} />
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>

);
};

export default NotificationSettings;
To wire it in, add it to your VIEW_COMPONENTS in MainDashboard.tsx:
tsximport NotificationSettings from "../NotificationSettings/NotificationSettings";

const VIEW_COMPONENTS = {
school: SchoolManagement,
renewals: StudentRenewalsPage,
students: StudentListPage,
attendance: TakeAttendance,
sales: SalesTrackingPage,
notifications: NotificationSettings, // add this
};
And add it to your SIDEBAR_CONFIG under the SETTINGS section:
tsx{
id: "notifications",
label: "Notifications",
icon: faBell,
section: "SETTINGS",
}
What's stubbed for later: the handleSave just logs to console for now. Once you build the Supabase side, you'll replace that with an upsert to a notification_settings table keyed by school_id. Parent emails are also disabled with a "coming soon" note so it's visible but not misleading.
Want me to also build the Supabase table schema for this so it's ready to go when you wire up the backend?yup let's do thatApr 1Here's the SQL to run in your Supabase SQL editor:
sqlcreate table notification_settings (
id uuid primary key default gen_random_uuid(),
school_id uuid not null references schools(id) on delete cascade,
reminders_enabled boolean not null default false,
reminder_days integer[] not null default '{7}',
send_to_admin boolean not null default true,
send_to_parent boolean not null default false,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
unique(school_id)
);

-- auto-update updated_at on changes
create or replace function update_updated_at()
returns trigger as $$
begin
new.updated_at = now();
return new;
end;

$$
language plpgsql;

create trigger notification_settings_updated_at
  before update on notification_settings
  for each row execute function update_updated_at();

-- RLS
alter table notification_settings enable row level security;

create policy "Admins can manage their school settings"
  on notification_settings
  for all
  using (
    school_id in (
      select id from schools where id = (
        select (auth.jwt() -> 'user_metadata' ->> 'schoolId')::uuid
      )
    )
  );
Then update handleSave in NotificationSettings.tsx to actually persist it:
tsximport { supabase } from "../../api/supabase";
import { useAuth } from "../../context/AuthContext";

// inside the component
const { user } = useAuth();

const handleSave = async () => {
  if (!user?.schoolId) return;

  const { error } = await supabase
    .from("notification_settings")
    .upsert({
      school_id: user.schoolId,
      reminders_enabled: config.remindersEnabled,
      reminder_days: config.reminderDays,
      send_to_admin: config.sendToAdmin,
      send_to_parent: config.sendToParent,
    }, { onConflict: "school_id" });

  if (!error) {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  } else {
    console.error("Failed to save settings:", error.message);
  }
};
And load the saved settings on mount so the toggles reflect what's already stored:
tsxuseEffect(() => {
  if (!user?.schoolId) return;

  const loadSettings = async () => {
    const { data } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("school_id", user.schoolId)
      .single();

    if (data) {
      setConfig({
        remindersEnabled: data.reminders_enabled,
        reminderDays: data.reminder_days,
        sendToAdmin: data.send_to_admin,
        sendToParent: data.send_to_parent,
      });
    }
  };

  loadSettings();
}, [user?.schoolId]);
That's the full settings layer done. Next up would be the Supabase Edge Function with the cron job that reads from this table and fires the emails. Want to tackle that next?yupApr 1Let's set up the Edge Function. First, make sure you have the Supabase CLI installed and your project linked. If you haven't done that yet run these:
bashnpm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
Then create the function:
bashsupabase functions new send-renewal-reminders
This creates supabase/functions/send-renewal-reminders/index.ts. Replace its contents with this:
typescriptimport { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async () => {
  try {
    // 1. Get all schools with reminders enabled
    const { data: settings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*, schools(name, id)")
      .eq("reminders_enabled", true);

    if (settingsError) throw settingsError;
    if (!settings || settings.length === 0) {
      return new Response("No schools with reminders enabled", { status: 200 });
    }

    const today = new Date();
    const results = [];

    for (const setting of settings) {
      // 2. For each reminder window (e.g. 7, 14, 30 days), find matching renewals
      for (const days of setting.reminder_days) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + days);
        const dateStr = targetDate.toISOString().split("T")[0];

        const { data: renewals, error: renewalsError } = await supabase
          .from("student_renewals")
          .select("*, students(name, id)")
          .eq("school_id", setting.school_id)
          .eq("renewal_date", dateStr)
          .eq("status", "active");

        if (renewalsError) throw renewalsError;
        if (!renewals || renewals.length === 0) continue;

        // 3. Get admin email for the school
        const { data: adminUser } = await supabase
          .from("users")
          .select("email")
          .eq("school_id", setting.school_id)
          .eq("role", "Admin")
          .single();

        if (!adminUser?.email) continue;

        // 4. Build and send the email
        const studentList = renewals
          .map((r) => `<li>${r.students?.name} — expires ${dateStr}</li>`)
          .join("");

        const emailBody = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e11d48;">Upcoming Renewals — ${setting.schools?.name}</h2>
            <p>The following students have memberships expiring in <strong>${days} days</strong>:</p>
            <ul style="line-height: 2;">${studentList}</ul>
            <p style="color: #6b7280; font-size: 14px;">
              Log in to TaeKwonTrack to manage these renewals.
            </p>
          </div>
        `;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "TaeKwonTrack <reminders@yourdomain.com>",
            to: adminUser.email,
            subject: `${renewals.length} renewal${renewals.length > 1 ? "s" : ""} expiring in ${days} days`,
            html: emailBody,
          }),
        });

        results.push({
          school: setting.schools?.name,
          days,
          students: renewals.length,
          sent: res.ok,
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
Set up the cron schedule in supabase/functions/send-renewal-reminders/config.toml:
toml[functions.send-renewal-reminders]
schedule = "0 9 * * *"
This fires every day at 9am UTC. Adjust the time to whatever makes sense for your users.
Add your secrets so the function has what it needs:
bashsupabase secrets set RESEND_API_KEY=your_resend_api_key
SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically by Supabase, so you don't need to set those manually.
Deploy it:
bashsupabase functions deploy send-renewal-reminders
Two things to sort out before this fully works:

The from email address (reminders@yourdomain.com) needs to be a domain you've verified in Resend. If you don't have a custom domain yet, Resend gives you a free onboarding@resend.dev address to test with.
Double check your student_renewals table has a renewal_date column as a date type and a school_id foreign key. If the column is named differently let me know and I'll adjust the query.

Want to test it locally before deploying?
$$
