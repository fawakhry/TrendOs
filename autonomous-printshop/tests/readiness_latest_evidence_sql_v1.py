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
assert "DENSE_RANK() OVER" in query
assert "MAX(CASE" in query and "invalidTimeInHistory" in query
assert "typeof(observed_at_ms)<>'integer'" in query
assert "invalidTimeInHistory" in query.split("FROM ranked",1)[0]
assert "ORDER BY observed_at_ms DESC" in query
assert "evidence_id DESC" not in query
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
  # All conflicting facts at the newest timestamp must survive to projection.
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
out = list(db.execute(query))
by = {}
for row in out:
    by.setdefault((row["lineId"], row["evidenceKind"]), []).append(row)
expected = {
  ("synthetic-a", "MACHINE"): {"m-new-expired"},
  ("synthetic-a", "DESIGN"): {"d-good"},
  ("synthetic-b", "MACHINE"): {"m-future-b"},
  ("synthetic-c", "MATERIAL"): {"a-tie", "z-tie"},
  ("synthetic-d", "DESIGN"): {"new-ready"}
}
assert len(by) == len(expected), "MISSING_LINE_KIND"
assert {key: {r["evidenceId"] for r in vals} for key,vals in by.items()} == expected
assert len(out) == 6, "LATEST_EQUAL_TIME_EVENTS_MUST_SURVIVE"
assert by[("synthetic-a", "MACHINE")][0]["expiresAtMs"] <= now
assert by[("synthetic-b", "MACHINE")][0]["observedAtMs"] > now
assert by[("synthetic-d", "DESIGN")][0]["expiresAtMs"] > now
assert all(row["invalidTimeInHistory"] == 0 for row in out)
# AP-122: insert malformed older chronology for an otherwise valid newest
# READY fact. The latest row remains READY in the SQL projection, but its
# flag records corrupt history for that SAME line and kind.
db.execute("""INSERT INTO autonomous_readiness_evidence
(evidence_id,line_id,evidence_kind,evidence_state,observed_at_ms,
 expires_at_ms,source_kind,source_ref,source_version,confidence)
VALUES ('bad-old-time','synthetic-d','DESIGN','READY',-1,
 NULL,'SYSTEM','synthetic','1',1.0)""")
flagged = list(db.execute(query))
design_d = [row for row in flagged
    if row["lineId"] == "synthetic-d" and row["evidenceKind"] == "DESIGN"]
assert len(design_d) == 1
assert design_d[0]["evidenceId"] == "new-ready"
assert design_d[0]["invalidTimeInHistory"] == 1
assert all(row["invalidTimeInHistory"] == 0 for row in flagged
           if row["lineId"] == "synthetic-a")
# SQLite INTEGER affinity still accepts malformed TEXT and REAL values unless
# the table is STRICT. Neither may silently normalize to a valid timestamp.
db.execute("""INSERT INTO autonomous_readiness_evidence
(evidence_id,line_id,evidence_kind,evidence_state,observed_at_ms,
 expires_at_ms,source_kind,source_ref,source_version,confidence)
VALUES ('bad-real-time','synthetic-d','MATERIAL','BLOCKED',1.5,
 NULL,'SYSTEM','synthetic','1',1.0)""")
db.execute("""INSERT INTO autonomous_readiness_evidence
(evidence_id,line_id,evidence_kind,evidence_state,observed_at_ms,
 expires_at_ms,source_kind,source_ref,source_version,confidence)
VALUES ('good-material-time','synthetic-d','MATERIAL','READY',?,
 ?, 'SYSTEM','synthetic','1',1.0)""", (now-10,now+5000))
material_d = [row for row in db.execute(query)
    if row["lineId"] == "synthetic-d" and row["evidenceKind"] == "MATERIAL"]
assert len(material_d)==1 and material_d[0]["evidenceId"]=="good-material-time"
assert material_d[0]["invalidTimeInHistory"]==1
print("AP122_SHADOW_INVALID_CHRONOLOGY_HISTORY_FLAG=PASS")
print("AP118_SHADOW_EQUAL_TIMESTAMP_CONFLICT_PRESERVED=PASS")
print("AP095_SHADOW_SQL_NEWEST_BEFORE_TTL=PASS")
print("AP095_EXPIRED_BLOCKER_NOT_PREMATURELY_FILTERED=PASS")
print("AP095_SQLITE_IN_MEMORY_ONLY=YES; PRODUCTION_REQUESTS=0; BUSINESS_WRITES=0")
