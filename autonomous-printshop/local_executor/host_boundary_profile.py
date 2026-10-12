"""AP-265 static offline pilot boundary review; NEVER configures an OS sandbox.

Pure stdlib validator of a source-only SAFETY SPECIFICATION, not a launcher,
device identity, owner approval, service, network access or host attestation.
Every outcome DENIES or BLOCKS actual execution, even a matching profile.
"""
from __future__ import annotations

import hashlib
import json

import policy
import trust_boundary

SCHEMA = "trendos.ap265.offline-host-boundary-profile.v1"
MAX_INPUT_BYTES = 4096
EXECUTOR_ENABLED = False
TRANSPORT_ENABLED = False
SANDBOX_INSTALLED = False
OWNER_CONSENT_GRANTED = False
REAL_STOP_ENABLED = False
LIVE_IDENTITY_ESTABLISHED = False

_FIXED_OPERATIONS = ("git_head", "git_status", "python_version")

# Reviewable target specification ONLY. None of the strings create a host
# filesystem namespace, account, group constraint, network filter or service.
REQUIRED_PROFILE = {
    "schema": SCHEMA,
    "target": "TrendosShop",
    "scope": "HOME_UBUNTU_OFFLINE_SYNTHETIC",
    "deployment": "NOT_INSTALLED",
    "transport": "OFF",
    "approval": "NOT_GRANTED",
    "operation_catalog": "AP236_REVIEW_ONLY",
    "operations": list(_FIXED_OPERATIONS),
    "isolation": {
        "identity": "DEDICATED_NON_ROOT_REQUIRED",
        "sudo": "FORBIDDEN",
        "shell": "FORBIDDEN",
        "host_home_access": "DENIED",
        "source_view": "SEPARATE_PINNED_READONLY_VIEW_REQUIRED",
        "customer_and_win7_mounts": "FORBIDDEN",
        "printer_access": "FORBIDDEN",
        "financial_data": "FORBIDDEN",
        "host_secrets": "FORBIDDEN",
        "external_network": "OFFLINE_NO_EGRESS",
        "inbound_network": "FORBIDDEN",
        "filesystem_writes": "PRIVATE_BOUNDED_AUDIT_ONLY_FUTURE",
        "resource_caps": "CPU_MEMORY_PIDS_TIME_REQUIRED",
    },
    "trust": {
        "device_identity": "NOT_IMPLEMENTED",
        "independent_owner_auth": "NOT_IMPLEMENTED",
        "durable_replay_guard": "NOT_IMPLEMENTED",
        "tamper_aware_audit": "NOT_IMPLEMENTED",
        "attested_os_sandbox": "NOT_IMPLEMENTED",
        "immutable_code_provenance": "NOT_IMPLEMENTED",
    },
    "control": {
        "real_external_stop": "NOT_IMPLEMENTED",
        "automatic_restart": "FORBIDDEN",
        "pilot_operation": "NOT_AUTHORIZED",
        "test_data": "SYNTHETIC_ONLY",
    },
}


class _Invalid(Exception):
    pass


def _unique_pairs(items: list[tuple[str, object]]) -> dict[str, object]:
    output: dict[str, object] = {}
    for key, value in items:
        if key in output:
            raise _Invalid("DUPLICATE_JSON_KEY")
        output[key] = value
    return output


def _reject_constant(_: str) -> None:
    raise _Invalid("NONSTANDARD_JSON_CONSTANT")


def _result(decision: str, reason: str) -> dict[str, object]:
    return {
        "decision": decision,
        "reason": reason,
        "host_attested": False,
        "owner_authenticated": False,
        "execution_authorized": False,
        "remote_channel_established": False,
        "sandbox_installed": False,
        "real_stop_installed": False,
    }


def review_host_boundary_profile(raw_json: object) -> dict[str, object]:
    """Review a narrow spec; NEVER assert that its claims are deployed.

    Caller-provided JSON is untrusted; matching values cannot confirm a real
    OS state, owner identity, signature, permission, or security enforcement.
    """
    if type(raw_json) is not str:
        return _result("DENY", "PROFILE_TEXT_REQUIRED")
    try:
        source = raw_json.encode("ascii")
    except UnicodeEncodeError:
        return _result("DENY", "NON_ASCII_PROFILE")
    if not (2 <= len(source) <= MAX_INPUT_BYTES) or "\n" in raw_json or "\r" in raw_json:
        return _result("DENY", "PROFILE_SIZE_OR_FORMAT_INVALID")
    try:
        data = json.loads(
            raw_json, object_pairs_hook=_unique_pairs,
            parse_constant=_reject_constant,
        )
    except (ValueError, TypeError, RecursionError, _Invalid):
        return _result("DENY", "INVALID_OR_DUPLICATE_JSON")
    if type(data) is not dict or data != REQUIRED_PROFILE:
        return _result("DENY", "PROFILE_NOT_REVIEWED_EXACTLY")

    # Both older source contracts must remain *exactly* the original three
    # candidate names; their IDs are descriptors, NEVER executable commands.
    if (tuple(sorted(policy.APPROVED_OPERATIONS)) != _FIXED_OPERATIONS
            or tuple(spec.operation_id for spec in trust_boundary.catalog())
            != _FIXED_OPERATIONS):
        return _result("DENY", "AP233_AP236_CATALOG_DRIFT")

    canonical = json.dumps(
        data, sort_keys=True, separators=(",", ":"), ensure_ascii=True,
    ).encode("ascii")
    result = _result("BLOCKED", "SPEC_MATCH_ONLY_REAL_HOST_GATES_MISSING")
    result["spec_sha256"] = hashlib.sha256(canonical).hexdigest()
    result["catalog_digest"] = trust_boundary.catalog_digest()
    result["unverified_gates"] = trust_boundary.UNVERIFIED_GATES
    return result
