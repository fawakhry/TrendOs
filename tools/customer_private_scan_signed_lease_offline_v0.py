"""SOURCE-ONLY Zero Google byte-scoped HMAC scan lease (NOT a network service).

This module provides a local synthetic lease validation boundary for the
previous offline D1/R2/ClamAV test seam. No HTTP listener, Cloudflare/R2 SDK,
secrets, authentic live customer identity, public links, print permission,
T12 order writer or real server68 access. An actual deployment would require
authenticated issuer/recipient, dedicated private transport, rotating keys
and an authoritative shared atomic replay ledger.

Issuance trusts ONLY an upstream caller supplying a freshly authenticated
owner-scoped D1 snapshot; this module cannot authenticate that assertion.
No lease or local observed CLEAN authorizes malware clearance / T12 / print.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import re
import secrets
from typing import Callable

from customer_private_r2_scan_handoff_offline_v0 import (
    _snapshot_valid, observe_quarantined_private_r2_bytes_offline,
)

ISSUER = "trendos-private-customer-stage-isolated-v0"
AUDIENCE = "trendos-private-ubuntu-offline-scanner-isolated-v0"
PURPOSE = "quarantined-private-byte-observation-only"
MAX_TTL_MS = 120_000
MAX_FUTURE_SKEW_MS = 5_000
MIN_SECRET_BYTES = 32
MAX_TOKEN_BYTES = 4096
_SHA = re.compile(r"^[0-9a-f]{64}$")
_NONCE = re.compile(r"^[0-9a-f]{32}$")
_TOKEN = re.compile(r"^[A-Za-z0-9_-]{1,4000}\\.[A-Za-z0-9_-]{43}$")
_KEYS = frozenset((
    "v", "iss", "aud", "purpose", "fileId", "draftId", "itemId",
    "sha256Hex", "byteSize", "contentType", "updatedAtMs",
    "iatMs", "expMs", "nonce",
))


def _denied(code: str, local_observation: dict | None = None) -> dict:
    observation = local_observation or {}
    return {
        "source": "zero-google-private-scan-signed-lease-offline-v0",
        "code": code,
        "sourceOnly": True,
        "scannerEngineExecuted": observation.get("scannerEngineExecuted", False),
        "localEngineObservedClean": observation.get("localEngineObservedClean", False),
        "localEngineDetectedThreat": observation.get("localEngineDetectedThreat", False),
        "scanAttestationVerified": False,
        "signatureDatabaseAuthenticityVerified": False,
        "malwareScanComplete": False,
        "fileQuarantineRemainsRequired": True,
        "eligibleForT12FileHandoff": False,
        "printReleaseAuthorized": False,
        "officialOrderCreated": False,
        "productionWriteAuthorized": False,
    }


def _secret_valid(secret: bytes) -> bool:
    return type(secret) is bytes and len(secret) >= MIN_SECRET_BYTES


def _encoded(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _decoded(text: str) -> bytes:
    raw = base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))
    if _encoded(raw) != text:
        raise ValueError("noncanonical base64")
    return raw


def _json_bytes(payload: dict) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=True, allow_nan=False).encode("ascii")


def _claims_match_snapshot(p: dict, s: dict) -> bool:
    return all(p[k] == s[k] and type(p[k]) is type(s[k]) for k in (
        "fileId", "draftId", "itemId", "sha256Hex",
        "byteSize", "contentType", "updatedAtMs",
    ))


def _claims_valid(claims: dict, now_ms: int) -> bool:
    if not isinstance(claims, dict) or set(claims) != _KEYS:
        return False
    if (type(claims["v"]) is not int or claims["v"] != 1
            or claims["iss"] != ISSUER or claims["aud"] != AUDIENCE
            or claims["purpose"] != PURPOSE):
        return False
    if not all(type(claims[k]) is str for k in (
        "fileId", "draftId", "itemId", "sha256Hex",
        "contentType", "nonce",
    )):
        return False
    if not _SHA.fullmatch(claims["sha256Hex"]):
        return False
    if not _NONCE.fullmatch(claims["nonce"]):
        return False
    for k in ("byteSize", "updatedAtMs", "iatMs", "expMs"):
        if type(claims[k]) is not int:
            return False
    iat, exp = claims["iatMs"], claims["expMs"]
    if not (1_500_000_000_000 <= iat <= now_ms + MAX_FUTURE_SKEW_MS
            and iat - MAX_FUTURE_SKEW_MS <= now_ms < exp
            and 1 <= exp - iat <= MAX_TTL_MS):
        return False
    if claims["byteSize"] < 8 or claims["byteSize"] > 5 * 1024 * 1024:
        return False
    if claims["updatedAtMs"] <= 0:
        return False
    return True


def issue_offline_scan_lease(*, owner_scoped_snapshot: dict,
                             signing_key: bytes, issued_at_ms: int,
                             ttl_ms: int = 60_000,
                             nonce: str | None = None) -> str | None:
    """Test/internal only: signer MUST first establish true D1 owner/session.

    Neither a client-supplied snapshot nor a signed blob by itself is a
    production authorization. The lease contains no customer identifier,
    session token, R2 object key or public download URL.
    """
    if (not _snapshot_valid(owner_scoped_snapshot)
            or not _secret_valid(signing_key)
            or type(issued_at_ms) is not int or issued_at_ms < 1_500_000_000_000
            or type(ttl_ms) is not int or not (1 <= ttl_ms <= MAX_TTL_MS)):
        return None
    if nonce is None:
        nonce = secrets.token_hex(16)
    if type(nonce) is not str or not _NONCE.fullmatch(nonce):
        return None
    s = owner_scoped_snapshot
    claims = {
        "v": 1, "iss": ISSUER, "aud": AUDIENCE, "purpose": PURPOSE,
        "fileId": s["fileId"], "draftId": s["draftId"], "itemId": s["itemId"],
        "sha256Hex": s["sha256Hex"], "byteSize": s["byteSize"],
        "contentType": s["contentType"], "updatedAtMs": s["updatedAtMs"],
        "iatMs": issued_at_ms, "expMs": issued_at_ms + ttl_ms,
        "nonce": nonce,
    }
    data = _json_bytes(claims)
    sig = hmac.digest(signing_key, data, "sha256")
    token = _encoded(data) + "." + _encoded(sig)
    return token if len(token) <= MAX_TOKEN_BYTES else None


def observe_signed_lease_offline(*, token: str, verification_key: bytes,
                                now_ms: int,
                                read_owner_scoped_snapshot: Callable[[], dict],
                                read_private_r2_bytes: Callable[[str], bytes],
                                consume_once: Callable[[str, int], bool],
                                clamscan_exe: str, signature_db_dir: str,
                                timeout_seconds: int = 35) -> dict:
    """Fail closed unless HMAC, scope, TTL, immutable replay CAS all pass.

    `consume_once` MUST be a trusted, durable, atomic insert-if-absent
    shared between ALL scanner workers; returning True from a local dict
    is valid only in synthetic tests. No actual transport is included.
    """
    if (type(token) is not str or len(token) > MAX_TOKEN_BYTES
            or not _TOKEN.fullmatch(token) or not _secret_valid(verification_key)
            or type(now_ms) is not int or now_ms < 1_500_000_000_000
            or not callable(read_owner_scoped_snapshot)
            or not callable(read_private_r2_bytes)
            or not callable(consume_once)):
        return _denied("SCAN_LEASE_CONFIGURATION_OR_FORMAT_DENIED")
    try:
        payload_text, signature_text = token.split(".")
        raw = _decoded(payload_text)
        signature = _decoded(signature_text)
        if len(signature) != 32 or len(raw) > 3072:
            return _denied("SCAN_LEASE_FORMAT_DENIED")
        correct = hmac.digest(verification_key, raw, "sha256")
        if not hmac.compare_digest(correct, signature):
            return _denied("SCAN_LEASE_SIGNATURE_REJECTED")
        claims = json.loads(raw)
        if _json_bytes(claims) != raw or not _claims_valid(claims, now_ms):
            return _denied("SCAN_LEASE_CLAIMS_OR_EXPIRY_REJECTED")
        snapshot = read_owner_scoped_snapshot()
        if not _snapshot_valid(snapshot) or not _claims_match_snapshot(claims, snapshot):
            return _denied("SCAN_LEASE_OWNER_FILE_QUARANTINE_REJECTED")
        # Verification precedes replay consumption and all private byte I/O.
        # One atomic, shared nonce CAS is mandatory: missing/False/errors DENY.
        if consume_once(claims["nonce"], claims["expMs"]) is not True:
            return _denied("SCAN_LEASE_REPLAY_OR_LEDGER_REJECTED")
        local = observe_quarantined_private_r2_bytes_offline(
            read_owner_scoped_snapshot=read_owner_scoped_snapshot,
            read_private_r2_bytes=read_private_r2_bytes,
            clamscan_exe=clamscan_exe, signature_db_dir=signature_db_dir,
            timeout_seconds=timeout_seconds,
        )
        if local.get("code") != "SCAN_PRIVATE_LOCAL_OBSERVATION_ONLY":
            return _denied("SCAN_LEASE_LOCAL_INPUT_OR_ENGINE_REJECTED")
        # Local success is diagnostic only: signed scan attestation is absent.
        return _denied("SCAN_LEASE_LOCAL_OBSERVATION_ONLY", local)
    except Exception:
        # Never leak secrets, scanner stderr, keys, customer data, paths.
        return _denied("SCAN_LEASE_INTERNAL_UNAVAILABLE")
