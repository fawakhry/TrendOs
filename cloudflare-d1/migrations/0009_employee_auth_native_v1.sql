-- TrendOS T12 A61
-- Native employee authentication foundation.
-- Additive and inert by default: control mode OFF.
-- Password plaintext, legacy AUTH_PASSWORD_PEPPER, and raw session tokens are never stored.

CREATE TABLE IF NOT EXISTS employee_auth_control_v1 (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  marker TEXT NOT NULL DEFAULT 'T12_EMPLOYEE_AUTH_V1',
  mode TEXT NOT NULL DEFAULT 'OFF' CHECK (mode IN ('OFF','TRANSITIONAL','NATIVE')),
  policy_epoch INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO employee_auth_control_v1 (singleton, marker, mode, policy_epoch)
VALUES (1, 'T12_EMPLOYEE_AUTH_V1', 'OFF', 1);

CREATE TABLE IF NOT EXISTS employee_auth_users_v1 (
  employee_id TEXT PRIMARY KEY,
  username_key TEXT NOT NULL UNIQUE,
  canonical_username TEXT NOT NULL,
  password_scheme TEXT NOT NULL DEFAULT '',
  password_iterations INTEGER NOT NULL DEFAULT 0,
  password_salt_hex TEXT NOT NULL DEFAULT '',
  password_hash_hex TEXT NOT NULL DEFAULT '',
  must_change INTEGER NOT NULL DEFAULT 1 CHECK (must_change IN (0,1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  role TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  screens_json TEXT NOT NULL DEFAULT '[]',
  session_version INTEGER NOT NULL DEFAULT 1,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until_ms INTEGER NOT NULL DEFAULT 0,
  migrated_at_ms INTEGER,
  last_login_at_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employee_auth_users_v1_active
  ON employee_auth_users_v1 (active, username_key);

CREATE TABLE IF NOT EXISTS employee_auth_sessions_v1 (
  username_key TEXT NOT NULL,
  token_fingerprint TEXT NOT NULL,
  session_version INTEGER NOT NULL,
  issued_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  last_seen_at_ms INTEGER NOT NULL,
  revoked_at_ms INTEGER,
  source TEXT NOT NULL DEFAULT 'd1-native',
  PRIMARY KEY (username_key, token_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_employee_auth_sessions_v1_expiry
  ON employee_auth_sessions_v1 (expires_at_ms);

CREATE INDEX IF NOT EXISTS idx_employee_auth_sessions_v1_user
  ON employee_auth_sessions_v1 (username_key, revoked_at_ms, expires_at_ms);
