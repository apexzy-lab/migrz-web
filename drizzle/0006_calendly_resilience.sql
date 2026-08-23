CREATE TABLE IF NOT EXISTS integration_cache (
  key TEXT PRIMARY KEY NOT NULL,
  value_json TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
ALTER TABLE appointment_requests ADD COLUMN provider_booking_url TEXT;
CREATE INDEX IF NOT EXISTS idx_integration_cache_expiry ON integration_cache(expires_at);
PRAGMA optimize;
