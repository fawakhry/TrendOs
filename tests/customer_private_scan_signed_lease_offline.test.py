"""Signed scan lease: synthetic only, no Cloudflare/network, no real customers."""
import hashlib
import hmac
import pathlib
import sqlite3
import sys
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import customer_private_scan_signed_lease_offline_v0 as lease

PNG = b"\x89PNG\r\n\x1a\nSYNTHETIC_CUSTOMER_TEST_BYTES"
NOW = 1793393000000
SECRET = b"synthetic-source-test-key-material-64-character-seed-not-real!!"


class SyntheticSignedScanLease(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="trendos-lease-offline-")
        self.addCleanup(self.tmp.cleanup)
        self.root = pathlib.Path(self.tmp.name)
        self.db = self.root / "test-signatures"
        self.db.mkdir()
        (self.db / "only-test.hdb").write_text("disposable synthetic signature\n")
        self.exe = self.root / "synthetic-scanner"
        self.exe.write_text(
            "#!" + sys.executable + "\nimport sys\n"
            "data=sys.stdin.buffer.read()\n"
            "if b'SYNTHETIC_THREAT' in data:\n"
            " print('stdin: Synthetic.Only FOUND')\n"
            " sys.exit(1)\n"
            "print('stdin: OK')\n"
        )
        self.exe.chmod(0o700)
        self.data = PNG
        self.snap = self.make_snapshot(self.data)
        self.snap_reads = 0
        self.r2_reads = 0
        self.ledger = sqlite3.connect(str(self.root / "replays.sqlite"))
        self.addCleanup(self.ledger.close)
        self.ledger.execute(
            "CREATE TABLE leases (nonce TEXT PRIMARY KEY, expiry_ms INTEGER NOT NULL)"
        )
        self.consumed = 0

    def make_snapshot(self, data):
        sha = hashlib.sha256(data).hexdigest()
        fid = "CDF-" + "a" * 32
        return {
            "fileId": fid, "draftId": "CDR-" + "b" * 32,
            "itemId": "CDI-" + "c" * 32,
            "objectKey": "customer-drafts/" + fid,
            "ownerScopedToSession": True, "sessionActive": True,
            "draftState": "DRAFT", "fileState": "READY",
            "contentType": "image/png", "sha256Hex": sha,
            "byteSize": len(data), "updatedAtMs": NOW,
            "quarantineDisposition": "QUARANTINED",
            "quarantineSha256Hex": sha,
            "quarantineByteSize": len(data), "quarantineContentType": "image/png",
            "quarantineScanCompleted": 0,
            "quarantinePrintReleaseAuthorized": 0,
        }

    def snapshot(self):
        self.snap_reads += 1
        return dict(self.snap)

    def r2(self, object_key):
        self.r2_reads += 1
        self.assertEqual(object_key, self.snap["objectKey"])
        return self.data

    def replay_cas(self, nonce, expiry_ms):
        self.consumed += 1
        result = self.ledger.execute(
            "INSERT OR IGNORE INTO leases (nonce, expiry_ms) VALUES (?, ?)",
            (nonce, expiry_ms),
        )
        return result.rowcount == 1

    def issue(self, **kw):
        return lease.issue_offline_scan_lease(
            owner_scoped_snapshot=kw.pop("snapshot", self.snap),
            signing_key=kw.pop("key", SECRET),
            issued_at_ms=kw.pop("issued_at_ms", NOW),
            ttl_ms=kw.pop("ttl_ms", 60000),
            nonce=kw.pop("nonce", "1" * 32),
            **kw,
        )

    def consume(self, token, **kw):
        return lease.observe_signed_lease_offline(
            token=token, verification_key=kw.pop("key", SECRET),
            now_ms=kw.pop("now_ms", NOW + 1000),
            read_owner_scoped_snapshot=kw.pop("snap", self.snapshot),
            read_private_r2_bytes=kw.pop("r2", self.r2),
            consume_once=kw.pop("guard", self.replay_cas),
            clamscan_exe=kw.pop("scanner", str(self.exe)),
            signature_db_dir=kw.pop("signatures", str(self.db)),
            **kw,
        )

    def assert_never_release(self, result):
        for key in ("scanAttestationVerified", "malwareScanComplete",
                    "signatureDatabaseAuthenticityVerified",
                    "eligibleForT12FileHandoff", "printReleaseAuthorized",
                    "officialOrderCreated", "productionWriteAuthorized"):
            self.assertIs(result[key], False, key)
        self.assertTrue(result["sourceOnly"])
        self.assertTrue(result["fileQuarantineRemainsRequired"])
        for field in ("fileId", "itemId", "draftId", "nonce", "objectKey",
                      "sha256Hex", "sessionToken", "customerId", "secret"):
            self.assertNotIn(field, result)
        self.assertNotIn(self.snap["fileId"], repr(result))
        self.assertNotIn(self.snap["sha256Hex"], repr(result))

    def test_signed_single_use_valid_synthetic_lease_stays_quarantined(self):
        token = self.issue()
        self.assertIsInstance(token, str)
        self.assertNotIn(self.snap["objectKey"], token)
        first = self.consume(token)
        self.assertEqual(first["code"], "SCAN_LEASE_LOCAL_OBSERVATION_ONLY")
        self.assertTrue(first["localEngineObservedClean"])
        self.assertEqual(self.r2_reads, 1)
        self.assert_never_release(first)
        second = self.consume(token)
        self.assertEqual(second["code"], "SCAN_LEASE_REPLAY_OR_LEDGER_REJECTED")
        self.assertFalse(second["scannerEngineExecuted"])
        self.assertEqual(self.r2_reads, 1)
        self.assert_never_release(second)

    def test_wrong_key_and_tampering_are_denied_before_database_and_r2(self):
        token = self.issue()
        cases = (
            (token, b"another-synthetic-secret-only-for-tests-44444"),
            (token[:-1] + ("A" if token[-1] != "A" else "B"), SECRET),
            ("bad", SECRET),
            ("." + token.split(".")[1], SECRET),
        )
        for bad, key in cases:
            with self.subTest(token=bad[:14]):
                self.snap_reads = self.r2_reads = self.consumed = 0
                out = self.consume(bad, key=key)
                self.assertFalse(out["scannerEngineExecuted"])
                self.assertEqual(self.r2_reads, 0)
                self.assertEqual(self.snap_reads, 0)
                self.assertEqual(self.consumed, 0)
                self.assert_never_release(out)

    def test_audience_purpose_issuer_and_expiry_fail_closed(self):
        orig = self.issue()
        packed, _ = orig.split(".")
        import json
        payload = json.loads(lease._decoded(packed))
        for k, value in (
            ("aud", "wrong-worker"),
            ("iss", "untrusted-issuer"),
            ("purpose", "print-release"),
            ("expMs", NOW + 999999),
            ("iatMs", NOW + 999999),
            ("v", 2),
        ):
            with self.subTest(field=k):
                changed = dict(payload)
                changed[k] = value
                raw = lease._json_bytes(changed)
                signed = lease._encoded(raw) + "." + lease._encoded(
                    hmac.digest(SECRET, raw, "sha256")
                )
                self.r2_reads = 0
                out = self.consume(signed)
                self.assertEqual(out["code"], "SCAN_LEASE_CLAIMS_OR_EXPIRY_REJECTED")
                self.assertEqual(self.r2_reads, 0)
                self.assert_never_release(out)
        for at in (NOW - 6000, NOW + 70000):
            with self.subTest(now=at):
                out = self.consume(orig, now_ms=at)
                self.assertEqual(out["code"], "SCAN_LEASE_CLAIMS_OR_EXPIRY_REJECTED")
                self.assert_never_release(out)

    def test_issuer_denies_wrong_owner_or_quarantine_and_ttl(self):
        for k,value in (("sessionActive", False), ("ownerScopedToSession", False),
                        ("quarantineDisposition", "CLEAN"),
                        ("fileState", "PENDING"), ("objectKey", "bad"),
                        ("quarantineScanCompleted", 1)):
            with self.subTest(field=k):
                invalid = self.make_snapshot(self.data)
                invalid[k] = value
                self.assertIsNone(self.issue(snapshot=invalid))
        self.assertIsNone(self.issue(ttl_ms=120001))
        self.assertIsNone(self.issue(key=b"short"))
        self.assertIsNone(self.issue(nonce="wrong"))

    def test_same_signed_lease_other_file_or_revoked_owner_denied_pre_r2(self):
        token = self.issue()
        for field,value in (
            ("fileId", "CDF-" + "f" * 32),
            ("sha256Hex", "f"*64),
            ("sessionActive", False),
            ("quarantineDisposition", "CLEAN"),
            ("updatedAtMs", NOW + 1),
        ):
            with self.subTest(field=field):
                self.snap = self.make_snapshot(self.data)
                self.snap[field] = value
                self.r2_reads = 0
                out = self.consume(token)
                self.assertEqual(out["code"], "SCAN_LEASE_OWNER_FILE_QUARANTINE_REJECTED")
                self.assertEqual(self.r2_reads, 0)
                self.assert_never_release(out)

    def test_missing_or_nonatomic_replay_ledger_denied_before_bytes(self):
        token = self.issue()
        for guard in (None, lambda nonce, expires: False,
                      lambda nonce, expires: None,
                      lambda nonce, expires: 1):
            with self.subTest(guard=repr(guard)):
                self.r2_reads = 0
                out = self.consume(token, guard=guard)
                self.assertEqual(self.r2_reads, 0)
                self.assert_never_release(out)
                self.assertIn(out["code"], (
                    "SCAN_LEASE_CONFIGURATION_OR_FORMAT_DENIED",
                    "SCAN_LEASE_REPLAY_OR_LEDGER_REJECTED",
                ))

    def test_real_synthetic_threat_never_grants_print_or_t12(self):
        self.data = PNG + b"SYNTHETIC_THREAT"
        self.snap = self.make_snapshot(self.data)
        out = self.consume(self.issue())
        self.assertEqual(out["code"], "SCAN_LEASE_LOCAL_OBSERVATION_ONLY")
        self.assertTrue(out["localEngineDetectedThreat"])
        self.assertFalse(out["localEngineObservedClean"])
        self.assert_never_release(out)

    def test_source_changed_during_scan_or_missing_signatures_never_clear(self):
        token = self.issue()
        count = 0
        def changing_snapshot():
            nonlocal count
            count += 1
            snap = self.make_snapshot(self.data)
            if count >= 4:
                snap["sessionActive"] = False
            return snap
        changed = self.consume(token, snap=changing_snapshot)
        self.assertEqual(changed["code"], "SCAN_LEASE_LOCAL_INPUT_OR_ENGINE_REJECTED")
        self.assert_never_release(changed)

        other = self.issue(nonce="2" * 32)
        missing = self.consume(other, signatures="/missing/signatures")
        self.assertEqual(missing["code"], "SCAN_LEASE_LOCAL_INPUT_OR_ENGINE_REJECTED")
        self.assert_never_release(missing)


if __name__ == "__main__":
    unittest.main()
