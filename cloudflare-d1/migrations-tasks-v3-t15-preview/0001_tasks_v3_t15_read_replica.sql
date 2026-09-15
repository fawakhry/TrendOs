-- TrendOS Tasks V3 T1.5 preview-only D1 read replica.
-- Intentionally isolated from cloudflare-d1/migrations used by trendos-main.

CREATE TABLE IF NOT EXISTS tasks_v3_t15_read_snapshot (
  snapshot_key TEXT PRIMARY KEY,
  refreshed_at INTEGER NOT NULL,
  source_health_json TEXT NOT NULL,
  source_status_json TEXT NOT NULL,
  snapshot_version TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_v3_t15_read_snapshot_refreshed_at
  ON tasks_v3_t15_read_snapshot(refreshed_at);
