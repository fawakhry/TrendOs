"""AP-260: opt-in, non-networked owner-local read-only metadata snapshot.

This is NOT an agent, remote transport, arbitrary command executor, runtime
installer or owner authorization mechanism. Do not run it on Ubuntu without
separate explicit permission. Reports tracked Git state ONLY; never claims to
audit untracked files, real customers, printers, secrets or OS services.
"""
from __future__ import annotations

import json
import os
import re
import stat
import subprocess
import sys
from pathlib import Path

EXPECTED_RELATIVE = ("TrendOs", "autonomous-printshop", "local_executor", "offline_snapshot.py")
GIT_BINARY = "/usr/bin/git"
_SHA40 = re.compile(r"[0-9a-f]{40}\Z", re.ASCII)
_BRANCH = re.compile(r"[a-zA-Z0-9._/-]{1,128}\Z", re.ASCII)
_GIT_BASE = (
    GIT_BINARY, "--no-optional-locks",
    "-c", "core.fsmonitor=false",
    "-c", "core.untrackedCache=false",
    "-c", "core.hooksPath=/dev/null",
    "-c", "diff.external=",
    "-c", "submodule.recurse=false",
)
_GIT_ENV = {
    "PATH": "/usr/bin:/bin",
    "LC_ALL": "C",
    "LANG": "C",
    "GIT_CONFIG_NOSYSTEM": "1",
    "GIT_CONFIG_GLOBAL": "/dev/null",
    "GIT_CONFIG_SYSTEM": "/dev/null",
    "GIT_OPTIONAL_LOCKS": "0",
    "GIT_TERMINAL_PROMPT": "0",
    "GIT_NO_REPLACE_OBJECTS": "1",
    "GIT_ATTR_NOSYSTEM": "1",
}
_TIMEOUT_SECONDS = 4
_MAX_OUTPUT = 256


class ProbeDenied(Exception):
    """Expected fail-closed error with a static, non-sensitive reason."""


def _deny(reason: str) -> None:
    raise ProbeDenied(reason)


def _validate_home_and_code(home: Path, source: Path) -> Path:
    if os.geteuid() == 0:
        _deny("ROOT_NOT_ALLOWED")
    if not home.is_absolute() or home.is_symlink():
        _deny("UNSAFE_HOME")
    try:
        homestat = home.stat()
        if (not stat.S_ISDIR(homestat.st_mode)
                or homestat.st_uid != os.geteuid()
                or home.resolve(strict=True) != home):
            _deny("UNSAFE_HOME")
        root = home / "TrendOs"
        repo_stat = root.lstat()
        if (not stat.S_ISDIR(repo_stat.st_mode)
                or repo_stat.st_uid != os.geteuid()
                or root.resolve(strict=True) != root):
            _deny("UNSAFE_CHECKOUT")
        dotgit = root / ".git"
        gitstat = dotgit.lstat()
        if (not stat.S_ISDIR(gitstat.st_mode)
                or gitstat.st_uid != os.geteuid()
                or dotgit.resolve(strict=True) != dotgit):
            _deny("UNSAFE_GIT_DIR")
        intended = home.joinpath(*EXPECTED_RELATIVE)
        if (not source.is_file() or source.is_symlink()
                or source.resolve(strict=True) != intended):
            _deny("UNEXPECTED_SOURCE_LOCATION")
    except (OSError, ValueError, RuntimeError) as exc:
        raise ProbeDenied("MISSING_OR_UNSAFE_OWNER_CHECKOUT") from exc
    return root


def _git_read(repo: Path, extra: tuple[str, ...]) -> subprocess.CompletedProcess[str]:
    argv = [*_GIT_BASE, "-C", str(repo), *extra]
    try:
        result = subprocess.run(
            argv,
            env=dict(_GIT_ENV),
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=_TIMEOUT_SECONDS,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise ProbeDenied("GIT_READ_UNAVAILABLE") from exc
    if len(result.stdout) > _MAX_OUTPUT:
        _deny("GIT_OUTPUT_TOO_LARGE")
    return result


def _git_value(repo: Path, args: tuple[str, ...]) -> str:
    result = _git_read(repo, args)
    if result.returncode != 0:
        _deny("GIT_METADATA_UNAVAILABLE")
    return result.stdout.strip()


def _tracked_dirty(repo: Path, args: tuple[str, ...]) -> bool:
    result = _git_read(repo, args)
    if result.returncode not in (0, 1):
        _deny("TRACKED_STATUS_UNAVAILABLE")
    return result.returncode == 1


def snapshot(*, home: Path, source: Path) -> dict[str, object]:
    repo = _validate_home_and_code(home, source)
    head = _git_value(repo, ("rev-parse", "--verify", "HEAD"))
    branch = _git_value(repo, ("symbolic-ref", "--quiet", "--short", "HEAD"))
    if not _SHA40.fullmatch(head):
        _deny("INVALID_HEAD")
    if not _BRANCH.fullmatch(branch):
        _deny("INVALID_BRANCH")
    # No file contents or names are captured or exposed. Diff --quiet returns
    # only a status code; --no-ext-diff/--no-textconv prevent external helpers.
    worktree_dirty = _tracked_dirty(
        repo, ("diff", "--no-ext-diff", "--no-textconv", "--quiet", "--exit-code")
    )
    index_dirty = _tracked_dirty(
        repo, ("diff", "--cached", "--no-ext-diff", "--no-textconv", "--quiet", "--exit-code")
    )
    return {
        "schema": "trendos.ap260.owner-local-snapshot.v1",
        "execution": "OWNER_LOCAL_READ_ONLY",
        "remote_executor": "NOT_ESTABLISHED",
        "python_version": ".".join(str(x) for x in sys.version_info[:3]),
        "git_head": head,
        "git_branch": branch,
        "tracked_changes": "YES" if worktree_dirty or index_dirty else "NO",
        "untracked_files": "NOT_SCANNED",
        "production": "NOT_ACCESSED",
    }


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else argv
    if args != ["--snapshot"]:
        print("AP260_DIAGNOSTIC=DENIED; REASON=EXPLICIT_SNAPSHOT_FLAG_REQUIRED")
        return 2
    try:
        result = snapshot(
            home=Path.home(),
            source=Path(__file__),
        )
    except ProbeDenied as exc:
        print(f"AP260_DIAGNOSTIC=DENIED; REASON={exc}")
        return 2
    except Exception:
        print("AP260_DIAGNOSTIC=DENIED; REASON=UNEXPECTED_SAFE_STOP")
        return 2
    print(json.dumps(result, sort_keys=True, separators=(",", ":"), ensure_ascii=True))
    print("AP260_LOCAL_SNAPSHOT=PASS; UNTRACKED_NOT_SCANNED=YES; REMOTE_ACCESS=OFF")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
