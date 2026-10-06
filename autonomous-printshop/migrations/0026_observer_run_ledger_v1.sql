-- Autonomous Printshop Shadow Observer Run Ledger V1
-- Append-only operational telemetry for scheduled shadow observation runs.

CREATE TABLE IF NOT EXISTS autonomy_observer_runs (
  run_id TEXT PRIMARY KEY,
  trigger_kind TEXT NOT NULL CHECK(trigger_kind IN ('CRON','MANUAL_DIAGNOSTIC')),
  status TEXT NOT NULL CHECK(status IN ('SUCCESS','SKIPPED','ERROR')),
  state TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  baseline_candidates INTEGER NOT NULL DEFAULT 0,
  strict_candidates INTEGER NOT NULL DEFAULT 0,
  evidence_rows INTEGER NOT NULL DEFAULT 0,
  event_inserted INTEGER NOT NULL DEFAULT 0 CHECK(event_inserted IN (0,1)),
  decision TEXT NOT NULL DEFAULT '',
  recommended_decision TEXT NOT NULL DEFAULT '',
  error_code TEXT NOT NULL DEFAULT '',
  started_at_ms INTEGER NOT NULL,
  completed_at_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK(completed_at_ms>=started_at_ms)
);

CREATE INDEX IF NOT EXISTS idx_autonomy_observer_runs_time
ON autonomy_observer_runs(started_at_ms DESC);

CREATE TRIGGER IF NOT EXISTS trg_autonomy_observer_runs_no_update
BEFORE UPDATE ON autonomy_observer_runs
BEGIN
  SELECT RAISE(ABORT,'AUTONOMY_OBSERVER_RUNS_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_autonomy_observer_runs_no_delete
BEFORE DELETE ON autonomy_observer_runs
BEGIN
  SELECT RAISE(ABORT,'AUTONOMY_OBSERVER_RUNS_APPEND_ONLY');
END;
