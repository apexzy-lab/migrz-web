ALTER TABLE appointment_requests ADD COLUMN provider TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE appointment_requests ADD COLUMN provider_event_uri TEXT;
ALTER TABLE appointment_requests ADD COLUMN provider_invitee_uri TEXT;
ALTER TABLE appointment_requests ADD COLUMN cancel_url TEXT;
ALTER TABLE appointment_requests ADD COLUMN reschedule_url TEXT;
ALTER TABLE appointment_requests ADD COLUMN completed_at INTEGER;
ALTER TABLE appointment_requests ADD COLUMN completion_notification_sent_at INTEGER;
ALTER TABLE appointment_requests ADD COLUMN completion_notification_attempts INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_label TEXT,
  action_view TEXT,
  entity_type TEXT,
  entity_id TEXT,
  read_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointment_completion_queue ON appointment_requests(status, completion_notification_sent_at, completion_notification_attempts);
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointment_provider_invitee ON appointment_requests(provider_invitee_uri) WHERE provider_invitee_uri IS NOT NULL;
PRAGMA optimize;
