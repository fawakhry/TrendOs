"""AP-238 offline source-byte integrity check (READ-ONLY), not an agent.

This tool checks exactly five fixed code files and one fixed JSON manifest
inside its own source directory. No git commands, shell, network, agent,
configuration changes or customer-file inspection. Passing hashes do NOT
authenticate this script, the host, the owner or the OS sandbox.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import stat
import sys
from pathlib import Path
from types import MappingProxyType

SOURCE_ONLY = True
EXECUTOR_ENABLED = False
NETWORK_ENABLED = False
OWNER_AUTH_IMPLEMENTED = False
PHYSICAL_HOST_ATTESTED = False
MANIFEST_NAME = "AP238_SOURCE_MANIFEST.json"
SCHEMA = "trendos.offline-source-bundle.v1"
SOURCE_SNAPSHOT_COMMIT = "3ee1f5b0a01102f53b8f56a355921ea1808616ac"

# These constants are separately embedded; trusting an editable JSON file
# alone is not an integrity check. Still, editing checker + JSON together
# defeats the check: independent reviewed commit pin remains a future gate.
_EXPECTED = MappingProxyType({
    "authorization_contract.py": ("b0077bef2057fd413d64832c291bbcdcf9bd1463d89ff6a6f6212301eda02389", 6167),
    "offline_canary.py": ("6d755bfc60d06515f98f1e0c15cc41369f8e665e6e437080cf8589702b916071", 4453),
    "policy.py": ("fc2d9cc1f649f5ad777af6b43a1564f462548040f5e11aa6f6c50dfa51c473ef", 2855),
    "receipt_journal.py": ("8f8a7edef2276c424a62de0757e3152b4d13e80b994393b6152aa69795ddfba3", 6675),
    "trust_boundary.py": ("99ac29cdaf41eb3c167602d3de7864ba0a8a5350a2ec4268a70e8d086d92fc00", 5839),
})


class _UnsafeSource(ValueError):
    """Private denial; never include paths or user supplied text in output."""


def _unique_pairs(pairs: list[tuple[str, object]]) -> dict[str, object]:
    output = {}
    for key, value in pairs:
        if key in output:
            raise _UnsafeSource("DUPLICATE_JSON_FIELD")
        output[key] = value
    return output


def _fixed_regular_bytes(root: Path, name: str, bound: int) -> bytes:
    """Use O_NOFOLLOW and fstat to reject symlink files and nonregular files.

    The source-only fixture's *parent directory* is not a production secure
    mount or filesystem trust anchor; independent OS attestation is missing.
    """
    if name not in _EXPECTED and name != MANIFEST_NAME:
        raise _UnsafeSource("UNLISTED_FILE")
    flags = os.O_RDONLY | getattr(os, "O_CLOEXEC", 0)
    if not hasattr(os, "O_NOFOLLOW"):
        raise _UnsafeSource("NO_NOFOLLOW_SUPPORT")
    flags |= os.O_NOFOLLOW
    fd = None
    try:
        fd = os.open(root / name, flags)
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_size < 0 or info.st_size > bound:
            raise _UnsafeSource("INVALID_SOURCE_FILE_TYPE_OR_SIZE")
        with os.fdopen(fd, "rb", closefd=True) as stream:
            fd = None
            content = stream.read(bound + 1)
        if len(content) > bound or len(content) != info.st_size:
            raise _UnsafeSource("SOURCE_FILE_SIZE_CHANGED")
        return content
    except OSError:
        raise _UnsafeSource("SOURCE_FILE_UNAVAILABLE") from None
    finally:
        if fd is not None:
            os.close(fd)


def check_offline_sources(root: Path | None = None) -> dict[str, object]:
    """Review-only; optional root exists solely for disposable CI fixtures."""
    if root is None:
        root = Path(__file__).absolute().parent
    if not isinstance(root, Path) or not root.is_absolute():
        return {"decision": "BLOCKED", "reason": "UNTRUSTED_BUNDLE_DIRECTORY"}
    try:
        if root.is_symlink() or not root.is_dir():
            raise _UnsafeSource("UNTRUSTED_BUNDLE_DIRECTORY")
        raw = _fixed_regular_bytes(root, MANIFEST_NAME, 8192)
        try:
            manifest = json.loads(raw.decode("utf-8"), object_pairs_hook=_unique_pairs)
        except (ValueError, UnicodeError, TypeError):
            raise _UnsafeSource("INVALID_MANIFEST") from None
        expected_manifest = {
            "schema": SCHEMA,
            "source_snapshot_commit": SOURCE_SNAPSHOT_COMMIT,
            "entries": {
                key: {"sha256": val[0], "bytes": val[1]} for key, val in _EXPECTED.items()
            },
        }
        if manifest != expected_manifest:
            raise _UnsafeSource("MANIFEST_MISMATCH")
        if any(
            type(manifest["entries"][name]["bytes"]) is not int
            or type(manifest["entries"][name]["sha256"]) is not str
            for name in _EXPECTED
        ):
            raise _UnsafeSource("MANIFEST_FIELD_TYPES_INVALID")
        for name, (digest, expected_bytes) in _EXPECTED.items():
            content = _fixed_regular_bytes(root, name, 100_000)
            if len(content) != expected_bytes:
                raise _UnsafeSource("SOURCE_SIZE_MISMATCH")
            if not hmac.compare_digest(hashlib.sha256(content).hexdigest(), digest):
                raise _UnsafeSource("SOURCE_SHA256_MISMATCH")
    except (_UnsafeSource, OSError) as err:
        return {"decision": "BLOCKED", "reason": str(err) if isinstance(err, _UnsafeSource)
                else "SOURCE_FILE_UNAVAILABLE"}
    return {
        "decision": "SOURCE_HASHES_MATCH_ONLY",
        "source_files": len(_EXPECTED),
        "host_attested": False,
        "execution_authorized": False,
    }


if __name__ == "__main__":
    # No file/directory parameters accepted in owner CLI; self-check only.
    if len(sys.argv) != 1:
        print("AP238_SOURCE_INTEGRITY=BLOCKED; HOST_ATTESTED=NO; EXECUTOR=OFF")
        raise SystemExit(2)
    result = check_offline_sources()
    if result["decision"] != "SOURCE_HASHES_MATCH_ONLY":
        print("AP238_SOURCE_INTEGRITY=BLOCKED; HOST_ATTESTED=NO; EXECUTOR=OFF")
        raise SystemExit(2)
    print("AP238_SOURCE_INTEGRITY=SOURCE_HASHES_MATCH_ONLY; HOST_ATTESTED=NO; EXECUTOR=OFF")
