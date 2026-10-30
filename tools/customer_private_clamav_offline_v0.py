"""Isolated OFFLINE ClamAV observation, NEVER a TrendOS file release.

This module runs only inside an independently provisioned Linux test/scanner
process. It has no Cloudflare APIs, HTTP listener, D1 writes, R2 credentials,
customer IDs, filenames, original T12 writer, or printer permission.

A local engine's CLEAN observation is not a trustworthy, signed scan
attestation, does not change the mandatory immutable D1 QUARANTINED state,
and MUST NOT be consumed as print release or T12 submit authorization.
"""
from __future__ import annotations
import hashlib
import os
import re
import subprocess
import time
from pathlib import Path

MAX_INPUT_BYTES = 5 * 1024 * 1024
MAX_OUTPUT_BYTES = 4096
DEFAULT_TIMEOUT_SECONDS = 35
SUPPORTED_MIMES = ("image/png", "image/jpeg", "application/pdf")
SHA_RE = re.compile(r"^[0-9a-f]{64}$")
GOOD_RE = re.compile(r"^stdin: OK$", re.ASCII)
BAD_RE = re.compile(r"^stdin: .{1,200} FOUND$", re.ASCII)
SIGNATURE_EXTENSIONS = (".cvd", ".cld", ".hdb", ".ndb", ".ldb")
# Preliminary local timestamp guard, NOT signed DB authenticity or freshness proof.
MAX_SIGNATURE_MTIME_AGE_SECONDS = 72 * 60 * 60
MAX_SIGNATURE_FUTURE_SKEW_SECONDS = 5 * 60

def _outcome(code: str, engine_executed: bool = False,
             observed_clean: bool = False, detected: bool = False) -> dict:
    # Deliberately never represent CLEAN, malware clearance or authorized print.
    return {
        "source": "customer-private-clamav-offline-source-v0",
        "code": code,
        "scannerEngineExecuted": engine_executed,
        "localEngineObservedClean": observed_clean,
        "localEngineDetectedThreat": detected,
        "malwareScanComplete": False,
        "scanAttestationVerified": False,
        "signatureDatabaseAuthenticityVerified": False,
        "fileQuarantineRemainsRequired": True,
        "printReleaseAuthorized": False,
        "eligibleForT12FileHandoff": False,
        "officialOrderCreated": False,
        "productionWriteAuthorized": False,
    }

def _magic_ok(data: bytes, content_type: str) -> bool:
    if content_type == "image/png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/jpeg":
        return len(data) >= 8 and data[:3] == b"\xff\xd8\xff"
    if content_type == "application/pdf":
        return data.startswith(b"%PDF-")
    return False

def scan_private_quarantined_bytes_offline(
    data: bytes, *, expected_sha256: str, expected_size: int,
    content_type: str, clamscan_exe: str, signature_db_dir: str,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS
) -> dict:
    """Scan exact private bytes through ClamAV stdin, never create public files.

    Only trusted INTERNAL caller supplies bytes/metadata; no client-supplied
    path or scanner executable may enter this method. A positive observation
    has no authority to mark any TrendOS file safe or write D1/R2.
    """
    if not isinstance(data, bytes) or not (8 <= len(data) <= MAX_INPUT_BYTES):
        return _outcome("SCAN_INPUT_BOUNDS_DENIED")
    if not isinstance(expected_size, int) or isinstance(expected_size, bool) or (
            expected_size != len(data)):
        return _outcome("SCAN_INPUT_SIZE_MISMATCH")
    if not isinstance(expected_sha256, str) or not SHA_RE.fullmatch(expected_sha256):
        return _outcome("SCAN_SHA256_REFERENCE_INVALID")
    if hashlib.sha256(data).hexdigest() != expected_sha256:
        return _outcome("SCAN_SHA256_NOT_MATCHED")
    if content_type not in SUPPORTED_MIMES or not _magic_ok(data, content_type):
        return _outcome("SCAN_MEDIA_SIGNATURE_DENIED")
    if not isinstance(timeout_seconds, int) or isinstance(timeout_seconds, bool) or not (
            1 <= timeout_seconds <= 90):
        return _outcome("SCAN_TIMEOUT_CONFIG_INVALID")
    # Local administrator controlled absolute paths ONLY, no caller filenames,
    # shell invocation, cloud storage API, or implicit signature downloads.
    if not isinstance(clamscan_exe, str) or not os.path.isabs(clamscan_exe):
        return _outcome("SCAN_EXECUTABLE_NOT_CONFIGURED")
    exe = Path(clamscan_exe)
    if not exe.is_file() or not os.access(exe, os.X_OK):
        return _outcome("SCAN_EXECUTABLE_UNAVAILABLE")
    if not isinstance(signature_db_dir, str) or not os.path.isabs(signature_db_dir):
        return _outcome("SCAN_SIGNATURE_DATABASE_NOT_CONFIGURED")
    db = Path(signature_db_dir)
    try:
        if db.is_symlink() or not db.is_dir():
            return _outcome("SCAN_SIGNATURE_DATABASE_UNAVAILABLE")
        signatures = [
            entry for entry in db.iterdir()
            if entry.suffix in SIGNATURE_EXTENSIONS
        ]
        if not signatures:
            return _outcome("SCAN_SIGNATURE_DATABASE_UNAVAILABLE")
        observed_at = time.time()
        for entry in signatures:
            # Fail closed on local path tampering and obviously stale/future
            # metadata. mtimes are NOT trusted vendor-signature attestations.
            if entry.is_symlink() or not entry.is_file():
                return _outcome("SCAN_SIGNATURE_DATABASE_UNTRUSTED_PATH")
            st = entry.stat()
            if st.st_size <= 0:
                return _outcome("SCAN_SIGNATURE_DATABASE_EMPTY")
            if (st.st_mtime < observed_at - MAX_SIGNATURE_MTIME_AGE_SECONDS
                    or st.st_mtime > observed_at + MAX_SIGNATURE_FUTURE_SKEW_SECONDS):
                return _outcome("SCAN_SIGNATURE_DATABASE_TIMESTAMP_REJECTED")
    except OSError:
        return _outcome("SCAN_SIGNATURE_DATABASE_UNAVAILABLE")

    command = [
        str(exe), "--database=" + str(db),
        "--no-summary", "--stdout",
        "--max-filesize=5M", "--max-scansize=25M",
        "--max-files=100", "--max-recursion=8",
        "--alert-exceeds-max=yes", "-"
    ]
    try:
        execution = subprocess.run(
            command, input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            timeout=timeout_seconds, check=False
        )
    except subprocess.TimeoutExpired:
        return _outcome("SCAN_ENGINE_TIMEOUT")
    except (OSError, ValueError):
        return _outcome("SCAN_ENGINE_UNAVAILABLE")
    # Fail closed on unusually verbose/ambiguous subprocess output. Never
    # relay clamscan logs or threat names to a browser or D1 customer row.
    if len(execution.stdout) > MAX_OUTPUT_BYTES or len(execution.stderr) > MAX_OUTPUT_BYTES:
        return _outcome("SCAN_ENGINE_OUTPUT_UNTRUSTED", True)
    stdout = execution.stdout.decode("utf-8", errors="replace")
    stderr = execution.stderr.decode("utf-8", errors="replace").strip()
    lines = [x.strip() for x in stdout.splitlines() if x.strip()]
    if stderr or len(lines) != 1:
        return _outcome("SCAN_ENGINE_DIAGNOSTIC_OR_AMBIGUOUS", True)
    line = lines[0]
    if execution.returncode == 1 and BAD_RE.fullmatch(line):
        if "Heuristics.Limits.Exceeded" in line:
            # Incomplete scan is a LIMIT, not confirmed malware detection.
            # The attachment stays quarantined and cannot reach T12.
            return _outcome("SCAN_ENGINE_LIMIT_EXCEEDED", True)
        return _outcome("SCAN_LOCAL_THREAT_DETECTED", True, detected=True)
    if execution.returncode == 0 and GOOD_RE.fullmatch(line):
        return _outcome("SCAN_LOCAL_ENGINE_OBSERVED_CLEAN_UNTRUSTED", True,
                        observed_clean=True)
    # Exit 2, unrecognized/malformed verdict, suspicious warnings and
    # signature load failure MUST NOT be interpreted as clean.
    return _outcome("SCAN_ENGINE_ERROR_OR_UNKNOWN_VERDICT", True)
