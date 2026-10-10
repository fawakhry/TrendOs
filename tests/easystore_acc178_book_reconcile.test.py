#!/usr/bin/env python3
"""ACC-178 independent negative tests for lossless book resolution."""
import importlib.util
import hashlib
from pathlib import Path

path = Path("scripts/easystore_acc178_reconcile_book.py")
spec = importlib.util.spec_from_file_location("acc178_book", path)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

base = ("# Original shared/accounting common history\n" +
        "".join(f"BASE_LINE_{i:05d} stable ledger and operating evidence\n" for i in range(170))).encode()
accounting_delta = b"\n### ACC-170 Original supplier payment source test\n### ACC-174 Handoff SQL original test\n### ACC-175 Trusted role matrix\n"
accounting = base + accounting_delta
shared = base.replace(b"# Original shared/accounting common history", b"# New shared-platform header 4.22") + (
    b"\n### ENTRY642 Latest authentication and operating history\n"
)
book, info = m.reconcile(base, accounting, shared)
assert book.startswith(shared)
assert book.endswith(accounting_delta)
assert book.count(accounting_delta) == 1
assert info["shared_original_book_sha256"] == hashlib.sha256(shared).hexdigest()
assert info["accounting_appended_history_sha256"] == hashlib.sha256(accounting_delta).hexdigest()
assert info["merged_book_sha256"] == hashlib.sha256(book).hexdigest()
assert info["finance_release_decision"] == "NO_GO"
assert info["production_deployed"] is False
assert info["production_financial_writes"] == 0


def blocked(b, a, s, error):
    try:
        m.reconcile(b, a, s)
    except m.ReconciliationBlocked as exc:
        assert error in str(exc), f"expected {error}, got {exc}"
    else:
        raise AssertionError("Expected fail-closed for " + error)


blocked(base, base.replace(b"BASE_LINE_00012", b"MUTATED_00012") + accounting_delta,
        shared, "NOT_STRICT_APPEND_ONLY")
blocked(base, base, shared, "NO_ACCOUNTING_APPEND")
blocked(base, accounting, shared.replace(base[-4096:], b"STOLEN_TAIL"),
        "SHARED_BASE_TAIL_NOT_UNIQUE")
blocked(base, accounting, base, "SHARED_HAS_NO_NEW_HISTORY")
blocked(base, accounting, shared + accounting_delta, "DELTA_ALREADY_PRESENT")
blocked(base, accounting, shared + "\n\n---\n\n## ACC-178 — Accounting branch append-only history, safely reconciled\n".encode("utf-8"),
        "RECONCILIATION_MARKER_ALREADY_PRESENT")
blocked(b"small", b"small appended", b"small shared", "COMMON_BASE_TOO_SMALL")
assert not book.startswith(accounting), "shared newest header must be retained as the primary book"
assert accounting in (base + accounting_delta,)
print("ACC178_VERBATIM_SHARED_BOOK_AND_ACCOUNTING_APPEND=PASS")
print("ACC178_ORIGINAL_BOOK_SHA256_PROVENANCE=PASS")
print("ACC178_MUTATED_OR_MISSING_HISTORY_FAIL_CLOSED=PASS")
print("ACC178_SOURCE_DOC_MERGE_HAS_NO_PRODUCTION_AUTHORITY=PASS")
