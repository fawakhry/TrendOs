#!/usr/bin/env python3
"""BOOK24: execute EXACT machine latest-observation SQL from source on SQLite in-memory."""
from pathlib import Path
import re, sqlite3

source=Path('autonomous-printshop/core/readiness-source-adapters-v1.mjs').read_text()
migration=Path('autonomous-printshop/migrations/0027_machine_readiness_v1.sql').read_text()
match=re.search(
    r"db\.prepare\(\`\s*(SELECT observationId,machineId,machineState,sourceKind,sourceRef,.*?)\s*\`\)\.all\(\)",
    source,re.S
)
assert match is not None, 'actual machine observation SELECT not found'
sql=match.group(1)
assert 'ROW_NUMBER() OVER' in sql and 'PARTITION BY machine_id' in sql
assert 'ORDER BY observed_at_ms DESC,observation_id DESC' in sql
assert 'WHERE latestRank=1' in sql
assert 'expires_at_ms>?' not in sql, 'pre-filtering expiry can resurrect old READY'
assert sql.count('?') == 0

db=sqlite3.connect(':memory:')
db.row_factory=sqlite3.Row
db.executescript(migration)
db.execute("INSERT INTO autonomous_machines(machine_id,display_name,department,machine_class) VALUES ('M1','fake','ليزر','LASER')")
db.execute("INSERT INTO autonomous_machines(machine_id,display_name,department,machine_class) VALUES ('M2','fake','ليزر','LASER')")
db.execute("INSERT INTO autonomous_machines(machine_id,display_name,department,machine_class) VALUES ('M3','fake','ليزر','LASER')")
db.execute("INSERT INTO autonomous_machines(machine_id,display_name,department,machine_class) VALUES ('M4','fake','ليزر','LASER')")
now=1800000000000
def insert(id,machine,state,observed,expires):
    db.execute("""INSERT INTO autonomous_machine_observations(
      observation_id,machine_id,machine_state,source_kind,observed_at_ms,expires_at_ms
    ) VALUES (?,?,?,?,?,?)""",(id,machine,state,'SELF_TEST',observed,expires))

# Exact failure: old READY valid, newer BLOCKED expired.
insert('M1-old-ready','M1','READY',now-10000,now+10000)
insert('M1-new-expired','M1','BLOCKED',now-2000,now-1)

# Latest future observation must not fall back to older READY.
insert('M2-old-ready','M2','READY',now-10000,now+10000)
insert('M2-new-future','M2','READY',now+1000,now+11000)

# Deterministic same-ms tie: lexically last observation wins even when expired.
insert('M3-a-ready','M3','READY',now-3000,now+10000)
insert('M3-z-expired','M3','UNKNOWN',now-3000,now-1)

# Ordinary valid newest READY remains available.
insert('M4-old-blocked','M4','BLOCKED',now-10000,now+10000)
insert('M4-new-ready','M4','READY',now-1000,now+10000)

rows={r['machineId']:dict(r) for r in db.execute(sql)}
assert set(rows)=={'M1','M2','M3','M4'},rows
assert rows['M1']['observationId']=='M1-new-expired' and rows['M1']['expiresAtMs']<now
assert rows['M2']['observationId']=='M2-new-future' and rows['M2']['observedAtMs']>now
assert rows['M3']['observationId']=='M3-z-expired'
assert rows['M4']['observationId']=='M4-new-ready'
assert all(k in rows['M1'] for k in ('observationId','machineId','machineState','confidence','observedAtMs','expiresAtMs'))
# Regression negative control: previous WHERE expires_at_ms>? would reselect old READY.
old=db.execute("""SELECT observation_id FROM autonomous_machine_observations
                    WHERE machine_id='M1' AND expires_at_ms>?
                    ORDER BY observed_at_ms DESC LIMIT 1""",(now,)).fetchone()[0]
assert old=='M1-old-ready'
print('BOOK24_EXACT_SQL_LATEST_EXPIRED_SELECTED=PASS')
print('BOOK24_EXACT_SQL_FUTURE_SELECTED_FOR_DOWNSTREAM_REJECTION=PASS')
print('BOOK24_EXACT_SQL_DETERMINISTIC_TIE=PASS')
print('BOOK24_SQLITE_NO_EXTERNAL_DEPENDENCIES=PASS')
