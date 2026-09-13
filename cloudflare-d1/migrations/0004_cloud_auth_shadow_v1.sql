-- TrendOS Cloud Migration V3 / T6B
-- Production canary migration for bounded D1 employee-session auth shadow.
-- Raw employee tokens are intentionally never stored.

CREATE TABLE IF NOT EXISTS cloud_auth_sessions_v1 (
  username_key TEXT NOT NULL,
  token_fingerprint TEXT NOT NULL,
  canonical_username TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  screens_json TEXT NOT NULL DEFAULT '[]',
  verified_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  last_seen_at_ms INTEGER NOT NULL,
  revoked_at_ms INTEGER,
  source TEXT NOT NULL DEFAULT 'apps-script-post',
  schema_version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (username_key, token_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_cloud_auth_sessions_v1_expiry
  ON cloud_auth_sessions_v1 (expires_at_ms);

CREATE INDEX IF NOT EXISTS idx_cloud_auth_sessions_v1_user_expiry
  ON cloud_auth_sessions_v1 (username_key, expires_at_ms);
