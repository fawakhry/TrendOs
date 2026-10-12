"""AP-257: owner-readable, private diagnostic receipt for the synthetic demo.

No network, browser automation, production reads, background service, credentials,
or prints. Keep ONLY latest synthetic session status under the existing owner-only
XDG_RUNTIME_DIR. PENDING is never treated as proof of a clean shutdown.
"""
from __future__ import annotations

import json
import math
import os
import stat
import uuid
from datetime import datetime, timezone
from pathlib import Path

_RECEIPT_NAME = "trendos-ap257-last-offline-result.json"
_MAX_BYTES = 4096


def receipt_path(control_socket: Path) -> Path:
    """Use the same owner runtime directory already checked by AP-252."""
    parent = control_socket.parent
    if not parent.is_absolute() or parent.is_symlink():
        raise RuntimeError("AP257_UNSAFE_RUNTIME_PATH")
    metadata = parent.stat()
    if (not stat.S_ISDIR(metadata.st_mode)
            or metadata.st_uid != os.getuid()
            or stat.S_IMODE(metadata.st_mode) & 0o077):
        raise RuntimeError("AP257_PRIVATE_RUNTIME_DIR_REQUIRED")
    if parent.resolve(strict=True) != parent:
        raise RuntimeError("AP257_UNSAFE_RUNTIME_PATH")
    return parent / _RECEIPT_NAME


def _require_regular_owner_only(path: Path) -> None:
    try:
        metadata = path.lstat()
    except FileNotFoundError:
        return
    if (not stat.S_ISREG(metadata.st_mode)
            or metadata.st_uid != os.getuid()
            or stat.S_IMODE(metadata.st_mode) != 0o600):
        raise RuntimeError("AP257_EXISTING_RECEIPT_UNSAFE_NO_OVERWRITE")


def _atomic_write(control_socket: Path, data: dict) -> None:
    target = receipt_path(control_socket)
    _require_regular_owner_only(target)
    payload = (json.dumps(data, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")
    if len(payload) > _MAX_BYTES:
        raise RuntimeError("AP257_RECEIPT_TOO_LARGE")
    temporary = target.parent / (".trendos-ap257-" + uuid.uuid4().hex)
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    fd = os.open(temporary, flags, 0o600)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(payload)
            stream.flush()
            os.fchmod(stream.fileno(), 0o600)
            os.fsync(stream.fileno())
        _require_regular_owner_only(target)
        os.replace(temporary, target)
    finally:
        try:
            temporary.unlink()
        except FileNotFoundError:
            pass


def start(control_socket: Path, session_id: str) -> None:
    """Invalidate any previous STOPPED receipt before a new demo can start."""
    if len(session_id) != 32 or any(c not in "0123456789abcdef" for c in session_id):
        raise ValueError("AP257_SESSION_ID_INVALID")
    _atomic_write(control_socket, {
        "schema": 1,
        "mode": "OFFLINE_GET_ONLY_75S",
        "session_id": session_id,
        "state": "PENDING",
        "reason": None,
        "elapsed_seconds": None,
        "http_stopped": False,
        "temp_cleaned": False,
        "recorded_utc": datetime.now(timezone.utc).isoformat(),
    })


def finish(control_socket: Path, session_id: str, reason: str, elapsed: float) -> None:
    """Write STOPPED only after HTTP shutdown and temp context have returned."""
    if reason not in ("OWNER_STOP", "TIMEOUT"):
        raise ValueError("AP257_REASON_INVALID")
    if not math.isfinite(elapsed) or elapsed < 0 or elapsed > 300:
        raise ValueError("AP257_ELAPSED_INVALID")
    current = read(control_socket)
    if (current is None or current["state"] != "PENDING"
            or current["session_id"] != session_id):
        raise RuntimeError("AP257_SESSION_RECEIPT_MISMATCH")
    _atomic_write(control_socket, {
        "schema": 1,
        "mode": "OFFLINE_GET_ONLY_75S",
        "session_id": session_id,
        "state": "STOPPED",
        "reason": reason,
        "elapsed_seconds": round(elapsed, 3),
        "http_stopped": True,
        "temp_cleaned": True,
        "recorded_utc": datetime.now(timezone.utc).isoformat(),
    })


def read(control_socket: Path) -> dict | None:
    """Reject forged-format, oversized, symlinked, or group-readable files."""
    target = receipt_path(control_socket)
    flags = os.O_RDONLY
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    try:
        fd = os.open(target, flags)
    except FileNotFoundError:
        return None
    except OSError as exc:
        raise RuntimeError("AP257_RECEIPT_OPEN_FAILED") from exc
    with os.fdopen(fd, "rb") as stream:
        metadata = os.fstat(stream.fileno())
        if (not stat.S_ISREG(metadata.st_mode)
                or metadata.st_uid != os.getuid()
                or stat.S_IMODE(metadata.st_mode) != 0o600):
            raise RuntimeError("AP257_RECEIPT_NOT_PRIVATE")
        raw = stream.read(_MAX_BYTES + 1)
    if len(raw) > _MAX_BYTES:
        raise RuntimeError("AP257_RECEIPT_TOO_LARGE")
    try:
        item = json.loads(raw)
    except (ValueError, UnicodeDecodeError) as exc:
        raise RuntimeError("AP257_RECEIPT_CORRUPT") from exc
    if not isinstance(item, dict):
        raise RuntimeError("AP257_RECEIPT_CORRUPT")
    if (item.get("schema") != 1
            or item.get("mode") != "OFFLINE_GET_ONLY_75S"
            or not isinstance(item.get("session_id"), str)
            or len(item["session_id"]) != 32
            or any(c not in "0123456789abcdef" for c in item["session_id"])
            or not isinstance(item.get("recorded_utc"), str)):
        raise RuntimeError("AP257_RECEIPT_SCHEMA_INVALID")
    state = item.get("state")
    if state == "PENDING":
        if (item.get("reason") is not None
                or item.get("elapsed_seconds") is not None
                or item.get("http_stopped") is not False
                or item.get("temp_cleaned") is not False):
            raise RuntimeError("AP257_PENDING_SCHEMA_INVALID")
    elif state == "STOPPED":
        elapsed = item.get("elapsed_seconds")
        if (item.get("reason") not in ("OWNER_STOP", "TIMEOUT")
                or type(elapsed) not in (float, int)
                or not math.isfinite(elapsed)
                or not 0 <= elapsed <= 300
                or item.get("http_stopped") is not True
                or item.get("temp_cleaned") is not True):
            raise RuntimeError("AP257_STOPPED_SCHEMA_INVALID")
    else:
        raise RuntimeError("AP257_STATE_INVALID")
    return item


def display(control_socket: Path) -> bool:
    """Read-only owner-facing CLI receipt; no attempt to relaunch anything."""
    item = read(control_socket)
    if item is None:
        print("AP257_RECEIPT=NOT_FOUND; EARLY_STOP_UNVERIFIED=YES", flush=True)
        return False
    if item["state"] != "STOPPED":
        print("AP257_RECEIPT=PENDING_OR_INTERRUPTED; EARLY_STOP_UNVERIFIED=YES", flush=True)
        return False
    print(
        f"AP257_RECEIPT=STOPPED; REASON={item['reason']}; "
        f"ELAPSED_SECONDS={item['elapsed_seconds']:.3f}; "
        "HTTP_STOPPED=YES; TEMP_CLEANED=YES; "
        f"SESSION={item['session_id']}; AT_UTC={item['recorded_utc']}",
        flush=True,
    )
    return True
