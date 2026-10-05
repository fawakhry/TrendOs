PRAGMA foreign_keys = ON;

-- EasyStore A2 transactional guard.
-- Used inside D1 batch() to turn missing optimistic updates into a constraint
-- failure so the whole batch rolls back instead of leaving a partial write.
CREATE TABLE IF NOT EXISTS employee_accounting_tx_guard_v1 (
  request_key TEXT PRIMARY KEY,
  expected_count INTEGER NOT NULL CHECK(expected_count>=0),
  actual_count INTEGER NOT NULL CHECK(actual_count>=0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(actual_count=expected_count)
);
