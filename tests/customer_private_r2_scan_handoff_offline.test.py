"""Synthetic private R2 + D1 repeat-read -> local scanner tests. NO cloud."""
import hashlib
import pathlib
import sys
import tempfile
import unittest
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import customer_private_r2_scan_handoff_offline_v0 as bridge

PNG = b"\x89PNG\r\n\x1a\n" + b"PRIVATE_TEST_BYTES_ONLY"


class QuarantinedPrivateR2Offline(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="trendos-r2-scan-source-")
        self.addCleanup(self.tmp.cleanup)
        self.folder = pathlib.Path(self.tmp.name)
        self.db = self.folder / "signatures"
        self.db.mkdir()
        (self.db / "synthetic.hdb").write_text("placeholder only\n")
        self.exe = self.folder / "fake-clamscan"
        self.exe.write_text(
            "#!" + sys.executable + "\n"
            "import sys\n"
            "b=sys.stdin.buffer.read()\n"
            "if b'TEST_MARKER' in b:\n"
            " print('stdin: Local.Synthetic FOUND')\n"
            " sys.exit(1)\n"
            "print('stdin: OK')\n"
        )
        self.exe.chmod(0o700)
        self.data = PNG
        self.snapshot = self.make_snapshot(self.data)
        self.bytes_reads = []
        self.snapshot_reads = 0

    def make_snapshot(self, data):
        fid = "CDF-" + "a" * 32
        return {
            "fileId": fid, "draftId": "CDR-" + "b" * 32,
            "itemId": "CDI-" + "c" * 32,
            "objectKey": "customer-drafts/" + fid,
            "ownerScopedToSession": True, "sessionActive": True,
            "draftState": "DRAFT", "fileState": "READY",
            "contentType": "image/png",
            "sha256Hex": hashlib.sha256(data).hexdigest(),
            "byteSize": len(data), "updatedAtMs": 1793393000000,
            "quarantineDisposition": "QUARANTINED",
            "quarantineSha256Hex": hashlib.sha256(data).hexdigest(),
            "quarantineByteSize": len(data), "quarantineContentType": "image/png",
            "quarantineScanCompleted": 0,
            "quarantinePrintReleaseAuthorized": 0,
        }

    def read_snapshot(self):
        self.snapshot_reads += 1
        return dict(self.snapshot)

    def read_r2(self, key):
        self.bytes_reads.append(key)
        return self.data

    def observe(self, snap=None, r2=None, **kw):
        return bridge.observe_quarantined_private_r2_bytes_offline(
            read_owner_scoped_snapshot=snap or self.read_snapshot,
            read_private_r2_bytes=r2 or self.read_r2,
            clamscan_exe=kw.pop("clamscan_exe", str(self.exe)),
            signature_db_dir=kw.pop("signature_db_dir", str(self.db)),
            **kw,
        )

    def assert_never_releases(self, out):
        for key in ("scanAttestationVerified", "malwareScanComplete",
                    "signatureDatabaseAuthenticityVerified",
                    "printReleaseAuthorized", "eligibleForT12FileHandoff",
                    "officialOrderCreated", "productionWriteAuthorized"):
            self.assertIs(out[key], False, key)
        self.assertTrue(out["fileQuarantineRemainsRequired"])
        self.assertTrue(out["sourceOnly"])
        forbidden = ("fileId", "draftId", "itemId", "objectKey",
                     "sha256Hex", "customerId", "bytes", "filename")
        for key in forbidden:
            self.assertNotIn(key, out)
        self.assertNotIn(self.snapshot["fileId"], repr(out))
        self.assertNotIn(self.snapshot["sha256Hex"], repr(out))

    def test_owned_private_bytes_clean_engine_only_observation(self):
        result = self.observe()
        self.assertEqual(result["code"], "SCAN_PRIVATE_LOCAL_OBSERVATION_ONLY")
        self.assertTrue(result["localByteMatchObserved"])
        self.assertTrue(result["localEngineObservedClean"])
        self.assertEqual(self.bytes_reads, [self.snapshot["objectKey"]])
        self.assertEqual(self.snapshot_reads, 3)
        self.assert_never_releases(result)

    def test_threat_detection_does_not_authorize_any_release(self):
        self.data = PNG + b"TEST_MARKER"
        self.snapshot = self.make_snapshot(self.data)
        result = self.observe()
        self.assertTrue(result["localEngineDetectedThreat"])
        self.assertFalse(result["localEngineObservedClean"])
        self.assert_never_releases(result)

    def test_wrong_owner_session_quarantine_or_key_denied_before_private_fetch(self):
        negatives = (
            ("ownerScopedToSession", False),
            ("sessionActive", False),
            ("draftState", "SUBMITTED"),
            ("fileState", "PENDING"),
            ("quarantineDisposition", "CLEAN"),
            ("quarantineScanCompleted", 1),
            ("quarantinePrintReleaseAuthorized", 1),
            ("quarantineSha256Hex", "0"*64),
            ("quarantineByteSize", 123),
            ("objectKey", "other-customer/customer-file"),
            ("fileId", "bad-id"),
        )
        for key,value in negatives:
            with self.subTest(key=key):
                self.snapshot = self.make_snapshot(self.data)
                self.snapshot[key] = value
                self.bytes_reads.clear()
                result = self.observe()
                self.assertEqual(result["code"], "SCAN_PRIVATE_SOURCE_PROOF_DENIED")
                self.assertEqual(self.bytes_reads, [])
                self.assertFalse(result["scannerEngineExecuted"])
                self.assert_never_releases(result)

    def test_missing_or_extra_snapshot_fields_denied(self):
        for mutation in ("missing", "extra"):
            self.snapshot = self.make_snapshot(self.data)
            if mutation == "missing":
                del self.snapshot["sessionActive"]
            else:
                self.snapshot["clientProvidedClean"] = True
            result = self.observe()
            self.assertEqual(result["code"], "SCAN_PRIVATE_SOURCE_PROOF_DENIED")
            self.assertFalse(result["scannerEngineExecuted"])
            self.assert_never_releases(result)

    def test_bad_private_r2_bytes_size_and_hash_never_call_scanner(self):
        for data, expected in (
            (b"too-short", "SCAN_PRIVATE_R2_BYTES_INVALID"),
            (PNG[:-1] + b"X", "SCAN_PRIVATE_R2_HASH_MISMATCH"),
        ):
            with self.subTest(expected=expected):
                with mock.patch.object(bridge, "scan_private_quarantined_bytes_offline") as scanner:
                    result = self.observe(r2=lambda key: data)
                self.assertEqual(result["code"], expected)
                scanner.assert_not_called()
                self.assert_never_releases(result)

    def test_snapshot_changed_between_fetch_and_scan_never_invokes_scanner(self):
        times = 0
        def changed():
            nonlocal times
            times += 1
            s = self.make_snapshot(self.data)
            if times >= 2:
                s["updatedAtMs"] += 1
            return s
        with mock.patch.object(bridge, "scan_private_quarantined_bytes_offline") as scanner:
            result = self.observe(snap=changed)
        self.assertEqual(result["code"], "SCAN_PRIVATE_SOURCE_CHANGED_AFTER_R2_READ")
        scanner.assert_not_called()
        self.assert_never_releases(result)

    def test_revoked_session_during_scanner_observation_discards_result(self):
        times = 0
        def changed():
            nonlocal times
            times += 1
            s = self.make_snapshot(self.data)
            if times == 3:
                s["sessionActive"] = False
            return s
        with mock.patch.object(bridge, "scan_private_quarantined_bytes_offline",
                               wraps=bridge.scan_private_quarantined_bytes_offline) as scanner:
            result = self.observe(snap=changed)
        self.assertEqual(result["code"], "SCAN_PRIVATE_SOURCE_CHANGED_DURING_SCAN")
        scanner.assert_called_once()
        self.assertFalse(result["localEngineObservedClean"])
        self.assert_never_releases(result)

    def test_source_failures_and_scanner_errors_fail_closed(self):
        def boom(*args):
            raise RuntimeError("sensitive customer internal path")
        first = self.observe(snap=boom)
        second = self.observe(r2=boom)
        third = self.observe(signature_db_dir="/missing/signature-db")
        self.assertEqual(first["code"], "SCAN_PRIVATE_SOURCE_OR_STORAGE_UNAVAILABLE")
        self.assertEqual(second["code"], "SCAN_PRIVATE_SOURCE_OR_STORAGE_UNAVAILABLE")
        self.assertEqual(third["code"], "SCAN_PRIVATE_ENGINE_NOT_EXECUTED")
        self.assertEqual(third["localScannerCode"],
                         "SCAN_SIGNATURE_DATABASE_UNAVAILABLE")
        for x in (first, second, third):
            self.assert_never_releases(x)
            self.assertNotIn("sensitive customer", repr(x))

    def test_invalid_providers_and_nonbytes(self):
        for bad in (None, b"", bytearray(self.data), "not-bytes"):
            result = self.observe(r2=lambda key: bad)
            self.assertEqual(result["code"], "SCAN_PRIVATE_R2_BYTES_INVALID")
            self.assert_never_releases(result)
        invalid = bridge.observe_quarantined_private_r2_bytes_offline(
            read_owner_scoped_snapshot=None, read_private_r2_bytes=None,
            clamscan_exe=str(self.exe), signature_db_dir=str(self.db))
        self.assertEqual(invalid["code"], "SCAN_INTERNAL_PROVIDERS_NOT_CONFIGURED")
        self.assert_never_releases(invalid)


if __name__ == "__main__":
    unittest.main()
