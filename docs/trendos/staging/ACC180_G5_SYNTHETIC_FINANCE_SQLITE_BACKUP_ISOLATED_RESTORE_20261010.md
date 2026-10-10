# ACC-180 — Real finance D1 migration schema, synthetic SQL export/native SQLite backup and isolated restore

**Date:** 2026-10-10  
**Scope:** TrendOS EasyStore financial predeployment G5 safety engineering, source/CI-only  
**Decision:** `SYNTHETIC_RESTORE_VERIFIED` / `REAL_PRODUCTION_BACKUP_NOT_PERFORMED` / **FINANCE_PRODUCTION_NO_GO**.

## Initial context and guards

- Baseline repo: `fawakhry/TrendOs`, base branch `candidate/easystore-accounting-a2-20261005` at ACC-179 commit `db07795515dc623a7c042f596f99f86ac5fc9694`.
- Prior verified [ACC-178](ACC178_G5_SHARED_BOOK_LOSSLESS_RECONCILIATION_WORKER_MERGE_TEST_20261010.md) recovered **both** master-book timelines in an ephemeral worker tree with finance and shared customer/auth regression PASS. ACC-179 [merged PR #60](https://github.com/fawakhry/TrendOs/pull/60) restored ACC-176/177 safety workflows and original book.
- ACC-180 does **not** change those workflows, the old manual production readonly deployment workflow, Worker code, authentication/employee privileges, production configuration or any D1 database.
- `cloudflare-d1/wrangler.toml` is a **production-connected** `trendos-main` binding; the ACC-180 workflow **never installs Wrangler or uses this binding**. No production D1 export or backup/restore has been authorized or attempted.

## Implemented executable evidence

The new `scripts/easystore_acc180_finance_backup_isolated_restore.py`:

1. Loads all **twelve original** finance D1 migration SQL files: `0015`, `0020`–`0030` (excluding the absent `0019`). All migration DDL is executed in a disposable local SQLite database with no network access.
2. Seeds *only* a synthetic supplier balance, print material, and request-ledger COMMITTED entry using fake nonemployee identifiers. Sets the local synthetic control to `READONLY`, with a zero command budget/empty canary user/action lists.
3. Validates original SQLite `PRAGMA integrity_check` and `foreign_key_check`; fingerprints complete `sqlite_schema` definitions and each **table's exact entire row contents** using canonical sorted per-row SHA-256 (excluding native SQLite internal metadata tables). Includes all finance tables without enumerating or uploading business data.
4. Produces an **SQLite SQL export** with Python `Connection.iterdump()` (analogous to SQL backup/restore mechanics; **not claimed to be a real Cloudflare D1 export**), verifies its file-level SHA-256 and restores it to a wholly separate temporary SQLite file. Revalidates every original table row/count/hash, entire schema and READONLY/zero-canary state.
5. Independently runs native `sqlite3.Connection.backup()` to a *different* isolated SQLite database and compares the same full fingerprints. The temporary databases and original SQL dump are erased when tests complete.
6. Emits only a small, **synthetic-only** receipt `artifacts/acc180-synthetic-only-backup-restore.json` with migration count, schema SHA-256, synthetic export SHA-256, table count and booleans; does **not** upload raw SQL, database files, personal details or row data. Receipt always marks `actual_cloudflare_d1_backup_created:false`, `actual_production_backup_restored:false`, `production_worker_rollback_proved:false`, `finance_release_decision:NO_GO`, `production_mutations:0`.

Adversarial `tests/easystore_acc180_finance_backup_isolated_restore.test.py` rejects export checksum mismatch, truncated SQL, invalid SQL body, rehashed but altered material/ledger rows, falsified source fingerprint, incomplete finance schema, and a rehashed mode-tampered restore that changes the authority from READONLY to GENERAL. No negative test can unlock the synthetic or production guard.

CI `.github/workflows/easystore-acc180-finance-isolated-backup-restore.yml` runs Python 3.12, source checks and tests on every qualifying PR/commit with `permissions: contents: read`. It contains **no secrets, Wrangler, remote SQL, production D1 read/write, Cloudflare deploy, HTTP finance POST, production backup import, release dispatch or Finance GENERAL enable**. It uploads only the sanitized 14-day synthetic status artifact.

## Actual GitHub evidence

- [ACC-180 initial failure #38077468467](https://github.com/fawakhry/TrendOs/actions/runs/38077468467): an adversarial test case erroneously replaced `READONLY` inside a CREATE TABLE check constraint. The real SQLite integrity validation correctly rejected that invalid fixture. No production impact.
- Fixed the fixture to replace **only** the synthetic control table's INSERT mode value, leaving original table constraints intact.
- [ACC-180 current success #38077519181](https://github.com/fawakhry/TrendOs/actions/runs/38077519181), job `114287493472`: **SUCCESS**:
```
ACC180_EXACT_SCHEMA_ALL_ROWS_AND_FINANCE_STATE_RESTORED=PASS
ACC180_CHANGED_BYTES_OR_INCORRECT_CHECKSUM_REJECTED=PASS
ACC180_REHASHED_TAMPERED_ROWS_AND_INCOMPLETE_SCHEMA_REJECTED=PASS
ACC180_RESTORED_WRITES_OR_CANARY_CANNOT_AUTO_ARM=PASS
ACC180_REAL_ACCOUNTING_MIGRATIONS=12
ACC180_ISOLATED_SQL_EXPORT_RESTORE_SCHEMA_ALL_ROWS=PASS
ACC180_ISOLATED_SQLITE_NATIVE_BACKUP_RESTORE=PASS
ACC180_READONLY_AND_ZERO_CANARY_IN_RESTORED_DATA=PASS
ACC180_PRODUCTION_D1_BACKUP_AND_RESTORE=NOT_PERFORMED
ACC180_RELEASE_DECISION=NO_GO
ACC180_PRODUCTION_MUTATIONS=ZERO
```

## Real finance G5 backup and restore acceptance — remains OPEN

The offline synthetic proof is **necessary but not sufficient**. A real production release still requires *separate, fresh owner-authorized* operations in a controlled maintenance window and protected environment:

1. **Define scope and recovery point:** record the active Cloudflare account, D1 database ID and Worker version, the financial data boundary, operator, approved timestamp/maximum acceptable data loss and signoffs. Existing finance frontend OFF / backend READONLY / zero-canary budget are mandatory preconditions. NEVER restore over `trendos-main` for a test.
2. **Approved real backup** using authenticated Cloudflare D1 export or appropriate managed backup path, with exact export finish/size/hash, private encryption and minimum-privilege storage/retention/access record. Finance data are sensitive: never commit full SQL/DB backups, tokens or employee identifiers to GitHub, CI artifacts or chat.
3. **Isolation-proven restore** to a *distinct* scratch Cloudflare D1 or trusted offline recovery database—not production—under authorized operator controls. Prove full-schema and full-ledger checksums/row totals against independent preserved snapshots and signed expected cutover/opening reconciliations; document FK/integrity, recovery timing, fail-closed permissions and whether export snapshot is consistent.
4. **Rollback drill** of the actually pinned previously active Worker deployment in a controlled non-disruptive plan; capture version IDs and multi-endpoint published/frontend checks. A Worker rollback does **not** undo accidental financial database writes and must not be represented as a database restore.
5. **Full finance go-live criteria:** G1 one fresh authenticated bounded A2.13 custody-close acceptance, G2 signed exact staff permission matrix (#40), G3 authoritative opening data reconciliation, G4 end-to-end real finance operations, G5 signed GO/NO-GO with verified encrypted backup/restore/rollback and monitored cutover. No unsigned, inferred or unlimited release.

**No actual Production Cloudflare operation occurred in ACC-180. This does not close G5.**
