#!/usr/bin/env python3
"""AP-095: exercise the actual SHADOW Worker readiness SELECT in isolated SQLite.

All IDs/data are synthetic. No Cloudflare, customers, business DB or external I/O.
"""
from pathlib import Path
import sqlite3

SOURCE = Path("autonomous-printshop/production-shadow/worker.mjs").read_text(encoding="utf-8")
anchor = "WITH ranked AS ("
assert SOURCE.count(anchor) == 1, "EXPECTED_ONE_RANKED_READINESS_QUERY"
index = SOURCE.index(anchor)
prefix = "env.DB.prepare(`"
start = SOURCE.rfind(prefix, 0, index)
end = SOURCE.find("`).all()", index)
assert start >= 0 and end > index, "SHADOW_QUERY_NOT_LOCATED"
query = SOURCE[start + len(prefix):end]
assert "FROM autonomous_readiness_evidence" in query
assert "PARTITION BY line_id,evidence_kind" in query
assert "ORDER BY observed_at_ms DESC,evidence_id DESC" in query
assert "WHERE evidenceRank=1" in query
assert "expires_at_ms>?" not in query, "EXPIRED_RECORDS_PREMATURELY_FILTERED"
assert "?" not in query, "UNEXPECTED_LIVE_BIND"
assert query.lstrip().startswith("WITH ranked AS (")

db = sqlite3.connect(":memory:")
db.row_factory = sqlite3.Row
db.execute("""CREATE TABLE autonomous_readiness_evidence (
  evidence_id TEXT PRIMARY KEY, line_id TEXT NOT NULL,
  evidence_kind TEXT NOT NULL, evidence_state TEXT NOT NULL,
  source_kind TEXT NOT NULL, source_ref TEXT,
  source_version TEXT, confidence REAL,
  observed_at_ms INTEGER NOT NULL, expires_at_ms INTEGER
)""")
now = 1_800_000_000_000
events = [
  # A newer expired BLOCKED must still be retrieved ahead of an older READY.
  ("m-old-ready", "synthetic-a", "MACHINE", "READY",  now - 10000, now + 30000),
  ("m-new-expired", "synthetic-a", "MACHINE", "BLOCKED", now - 2000, now - 1),
  # Different kind on same line must remain independently represented.
  ("d-good", "synthetic-a", "DESIGN", "READY", now - 1000, None),
  # A future-dated newer event must be retained for fail-closed projection.
  ("m-old-b", "synthetic-b", "MACHINE", "READY", now - 9000, now + 30000),
  ("m-future-b", "synthetic-b", "MACHINE", "READY", now + 1000, now + 4000),
  # Deterministic tie-break by evidence ID, NOT row retrieval order.
  ("a-tie", "synthetic-c", "MATERIAL", "READY", now - 700, now + 30000),
  ("z-tie", "synthetic-c", "MATERIAL", "BLOCKED", now - 700, now + 30000),
  # Nonexpired newer READY must permit ordinary recovery.
  ("old-blocked", "synthetic-d", "DESIGN", "BLOCKED", now - 3000, now - 2000),
  ("new-ready", "synthetic-d", "DESIGN", "READY", now - 500, now + 10000)
]
db.executemany("""INSERT INTO autonomous_readiness_evidence
 (evidence_id,line_id,evidence_kind,evidence_state,
  observed_at_ms,expires_at_ms,source_kind,source_ref,source_version,confidence)
 VALUES (?,?,?,?,?,?,'SYSTEM','synthetic','1',1.0)""", events)
out = {(row["lineId"], row["evidenceKind"]): row for row in db.execute(query)}
expected = {
  ("synthetic-a", "MACHINE"): "m-new-expired",
  ("synthetic-a", "DESIGN"): "d-good",
  ("synthetic-b", "MACHINE"): "m-future-b",
  ("synthetic-c", "MATERIAL"): "z-tie",
  ("synthetic-d", "DESIGN"): "new-ready"
}
assert len(out) == len(expected), "DUPLICATE_OR_MISSING_LINE_KIND"
assert {key: row["evidenceId"] for key,row in out.items()} == expected
assert out[("synthetic-a", "MACHINE")]["expiresAtMs"] <= now
assert out[("synthetic-b", "MACHINE")]["observedAtMs"] > now
assert out[("synthetic-d", "DESIGN")]["expiresAtMs"] > now
print("AP095_SHADOW_SQL_NEWEST_BEFORE_TTL=PASS")
print("AP095_EXPIRED_BLOCKER_NOT_PREMATURELY_FILTERED=PASS")
print("AP095_SQLITE_IN_MEMORY_ONLY=YES; PRODUCTION_REQUESTS=0; BUSINESS_WRITES=0")
