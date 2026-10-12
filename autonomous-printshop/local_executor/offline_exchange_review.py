"""AP-264 owner-carried diagnostic exchange: pure OFFLINE correlation review.

UNTRUSTED JSON FIXTURES ONLY: not a producer, consumer, dispatcher, transport,
real clock, audit store, signature verifier, owner consent or host attestation.
An accepted exchange remains REVIEW_ONLY and never authorizes host operations.
"""
from __future__ import annotations

import hashlib
import json
import re

import offline_snapshot_handoff as handoff
import policy
import trust_boundary

REQUEST_SCHEMA = "trendos.ap264.offline-exchange-request.v1"
RESPONSE_SCHEMA = "trendos.ap264.offline-exchange-response.v1"
TARGET = "TrendosShop"
MODE = "OFFLINE_OWNER_CARRIED"
MAX_REQUEST_BYTES = 1536
MAX_RESPONSE_BYTES = 2048
MAX_WINDOW_SECONDS = 300
TRANSPORT_ENABLED = False
HOST_EXECUTION_ENABLED = False
OWNER_AUTH_IMPLEMENTED = False
DEVICE_ATTESTATION_IMPLEMENTED = False
TRUSTED_CLOCK_IMPLEMENTED = False
DURABLE_REPLAY_AUDIT_IMPLEMENTED = False
REAL_STOP_IMPLEMENTED = False

_REQUEST_FIELDS = frozenset((
    "schema", "target", "mode", "branch", "issued_at", "expires_at",
    "catalog_digest", "plan",
))
_PLAN_FIELDS = frozenset(("schema", "operation", "commit", "request_id", "args"))
_RESPONSE_FIELDS = frozenset((
    "schema", "target", "mode", "request_id", "operation", "commit", "snapshot",
))
_HEX40 = re.compile(r"[a-f0-9]{40}\Z", re.ASCII)
_ID = re.compile(r"[A-Za-z0-9_-]{12,64}\Z", re.ASCII)
_BRANCH = re.compile(r"[A-Za-z0-9._/-]{1,128}\Z", re.ASCII)


class _InvalidPayload(ValueError):
    pass


def _unique_keys(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise _InvalidPayload("DUPLICATE_KEY")
        result[key] = value
    return result


def _invalid_constant(_: str) -> None:
    raise _InvalidPayload("NON_STANDARD_JSON")


def _decode(value: object, bound: int) -> object:
    if type(value) is not str:
        raise _InvalidPayload("NON_STRING_WIRE")
    try:
        raw = value.encode("ascii")
    except UnicodeEncodeError:
        raise _InvalidPayload("NON_ASCII_WIRE") from None
    if len(raw) < 2 or len(raw) > bound or "\r" in value or "\n" in value:
        raise _InvalidPayload("WIRE_BOUND_OR_MULTILINE")
    try:
        return json.loads(
            value, object_pairs_hook=_unique_keys, parse_constant=_invalid_constant,
        )
    except (ValueError, TypeError, RecursionError):
        raise _InvalidPayload("INVALID_JSON") from None


def _canonical(value: dict[str, object]) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=True,
    ).encode("ascii")


def _verdict(decision: str, reason: str) -> dict[str, object]:
    return {
        "decision": decision,
        "reason": reason,
        "host_attested": False,
        "owner_authenticated": False,
        "execution_authorized": False,
        "remote_channel_established": False,
        "durable_replay_protection": False,
        "real_stop_installed": False,
    }


def review_offline_exchange(
    request_text: object,
    response_text: object,
    *,
    expected_head: object,
    expected_branch: object,
    sample_now: object,
    stop_requested: object = False,
) -> dict[str, object]:
    """Validate untrusted owner-carried synthetic request/response metadata.

    A matching ID is not proof of origin or single-use. sample_now is a
    *caller-provided fixture*, never an attested time source; matching hashes
    are content fingerprints, not signatures. No side effects are possible.
    """
    if type(stop_requested) is not bool:
        return _verdict("DENY", "STOP_FLAG_INVALID")
    if stop_requested:
        return _verdict("BLOCKED", "SIMULATED_STOP_NO_HOST_EFFECT")
    if (type(expected_head) is not str or _HEX40.fullmatch(expected_head) is None
            or type(expected_branch) is not str
            or _BRANCH.fullmatch(expected_branch) is None):
        return _verdict("DENY", "EXPECTED_SOURCE_PIN_REQUIRED")
    if type(sample_now) is not int or sample_now <= 0:
        return _verdict("DENY", "UNTRUSTED_SAMPLE_TIME_INVALID")

    try:
        request = _decode(request_text, MAX_REQUEST_BYTES)
        response = _decode(response_text, MAX_RESPONSE_BYTES)
    except _InvalidPayload:
        return _verdict("DENY", "INVALID_OFFLINE_WIRE")
    if (type(request) is not dict or frozenset(request) != _REQUEST_FIELDS
            or type(response) is not dict or frozenset(response) != _RESPONSE_FIELDS):
        return _verdict("DENY", "ENVELOPE_FIELDS_INVALID")
    if (request["schema"] != REQUEST_SCHEMA
            or request["target"] != TARGET
            or request["mode"] != MODE
            or request["branch"] != expected_branch
            or response["schema"] != RESPONSE_SCHEMA
            or response["target"] != TARGET
            or response["mode"] != MODE):
        return _verdict("DENY", "OFFLINE_SCOPE_MISMATCH")
    if (type(request["catalog_digest"]) is not str
            or request["catalog_digest"] != trust_boundary.catalog_digest()):
        return _verdict("DENY", "CANDIDATE_CATALOG_MISMATCH")
    if (type(request["issued_at"]) is not int
            or type(request["expires_at"]) is not int
            or not (0 < request["expires_at"] - request["issued_at"] <= MAX_WINDOW_SECONDS
                    and request["issued_at"] <= sample_now < request["expires_at"])):
        return _verdict("DENY", "SYNTHETIC_TIME_WINDOW_INVALID")

    plan = request["plan"]
    if type(plan) is not dict or frozenset(plan) != _PLAN_FIELDS:
        return _verdict("DENY", "PLAN_FIELDS_INVALID")
    if (plan["schema"] != policy.POLICY_SCHEMA
            or type(plan["operation"]) is not str
            or plan["operation"] not in policy.APPROVED_OPERATIONS
            or type(plan["commit"]) is not str
            or plan["commit"] != expected_head
            or type(plan["request_id"]) is not str
            or _ID.fullmatch(plan["request_id"]) is None
            or type(plan["args"]) is not dict or plan["args"]):
        return _verdict("DENY", "UNAPPROVED_PLAN")
    # AP-236 candidate catalog must remain consistent with the AP-233 IDs.
    if plan["operation"] not in {spec.operation_id for spec in trust_boundary.catalog()}:
        return _verdict("DENY", "UNREVIEWED_OPERATION")
    if (type(response["request_id"]) is not str
            or response["request_id"] != plan["request_id"]
            or type(response["operation"]) is not str
            or response["operation"] != plan["operation"]
            or type(response["commit"]) is not str
            or response["commit"] != plan["commit"]):
        return _verdict("DENY", "RESPONSE_CORRELATION_MISMATCH")
    if type(response["snapshot"]) is not dict:
        return _verdict("DENY", "SNAPSHOT_REQUIRED")
    try:
        copied_snapshot = _canonical(response["snapshot"]).decode("ascii")
    except (TypeError, ValueError, RecursionError, OverflowError):
        return _verdict("DENY", "INVALID_SNAPSHOT")
    review = handoff.review_owner_copied_snapshot(
        copied_snapshot, expected_head=expected_head, expected_branch=expected_branch,
    )
    if review["decision"] not in ("REVIEW_ONLY", "OWNER_ATTENTION"):
        return _verdict("DENY", "UNVERIFIED_SNAPSHOT_CONTENT")
    result = _verdict(
        "MATCHED_REVIEW_ONLY" if review["decision"] == "REVIEW_ONLY"
        else "OWNER_ATTENTION",
        "UNAUTHENTICATED_CORRELATION_ONLY",
    )
    result["request_sha256"] = hashlib.sha256(_canonical(request)).hexdigest()
    result["response_sha256"] = hashlib.sha256(_canonical(response)).hexdigest()
    result["reported_tracked_changes"] = review["tracked_changes"]
    result["untracked_files_scanned"] = False
    return result
