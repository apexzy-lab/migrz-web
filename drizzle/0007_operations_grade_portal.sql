ALTER TABLE users ADD COLUMN notification_email INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN notification_appointments INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN privacy_requested_at INTEGER;
ALTER TABLE users ADD COLUMN deletion_requested_at INTEGER;
ALTER TABLE users ADD COLUMN last_login_at INTEGER;
ALTER TABLE admins ADD COLUMN permissions_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE admins ADD COLUMN invited_by TEXT;
ALTER TABLE admins ADD COLUMN last_login_at INTEGER;
ALTER TABLE applications ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE applications ADD COLUMN service_stage TEXT NOT NULL DEFAULT 'assessment';
ALTER TABLE applications ADD COLUMN completed_questions INTEGER NOT NULL DEFAULT 0;
ALTER TABLE applications ADD COLUMN total_questions INTEGER NOT NULL DEFAULT 0;
ALTER TABLE documents ADD COLUMN security_status TEXT NOT NULL DEFAULT 'validated';
ALTER TABLE documents ADD COLUMN sha256 TEXT;
ALTER TABLE documents ADD COLUMN reviewed_by TEXT;
ALTER TABLE documents ADD COLUMN reviewed_at INTEGER;
ALTER TABLE payments ADD COLUMN provider_capture_reference TEXT;
ALTER TABLE payments ADD COLUMN failure_code TEXT;
ALTER TABLE payments ADD COLUMN receipt_number TEXT;
ALTER TABLE payments ADD COLUMN refunded_minor INTEGER NOT NULL DEFAULT 0;
ALTER TABLE service_messages ADD COLUMN assigned_admin_id TEXT;
ALTER TABLE service_messages ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE service_messages ADD COLUMN attachment_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE email_deliveries ADD COLUMN text_body TEXT;
ALTER TABLE email_deliveries ADD COLUMN html_body TEXT;
ALTER TABLE email_deliveries ADD COLUMN next_attempt_at INTEGER;

CREATE TABLE IF NOT EXISTS admin_tasks (
  id TEXT PRIMARY KEY NOT NULL, application_id TEXT, assigned_admin_id TEXT, created_by TEXT NOT NULL,
  title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open', due_at INTEGER, completed_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_assignee_status ON admin_tasks(assigned_admin_id,status,due_at);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_application ON admin_tasks(application_id,created_at DESC);

CREATE TABLE IF NOT EXISTS application_tags (
  application_id TEXT NOT NULL, tag TEXT NOT NULL, created_by TEXT NOT NULL, created_at INTEGER NOT NULL,
  PRIMARY KEY(application_id,tag)
);
CREATE INDEX IF NOT EXISTS idx_application_tags_tag ON application_tags(tag);

CREATE TABLE IF NOT EXISTS information_request_items (
  id TEXT PRIMARY KEY NOT NULL, message_id TEXT NOT NULL, application_id TEXT NOT NULL, label TEXT NOT NULL,
  response_type TEXT NOT NULL DEFAULT 'text', required INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'open',
  response_text TEXT, responded_at INTEGER, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_information_items_application_status ON information_request_items(application_id,status);

CREATE TABLE IF NOT EXISTS message_attachments (
  id TEXT PRIMARY KEY NOT NULL, message_id TEXT NOT NULL, application_id TEXT NOT NULL, user_id TEXT NOT NULL,
  r2_key TEXT NOT NULL, file_name TEXT NOT NULL, content_type TEXT NOT NULL, size INTEGER NOT NULL,
  security_status TEXT NOT NULL DEFAULT 'validated', created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);

CREATE TABLE IF NOT EXISTS structured_reports (
  id TEXT PRIMARY KEY NOT NULL, application_id TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL, executive_summary TEXT NOT NULL DEFAULT '', pathways_json TEXT NOT NULL DEFAULT '[]',
  evidence_gaps_json TEXT NOT NULL DEFAULT '[]', next_steps_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft', created_by TEXT NOT NULL, approved_by TEXT,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, published_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_structured_reports_application_version ON structured_reports(application_id,version);

CREATE TABLE IF NOT EXISTS payment_refunds (
  id TEXT PRIMARY KEY NOT NULL, payment_id TEXT NOT NULL, amount_minor INTEGER NOT NULL, reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested', provider_reference TEXT, requested_by TEXT NOT NULL,
  approved_by TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, completed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment ON payment_refunds(payment_id,created_at DESC);

CREATE TABLE IF NOT EXISTS payment_events (
  id TEXT PRIMARY KEY NOT NULL, payment_id TEXT, provider TEXT NOT NULL, event_type TEXT NOT NULL,
  provider_event_id TEXT, status TEXT NOT NULL, detail_json TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_provider_id ON payment_events(provider,provider_event_id);

CREATE TABLE IF NOT EXISTS consent_records (
  id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, consent_type TEXT NOT NULL, document_version TEXT NOT NULL,
  granted INTEGER NOT NULL, ip_hash TEXT, user_agent_hash TEXT, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_consent_records_user ON consent_records(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS user_data_requests (
  id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, request_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'requested',
  admin_note TEXT NOT NULL DEFAULT '', requested_at INTEGER NOT NULL, completed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_user_data_requests_status ON user_data_requests(status,requested_at);

CREATE TABLE IF NOT EXISTS integration_handoffs (
  id TEXT PRIMARY KEY NOT NULL, application_id TEXT NOT NULL, provider TEXT NOT NULL, external_reference TEXT,
  status TEXT NOT NULL DEFAULT 'queued', payload_json TEXT NOT NULL DEFAULT '{}', attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, completed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_integration_handoffs_status ON integration_handoffs(provider,status,updated_at);

CREATE TABLE IF NOT EXISTS service_feedback (
  id TEXT PRIMARY KEY NOT NULL, application_id TEXT NOT NULL, user_id TEXT NOT NULL, stage TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), comment TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_feedback_stage ON service_feedback(application_id,stage);

CREATE TABLE IF NOT EXISTS product_events (
  id TEXT PRIMARY KEY NOT NULL, user_id TEXT, application_id TEXT, event TEXT NOT NULL,
  properties_json TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_product_events_event_created ON product_events(event,created_at);

CREATE TABLE IF NOT EXISTS security_events (
  id TEXT PRIMARY KEY NOT NULL, user_id TEXT, event TEXT NOT NULL, ip_hash TEXT, detail_json TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_created ON security_events(ip_hash,created_at);

CREATE TABLE IF NOT EXISTS admin_authenticators (
  id TEXT PRIMARY KEY NOT NULL, admin_id TEXT NOT NULL, credential_id TEXT NOT NULL, public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0, transports TEXT NOT NULL DEFAULT '[]', created_at INTEGER NOT NULL, last_used_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_authenticators_credential ON admin_authenticators(credential_id);

CREATE INDEX IF NOT EXISTS idx_documents_security ON documents(security_status,status);
CREATE INDEX IF NOT EXISTS idx_payments_status_updated ON payments(status,updated_at);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_retry ON email_deliveries(status,next_attempt_at,attempts);
CREATE INDEX IF NOT EXISTS idx_applications_assignee_priority ON applications(assigned_admin_id,priority,review_due_at);
PRAGMA optimize;
