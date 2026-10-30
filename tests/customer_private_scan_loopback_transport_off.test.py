"""Real HTTP/1.1 loopback bytes + JS HMAC envelope -> Python scan fixture.

No public listener, Cloudflare D1/R2/customer files or true vendor AV DB.
Uses real socket bound solely to 127.0.0.1 and mock D1/nonce callback.
"""
import base64
import hashlib
import http.client
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from customer_private_scan_signed_lease_offline_v0 import issue_offline_scan_lease
from customer_private_scan_loopback_transport_off_v0 import (
    create_synthetic_loopback_server, PATH,
)

NOW = 1793393000000
PNG = b"\x89PNG\r\n\x1a\nSYNTHETIC_LOOPBACK_ONLY"
SIGNING = b"synthetic-scan-lease-issuer-secret-64-bytes-test-20261030!!"
TRANSPORT = b"synthetic-scan-transport-distinct-secret-64-test-20261030!!"


class LocalRealHttpSignedTransport(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="trendos-http-loopback-")
        self.addCleanup(self.tmp.cleanup)
        self.directory = pathlib.Path(self.tmp.name)
        self.sig_dir = self.directory / "signatures"
        self.sig_dir.mkdir()
        (self.sig_dir / "local-test.hdb").write_text("synthetic only\n")
        self.scanner = self.directory / "test-scanner"
        self.scanner.write_text(
            "#!" + sys.executable + "\nimport sys\n"
            "body=sys.stdin.buffer.read()\n"
            "if b'SYNTHETIC_THREAT' in body:\n"
            " print('stdin: Synthetic.Sample FOUND')\n"
            " sys.exit(1)\n"
            "print('stdin: OK')\n"
        )
        self.scanner.chmod(0o700)
        self.data = PNG
        self.replay = set()
        self.snapshot_reads = 0
        self.claims = self.make_snapshot()
        os.environ["TRENDOS_PRIVATE_SCAN_LOOPBACK_TEST_ONLY"] = "1"
        self.addCleanup(os.environ.pop, "TRENDOS_PRIVATE_SCAN_LOOPBACK_TEST_ONLY", None)
        self.server = create_synthetic_loopback_server(
            transport_key=TRANSPORT, lease_key=SIGNING,
            read_owner_scoped_snapshot=self.snapshot,
            consume_once=self.claim,
            clamscan_exe=str(self.scanner), signature_db_dir=str(self.sig_dir),
            clock_ms=lambda: NOW + 1000, synthetic_test_only=True,
        )
        self.addCleanup(self.server.server_close)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.server.shutdown)
        self.assertEqual(self.server.server_address[0], "127.0.0.1")

    def make_snapshot(self):
        sha = hashlib.sha256(self.data).hexdigest()
        fileid = "CDF-" + "a"*32
        return {
            "fileId": fileid, "draftId": "CDR-" + "b"*32,
            "itemId": "CDI-" + "c"*32,
            "objectKey": "customer-drafts/" + fileid,
            "ownerScopedToSession": True, "sessionActive": True,
            "draftState": "DRAFT", "fileState": "READY",
            "contentType": "image/png", "sha256Hex": sha,
            "byteSize": len(self.data), "updatedAtMs": NOW,
            "quarantineDisposition": "QUARANTINED",
            "quarantineSha256Hex": sha,
            "quarantineByteSize": len(self.data),
            "quarantineContentType": "image/png",
            "quarantineScanCompleted": 0,
            "quarantinePrintReleaseAuthorized": 0,
        }

    def snapshot(self):
        self.snapshot_reads += 1
        return dict(self.claims)

    def claim(self, nonce, expiry):
        if nonce in self.replay:
            return False
        self.replay.add(nonce)
        return True

    def lease(self, nonce="a"*32):
        return issue_offline_scan_lease(
            owner_scoped_snapshot=self.claims, signing_key=SIGNING,
            issued_at_ms=NOW, ttl_ms=60000, nonce=nonce,
        )

    def envelope(self, lease=None, ts=NOW + 1000):
        if lease is None:
            lease = self.lease()
        code = """
import {webcrypto} from 'node:crypto';
import {makePrivateScanTransportEnvelopeInternalV0 as make}
 from './cloudflare-d1/customer-stage/private-scan-transport-envelope-internal-v0.mjs';
globalThis.crypto ??= webcrypto;
const req=JSON.parse(process.argv[1]);
const out=await make({
 lease:req.lease,fileBytes:new Uint8Array(Buffer.from(req.file,'base64')),
 transportKey:req.key,nowMs:req.nowMs,allowSyntheticStage:true
});
if(!out.ok)throw new Error(out.code);
process.stdout.write(JSON.stringify({path:out.path,headers:out.headers}));
"""
        payload = json.dumps({
            "lease": lease,
            "file": base64.b64encode(self.data).decode("ascii"),
            "key": TRANSPORT.decode("ascii"), "nowMs": ts
        })
        proc = subprocess.run(
            ["node", "--input-type=module", "-e", code, payload],
            cwd=ROOT, text=True, capture_output=True, timeout=8,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr)
        out = json.loads(proc.stdout)
        self.assertEqual(out["path"], PATH)
        return out["headers"]

    def request(self, *, headers=None, body=None, method="POST", path=PATH):
        conn = http.client.HTTPConnection(
            "127.0.0.1", self.server.server_address[1], timeout=5,
        )
        try:
            conn.request(method, path, body=self.data if body is None else body,
                         headers=self.envelope() if headers is None else headers)
            res = conn.getresponse()
            return res.status, json.loads(res.read().decode())
        finally:
            conn.close()

    def assert_no_release(self, value):
        for field in ("scanAttestationVerified",
                      "signatureDatabaseAuthenticityVerified",
                      "malwareScanComplete", "printReleaseAuthorized",
                      "eligibleForT12FileHandoff", "officialOrderCreated",
                      "productionWriteAuthorized"):
            self.assertIs(value[field], False, field)
        self.assertTrue(value["fileQuarantineRemainsRequired"])
        self.assertNotIn(self.claims["fileId"], repr(value))
        self.assertNotIn(self.claims["sha256Hex"], repr(value))
        self.assertNotIn(self.claims["objectKey"], repr(value))

    def test_real_http_js_envelope_python_lease_verifies_and_never_releases(self):
        status, out = self.request()
        self.assertEqual(status, 200)
        self.assertEqual(out["code"], "SCAN_LEASE_LOCAL_OBSERVATION_ONLY")
        self.assertTrue(out["scannerEngineExecuted"])
        self.assertTrue(out["localEngineObservedClean"])
        self.assertEqual(len(self.replay), 1)
        self.assertGreaterEqual(self.snapshot_reads, 4)
        self.assert_no_release(out)

    def test_duplicate_same_http_envelope_rejected_before_second_scan(self):
        headers = self.envelope()
        first = self.request(headers=headers)
        second = self.request(headers=headers)
        self.assertEqual(first[0], 200)
        self.assertEqual(second[0], 200)
        self.assertEqual(second[1]["code"], "SCAN_LEASE_REPLAY_OR_LEDGER_REJECTED")
        self.assertFalse(second[1]["scannerEngineExecuted"])
        self.assert_no_release(second[1])

    def test_wrong_transport_signature_denied_before_lease_or_replay(self):
        headers = self.envelope()
        headers["x-trendos-transport-signature"] = "0"*64
        status, out = self.request(headers=headers)
        self.assertEqual(status, 403)
        self.assertEqual(out["code"], "SCAN_TRANSPORT_HMAC_REJECTED")
        self.assertEqual(len(self.replay), 0)
        self.assertEqual(self.snapshot_reads, 0)
        self.assert_no_release(out)

    def test_wrong_body_hash_denied_before_owner_or_replay(self):
        headers = self.envelope()
        bad = self.data[:-1] + b"X"
        status, out = self.request(headers=headers, body=bad)
        self.assertEqual(status, 403)
        self.assertEqual(out["code"], "SCAN_TRANSPORT_BYTES_MISMATCH")
        self.assertEqual(len(self.replay), 0)
        self.assert_no_release(out)

    def test_expired_transport_time_denied_before_scanner(self):
        headers = self.envelope(ts=NOW - 8000)
        status, out = self.request(headers=headers)
        self.assertEqual(status, 403)
        self.assertEqual(out["code"], "SCAN_TRANSPORT_EXPIRED")
        self.assert_no_release(out)

    def test_owner_revoked_after_signing_rejected_before_scan(self):
        headers = self.envelope()
        self.claims["sessionActive"] = False
        status, out = self.request(headers=headers)
        self.assertEqual(status, 200)
        self.assertEqual(out["code"], "SCAN_LEASE_OWNER_FILE_QUARANTINE_REJECTED")
        self.assertFalse(out["scannerEngineExecuted"])
        self.assertEqual(len(self.replay), 0)
        self.assert_no_release(out)

    def test_wrong_path_method_origin_or_chunked_denied(self):
        headers = self.envelope()
        for change in (
            {"path": "/not-private"},
            {"method": "GET"},
            {"headers": {**headers, "Origin": "https://attacker.example"}},
            {"headers": {**headers, "Transfer-Encoding": "chunked"}},
        ):
            with self.subTest(change=change.keys()):
                status, out = self.request(
                    headers=change.get("headers", headers),
                    path=change.get("path", PATH),
                    method=change.get("method", "POST"),
                )
                self.assertIn(status, (400, 404, 405))
                self.assertFalse(out["scannerEngineExecuted"])
                self.assert_no_release(out)
        self.assertEqual(len(self.replay), 0)

    def test_threat_observation_keeps_quarantine_and_no_t12(self):
        self.data = PNG + b"SYNTHETIC_THREAT"
        self.claims = self.make_snapshot()
        status, out = self.request()
        self.assertEqual(status, 200)
        self.assertEqual(out["code"], "SCAN_LEASE_LOCAL_OBSERVATION_ONLY")
        self.assertTrue(out["localEngineDetectedThreat"])
        self.assertFalse(out["localEngineObservedClean"])
        self.assert_no_release(out)

    def test_server_requires_explicit_test_only_env_and_distinct_keys(self):
        kwargs = dict(
            transport_key=TRANSPORT, lease_key=SIGNING,
            read_owner_scoped_snapshot=self.snapshot,
            consume_once=self.claim,
            clamscan_exe=str(self.scanner),
            signature_db_dir=str(self.sig_dir),
        )
        with patch.dict(os.environ, {"TRENDOS_PRIVATE_SCAN_LOOPBACK_TEST_ONLY":"0"}):
            with self.assertRaises(PermissionError):
                create_synthetic_loopback_server(synthetic_test_only=True, **kwargs)
        with self.assertRaises(PermissionError):
            create_synthetic_loopback_server(synthetic_test_only=False, **kwargs)
        kwargs["lease_key"] = TRANSPORT
        with self.assertRaises(ValueError):
            create_synthetic_loopback_server(synthetic_test_only=True, **kwargs)


if __name__ == "__main__":
    unittest.main()
