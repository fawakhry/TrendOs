"""AP-237 offline canary and emergency-stop *SPECIFICATION*, not a daemon.

No filesystem/network/process operations. A STOP verdict cannot stop a real
service: it changes only a hypothetical state in synthetic unit tests.
"""
from __future__ import annotations

from dataclasses import dataclass
from types import MappingProxyType

EXECUTOR_ENABLED = False
TRANSPORT_ENABLED = False
SERVICE_INSTALLED = False
HOST_ATTESTATION_IMPLEMENTED = False
PERSISTENT_STOP_LATCH_IMPLEMENTED = False
LIVE_CREDENTIALS_CONFIGURED = False

SOURCE_SCHEMA = "trendos.offline-canary.review.v1"

# Exact AP-236 security blockers; additional preflight blockers are explicit.
REQUIRED_EVIDENCE = (
    "independent_owner_authentication",
    "device_identity_and_key_revocation",
    "tamper_aware_consume_once_audit",
    "rootless_host_sandbox_attestation",
    "reviewed_immutable_command_implementations",
    "approved_outbound_only_transport",
    "owner_approved_runtime_pilot",
    "output_redaction_and_bounded_receipts",
    "physical_ubuntu_host_identity_check",
    "owner_operated_stop_and_rollback_test",
)
_AUDITABLE_EVENTS = frozenset(("OFFLINE_REVIEW", "EMERGENCY_STOP"))
_ALLOWED_STATES = frozenset(("SPEC_OFF", "SPEC_REVIEW_BLOCKED", "SPEC_STOP_LATCHED"))


@dataclass(frozen=True, slots=True)
class ReviewSummary:
    decision: str
    reason: str
    review_state: str
    missing_evidence: tuple[str, ...]
    host_effect: str = "NONE"


def _blocked(reason: str, state: str, missing: tuple[str, ...] = ()) -> ReviewSummary:
    return ReviewSummary("BLOCKED", reason, state, missing)


def _deny(reason: str) -> ReviewSummary:
    return ReviewSummary("DENY", reason, "SPEC_OFF", ())


def assess_offline_canary(
    state: object = "SPEC_OFF",
    event: object = None,
    evidence: object = None,
) -> ReviewSummary:
    """Pure gate model: never returns RUN, ENABLED, READY, or host authority.

    Evidence is a synthetic dictionary of *claims*, not signed OS attestation.
    Any absent, false, malformed, or untrusted claim stays blocked.
    """
    if type(state) is not str or state not in _ALLOWED_STATES:
        return _deny("UNKNOWN_STATE_FAIL_CLOSED")
    if type(event) is not str or event not in _AUDITABLE_EVENTS:
        return _blocked("UNKNOWN_EVENT_FAIL_CLOSED", state)
    # Safety STOP needs no synthetic evidence. Real effects are NOT implemented.
    if event == "EMERGENCY_STOP":
        return _blocked("SPEC_STOP_ONLY_NO_HOST_EFFECT", "SPEC_STOP_LATCHED")
    # A model STOP is sticky: no resume/rearm method exists in this source.
    if state == "SPEC_STOP_LATCHED":
        return _blocked("STOP_LATCH_REQUIRES_OWNER_RESET_NOT_IMPLEMENTED",
                        "SPEC_STOP_LATCHED")
    if type(evidence) is not dict or frozenset(evidence) != frozenset(REQUIRED_EVIDENCE):
        return _blocked("MISSING_OR_EXTRA_CLAIMS", "SPEC_OFF")
    if any(type(evidence[key]) is not bool for key in REQUIRED_EVIDENCE):
        return _blocked("INVALID_EVIDENCE_TYPES", "SPEC_OFF")
    missing = tuple(name for name in REQUIRED_EVIDENCE if evidence[name] is False)
    if missing:
        return _blocked("INCOMPLETE_SYNTHETIC_READINESS", "SPEC_REVIEW_BLOCKED", missing)
    # Even an all-true fixture CANNOT be interpreted as host attestation.
    return _blocked("ALL_CLAIMS_UNVERIFIED_AND_NO_RUNTIME", "SPEC_REVIEW_BLOCKED")


def required_gate_descriptions() -> MappingProxyType:
    """Immutable static map for offline owner review (not verified claims)."""
    return MappingProxyType({
        "independent_owner_authentication": "External owner proof, scoped consent and revocation",
        "device_identity_and_key_revocation": "Host key provenance, expiry and rotation",
        "tamper_aware_consume_once_audit": "Durable replay-resistant audit / recovery",
        "rootless_host_sandbox_attestation": "Dedicated non-root OS isolation; no customer mounts",
        "reviewed_immutable_command_implementations": "Fixed reviewed diagnostics only",
        "approved_outbound_only_transport": "Owner-approved authenticated outbound link",
        "owner_approved_runtime_pilot": "Explicit separate owner approval before any install",
        "output_redaction_and_bounded_receipts": "Safe output and confidential receipt policy",
        "physical_ubuntu_host_identity_check": "Home iMac vs shop LAN verified by owner",
        "owner_operated_stop_and_rollback_test": "External hard OFF/stop/restart test",
    })
