"""AP-263: validate owner-copied AP-260 snapshot text for OFFLINE REVIEW ONLY.

No IO, network, OS commands, credentials, CLI, host agent or authorization.
An owner-copied JSON snapshot is UNAUTHENTICATED and is NOT device attestation.
"""
from __future__ import annotations

import hashlib
import json
import re

HANDOFF_SCHEMA = "trendos.ap260.owner-local-snapshot.v1"
TRANSPORT_ENABLED = False
HOST_EXECUTION_ENABLED = False
DEVICE_ATTESTATION_IMPLEMENTED = False
OWNER_AUTHENTICATION_IMPLEMENTED = False
REPLAY_STORE_IMPLEMENTED = False
MAX_SNAPSHOT_BYTES = 1024

_FIELDS = frozenset((
    "schema", "execution", "remote_executor", "python_version",
    "git_head", "git_branch", "tracked_changes", "untracked_files",
    "production",
))
_HEX40 = re.compile(r"[0-9a-f]{40}\Z", re.ASCII)
_BRANCH = re.compile(r"[A-Za-z0-9._/-]{1,128}\Z", re.ASCII)
_VERSION = re.compile(r"3\.[0-9]{1,2}\.[0-9]{1,3}\Z", re.ASCII)


class _Rejected(ValueError):
    pass


def _no_duplicate_fields(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise _Rejected("DUPLICATE_FIELD")
        result[key] = value
    return result


def _invalid_constant(_: str) -> None:
    raise _Rejected("NON_STANDARD_JSON")


def _deny(reason: str) -> dict[str, object]:
    # Do not echo arbitrary caller text, paths, tokens, or JSON contents.
    return {
        "decision": "DENY",
        "reason": reason,
        "host_attested": False,
        "execution_authorized": False,
        "remote_channel_established": False,
    }


def review_owner_copied_snapshot(
    snapshot_text: object,
    *,
    expected_head: object,
    expected_branch: object,
) -> dict[str, object]:
    """Review strictly bounded AP-260 text with independently reviewed pins.

    All inputs are copied/provided by a caller: even a successful review is
    NOT cryptographic verification of an owner, host or an original terminal.
    The digest is a content fingerprint, NOT a MAC, signature or replay guard.
    Never return authority to execute a command.
    """
    if (type(expected_head) is not str
            or _HEX40.fullmatch(expected_head) is None
            or type(expected_branch) is not str
            or _BRANCH.fullmatch(expected_branch) is None):
        return _deny("EXPECTED_PINS_REQUIRED")
    if type(snapshot_text) is not str:
        return _deny("SNAPSHOT_TEXT_REQUIRED")
    try:
        raw = snapshot_text.encode("ascii")
    except UnicodeEncodeError:
        return _deny("NON_ASCII_INPUT")
    if not (2 <= len(raw) <= MAX_SNAPSHOT_BYTES):
        return _deny("SNAPSHOT_SIZE_INVALID")
    if "\r" in snapshot_text or "\n" in snapshot_text:
        return _deny("MULTILINE_INPUT_FORBIDDEN")
    try:
        value = json.loads(
            snapshot_text, object_pairs_hook=_no_duplicate_fields,
            parse_constant=_invalid_constant,
        )
    except (ValueError, TypeError, RecursionError):
        return _deny("INVALID_OR_DUPLICATE_JSON")
    if type(value) is not dict or frozenset(value) != _FIELDS:
        return _deny("UNEXPECTED_FIELDS")
    if any(type(value[key]) is not str for key in _FIELDS):
        return _deny("INVALID_FIELD_TYPES")
    if (value["schema"] != HANDOFF_SCHEMA
            or value["execution"] != "OWNER_LOCAL_READ_ONLY"
            or value["remote_executor"] != "NOT_ESTABLISHED"
            or value["production"] != "NOT_ACCESSED"
            or value["untracked_files"] != "NOT_SCANNED"):
        return _deny("UNEXPECTED_SOURCE_FLAGS")
    if (_VERSION.fullmatch(value["python_version"]) is None
            or _HEX40.fullmatch(value["git_head"]) is None
            or _BRANCH.fullmatch(value["git_branch"]) is None
            or value["tracked_changes"] not in ("YES", "NO")):
        return _deny("INVALID_METADATA")
    if value["git_head"] != expected_head or value["git_branch"] != expected_branch:
        return _deny("COMMIT_OR_BRANCH_PIN_MISMATCH")

    canonical = json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=True,
    ).encode("ascii")
    return {
        "decision": "REVIEW_ONLY" if value["tracked_changes"] == "NO"
                    else "OWNER_ATTENTION",
        "reason": "REPORTED_TRACKED_CLEAN_UNVERIFIED"
                  if value["tracked_changes"] == "NO"
                  else "REPORTED_TRACKED_DIRTY_UNVERIFIED",
        "snapshot_sha256": hashlib.sha256(canonical).hexdigest(),
        "python_version": value["python_version"],
        "tracked_changes": value["tracked_changes"],
        "untracked_files_scanned": False,
        "host_attested": False,
        "execution_authorized": False,
        "remote_channel_established": False,
    }
