#!/usr/bin/env python3
"""ACC-199: read-only PR change-set safety preflight, NOT merge authority.

Run on a checked-out exact PR head against the exact event base SHA, without
GitHub secrets, Cloudflare tokens, remote D1, network requests, or business data.
Tests/manifest are source-only; cannot certify a real manager, runtime, or prod.
"""
from __future__ import annotations
import argparse
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SAFE_PATHS = (
    re.compile(r"^scripts/easystore_acc[0-9]{3}_[a-zA-Z0-9_.-]+\.(py|mjs|cjs)$"),
    re.compile(r"^tests/easystore_acc[0-9]{3}_[a-zA-Z0-9_.-]+\.(py|mjs|cjs)$"),
    re.compile(r"^docs/trendos/staging/ACC[0-9]{3}_[a-zA-Z0-9_.-]+\.(json|md)$"),
    re.compile(r"^\.github/workflows/easystore-acc[0-9]{3}[a-zA-Z0-9_.-]*-no-go\.ya?ml$"),
)
# A Workflow titled READONLY can still have remote D1, deploy, secrets or rollback.
# These are source-only PR checks, not an attempt to disable historic workflows.
DANGEROUS_WORKFLOW = (
    (re.compile(r"\$\{\{\s*secrets\.", re.I), "GITHUB_SECRET_REFERENCE"),
    (re.compile(r"\bwrangler\s+(?:deploy|rollback|d1\s+execute)\b", re.I), "WRANGLER_REMOTE_OR_DEPLOY_COMMAND"),
    (re.compile(r"\bd1\s+execute\b.*--remote", re.I), "REMOTE_D1_COMMAND"),
    (re.compile(r"\b(?:npm|pnpm|yarn)\s+(?:run\s+)?deploy\b", re.I), "DEPLOY_SCRIPT"),
    (re.compile(r"(?m)^\s*workflow_run\s*:", re.I), "CHAINED_WORKFLOW_TRIGGER"),
    (re.compile(r"\b(?:git\s+push|git\s+merge)\b", re.I), "GIT_MUTATION_COMMAND"),
    (re.compile(r"\b(?:curl|wget)\b[^\n]*(?:https?://|--data|-[dX]\s*POST)", re.I), "NETWORK_POST_OR_FETCH"),
    (re.compile(r"\bcloudflare/(?:wrangler-action|pages-action)\b", re.I), "CLOUDFLARE_ACTION"),
)
SHA = re.compile(r"^[0-9a-f]{40}$")


def classify_changed_paths(changes: list[tuple[str, str]]) -> list[str]:
    """Fail closed on ANY forbidden path/status, even an apparently small change."""
    issues: list[str] = []
    if not changes:
        return ["NO_CHANGED_FILES_NOT_QUALIFIED"]
    names: set[str] = set()
    for status, path in changes:
        if not isinstance(path, str) or not isinstance(status, str):
            issues.append("INVALID_CHANGE_RECORD")
            continue
        if (not path or "\x00" in path or "\\" in path or path.startswith("/")
                or ".." in PurePosixPath(path).parts):
            issues.append(f"INVALID_PATH:{path!r}")
            continue
        if path in names:
            issues.append(f"DUPLICATE_CHANGE:{path}")
        names.add(path)
        if status not in {"A", "M"}:
            issues.append(f"DESTRUCTIVE_OR_UNEXPECTED_STATUS:{status}:{path}")
        if not any(pattern.fullmatch(path) for pattern in SAFE_PATHS):
            issues.append(f"NON_SOURCE_ONLY_FILE:{path}")
    return issues


def inspect_workflow_content(path: str, content: str) -> list[str]:
    if not path.startswith(".github/workflows/"):
        return []
    violations = []
    # Read-only permissions are enforced independently of the workflow title.
    if not re.search(r"(?m)^permissions:\s*\n\s+contents:\s*read\s*$", content):
        violations.append(f"READONLY_PERMISSIONS_NOT_DECLARED:{path}")
    for regex, marker in DANGEROUS_WORKFLOW:
        if regex.search(content):
            violations.append(f"{marker}:{path}")
    return violations


def git(*args: str) -> str:
    cp = subprocess.run(
        ["git", *args], cwd=ROOT, text=True, capture_output=True,
        timeout=20, check=True,
    )
    return cp.stdout.strip()


def inspect_checked_out_pr(base_sha: str, head_sha: str) -> tuple[list[tuple[str, str]], list[str]]:
    """Local git graph/diff ONLY. Never invokes a workflow or accesses network."""
    issues = []
    if not SHA.fullmatch(base_sha) or not SHA.fullmatch(head_sha):
        return [], ["INVALID_PINNED_SHA"]
    if git("rev-parse", "HEAD") != head_sha:
        return [], ["CHECKED_OUT_SHA_DOES_NOT_MATCH_PR_HEAD"]
    if git("rev-parse", "--verify", f"{base_sha}^{{commit}}") != base_sha:
        return [], ["BASE_SHA_UNAVAILABLE"]
    try:
        git("merge-base", "--is-ancestor", base_sha, head_sha)
    except subprocess.CalledProcessError:
        return [], ["BASE_NOT_ANCESTOR_OF_EXACT_HEAD"]
    raw = git("diff", "--no-renames", "--name-status", base_sha, head_sha)
    changes = []
    for line in raw.splitlines():
        parts = line.split("\t")
        if len(parts) != 2:
            issues.append("UNEXPECTED_GIT_DIFF_STATUS")
        else:
            changes.append((parts[0], parts[1]))
    issues.extend(classify_changed_paths(changes))
    for status, path in changes:
        if path.startswith(".github/workflows/") and status in {"A", "M"}:
            file = ROOT / path
            if file.is_symlink() or not file.is_file():
                issues.append(f"WORKFLOW_NON_REGULAR_FILE:{path}")
            else:
                issues.extend(inspect_workflow_content(
                    path, file.read_text(encoding="utf-8")
                ))
        if status in {"A", "M"} and (ROOT / path).is_symlink():
            issues.append(f"SYMLINK_CHANGE_UNVERIFIED:{path}")
    return changes, issues


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-sha", required=True)
    parser.add_argument("--head-sha", required=True)
    args = parser.parse_args(argv)
    try:
        changes, issues = inspect_checked_out_pr(args.base_sha, args.head_sha)
    except (OSError, UnicodeError, subprocess.CalledProcessError,
            subprocess.TimeoutExpired) as exc:
        print("ACC199_PR_SOURCE_DIFF_GATE=FAIL_CLOSED")
        print(f"ACC199_LOCAL_GIT_READ_ERROR={type(exc).__name__}")
        return 1
    for status, path in changes:
        print(f"ACC199_DIFF_ONLY={status}:{path}")
    for issue in issues:
        print(f"ACC199_SOURCE_GATE_BLOCK={issue}")
    if issues:
        print("ACC199_PR_SOURCE_DIFF_GATE=FAIL_CLOSED")
        return 1
    print("ACC199_PR_SOURCE_DIFF_GATE=PASS_SOURCE_ONLY")
    print("ACC199_PR_MERGE_AUTHORITY=NONE")
    print("ACC199_REAL_PRODUCTION_GATES=G1_G2_G3_G4_G5_OPEN")
    print("FINANCE_RELEASE=NO_GO")
    return 0


if __name__ == "__main__":
    sys.exit(main())
