import { useEffect, useState } from "react";
import { Bell, Clock, Mail, Save, AlertCircle } from "lucide-react";
import { useSchool } from "../../../context/SchoolContext";
import {
  getNotificationSettings,
  upsertNotificationSettings,
  type ReminderWindow,
} from "../../../api/NotificationRequests/notificationRequests";

interface Config {
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

const DEFAULT_CONFIG: Config = {
  remindersEnabled: false,
  reminderDays: [7],
  sendToAdmin: true,
  sendToParent: false,
};

type SaveState = "idle" | "saving" | "saved" | "error";

export const NotificationSettings = () => {
  const { school } = useSchool();
  const schoolId = school?.id;

  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loading, setLoading] = useState(true);

  // Load saved settings on mount
  useEffect(() => {
    if (!schoolId) return;

    getNotificationSettings(schoolId)
      .then((data) => {
        if (data) {
          setConfig({
            remindersEnabled: data.reminders_enabled,
            reminderDays: data.reminder_days,
            sendToAdmin: data.send_to_admin,
            sendToParent: data.send_to_parent,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [schoolId]);

  const toggleReminderDay = (day: ReminderWindow) => {
    setConfig((prev) => {
      const already = prev.reminderDays.includes(day);
      // Must keep at least one day selected
      if (already && prev.reminderDays.length === 1) return prev;
      return {
        ...prev,
        reminderDays: already
          ? prev.reminderDays.filter((d) => d !== day)
          : [...prev.reminderDays, day].sort((a, b) => a - b),
      };
    });
  };

  const handleSave = async () => {
    if (!schoolId) return;
    setSaveState("saving");
    try {
      await upsertNotificationSettings({
        school_id: schoolId,
        reminders_enabled: config.remindersEnabled,
        reminder_days: config.reminderDays,
        send_to_admin: config.sendToAdmin,
        send_to_parent: config.sendToParent,
      });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch (err) {
      console.error("Failed to save notification settings:", err);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Page description */}
      <p className="text-sm text-gray-500">
        Automatically email the school admin when student memberships are approaching expiration.
        Emails are sent once per day for each configured reminder window.
      </p>

      {/* Master toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-sm font-semibold text-gray-800">Enable Renewal Reminders</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Send automatic emails before memberships expire
          </p>
        </div>
        <button
          onClick={() =>
            setConfig((prev) => ({ ...prev, remindersEnabled: !prev.remindersEnabled }))
          }
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            config.remindersEnabled ? "bg-primary" : "bg-gray-300"
          }`}
          role="switch"
          aria-checked={config.remindersEnabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              config.remindersEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Options — only shown when enabled */}
      {config.remindersEnabled && (
        <>
          {/* Reminder timing */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-primary" />
              <p className="text-sm font-semibold text-gray-800">When to send reminders</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((opt) => {
                const active = config.reminderDays.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleReminderDay(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      active
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Select one or more windows. An email is sent each day a student hits a window.
            </p>
          </div>

          {/* Who receives the email */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Mail size={16} className="text-primary" />
              <p className="text-sm font-semibold text-gray-800">Email recipients</p>
            </div>

            <div className="space-y-4">
              {/* School admin */}
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-700">School Admin</p>
                  <p className="text-xs text-gray-400">Your account email receives a daily digest</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.sendToAdmin}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, sendToAdmin: e.target.checked }))
                  }
                  className="h-4 w-4 accent-primary rounded"
                />
              </label>

              <div className="border-t border-gray-100" />

              {/* Parents — coming soon */}
              <label className="flex items-center justify-between opacity-50 cursor-not-allowed">
                <div>
                  <p className="text-sm font-medium text-gray-700">Parents</p>
                  <p className="text-xs text-gray-400">Send directly to parent contact on file — coming soon</p>
                </div>
                <input
                  type="checkbox"
                  checked={false}
                  disabled
                  className="h-4 w-4 accent-primary rounded"
                />
              </label>
            </div>
          </div>

          {/* Grace period info */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Students already have a <strong>7-day grace period</strong> after their expiration date
              before their status flips to expired. Reminder emails are sent before the expiration
              date based on the windows you select above.
            </p>
          </div>
        </>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Save size={14} />
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : "Save Settings"}
        </button>

        {saveState === "error" && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle size={14} /> Failed to save. Please try again.
          </p>
        )}
      </div>

      {/* Deployment note */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-2">
        <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
          <Bell size={12} /> Setup required
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Reminder emails require the <code className="bg-gray-100 px-1 rounded">send-renewal-reminders</code> Supabase
          Edge Function to be deployed and a <strong>Resend API key</strong> configured as a secret.
          See <code className="bg-gray-100 px-1 rounded">supabase/functions/send-renewal-reminders/</code> in this repo.
        </p>
      </div>
    </div>
  );
};
