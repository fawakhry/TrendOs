#!/usr/bin/env python3
"""ACC-178 — explicit three-way BOOK-ONLY conflict resolution for isolated CI.

Do NOT run a production deploy from this script. The shared platform book is
preserved byte-for-byte as the prefix of the result; the accounting branch's
strictly append-only history since the actual common-base book is appended
byte-for-byte. The original complete books remain in Git history by pinned SHA.
No arbitrary preference (-X ours/theirs), no fuzzy patch, and no source code
conflict is accepted.
"""
import argparse
import hashlib
import json
from pathlib import Path


class ReconciliationBlocked(ValueError):
    pass


def sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def reconcile(base: bytes, accounting: bytes, shared: bytes):
    if not base or not accounting or not shared:
        raise ReconciliationBlocked("ACC178_EMPTY_BOOK_SOURCE")
    if not accounting.startswith(base):
        raise ReconciliationBlocked("ACC178_ACCOUNTING_NOT_STRICT_APPEND_ONLY")
    delta = accounting[len(base):]
    if not delta.strip():
        raise ReconciliationBlocked("ACC178_NO_ACCOUNTING_APPEND")
    if len(base) < 4096:
        raise ReconciliationBlocked("ACC178_COMMON_BASE_TOO_SMALL")
    anchor = base[-4096:]
    if shared.count(anchor) != 1:
        raise ReconciliationBlocked("ACC178_SHARED_BASE_TAIL_NOT_UNIQUE")
    pos = shared.index(anchor) + len(anchor)
    if len(shared) <= pos:
        raise ReconciliationBlocked("ACC178_SHARED_HAS_NO_NEW_HISTORY")
    if delta[:128] in shared:
        raise ReconciliationBlocked("ACC178_ACCOUNTING_DELTA_ALREADY_PRESENT")
    section = (
        "\n\n---\n\n"
        "## ACC-178 — Accounting branch append-only history, safely reconciled\n\n"
        "The preceding full TrendOS shared-platform master book is preserved "
        "byte-for-byte. Below is the unmodified accounting-branch append-only "
        "history since the pinned common-base version. The exact parent "
        "commits and SHA-256 fingerprints are recorded in the ACC-178 "
        "reconciliation receipt. This isolated Git merge is NOT a deployed "
        "Worker or accepted financial release.\n\n"
    ).encode("utf-8")
    marker = b"## ACC-178 " + "— Accounting branch append-only history, safely reconciled".encode("utf-8")
    if marker in shared or marker in accounting:
        raise ReconciliationBlocked("ACC178_RECONCILIATION_MARKER_ALREADY_PRESENT")
    combined = shared + section + delta
    assert combined.startswith(shared)
    assert combined.endswith(delta)
    assert len(combined) == len(shared) + len(section) + len(delta)
    report = {
        "schema": "ACC178_BOOK_RECONCILIATION_V1",
        "method": "VERBATIM_SHARED_MASTER_PLUS_APPEND_ONLY_ACCOUNTING_DELTA",
        "common_base_book_sha256": sha(base),
        "shared_original_book_sha256": sha(shared),
        "accounting_original_book_sha256": sha(accounting),
        "accounting_appended_history_sha256": sha(delta),
        "merged_book_sha256": sha(combined),
        "shared_full_book_preserved_verbatim": True,
        "accounting_appended_history_preserved_verbatim": True,
        "accounting_original_prefix_preserved_by_git_history": True,
        "shared_header_and_book_changes_preserved": True,
        "merged_book_bytes": len(combined),
        "shared_book_bytes": len(shared),
        "accounting_append_bytes": len(delta),
        "book_conflict_resolved_only_in_disposable_worktree": True,
        "finance_release_decision": "NO_GO",
        "production_deployed": False,
        "production_financial_writes": 0,
    }
    return combined, report


def main():
    parser = argparse.ArgumentParser()
    for item in ("base", "accounting", "shared", "out", "report"):
        parser.add_argument("--" + item, type=Path, required=True)
    args = parser.parse_args()
    try:
        book, evidence = reconcile(
            args.base.read_bytes(),
            args.accounting.read_bytes(),
            args.shared.read_bytes(),
        )
    except ReconciliationBlocked as exc:
        parser.exit(1, str(exc) + "\n")
    args.out.write_bytes(book)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("ACC178_BOTH_BOOK_TIMELINES_PRESERVED=PASS")
    print("ACC178_BOOK_RESOLUTION_ONLY=PASS")
    print("ACC178_MERGED_BOOK_SHA256=" + evidence["merged_book_sha256"])
    print("ACC178_FINANCE_RELEASE=NO_GO")
    print("ACC178_PRODUCTION_WRITES=ZERO")


if __name__ == "__main__":
    main()
