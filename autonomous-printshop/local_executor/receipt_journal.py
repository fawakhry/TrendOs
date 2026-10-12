"""AP-235 OFFLINE synthetic SQLite receipt journal. No executor or network.

Never deploy this model or interpret its review-only receipts as permission
for actual system commands, production writes, or printer access.
"""
from __future__ import annotations

import re
import sqlite3
from contextlib import closing
from pathlib import Path

EXECUTION_ENABLED = False
NETWORK_ENABLED = False
APPROVAL_SERVICE_IMPLEMENTED = False
JOURNAL_SCHEMA = 1
_ALLOWED = frozenset(("python_version", "git_head", "git_status"))
_REVIEW_FIELDS = frozenset(("decision", "reason", "replay_token"))
_REQUEST_FIELDS = frozenset(("request_id", "operation", "commit", "issued_at", "expires_at"))
_HEX64 = re.compile(r"[a-f0-9]{64}\Z", re.ASCII)
_HEX40 = re.compile(r"[a-f0-9]{40}\Z", re.ASCII)
_REQUEST_ID = re.compile(r"[A-Za-z0-9_-]{12,64}\Z", re.ASCII)


def _deny(reason: str) -> dict[str, str]:
    return {"decision": "DENY", "reason": reason}


def _path(value: object, *, must_exist: bool) -> Path | None:
    if not isinstance(value, (str, Path)) or not str(value):
        return None
    try:
        p = Path(value)
        # No implicit home/relative path or symlink following in test fixtures.
        if not p.is_absolute() or p.is_symlink():
            return None
        if must_exist and not p.is_file():
            return None
        if not must_exist and (p.exists() or not p.parent.is_dir()):
            return None
    except (OSError, ValueError, TypeError):
        return None
    return p


def initialize_synthetic_journal(file_path: object) -> dict[str, str]:
    """Explicit TEST FIXTURE bootstrap; never recreate an existing store."""
    p = _path(file_path, must_exist=False)
    if p is None:
        return _deny("TEST_STORE_PATH_INVALID_OR_ALREADY_EXISTS")
    try:
        # Using sqlite3's CREATE mode here is intentional ONLY for test fixtures.
        # Production provisioning and access hardening are NOT implemented.
        with closing(sqlite3.connect(str(p), timeout=0.25, isolation_level=None)) as db:
            db.execute("PRAGMA synchronous=FULL")
            db.execute("PRAGMA journal_mode=DELETE")
            db.execute("BEGIN IMMEDIATE")
            db.execute("CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL) WITHOUT ROWID")
            db.execute("CREATE TABLE receipts ("
                       "token TEXT PRIMARY KEY, request_id TEXT NOT NULL UNIQUE, "
                       "operation TEXT NOT NULL, commit_sha TEXT NOT NULL, "
                       "issued_at INTEGER NOT NULL, expires_at INTEGER NOT NULL) WITHOUT ROWID")
            db.execute("INSERT INTO meta(key,value) VALUES ('schema','ap235-synthetic-v1')")
            db.execute("PRAGMA user_version=1")
            db.execute("COMMIT")
        return {"decision": "TEST_STORE_INITIALIZED", "reason": "NO_EXECUTOR"}
    except (OSError, sqlite3.Error, ValueError):
        return _deny("TEST_STORE_BOOTSTRAP_FAILED")


def reserve_synthetic_review(
    file_path: object,
    review: object,
    request: object,
    *,
    expected_commit: str | None = None,
    trusted_now: int | None = None,
) -> dict[str, str]:
    """Atomically record synthetic review metadata. NEVER issue run authority.

    Input review/clock/pin are ALL test-supplied. They are not authenticated,
    and the store is not tamper-evident. The only allowed success response
    means 'review fingerprint was stored', not 'request may be executed'.
    """
    if type(review) is not dict or frozenset(review) != _REVIEW_FIELDS:
        return _deny("INVALID_REVIEW_VERDICT")
    if (review.get("decision") != "REVIEW_ONLY"
            or review.get("reason") != "NO_EXECUTOR_OR_DURABLE_REPLAY_STORE"
            or type(review.get("replay_token")) is not str
            or _HEX64.fullmatch(review["replay_token"]) is None):
        return _deny("REVIEW_NOT_ELIGIBLE")
    if type(request) is not dict or frozenset(request) != _REQUEST_FIELDS:
        return _deny("INVALID_REQUEST")
    reqid, operation, commit, issued, expires = (
        request[key] for key in ("request_id", "operation", "commit", "issued_at", "expires_at")
    )
    if (type(reqid) is not str or _REQUEST_ID.fullmatch(reqid) is None
            or type(operation) is not str or operation not in _ALLOWED
            or type(commit) is not str or _HEX40.fullmatch(commit) is None
            or type(expected_commit) is not str or expected_commit != commit
            or type(trusted_now) is not int
            or type(issued) is not int or type(expires) is not int
            or not (0 < expires - issued <= 300 and issued <= trusted_now < expires)):
        return _deny("INVALID_SCOPE_OR_TIME")
    p = _path(file_path, must_exist=True)
    if p is None:
        return _deny("STORE_MISSING_OR_UNSAFE_PATH")
    try:
        # rw mode prevents sqlite3 from silently recreating a deleted journal.
        with closing(sqlite3.connect(p.as_uri() + "?mode=rw", uri=True,
                                     timeout=0.25, isolation_level=None)) as db:
            db.execute("PRAGMA synchronous=FULL")
            db.execute("BEGIN IMMEDIATE")
            try:
                if db.execute("PRAGMA quick_check").fetchone() != ("ok",):
                    raise sqlite3.DatabaseError("integrity verification failed")
                if db.execute("PRAGMA user_version").fetchone() != (JOURNAL_SCHEMA,):
                    raise sqlite3.DatabaseError("schema version invalid")
                if db.execute("SELECT value FROM meta WHERE key='schema'").fetchone() != ("ap235-synthetic-v1",):
                    raise sqlite3.DatabaseError("schema marker invalid")
                # Legacy/corrupt schema cannot silently lose uniqueness rules.
                indexes = db.execute("PRAGMA index_list(receipts)").fetchall()
                if len(indexes) != 2 or not all(v[2] == 1 for v in indexes):
                    raise sqlite3.DatabaseError("uniqueness missing")
                db.execute(
                    "INSERT INTO receipts(token,request_id,operation,commit_sha,issued_at,expires_at) "
                    "VALUES(?,?,?,?,?,?)",
                    (review["replay_token"], reqid, operation, commit, issued, expires),
                )
                db.execute("COMMIT")
            except BaseException:
                if db.in_transaction:
                    db.execute("ROLLBACK")
                raise
    except sqlite3.IntegrityError:
        return _deny("REPLAY_OR_REQUEST_ID_REUSED")
    except (OSError, sqlite3.Error, ValueError):
        return _deny("STORE_UNAVAILABLE_OR_CORRUPT")
    return {"decision": "RECORDED_REVIEW_ONLY", "reason": "NO_EXECUTOR_OR_REAL_AUTH"}
