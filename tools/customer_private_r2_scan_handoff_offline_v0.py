"""Zero Google — isolated private R2 -> offline scan INPUT CONTRACT, NOT a bridge.

No Cloudflare SDK, network fetch, customer identity lookup, D1/R2 credentials,
database writes, HTTP, queue, T12, printer or file-release authority exists.
An INTERNAL caller must provide independently authenticated, owner-scoped D1
read snapshots and a private R2 byte reader. This synthetic contract cannot
establish that such a trusted caller exists in deployed Cloudflare.

A matching hash, observed ClamAV result or repeated snapshot NEVER authorizes
production malware clearance, handing files to T12, or printing.
"""
from __future__ import annotations

import hashlib
import re
from typing import Any, Callable

from customer_private_clamav_offline_v0 import (
    MAX_INPUT_BYTES, scan_private_quarantined_bytes_offline,
)

_FILE = re.compile(r"^CDF-[0-9a-f]{32}$")
_DRAFT = re.compile(r"^CDR-[0-9a-f]{32}$")
_ITEM = re.compile(r"^CDI-[0-9a-f]{32}$")
_SHA = re.compile(r"^[a-f0-9]{64}$")
_MIMES = {"image/png", "image/jpeg", "application/pdf"}
_FIELDS = frozenset((
    "fileId", "draftId", "itemId", "objectKey", "ownerScopedToSession",
    "sessionActive", "draftState", "fileState", "contentType",
    "sha256Hex", "byteSize", "updatedAtMs", "quarantineDisposition",
    "quarantineSha256Hex", "quarantineByteSize", "quarantineContentType",
    "quarantineScanCompleted", "quarantinePrintReleaseAuthorized",
))


def _result(code: str, *, scanner: dict | None = None,
            verified_bytes: bool = False) -> dict:
    scanner = scanner or {}
    # Results are for isolated diagnostics, NEVER customer-facing HTTP.
    # Do not add customer IDs, object keys, bytes, filenames or SHA hashes.
    return {
        "source": "customer-private-r2-scan-handoff-offline-source-v0",
        "code": code,
        "sourceOnly": True,
        "localByteMatchObserved": verified_bytes,
        "scannerEngineExecuted": scanner.get("scannerEngineExecuted", False),
        "localEngineObservedClean": scanner.get("localEngineObservedClean", False),
        "localEngineDetectedThreat": scanner.get("localEngineDetectedThreat", False),
        "localScannerCode": scanner.get("code", "NOT_EXECUTED"),
        "signatureDatabaseAuthenticityVerified": False,
        "scanAttestationVerified": False,
        "malwareScanComplete": False,
        "fileQuarantineRemainsRequired": True,
        "printReleaseAuthorized": False,
        "eligibleForT12FileHandoff": False,
        "officialOrderCreated": False,
        "productionWriteAuthorized": False,
    }


def _snapshot_valid(s: Any) -> bool:
    if not isinstance(s, dict) or set(s) != _FIELDS:
        return False
    if not all(isinstance(s[k], str) for k in (
            "fileId", "draftId", "itemId", "objectKey", "draftState",
            "fileState", "contentType", "sha256Hex",
            "quarantineDisposition", "quarantineSha256Hex",
            "quarantineContentType")):
        return False
    if not (_FILE.fullmatch(s["fileId"]) and _DRAFT.fullmatch(s["draftId"])
            and _ITEM.fullmatch(s["itemId"])):
        return False
    if s["ownerScopedToSession"] is not True or s["sessionActive"] is not True:
        return False
    if s["draftState"] != "DRAFT" or s["fileState"] != "READY":
        return False
    if s["objectKey"] != "customer-drafts/" + s["fileId"]:
        return False
    if not _SHA.fullmatch(s["sha256Hex"]) or s["contentType"] not in _MIMES:
        return False
    n = s["byteSize"]
    if type(n) is not int or n < 8 or n > MAX_INPUT_BYTES:
        return False
    if type(s["updatedAtMs"]) is not int or s["updatedAtMs"] <= 0:
        return False
    # PENDING/READY staging never means malware-cleared or print-ready.
    if s["quarantineDisposition"] != "QUARANTINED":
        return False
    if (s["quarantineSha256Hex"] != s["sha256Hex"]
            or s["quarantineByteSize"] != n
            or s["quarantineContentType"] != s["contentType"]):
        return False
    if (type(s["quarantineByteSize"]) is not int
            or type(s["quarantineScanCompleted"]) is not int
            or type(s["quarantinePrintReleaseAuthorized"]) is not int
            or s["quarantineScanCompleted"] != 0
            or s["quarantinePrintReleaseAuthorized"] != 0):
        return False
    return True


def observe_quarantined_private_r2_bytes_offline(
    *, read_owner_scoped_snapshot: Callable[[], dict],
    read_private_r2_bytes: Callable[[str], bytes],
    clamscan_exe: str, signature_db_dir: str,
    timeout_seconds: int = 35
) -> dict:
    """Source-only deterministic check: D1 proof -> R2 bytes -> D1 -> scan -> D1.

    The callbacks are TEST-INTERNAL adapter seams, NOT proof of a trusted
    production issuer. They must not be wired to web requests or public R2.
    Snapshot identity/session/ownership proof is asserted by a hypothetical
    internal authority, NOT independently authenticated by this function.
    """
    if not callable(read_owner_scoped_snapshot) or not callable(read_private_r2_bytes):
        return _result("SCAN_INTERNAL_PROVIDERS_NOT_CONFIGURED")
    try:
        before = read_owner_scoped_snapshot()
        if not _snapshot_valid(before):
            return _result("SCAN_PRIVATE_SOURCE_PROOF_DENIED")
        # Fetch by canonical D1 key only. Caller cannot supply arbitrary paths.
        data = read_private_r2_bytes(before["objectKey"])
        if type(data) is not bytes or len(data) != before["byteSize"]:
            return _result("SCAN_PRIVATE_R2_BYTES_INVALID")
        if hashlib.sha256(data).hexdigest() != before["sha256Hex"]:
            return _result("SCAN_PRIVATE_R2_HASH_MISMATCH")
        middle = read_owner_scoped_snapshot()
        if not _snapshot_valid(middle) or middle != before:
            return _result("SCAN_PRIVATE_SOURCE_CHANGED_AFTER_R2_READ")
        observed = scan_private_quarantined_bytes_offline(
            data, expected_sha256=before["sha256Hex"],
            expected_size=before["byteSize"],
            content_type=before["contentType"],
            clamscan_exe=clamscan_exe, signature_db_dir=signature_db_dir,
            timeout_seconds=timeout_seconds,
        )
        # The final D1 read MUST run, including scanner error/timeout paths.
        after = read_owner_scoped_snapshot()
        if not _snapshot_valid(after) or after != before:
            return _result("SCAN_PRIVATE_SOURCE_CHANGED_DURING_SCAN")
        if not observed.get("scannerEngineExecuted"):
            return _result("SCAN_PRIVATE_ENGINE_NOT_EXECUTED", scanner=observed)
        # These bytes were scanned only in the local process. No trusted
        # R2-to-Linux identity, signed verdict, signature provenance, or
        # long-lived object immutability is established.
        return _result("SCAN_PRIVATE_LOCAL_OBSERVATION_ONLY",
                       scanner=observed, verified_bytes=True)
    except Exception:
        # Deliberately no external error text, paths, keys or customer data.
        return _result("SCAN_PRIVATE_SOURCE_OR_STORAGE_UNAVAILABLE")
