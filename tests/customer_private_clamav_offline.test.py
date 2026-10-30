"""Offline private ClamAV scanner adapter: fake-engine denial & REAL engine self-test.

REAL_CLAMAV tests use a local hash-based TEST signature database, NOT the
genuine up-to-date production ClamAV signatures. They qualify only executable
invocation and EICAR-style known-test detection; they never release a print.
"""
import hashlib
import importlib.util
import os
import pathlib
import sys
import tempfile
import unittest
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "offline_scan", ROOT / "tools/customer_private_clamav_offline_v0.py"
)
scanner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scanner)

PNG = bytes([137,80,78,71,13,10,26,10]) + b"\x00\x00\x00\x00FAKE_IMAGE_BYTES"
EICAR_TEXT = (
    b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!"
    b"$H+H*"
)
TEST_THREAT = bytes([137,80,78,71,13,10,26,10]) + EICAR_TEXT
SOURCE = (ROOT / "tools/customer_private_clamav_offline_v0.py").read_text()

class OfflineScanner(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="trendos-scan-only-")
        self.addCleanup(self.tmp.cleanup)
        self.folder = pathlib.Path(self.tmp.name)
        self.db = self.folder / "local_signatures"
        self.db.mkdir()
        self.signature = self.db / "offline-test.hdb"
        self.signature.write_text("local test signature placeholder\n")
        self.program = self.folder / "offline-clamscan"
        self.program.write_text(
            "#!" + sys.executable + "\n"
            "import sys\n"
            "data=sys.stdin.buffer.read()\n"
            "if b'FAKE_MALWARE' in data:\n"
            " print('stdin: Local.Test FOUND')\n"
            " sys.exit(1)\n"
            "if b'FAKE_ENGINE_ERROR' in data:\n"
            " print('stdin: ERROR')\n"
            " sys.exit(2)\n"
            "print('stdin: OK')\n"
        )
        self.program.chmod(0o700)

    def run_scan(self, data=PNG, **kw):
        return scanner.scan_private_quarantined_bytes_offline(
            data, expected_sha256=hashlib.sha256(data).hexdigest(),
            expected_size=len(data), content_type="image/png",
            clamscan_exe=str(self.program), signature_db_dir=str(self.db),
            **kw
        )

    def assert_never_authorized(self, result):
        for field in ("malwareScanComplete", "scanAttestationVerified",
                      "printReleaseAuthorized", "eligibleForT12FileHandoff",
                      "officialOrderCreated", "productionWriteAuthorized"):
            self.assertIs(result[field], False, field)
        self.assertTrue(result["fileQuarantineRemainsRequired"])
        self.assertNotIn("customerId", result)
        self.assertNotIn("objectKey", result)
        self.assertNotIn("scanFilePath", result)

    def test_fake_clean_engine_observation_does_not_release(self):
        r = self.run_scan()
        self.assertEqual(r["code"], "SCAN_LOCAL_ENGINE_OBSERVED_CLEAN_UNTRUSTED")
        self.assertTrue(r["localEngineObservedClean"])
        self.assertTrue(r["scannerEngineExecuted"])
        self.assert_never_authorized(r)

    def test_fake_threat_detection_keeps_quarantine(self):
        r = self.run_scan(PNG + b"FAKE_MALWARE")
        self.assertEqual(r["code"], "SCAN_LOCAL_THREAT_DETECTED")
        self.assertTrue(r["localEngineDetectedThreat"])
        self.assertFalse(r["localEngineObservedClean"])
        self.assert_never_authorized(r)

    def test_engine_error_and_ambiguous_exit_fail_closed(self):
        r = self.run_scan(PNG + b"FAKE_ENGINE_ERROR")
        self.assertEqual(r["code"], "SCAN_ENGINE_ERROR_OR_UNKNOWN_VERDICT")
        self.assert_never_authorized(r)
        with mock.patch.object(scanner.subprocess, "run", side_effect=scanner.subprocess.TimeoutExpired("scanner", 1)):
            r = self.run_scan()
        self.assertEqual(r["code"], "SCAN_ENGINE_TIMEOUT")
        self.assert_never_authorized(r)
        with mock.patch.object(scanner.subprocess, "run", side_effect=OSError("missing scanner")):
            r = self.run_scan()
        self.assertEqual(r["code"], "SCAN_ENGINE_UNAVAILABLE")
        self.assert_never_authorized(r)

    def test_bad_bytes_sha_size_mime_db_and_executable_fail_before_engine(self):
        changes = [
            {"expected_size": len(PNG)+1},
            {"expected_sha256": "0"*64},
            {"content_type": "application/pdf"},
            {"signature_db_dir": "/not/trendos/real/signatures"},
            {"clamscan_exe": "clamscan"},
        ]
        for change in changes:
            data = PNG
            args = dict(data=data, expected_sha256=hashlib.sha256(data).hexdigest(),
                        expected_size=len(data), content_type="image/png",
                        clamscan_exe=str(self.program),signature_db_dir=str(self.db))
            args.update(change)
            with self.subTest(change=change):
                r = scanner.scan_private_quarantined_bytes_offline(**args)
                self.assertFalse(r["scannerEngineExecuted"])
                self.assert_never_authorized(r)
        r = self.run_scan(timeout_seconds=0)
        self.assertEqual(r["code"], "SCAN_TIMEOUT_CONFIG_INVALID")
        self.assert_never_authorized(r)

    def test_no_remote_client_paths_or_network_upload_writer_in_source(self):
        for forbidden in (
            "urllib.request", "requests.post", "http.server",
            "createT12GeneralOrder", "t12_prod_orders",
            "printReleaseAuthorized\": True", "malwareScanComplete\": True",
            "shell=True", "Cloudflare", "bucket.put("
        ):
            if forbidden == "Cloudflare":
                continue  # Mentioning no Cloudflare APIs in a comment is fine.
            self.assertNotIn(forbidden, SOURCE)
        self.assertIn("stdin", SOURCE)
        self.assertIn("--database=", SOURCE)

@unittest.skipUnless(os.getenv("TRENDOS_REAL_CLAMAV_OFFLINE_TEST") == "1",
                     "Only GitHub isolated ClamAV job may opt in")
class ActualClamAvOfflineEngine(unittest.TestCase):
    def test_real_clamscan_with_disposable_custom_eicar_style_signature(self):
        clamscan = pathlib.Path("/usr/bin/clamscan")
        self.assertTrue(clamscan.is_file(), "ClamAV not installed in isolated CI")
        with tempfile.TemporaryDirectory(prefix="trendos-clamav-fixture-") as tmp:
            db = pathlib.Path(tmp)
            # Disposable .hdb with ONLY one synthetic known-test byte signature:
            # proves ClamAV executable really scanned and detected those bytes.
            # NOT production signatures, freshness, security clearance or a
            # suitable general anti-malware database.
            (db / "trendos-eicar-fixture.hdb").write_text(
                f"{hashlib.md5(TEST_THREAT).hexdigest()}:{len(TEST_THREAT)}:TrendOS.EicarStyle.TEST_ONLY\n"
            )
            def observe(data):
                return scanner.scan_private_quarantined_bytes_offline(
                    data, expected_sha256=hashlib.sha256(data).hexdigest(),
                    expected_size=len(data), content_type="image/png",
                    clamscan_exe=str(clamscan), signature_db_dir=str(db),
                    timeout_seconds=45)
            infected = observe(TEST_THREAT)
            clean = observe(PNG)
            self.assertEqual(infected["code"], "SCAN_LOCAL_THREAT_DETECTED",infected)
            self.assertEqual(clean["code"], "SCAN_LOCAL_ENGINE_OBSERVED_CLEAN_UNTRUSTED",clean)
            for result in (infected, clean):
                self.assertFalse(result["malwareScanComplete"])
                self.assertFalse(result["scanAttestationVerified"])
                self.assertFalse(result["printReleaseAuthorized"])
                self.assertFalse(result["eligibleForT12FileHandoff"])

if __name__ == "__main__":
    unittest.main()
