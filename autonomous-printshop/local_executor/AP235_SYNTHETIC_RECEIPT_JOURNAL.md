# AP-235 — SQLite synthetic review receipt journal (SOURCE ONLY / NO EXECUTION)

**Authority:** GitHub source + hosted synthetic Python CI only. Neither local Ubuntu nor Cloudflare/Production/D1 nor the Windows 7 print PC is involved. Nothing is installed or running on TrendosShop. This is NOT a trusted remote executor.

## Implemented (explicitly bounded)

- `receipt_journal.py` models a **one-use** review receipt, stored as an INSERT-only row with two uniqueness constraints: `token` (AP-234 proposal digest) and `request_id`. It never executes the reviewed operation.
- The model `reserve_synthetic_review` requires `REVIEW_ONLY/NO_EXECUTOR_OR_DURABLE_REPLAY_STORE` metadata and a strictly bounded request (`python_version | git_head | git_status`, SHA40 commit pin, 12–64-character ID, <=300-second window) with independently supplied *synthetic* current time and commit pin. Even with all flags satisfied, only response is `RECORDED_REVIEW_ONLY/NO_EXECUTOR_OR_REAL_AUTH`.
- No silent database creation for receipt recording: `mode=rw` and schema/integrity checks deny when journal is missing/corrupt or version/uniqueness checks fail. Dedicated `initialize_synthetic_journal` deliberately provisions **only a caller-chosen test fixture** and refuses existing paths; never expose this function as a host endpoint.
- SQLite `BEGIN IMMEDIATE`, unique token/ID and `COMMIT` before returning the review-only receipt. Missing DB, lock contention, invalid review envelope, malformed path, symlink leaf, SQLite errors or duplicate identity = `DENY`; no exception details or secrets echoed. `synchronous=FULL` applies to synthetic fixture store. Records are not automatically pruned when their timestamps expire.
- GitHub-hosted tests use `tempfile.TemporaryDirectory` for synthetic records; concurrency test launches 12 separate SQLite connections and requires exactly one accepted receipt. Other tests cover restart/reopen, close-before-commit rollback (no outside effect), corrupt and schema-mismatched DB, locks, simulated disk-full, tampered payloads, symlinks, missing store, and no command/network dispatch. A cross-stage test composes the existing AP-234 fake HMAC signed-review model with this journal without promoting either to a trusted authorization service.

## Critical limits and unresolved threat gates

1. **Not real owner approval:** AP-234 keys are synthetic; this module accepts a caller-supplied `review` object that could be forged. It does not verify signatures or authenticate users, devices, clocks, or commits. Never interpret `RECORDED_REVIEW_ONLY` as permission to execute.
2. **Persistence relies on intact test filesystem:** SQLite records survive close/reopen, but owner/admin deletion, rollback of disk snapshots, hardlinks, directory swap or filesystem tampering can bypass persistence. This is not tamper-evident, replicated or backed up. No real trusted clock or pinned commit source is integrated.
3. **Crash semantics:** a crash before COMMIT rolls back reservation; *because absolutely no external operation is dispatched*, no replayed side effect exists. A future executor must have durable consume-before-effect and a proven idempotent/atomic operation contract with power-loss tests; this code does NOT.
4. **OS isolation absent:** test-only path selection is not a secure production path allowlist. This module has no service sandbox or audit/recovery infrastructure, and does not block malicious same-user processes. Dedicated non-root identity, ownership/permissions, and symlink-race/hardlink defenses remain required.
5. **Public repo threat:** do NOT register a persistent self-hosted GitHub runner on the shared printshop Ubuntu. Hosted CI only, `contents:read`, no secrets, D1/Cloudflare endpoints, deploy, NetBird, SSH, or Windows7 access.

## Next candidate — AP-236 (not authorized or implemented now)

GitHub-only trusted-boundary and immutable operation-catalog design, independent negative tests for approval receipts, tamper-aware audit, path ownership, and OS isolation. Do not create a listener, real executor or local service; future live pilot needs explicit owner-approved threat review.

Status: `RECEIPT_JOURNAL=TEST_MODEL_ONLY`; `DURABLE_SQLITE_SIMULATION=PENDING_CI`; `OWNER_AUTHENTICATION=NONE`; `EXECUTOR_ENABLED=NO`; `UBUNTU_CONNECTION=NONE`; `WINDOWS7_ACCESS=NO`; `D1_WRITES=0`; `PR_MERGE=NO`.
