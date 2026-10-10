#!/usr/bin/env python3
"""AP-112: exact owner-Console single-paste AP-107 SQL parity, SQLite only."""
from pathlib import Path
import re
import runpy
import sqlite3

root=Path("autonomous-printshop/diagnostics")
original=(root/"AP107_D1_PRINTING_DATE_TRIAGE_READONLY.sql").read_text(encoding="utf-8")
console=(root/"AP112_D1_CAIRO_TRIAGE_CONSOLE_PASTE.sql").read_text(encoding="utf-8")
canonical=" ".join(line for line in original.splitlines() if not line.lstrip().startswith("--"))
canonical=re.sub(r"\s+"," ",canonical).strip()+"\n"
assert console==canonical, "AP112_MUST_MATCH_AP107_EXACT_SOURCE"
assert console.startswith("WITH params AS")
assert console.count(";")==1 and console.rstrip().endswith(";")
assert "\n" not in console.rstrip("\n")
assert not re.search(r"--|/\*|\*/",console)
assert sqlite3.complete_statement(console)
for forbidden in ("INSERT","DELETE","UPDATE","REPLACE","DROP","ALTER","CREATE",
                  "PRAGMA","ATTACH","DETACH","VACUUM"):
    assert not re.search(r"\b"+forbidden+r"\b",console,re.I),forbidden
assert "SELECT department,dueBucket,COUNT(*) AS lineCount" in console
assert "PARTITION BY lineId" in console
assert "date('now','+3 hours')" in console
# AP-107 already builds synthetic isolated schema with 8 known classified items,
# native-over-legacy precedence, archived exclusion, and invalid-date buckets.
namespace=runpy.run_path("autonomous-printshop/tests/ap107_d1_due_triage_sql_readonly.test.py")
baseline=namespace["result"]
conn=namespace["c"]
review=[dict(row) for row in conn.execute(console)]
assert review==baseline,(review,baseline)
assert len(review)>0
assert set(review[0])=={"department","dueBucket","lineCount"}
assert all(isinstance(row["lineCount"],int) and row["lineCount"]>=0 for row in review)
print("AP112_SINGLE_PASTE_NO_COMMENTS=PASS")
print("AP112_AP107_IDENTICAL_SQL_AND_SYNTHETIC_RESULTS=PASS")
print("AP112_SELECT_ONLY_AGGREGATES_NO_RAW_IDS=PASS")
print("AP112_LIVE_OWNER_D1=NOT_RUN; CLOUDFARE_UI_PASTE=NOT_VERIFIED")
