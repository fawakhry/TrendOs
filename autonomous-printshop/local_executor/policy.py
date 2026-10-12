"""AP-233 source-only local diagnostic policy. NO host executor is implemented.

Never import this module as evidence that a network connection or a host job exists.
The function evaluates synthetic job metadata; it cannot execute an operation.
"""
from __future__ import annotations

import re

POLICY_SCHEMA = "trendos.local-diagnostic.plan.v1"
EXECUTION_ENABLED = False
NETWORK_LISTENER_ENABLED = False
SHELL_EXECUTION_ENABLED = False
APPROVED_OPERATIONS = frozenset(("python_version", "git_head", "git_status"))
_REQUEST_FIELDS = frozenset(("schema", "operation", "commit", "request_id", "args"))
_SHA40 = re.compile(r"[0-9a-f]{40}\Z", re.ASCII)
_REQUEST_ID = re.compile(r"[A-Za-z0-9_-]{12,64}\Z", re.ASCII)


def _deny(reason: str) -> dict[str, str]:
    """Return a non-sensitive verdict, never echo caller-provided data."""
    return {"decision": "DENY", "reason": reason}


def qualify_plan(
    request: object,
    *,
    owner_gate: bool = False,
    non_root: bool = False,
    isolated: bool = False,
    pinned_commit: str | None = None,
) -> dict[str, str]:
    """Classify a candidate for OFFLINE REVIEW ONLY; NEVER execute it.

    Gate booleans are synthetic assertions, NOT trusted attestations. An actual
    host agent will need independently verified identity, signed requests,
    replay protection, isolated filesystem, and explicit owner approval.
    """
    if type(request) is not dict or frozenset(request) != _REQUEST_FIELDS:
        return _deny("INVALID_ENVELOPE")
    schema, operation = request["schema"], request["operation"]
    commit, request_id, args = (
        request["commit"], request["request_id"], request["args"]
    )
    if not all(type(v) is str for v in (schema, operation, commit, request_id)):
        return _deny("INVALID_TYPES")
    if type(args) is not dict or args:
        return _deny("ARGUMENTS_FORBIDDEN")
    if schema != POLICY_SCHEMA:
        return _deny("UNKNOWN_SCHEMA")
    if operation not in APPROVED_OPERATIONS:
        return _deny("OPERATION_NOT_ALLOWED")
    if not _SHA40.fullmatch(commit) or not _REQUEST_ID.fullmatch(request_id):
        return _deny("INVALID_IDENTIFIERS")
    if type(owner_gate) is not bool or owner_gate is not True:
        return _deny("OWNER_GATE_OFF")
    if type(non_root) is not bool or non_root is not True:
        return _deny("NON_ROOT_NOT_VERIFIED")
    if type(isolated) is not bool or isolated is not True:
        return _deny("ISOLATION_NOT_VERIFIED")
    if (
        type(pinned_commit) is not str
        or not _SHA40.fullmatch(pinned_commit)
        or pinned_commit != commit
    ):
        return _deny("COMMIT_PIN_MISMATCH")
    # Deliberately no subprocess, filesystem write, shell, network or service.
    return {
        "decision": "PLAN_ONLY",
        "reason": "NO_EXECUTOR_IMPLEMENTED",
        "operation": operation,
    }
