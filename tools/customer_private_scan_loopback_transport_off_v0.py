"""Zero Google synthetic SCAN TRANSPORT over true HTTP loopback, never public.

Bound ONLY to 127.0.0.1, disabled without test-only env and explicit flag.
Transport HMAC authenticates byte digest+lease+timestamp+fixed path, but it
does NOT prove a real Cloudflare Worker identity or provenance of R2 bytes.
Every passed callback is synthetic: external trusted D1 owner/session, true
shared nonce CAS and private R2 read are NOT furnished by this module.
It never issues production scan attestation, T12 or print authorization.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Callable

from customer_private_scan_signed_lease_offline_v0 import (
    observe_signed_lease_offline,
)

PATH = "/internal/customer/private-scan/observe-v0"
MAX_BYTES = 5 * 1024 * 1024
MAX_CLOCK_SKEW_MS = 5000
_HEX = re.compile(r"^[a-f0-9]{64}$")
_TS = re.compile(r"^[0-9]{13}$")
_LENGTH = re.compile(r"^[1-9][0-9]{0,7}$")
_TOKEN = re.compile(r"^[A-Za-z0-9_-]{1,4000}\.[A-Za-z0-9_-]{43}$")
_REQUIRED = ("content-length", "content-type", "x-trendos-scan-lease",
             "x-trendos-transport-ts", "x-trendos-transport-sha256",
             "x-trendos-transport-signature")


def _blocked(code: str) -> dict:
    return {
        "code": code, "sourceOnly": True, "scannerEngineExecuted": False,
        "localEngineObservedClean": False, "localEngineDetectedThreat": False,
        "scanAttestationVerified": False,
        "signatureDatabaseAuthenticityVerified": False,
        "malwareScanComplete": False, "fileQuarantineRemainsRequired": True,
        "printReleaseAuthorized": False, "eligibleForT12FileHandoff": False,
        "officialOrderCreated": False, "productionWriteAuthorized": False,
    }


def create_synthetic_loopback_server(
    *, transport_key: bytes, lease_key: bytes,
    read_owner_scoped_snapshot: Callable[[], dict],
    consume_once: Callable[[str, int], bool],
    clamscan_exe: str, signature_db_dir: str,
    clock_ms: Callable[[], int] | None = None,
    synthetic_test_only: bool = False
) -> ThreadingHTTPServer:
    """Construct server for GH/local synthetic tests ONLY, never production.

    Not enough for real Cloudflare↔Ubuntu deployment: no Cloudflare Access,
    no remote peer certificate, no real D1 or R2 reader, no distributed CAS.
    """
    if (synthetic_test_only is not True or
            os.environ.get("TRENDOS_PRIVATE_SCAN_LOOPBACK_TEST_ONLY") != "1"):
        raise PermissionError("SCAN_LOOPBACK_TEST_ONLY_OFF")
    if (type(transport_key) is not bytes or len(transport_key) < 32 or
            type(lease_key) is not bytes or len(lease_key) < 32 or
            hmac.compare_digest(transport_key, lease_key)):
        raise ValueError("SCAN_LOOPBACK_DISTINCT_TEST_KEYS_REQUIRED")
    if not callable(read_owner_scoped_snapshot) or not callable(consume_once):
        raise ValueError("SCAN_LOOPBACK_MISSING_TEST_PROVIDERS")
    clock = clock_ms if clock_ms is not None else lambda: int(time.time() * 1000)
    if not callable(clock):
        raise ValueError("SCAN_LOOPBACK_CLOCK_INVALID")

    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"
        server_version = "TrendOS-Synthetic-Loopback"
        sys_version = ""

        def log_message(self, *_args):
            # No signed lease, filename or file bytes in test logging.
            pass

        def _reply(self, status: int, data: dict):
            payload = json.dumps(data, separators=(",", ":")).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(payload)
            self.close_connection = True

        def do_GET(self):
            self._reply(405, _blocked("SCAN_TRANSPORT_METHOD_DENIED"))

        def do_POST(self):
            if self.path != PATH:
                return self._reply(404, _blocked("SCAN_TRANSPORT_PATH_DENIED"))
            if (self.headers.get("Origin") is not None or
                    self.headers.get("Transfer-Encoding") is not None or
                    self.headers.get("Content-Encoding") is not None or
                    self.headers.get("Expect") is not None):
                return self._reply(400, _blocked("SCAN_TRANSPORT_UNSUPPORTED_REQUEST"))
            if any(len(self.headers.get_all(k, [])) != 1 for k in _REQUIRED):
                return self._reply(400, _blocked("SCAN_TRANSPORT_HEADERS_DENIED"))
            vals = {k: self.headers.get(k) for k in _REQUIRED}
            length = vals["content-length"]
            lease = vals["x-trendos-scan-lease"]
            ts = vals["x-trendos-transport-ts"]
            digest = vals["x-trendos-transport-sha256"]
            signature = vals["x-trendos-transport-signature"]
            if (vals["content-type"] != "application/octet-stream" or
                    not _LENGTH.fullmatch(length) or
                    int(length) < 8 or int(length) > MAX_BYTES or
                    not _TOKEN.fullmatch(lease) or
                    not _TS.fullmatch(ts) or
                    not _HEX.fullmatch(digest) or
                    not _HEX.fullmatch(signature)):
                return self._reply(400, _blocked("SCAN_TRANSPORT_FORMAT_DENIED"))
            now = clock()
            if (type(now) is not int or
                    abs(int(ts) - now) > MAX_CLOCK_SKEW_MS):
                return self._reply(403, _blocked("SCAN_TRANSPORT_EXPIRED"))
            try:
                data = self.rfile.read(int(length))
                if len(data) != int(length):
                    return self._reply(400, _blocked("SCAN_TRANSPORT_BYTES_TRUNCATED"))
                actual_hash = hashlib.sha256(data).hexdigest()
                if not hmac.compare_digest(actual_hash, digest):
                    return self._reply(403, _blocked("SCAN_TRANSPORT_BYTES_MISMATCH"))
                message = "\n".join((
                    "trendos-private-scan-transport-v0", PATH, ts, lease,
                    digest, length, "",
                )).encode("ascii")
                expected = hmac.new(transport_key, message, hashlib.sha256).hexdigest()
                if not hmac.compare_digest(expected, signature):
                    return self._reply(403, _blocked("SCAN_TRANSPORT_HMAC_REJECTED"))
                # Byte callback is synthetic HMAC-authenticated incoming data,
                # NOT authenticated R2 provenance. The preexisting scanner
                # lease contract independently checks owner snapshot + hash.
                out = observe_signed_lease_offline(
                    token=lease, verification_key=lease_key, now_ms=now,
                    read_owner_scoped_snapshot=read_owner_scoped_snapshot,
                    read_private_r2_bytes=lambda _canonical_key: data,
                    consume_once=consume_once,
                    clamscan_exe=clamscan_exe,
                    signature_db_dir=signature_db_dir,
                )
                return self._reply(200, out)
            except Exception:
                return self._reply(503, _blocked("SCAN_TRANSPORT_INTERNAL_UNAVAILABLE"))

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    server.daemon_threads = True
    return server
