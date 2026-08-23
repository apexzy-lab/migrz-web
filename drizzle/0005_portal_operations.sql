ALTER TABLE applications ADD COLUMN review_due_at INTEGER;
ALTER TABLE applications ADD COLUMN report_published_at INTEGER;
ALTER TABLE applications ADD COLUMN casevault_status TEXT NOT NULL DEFAULT 'not_ready';
ALTER TABLE applications ADD COLUMN casevault_reference TEXT;
ALTER TABLE applications ADD COLUMN retention_until INTEGER;
ALTER TABLE appointment_requests ADD COLUMN reminder_24h_sent_at INTEGER;
ALTER TABLE appointment_requests ADD COLUMN reminder_1h_sent_at INTEGER;
ALTER TABLE appointment_requests ADD COLUMN no_show_followup_sent_at INTEGER;
CREATE TABLE IF NOT EXISTS service_messages (
  id TEXT PRIMARY KEY NOT NULL, application_id TEXT NOT NULL, user_id TEXT NOT NULL,
  sender_user_id TEXT NOT NULL, sender_role TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'message',
  subject TEXT NOT NULL DEFAULT '', body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open',
  due_at INTEGER, resolved_at INTEGER, read_by_applicant_at INTEGER, read_by_admin_at INTEGER,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_service_messages_application_created ON service_messages(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_messages_user_status ON service_messages(user_id, status);
CREATE TABLE IF NOT EXISTS assessment_reports (
  id TEXT PRIMARY KEY NOT NULL, application_id TEXT NOT NULL, user_id TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
  r2_key TEXT NOT NULL, file_name TEXT NOT NULL, content_type TEXT NOT NULL, size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', summary TEXT NOT NULL DEFAULT '', created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL, published_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_reports_r2_key ON assessment_reports(r2_key);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_application_status ON assessment_reports(application_id, status);
CREATE TABLE IF NOT EXISTS email_deliveries (
  id TEXT PRIMARY KEY NOT NULL, user_id TEXT, application_id TEXT, category TEXT NOT NULL,
  recipient TEXT NOT NULL, subject TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued', attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT, created_at INTEGER NOT NULL, sent_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_status_created ON email_deliveries(status, created_at);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_application ON email_deliveries(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_review_due ON applications(review_status, review_due_at);
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_queue ON appointment_requests(status, confirmed_start, reminder_24h_sent_at, reminder_1h_sent_at);
PRAGMA optimize;
