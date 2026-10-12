"""AP-236 non-executable immutable diagnostics catalog and trust-boundary gate.

SOURCE-ONLY. This module intentionally has no launcher, filesystem access,
network transport, credential handling, approval service or OS integration.
Do not interpret a review receipt as permission to execute anything.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from hashlib import sha256
import json
import re
from types import MappingProxyType

POLICY_SCHEMA = "trendos.local-diagnostic.plan.v1"
EXECUTION_ENABLED = False
NETWORK_ENABLED = False
COMMAND_DISPATCH_IMPLEMENTED = False
REAL_TRUST_CHAIN_IMPLEMENTED = False
OS_SANDBOX_IMPLEMENTED = False
AUDIT_CHAIN_IMPLEMENTED = False

_COMMIT_RE = re.compile(r"[a-f0-9]{40}\Z", re.ASCII)
_REQUEST_ID_RE = re.compile(r"[A-Za-z0-9_-]{12,64}\Z", re.ASCII)
_DIGEST_RE = re.compile(r"[a-f0-9]{64}\Z", re.ASCII)


@dataclass(frozen=True, slots=True)
class DiagnosticSpec:
    operation_id: str
    purpose: str
    source_scope: str
    output_class: str
    network_access: bool
    write_access: bool
    privileged: bool
    shell: bool
    max_runtime_seconds: int
    max_output_bytes: int


# Abstract descriptions only. NO shell command, executable path, or cwd is
# stored here. Future execution needs a separately audited fixed implementation.
_CATALOG = MappingProxyType({
    "python_version": DiagnosticSpec(
        "python_version", "Observe Python interpreter version",
        "local_runtime_metadata", "bounded_version", False, False,
        False, False, 5, 128
    ),
    "git_head": DiagnosticSpec(
        "git_head", "Observe local repository HEAD commit",
        "checked_out_repo_metadata", "single_hex40", False, False,
        False, False, 5, 128
    ),
    "git_status": DiagnosticSpec(
        "git_status", "Observe local repository branch and worktree status",
        "checked_out_repo_metadata", "redacted_bounded_status", False,
        False, False, False, 5, 1024
    ),
})

# These are unresolved independent trust gates. Caller-supplied booleans,
# synthetic HMAC test keys and fake receipts MUST NOT clear any of these.
UNVERIFIED_GATES = (
    "independent_owner_authentication",
    "device_identity_and_key_revocation",
    "tamper_aware_consume_once_audit",
    "rootless_host_sandbox_attestation",
    "reviewed_immutable_command_implementations",
    "approved_outbound_only_transport",
    "owner_approved_runtime_pilot",
)


def catalog() -> tuple[DiagnosticSpec, ...]:
    """Return immutable abstract specs in stable order, not command objects."""
    return tuple(_CATALOG[k] for k in sorted(_CATALOG))


def catalog_digest() -> str:
    """Static source review identifier, NOT a code signature or authorization."""
    data = [asdict(s) for s in catalog()]
    encoded = json.dumps(
        data, sort_keys=True, separators=(",", ":"), ensure_ascii=True
    ).encode("ascii")
    return sha256(encoded).hexdigest()


def _deny(reason: str) -> dict[str, str]:
    return {"decision": "DENY", "reason": reason}


def evaluate_review_handoff(
    plan: object,
    signed_review_verdict: object,
    recorded_review_verdict: object,
    *,
    expected_commit: str | None = None,
    expected_catalog_digest: str | None = None,
) -> dict[str, object]:
    """Classify caller-supplied AP-233/234/235 *models* for SOURCE REVIEW ONLY.

    No payload is a trusted attestation. Even apparently perfect inputs MUST
    return BLOCKED and NEVER EXECUTE/ALLOW/RUN.
    """
    if type(plan) is not dict or frozenset(plan) != frozenset((
        "schema", "operation", "commit", "request_id", "args"
    )):
        return _deny("INVALID_PLAN")
    if type(signed_review_verdict) is not dict or frozenset(signed_review_verdict) != frozenset((
        "decision", "reason", "replay_token"
    )):
        return _deny("INVALID_REVIEW_RECEIPT")
    if type(recorded_review_verdict) is not dict or frozenset(recorded_review_verdict) != frozenset((
        "decision", "reason"
    )):
        return _deny("INVALID_JOURNAL_RECEIPT")
    if (
        type(plan["schema"]) is not str
        or type(plan["operation"]) is not str
        or type(plan["commit"]) is not str
        or type(plan["request_id"]) is not str
        or type(plan["args"]) is not dict
        or plan["args"]
        or plan["schema"] != POLICY_SCHEMA
        or plan["operation"] not in _CATALOG
        or _COMMIT_RE.fullmatch(plan["commit"]) is None
        or _REQUEST_ID_RE.fullmatch(plan["request_id"]) is None
    ):
        return _deny("PLAN_SCOPE_INVALID")
    if (
        type(expected_commit) is not str
        or expected_commit != plan["commit"]
        or type(expected_catalog_digest) is not str
        or _DIGEST_RE.fullmatch(expected_catalog_digest) is None
        or expected_catalog_digest != catalog_digest()
    ):
        return _deny("INDEPENDENT_PIN_UNVERIFIED")
    if (
        signed_review_verdict["decision"] != "REVIEW_ONLY"
        or signed_review_verdict["reason"] != "NO_EXECUTOR_OR_DURABLE_REPLAY_STORE"
        or type(signed_review_verdict["replay_token"]) is not str
        or _DIGEST_RE.fullmatch(signed_review_verdict["replay_token"]) is None
    ):
        return _deny("REVIEW_NOT_AUTHORITATIVE")
    if (
        recorded_review_verdict["decision"] != "RECORDED_REVIEW_ONLY"
        or recorded_review_verdict["reason"] != "NO_EXECUTOR_OR_REAL_AUTH"
    ):
        return _deny("JOURNAL_NOT_AUTHORITATIVE")
    # AP-235's two-field verdict is NOT cryptographically bound to this
    # request; this chain is therefore not a real authorization protocol.
    return {
        "decision": "BLOCKED",
        "reason": "INDEPENDENT_TRUST_AND_SANDBOX_NOT_IMPLEMENTED",
        "candidate_operation": plan["operation"],
        "catalog_digest": catalog_digest(),
        "unverified_gates": UNVERIFIED_GATES,
    }
