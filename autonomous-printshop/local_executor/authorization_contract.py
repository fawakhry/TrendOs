"""AP-234: review-only dual-signature/replay contract; NO command executor.

This pure standard-library module does NOT authenticate a real person/device:
keys, time, replay receipts and commit pin MUST come from independent trusted
components that do not exist in TrendOS Ubuntu yet. Never use to dispatch jobs.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import re

REQUEST_SCHEMA = "trendos.local-diagnostic.plan.v1"
PROPOSAL_SCHEMA = "trendos.local-diagnostic.proposal.v1"
APPROVAL_SCHEMA = "trendos.local-diagnostic.owner-review.v1"
EXPECTED_TARGET = "TrendosShop"
CANDIDATE_OPERATIONS = frozenset(("python_version", "git_head", "git_status"))
MAX_WINDOW_SECONDS = 300
EXECUTION_ENABLED = False
RECEIPT_STORE_IMPLEMENTED = False
NETWORK_ENABLED = False
_HEX40 = re.compile(r"[0-9a-f]{40}\Z", re.ASCII)
_HEX64 = re.compile(r"[0-9a-f]{64}\Z", re.ASCII)
_IDENTIFIER = re.compile(r"[A-Za-z0-9_-]{12,64}\Z", re.ASCII)


def _deny(reason: str) -> dict[str, str]:
    return {"decision": "DENY", "reason": reason}


def _exact(value: object, keys: frozenset[str]) -> bool:
    return type(value) is dict and frozenset(value) == keys


def _canonical(value: dict) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=True
    ).encode("ascii")


def evaluate_signed_review(
    bundle: object,
    *,
    controller_key: bytes | None = None,
    owner_key: bytes | None = None,
    trusted_now: int | None = None,
    pinned_commit: str | None = None,
    seen_tokens: frozenset[str] | None = None,
) -> dict[str, str]:
    """Validate synthetic metadata for REVIEW_ONLY; never cause host I/O.

    seen_tokens and trusted_now are caller-provided test fixtures, NOT a
    durable authenticated replay ledger or independently attested clock.
    """
    if not _exact(bundle, frozenset((
        "proposal", "proposal_mac", "approval", "approval_mac"
    ))):
        return _deny("INVALID_BUNDLE")
    if (
        type(controller_key) is not bytes or len(controller_key) < 32
        or type(owner_key) is not bytes or len(owner_key) < 32
        or hmac.compare_digest(controller_key, owner_key)
    ):
        return _deny("DISTINCT_TRUSTED_KEYS_REQUIRED")
    if type(trusted_now) is not int or trusted_now <= 0:
        return _deny("TRUSTED_CLOCK_REQUIRED")
    if (
        type(pinned_commit) is not str
        or _HEX40.fullmatch(pinned_commit) is None
    ):
        return _deny("INDEPENDENT_COMMIT_PIN_REQUIRED")
    if (
        type(seen_tokens) is not frozenset
        or len(seen_tokens) > 4096
        or any(type(t) is not str or _HEX64.fullmatch(t) is None for t in seen_tokens)
    ):
        return _deny("REPLAY_JOURNAL_REQUIRED")

    p = bundle["proposal"]
    a = bundle["approval"]
    if not _exact(p, frozenset((
        "schema", "target", "issued_at", "expires_at", "key_id", "request"
    ))):
        return _deny("INVALID_PROPOSAL")
    if not _exact(a, frozenset((
        "schema", "decision", "proposal_sha256", "issued_at", "expires_at", "key_id"
    ))):
        return _deny("INVALID_APPROVAL")
    req = p["request"]
    if not _exact(req, frozenset((
        "schema", "operation", "commit", "request_id", "args"
    ))):
        return _deny("INVALID_REQUEST")
    for obj, fields in (
        (p, ("schema", "target", "key_id")),
        (a, ("schema", "decision", "proposal_sha256", "key_id")),
        (req, ("schema", "operation", "commit", "request_id")),
    ):
        if any(type(obj[key]) is not str for key in fields):
            return _deny("INVALID_TYPES")
    if type(req["args"]) is not dict or req["args"]:
        return _deny("ARGUMENTS_FORBIDDEN")
    if (
        p["schema"] != PROPOSAL_SCHEMA
        or a["schema"] != APPROVAL_SCHEMA
        or req["schema"] != REQUEST_SCHEMA
        or p["target"] != EXPECTED_TARGET
        or p["key_id"] != "controller-synthetic-v1"
        or a["key_id"] != "owner-synthetic-v1"
        or a["decision"] != "REVIEW_ONLY"
    ):
        return _deny("SCOPE_MISMATCH")
    if req["operation"] not in CANDIDATE_OPERATIONS:
        return _deny("OPERATION_NOT_ALLOWED")
    if (
        _HEX40.fullmatch(req["commit"]) is None
        or req["commit"] != pinned_commit
        or _IDENTIFIER.fullmatch(req["request_id"]) is None
    ):
        return _deny("INVALID_IDENTIFIERS_OR_PIN")
    if any(type(obj[key]) is not int for obj in (p, a)
           for key in ("issued_at", "expires_at")):
        return _deny("INVALID_TIME_TYPES")
    if (
        not (0 < p["expires_at"] - p["issued_at"] <= MAX_WINDOW_SECONDS)
        or not (p["issued_at"] <= trusted_now < p["expires_at"])
        or not (p["issued_at"] <= a["issued_at"] <= trusted_now)
        or not (0 < a["expires_at"] - a["issued_at"] <= MAX_WINDOW_SECONDS)
        or not (trusted_now < a["expires_at"] <= p["expires_at"])
    ):
        return _deny("REVIEW_WINDOW_INVALID")
    p_mac, a_mac = bundle["proposal_mac"], bundle["approval_mac"]
    if (
        type(p_mac) is not str or _HEX64.fullmatch(p_mac) is None
        or type(a_mac) is not str or _HEX64.fullmatch(a_mac) is None
        or _HEX64.fullmatch(a["proposal_sha256"]) is None
    ):
        return _deny("INVALID_SIGNATURE_FORMAT")

    encoded = _canonical(p)
    fingerprint = hashlib.sha256(encoded).hexdigest()
    if not hmac.compare_digest(
        hmac.new(controller_key, encoded, hashlib.sha256).hexdigest(), p_mac
    ):
        return _deny("PROPOSAL_SIGNATURE_INVALID")
    if not hmac.compare_digest(fingerprint, a["proposal_sha256"]):
        return _deny("APPROVAL_NOT_BOUND_TO_PROPOSAL")
    if not hmac.compare_digest(
        hmac.new(owner_key, _canonical(a), hashlib.sha256).hexdigest(), a_mac
    ):
        return _deny("OWNER_SIGNATURE_INVALID")
    if fingerprint in seen_tokens:
        return _deny("REPLAY_DETECTED")
    # This is a synthetic token for tests, not an append-only persisted receipt.
    # No real approval/OS attestation, execution or state mutation follows.
    return {
        "decision": "REVIEW_ONLY",
        "reason": "NO_EXECUTOR_OR_DURABLE_REPLAY_STORE",
        "replay_token": fingerprint,
    }
