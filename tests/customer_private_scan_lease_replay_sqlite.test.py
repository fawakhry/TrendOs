"""Real local SQLite verification for source-only D1 replay CAS migration.

No production D1 migration, no Cloudflare credentials, no actual R2 files.
"""
import concurrent.futures
import pathlib
import re
import sqlite3
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "cloudflare-d1/migrations/0041_customer_private_scan_lease_replay_v0.sql"
JS = ROOT / "cloudflare-d1/customer-stage/private-scan-lease-replay-d1-internal-v0.mjs"
NOW = 1793393000000
INSERT = (
    "INSERT INTO customer_private_scan_lease_replay_v0 "
    "(nonce_digest_hex,signed_lease_digest_hex,issued_at_ms,expires_at_ms,consumed_at_ms) "
    "VALUES(?,?,?,?,?) ON CONFLICT(nonce_digest_hex) DO NOTHING"
)


class ImmutableReplayRealSQLite(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="trendos-replay-d1-sqlite-only-")
        self.addCleanup(self.tmp.cleanup)
        self.path = str(pathlib.Path(self.tmp.name) / "isolated-replay.sqlite")
        with sqlite3.connect(self.path) as db:
            db.executescript(MIGRATION.read_text())
        self.values = ("a"*64, "b"*64, NOW, NOW + 60000, NOW + 1000)

    def db(self):
        return sqlite3.connect(self.path, timeout=10, isolation_level="DEFERRED")

    def test_d1_module_query_is_same_as_sqlite_test_contract(self):
        code = JS.read_text()
        self.assertIn("ON CONFLICT(nonce_digest_hex) DO NOTHING", code)
        self.assertIn("SCAN_REPLAY_USED_OR_UNVERIFIED", code)
        self.assertIn("SCAN_REPLAY_ATOMIC_PROOF_UNAVAILABLE", code)

    def test_atomic_first_insert_one_second_duplicate_zero_and_persistent(self):
        with self.db() as db:
            self.assertEqual(db.execute(INSERT, self.values).rowcount, 1)
            self.assertEqual(db.execute(INSERT, self.values).rowcount, 0)
        with self.db() as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM customer_private_scan_lease_replay_v0").fetchone()[0], 1)
            self.assertEqual(db.execute(
                "SELECT nonce_digest_hex,signed_lease_digest_hex,issued_at_ms,expires_at_ms,consumed_at_ms "
                "FROM customer_private_scan_lease_replay_v0"
            ).fetchone(), self.values)
            self.assertEqual(db.execute(INSERT, self.values).rowcount, 0)

    def test_concurrent_connections_same_nonce_exactly_one_wins(self):
        def race(i):
            with self.db() as db:
                return db.execute(INSERT, self.values).rowcount
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            changed = list(executor.map(race, range(16)))
        self.assertEqual(changed.count(1), 1)
        self.assertEqual(changed.count(0), 15)
        with self.db() as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM customer_private_scan_lease_replay_v0").fetchone()[0], 1)

    def test_nonce_cannot_reissue_with_other_signed_lease_after_expiry(self):
        with self.db() as db:
            db.execute(INSERT, self.values)
            next_attempt = list(self.values)
            next_attempt[1] = "c"*64
            next_attempt[4] = NOW + 50000
            self.assertEqual(db.execute(INSERT, next_attempt).rowcount, 0)

    def test_audit_rows_immutable_for_update_and_delete(self):
        with self.db() as db:
            db.execute(INSERT, self.values)
            with self.assertRaises(sqlite3.DatabaseError):
                db.execute("UPDATE customer_private_scan_lease_replay_v0 SET consumed_at_ms=?",
                           (NOW + 5000,))
            with self.assertRaises(sqlite3.DatabaseError):
                db.execute("DELETE FROM customer_private_scan_lease_replay_v0")
            self.assertEqual(db.execute("SELECT COUNT(*) FROM customer_private_scan_lease_replay_v0").fetchone()[0],1)

    def test_invalid_hashes_expiry_and_consumed_time_rejected(self):
        invalid = [
            ("X"*64, self.values[1], NOW, NOW+60000, NOW+1000),
            (self.values[0], "X"*64, NOW, NOW+60000, NOW+1000),
            (self.values[0], self.values[1], NOW, NOW+120001, NOW+1000),
            (self.values[0], self.values[1], NOW, NOW+60000, NOW+60000),
            (self.values[0], self.values[1], NOW, NOW-1, NOW),
            (self.values[0], self.values[1], NOW, NOW+60000, NOW-6000),
        ]
        for bad in invalid:
            with self.subTest(bad=bad):
                with self.db() as db:
                    with self.assertRaises(sqlite3.IntegrityError):
                        db.execute(INSERT,bad)

    def test_no_pii_file_id_raw_nonce_or_token_storage(self):
        with self.db() as db:
            columns = {row[1] for row in db.execute(
                "PRAGMA table_info(customer_private_scan_lease_replay_v0)"
            )}
            self.assertEqual(columns,{
                "nonce_digest_hex","signed_lease_digest_hex",
                "issued_at_ms","expires_at_ms","consumed_at_ms"
            })
            self.assertFalse(any(re.search(r"customer|file_id|r2|token|session",c) for c in columns))


if __name__ == "__main__":
    unittest.main()
