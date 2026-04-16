-- notification_settings
-- One row per school. Controls whether renewal reminder emails are sent,
-- how far in advance, and who receives them.

CREATE TABLE public.notification_settings (
  id                UUID        NOT NULL DEFAULT gen_random_uuid(),
  school_id         UUID        NOT NULL,
  reminders_enabled BOOLEAN     NOT NULL DEFAULT false,
  -- Array of day windows before expiration (e.g. {7} or {7,14,30})
  reminder_days     INTEGER[]   NOT NULL DEFAULT '{7}',
  send_to_admin     BOOLEAN     NOT NULL DEFAULT true,
  send_to_parent    BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT notification_settings_pkey PRIMARY KEY (id),
  CONSTRAINT notification_settings_school_fkey
    FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE,
  CONSTRAINT notification_settings_school_unique
    UNIQUE (school_id)
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_notification_settings_updated_at();

-- RLS: only the school's admin can read/write their own settings
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage their school notification settings"
  ON public.notification_settings
  FOR ALL
  USING (
    school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid())
  )
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid())
  );
