"""AP-235: temporary synthetic SQLite only; no host or customer data."""
import ast
import concurrent.futures
import hashlib
import hmac
import json
import runpy
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "local_executor" / "receipt_journal.py"
m = runpy.run_path(str(SOURCE))
bootstrap = m["initialize_synthetic_journal"]
reserve = m["reserve_synthetic_review"]
TOKEN = "a" * 64
COMMIT = "b" * 40
NOW = 1791800000


def review(token=TOKEN):
    return {"decision": "REVIEW_ONLY", "reason": "NO_EXECUTOR_OR_DURABLE_REPLAY_STORE", "replay_token": token}


def request(request_id="ap235_synthetic_00001", operation="git_status"):
    return {"request_id": request_id, "operation": operation, "commit": COMMIT,
            "issued_at": NOW - 20, "expires_at": NOW + 20}


def submit(path, *, rv=None, req=None, now=NOW, commit=COMMIT):
    return reserve(path, rv if rv is not None else review(),
                   req if req is not None else request(),
                   expected_commit=commit, trusted_now=now)


class TestReceiptJournal(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="ap235-fixture-")
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "journal.sqlite3"

    def init(self):
        self.assertEqual(bootstrap(self.path)["decision"], "TEST_STORE_INITIALIZED")

    def assert_denied(self, result, reason=None):
        self.assertEqual(result["decision"], "DENY", result)
        if reason:
            self.assertEqual(result["reason"], reason)
        self.assertNotIn(TOKEN, repr(result))
        return result

    def test_default_off_and_missing_journal_fail_closed(self):
        self.assertFalse(m["EXECUTION_ENABLED"])
        self.assertFalse(m["NETWORK_ENABLED"])
        self.assertFalse(m["APPROVAL_SERVICE_IMPLEMENTED"])
        self.assert_denied(submit(self.path), "STORE_MISSING_OR_UNSAFE_PATH")
        self.assertFalse(self.path.exists())

    def test_bootstrap_only_once_never_resets(self):
        self.init()
        self.assert_denied(bootstrap(self.path), "TEST_STORE_PATH_INVALID_OR_ALREADY_EXISTS")
        self.assertEqual(submit(self.path)["decision"], "RECORDED_REVIEW_ONLY")
        self.assert_denied(bootstrap(self.path), "TEST_STORE_PATH_INVALID_OR_ALREADY_EXISTS")
        self.assert_denied(submit(self.path), "REPLAY_OR_REQUEST_ID_REUSED")

    def test_persists_across_close_and_reopen_and_expiration(self):
        self.init()
        self.assertEqual(submit(self.path)["decision"], "RECORDED_REVIEW_ONLY")
        # Each call establishes a separate sqlite connection; no in-memory cache.
        self.assert_denied(submit(self.path), "REPLAY_OR_REQUEST_ID_REUSED")
        self.assert_denied(submit(self.path, now=NOW + 21), "INVALID_SCOPE_OR_TIME")
        self.assert_denied(submit(self.path), "REPLAY_OR_REQUEST_ID_REUSED")

    def test_token_uniqueness_across_request_ids(self):
        self.init()
        self.assertEqual(submit(self.path)["decision"], "RECORDED_REVIEW_ONLY")
        self.assert_denied(submit(self.path, req=request("ap235_synthetic_00002")),
                           "REPLAY_OR_REQUEST_ID_REUSED")

    def test_request_id_uniqueness_across_distinct_tokens(self):
        self.init()
        self.assertEqual(submit(self.path)["decision"], "RECORDED_REVIEW_ONLY")
        self.assert_denied(submit(self.path, rv=review("c" * 64)), "REPLAY_OR_REQUEST_ID_REUSED")

    def test_two_distinct_receipts_can_coexist(self):
        self.init()
        self.assertEqual(submit(self.path)["decision"], "RECORDED_REVIEW_ONLY")
        self.assertEqual(submit(self.path, rv=review("c" * 64),
                                req=request("ap235_synthetic_00002"))["decision"],
                         "RECORDED_REVIEW_ONLY")
        with sqlite3.connect(self.path) as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM receipts").fetchone()[0], 2)

    def test_race_12_connections_exactly_one_wins(self):
        self.init()
        with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
            results = list(pool.map(lambda _n: submit(self.path), range(12)))
        self.assertEqual(sum(x["decision"] == "RECORDED_REVIEW_ONLY" for x in results), 1, results)
        self.assertTrue(all(x["decision"] in {"RECORDED_REVIEW_ONLY", "DENY"} for x in results))
        with sqlite3.connect(self.path) as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM receipts").fetchone()[0], 1)

    def test_corruption_fails_closed_without_recreation(self):
        self.init()
        self.path.write_bytes(b"not a sqlite database")
        self.assert_denied(submit(self.path), "STORE_UNAVAILABLE_OR_CORRUPT")
        self.assertEqual(self.path.read_bytes(), b"not a sqlite database")

    def test_missing_schema_fails_closed(self):
        self.init()
        with sqlite3.connect(self.path) as db:
            db.execute("DROP TABLE meta")
        self.assert_denied(submit(self.path), "STORE_UNAVAILABLE_OR_CORRUPT")

    def test_schema_version_mismatch_fails_closed(self):
        self.init()
        with sqlite3.connect(self.path) as db:
            db.execute("PRAGMA user_version=42")
        self.assert_denied(submit(self.path), "STORE_UNAVAILABLE_OR_CORRUPT")

    def test_missing_uniqueness_constraint_fails_closed(self):
        self.init()
        with sqlite3.connect(self.path) as db:
            db.execute("DROP TABLE receipts")
            db.execute("CREATE TABLE receipts(token TEXT,request_id TEXT,operation TEXT,commit_sha TEXT,issued_at INTEGER,expires_at INTEGER)")
        self.assert_denied(submit(self.path), "STORE_UNAVAILABLE_OR_CORRUPT")

    def test_simulated_disk_full_open_denied_without_echo(self):
        self.init()
        with patch.object(m["sqlite3"], "connect", side_effect=sqlite3.OperationalError("database or disk is full")):
            self.assert_denied(submit(self.path), "STORE_UNAVAILABLE_OR_CORRUPT")

    def test_missing_store_after_record_denied_no_reset(self):
        self.init()
        self.assertEqual(submit(self.path)["decision"], "RECORDED_REVIEW_ONLY")
        self.path.unlink()
        self.assert_denied(submit(self.path), "STORE_MISSING_OR_UNSAFE_PATH")
        self.assertFalse(self.path.exists())

    def test_symlink_path_denied(self):
        self.init()
        link = self.path.parent / "linked.sqlite3"
        link.symlink_to(self.path)
        self.assert_denied(submit(link), "STORE_MISSING_OR_UNSAFE_PATH")
        self.assert_denied(bootstrap(link), "TEST_STORE_PATH_INVALID_OR_ALREADY_EXISTS")

    def test_relative_paths_and_unwritable_parent_rejected(self):
        self.assert_denied(bootstrap(Path("relative.sqlite3")))
        self.assert_denied(submit(Path("relative.sqlite3")))
        self.assert_denied(bootstrap(self.path.parent / "absent" / "db.sqlite3"))

    def test_malformed_and_forged_review_rejected(self):
        self.init()
        bad = (None, [], {}, {**review(), "execute": True},
               {**review(), "decision": "EXECUTE"},
               {**review(), "reason": "AUTHORIZED"},
               {**review(), "replay_token": "x" * 64})
        for r in bad:
            with self.subTest(review=repr(r)[:90]):
                self.assert_denied(reserve(self.path, r, request(),
                                           expected_commit=COMMIT, trusted_now=NOW))

    def test_reject_expired_future_and_bool_timestamps(self):
        self.init()
        for bad in (NOW + 20, NOW - 21, True, None):
            with self.subTest(clock=bad):
                self.assert_denied(submit(self.path, now=bad), "INVALID_SCOPE_OR_TIME")
        for bad in (True, NOW + 10, NOW - 400):
            req = request()
            req["issued_at"] = bad
            self.assert_denied(submit(self.path, req=req), "INVALID_SCOPE_OR_TIME")

    def test_reject_mismatched_commit_unauthorized_operations(self):
        self.init()
        self.assert_denied(submit(self.path, commit="c" * 40), "INVALID_SCOPE_OR_TIME")
        for op in ("sudo", "bash", "netbird_up", "git_pull", "print", "d1_write", "ssh"):
            self.assert_denied(submit(self.path, req=request(operation=op)), "INVALID_SCOPE_OR_TIME")

    def test_sqlite_write_lock_fails_closed_without_new_row(self):
        self.init()
        with sqlite3.connect(self.path, timeout=0, isolation_level=None) as writer:
            writer.execute("BEGIN IMMEDIATE")
            self.assert_denied(submit(self.path), "STORE_UNAVAILABLE_OR_CORRUPT")
            writer.execute("ROLLBACK")
        self.assertEqual(submit(self.path)["decision"], "RECORDED_REVIEW_ONLY")

    def test_abrupt_writer_close_before_commit_is_rollback_only(self):
        self.init()
        db = sqlite3.connect(self.path, isolation_level=None)
        try:
            db.execute("BEGIN IMMEDIATE")
            db.execute("INSERT INTO receipts VALUES (?, ?, ?, ?, ?, ?)",
                       (TOKEN, "ap235_synthetic_00001", "git_status", COMMIT,
                        NOW - 20, NOW + 20))
        finally:
            # Simulates a crashed writer BEFORE COMMIT. No job dispatch exists.
            db.close()
        with sqlite3.connect(self.path) as check:
            self.assertEqual(check.execute("SELECT COUNT(*) FROM receipts").fetchone()[0], 0)
        self.assertEqual(submit(self.path)["decision"], "RECORDED_REVIEW_ONLY")
        self.assert_denied(submit(self.path), "REPLAY_OR_REQUEST_ID_REUSED")

    @unittest.skipUnless((ROOT / "local_executor" / "authorization_contract.py").is_file(), "AP-234 source required for cross-stage test")
    def test_integrates_with_ap234_synthetic_review_only(self):
        auth = runpy.run_path(str(ROOT / "local_executor" / "authorization_contract.py"))
        controller, owner = b"C" * 32, b"O" * 32
        proposal = {
            "schema": auth["PROPOSAL_SCHEMA"], "target": "TrendosShop",
            "issued_at": NOW - 40, "expires_at": NOW + 40,
            "key_id": "controller-synthetic-v1",
            "request": {"schema": auth["REQUEST_SCHEMA"],
                        "operation": "git_status", "commit": COMMIT,
                        "request_id": "ap235_synthetic_00001", "args": {}},
        }
        encode = lambda d: json.dumps(d, sort_keys=True, separators=(",", ":"),
                                      ensure_ascii=True).encode("ascii")
        approval = {"schema": auth["APPROVAL_SCHEMA"], "decision": "REVIEW_ONLY",
                    "proposal_sha256": hashlib.sha256(encode(proposal)).hexdigest(),
                    "issued_at": NOW - 20, "expires_at": NOW + 20,
                    "key_id": "owner-synthetic-v1"}
        bundle = {"proposal": proposal, "approval": approval,
                  "proposal_mac": hmac.new(controller, encode(proposal), hashlib.sha256).hexdigest(),
                  "approval_mac": hmac.new(owner, encode(approval), hashlib.sha256).hexdigest()}
        verdict = auth["evaluate_signed_review"](
            bundle, controller_key=controller, owner_key=owner,
            trusted_now=NOW, pinned_commit=COMMIT, seen_tokens=frozenset())
        self.assertEqual(verdict["decision"], "REVIEW_ONLY")
        self.init()
        record = {"request_id": proposal["request"]["request_id"],
                  "operation": proposal["request"]["operation"],
                  "commit": COMMIT, "issued_at": proposal["issued_at"],
                  "expires_at": proposal["expires_at"]}
        self.assertEqual(submit(self.path, rv=verdict, req=record)["decision"],
                         "RECORDED_REVIEW_ONLY")
        self.assert_denied(submit(self.path, rv=verdict, req=record),
                           "REPLAY_OR_REQUEST_ID_REUSED")

    def test_no_network_subprocess_or_host_operations_in_source(self):
        syntax = ast.parse(SOURCE.read_text(encoding="utf8"))
        banned = {"subprocess", "socket", "urllib", "requests", "os", "ctypes"}
        for node in ast.walk(syntax):
            if isinstance(node, ast.Import):
                self.assertFalse({x.name.split(".")[0] for x in node.names} & banned)
            elif isinstance(node, ast.ImportFrom):
                self.assertNotIn((node.module or "").split(".")[0], banned)
        self.assertNotIn("subprocess", SOURCE.read_text())


if __name__ == "__main__":
    unittest.main(verbosity=2)
