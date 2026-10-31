"""Offline-only D1 SQLite fixture for native private-file status HTTP E2E.
Loads existing Entry660/666 seed and 0038+0040 migrations. No production data.
"""
import importlib.util
import pathlib
import sqlite3
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "customer_file_seed", ROOT / "tests/entry666_customer_native_r2_file_sqlite.test.py"
)
fixture = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(fixture)

def create(output):
    fx = fixture.PrivateNativeFileSqlite(
        methodName="test_01_owned_reservation_is_pending_then_ready_only_on_finalize"
    )
    fx.setUp()
    try:
        db = fx.db
        db.executescript(
            (ROOT / "cloudflare-d1/migrations/"
             "0040_customer_portal_native_file_quarantine_v1.sql").read_text()
        )
        assert fx.reserve() == 1
        assert fx.finalize() == 1
        assert fx.reserve(
            2, draft=fixture.OTHER_DRAFT, item=fixture.OTHER_ITEM,
            token=fixture.OTHER_MAC, key="cc"*16) == 1
        assert fx.finalize(
            2, draft=fixture.OTHER_DRAFT, item=fixture.OTHER_ITEM,
            token=fixture.OTHER_MAC, key="cc"*16) == 1
        now = int(time.time() * 1000)
        # The original fixture's synthetic 2027 clock differs from real CI
        # clock. Reissue both TEST sessions for this disposable local run.
        db.execute(
            """UPDATE customer_portal_native_sessions_v1
                 SET issued_at_ms=?, expires_at_ms=?
               WHERE customer_id IN ('C1','C2')""",
            (now - 60_000, now + 900_000)
        )
        # C2's pre-existing fixture MAC is a placeholder for SQL tests.
        # For HTTP E2E compute actual HMAC of a second fake bearer.
        db.execute(
            """UPDATE customer_portal_native_sessions_v1
                  SET token_fingerprint_hex=?
                WHERE customer_id='C2'""",
            (fixture.fixture.fingerprint("cd"*32),)
        )
        db.commit()
        with sqlite3.connect(output) as disk:
            db.backup(disk)
            disk.commit()
        print("DISPOSABLE_D1_FIXTURE_ONLY=YES")
    finally:
        fx.tearDown()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Expected disposable local SQLite destination")
    dest = pathlib.Path(sys.argv[1])
    if dest.exists():
        raise SystemExit("Refusing to overwrite existing local SQLite file")
    create(dest)
