ALTER TABLE applications ADD COLUMN review_notification_sent_at INTEGER;
ALTER TABLE applications ADD COLUMN review_notification_attempts INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS appointment_requests (
  id TEXT PRIMARY KEY NOT NULL,
  public_id TEXT NOT NULL,
  application_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  requested_start INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK(duration_minutes BETWEEN 15 AND 60),
  timezone TEXT NOT NULL,
  applicant_note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'requested',
  confirmed_start INTEGER,
  meeting_url TEXT,
  admin_note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointment_application ON appointment_requests(application_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointment_public_id ON appointment_requests(public_id);
CREATE INDEX IF NOT EXISTS idx_appointment_status_start ON appointment_requests(status, requested_start);
CREATE INDEX IF NOT EXISTS idx_review_notification_queue ON applications(review_status, review_notification_sent_at, review_notification_attempts);
PRAGMA optimize;
