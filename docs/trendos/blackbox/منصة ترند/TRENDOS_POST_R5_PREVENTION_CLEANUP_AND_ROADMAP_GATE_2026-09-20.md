# TrendOS — post-R5 recurrence prevention, reversible cleanup, and roadmap restart
Date: 2026-09-20. Scope: **read-only discovery and branch-only safety plan**. No production cleanup approval is implied.

## Exact starting position
- The owner-observed R5 manual start had two upserts, verified postflight parity, and installed the 10-minute trigger. The first time-driven R5 tick logged success, 0 upserts, postflight parity, no unknown outcome, and scheduledSyncDisarmed=false; its Executions UI still said Running in the provided screenshot. Do not state the UI showed Completed.
- A later independent D1 GET-only catalog snapshot showed Orders 639 and Lines 695, both sourceLastRow matched their respective D1 rowCount and syncedAt 2026-09-20 12:53:20 (server timestamp). Concurrent fresh Sheets metadata showed **allocated** grid rows Orders 641, Lines 697. This is a two-row dimension gap at these separate read times, **not** a full-content parity comparison or proof of a failed trigger: new orders may arrive between 10-minute ticks and allocation is not guaranteed to equal last populated row. Recheck automatically at the next actual tick; do not manually restart or run R4/V2.
- Normal Sheets/Apps Script Order writes remain authoritative. R5 is a D1 mirror; separate Operational Enrichment remains last-known paused, and Tasks V3 T3 remains locked. Keep active R5 trigger/Worker and fallback code in place during audits.

## Root risk and exact source evidence
Repository `Code.gs` (baseline only; verify actual production Version 155/live Head before edits):
- Lines approx 10715–10739: `trendosV1908RequestKey_` derives a client request ID; `trendosV1908PropKey_` maps it to `TRENDOS_CREATE_ORDER_V1908_...`; `trendosV1908ReadSavedResponse_` reads it; `trendosV1908SaveResponse_` writes a successful replay JSON (up to 8000 chars) to shared Script Properties, inside a catch that suppresses failures.
- `createManualOrder_` calls the replay read around 11069–11071 and replay save around 11270. No age-based pruning in this baseline path. Unbounded new keys can exhaust finite Script Properties, and swallowed write failure silently degrades same-key duplicate prevention.
- Separate `accountingSaveIdempotentV1913_` near lines 8720–8725 also stores successful up-to-8000-char replies under separate `MATBAGY_` keys and suppresses write failures. Inventory it separately; NEVER delete financial idempotency receipts based only on age/prefix.
- The previous approved one-off cleanup removed exactly 150 privately backed-up historic V1908 keys. No blanket replay/property deletion, no wholesale backups purge, and no rerun of `trendosReplayFixed150DeleteOnce20260919`. Keep the private backup private and intact.

## Prevention gates — no irreversible shortcuts
P0 — Read-only production evidence (now):
1. Re-run ONLY the already-qualified `trendosPropertyQuotaAuditReadOnly20260919` **in the original bound production Apps Script project** under owner supervision (not in isolated Tasks project or an old deployment). It logs group totals/byte estimates and age buckets, not keys/values. Capture the sanitized result and run status. DO NOT paste private Script Properties or actual order responses.
2. Fresh inventory of original bound Head files, project triggers (handler names and counts only), and deployed Version 155 create-path exactness against repository baseline. The 2026-09-10 file list is stale; `R5_Orders_Periodic_20260920` was added in September. Protect all active routines and current rollback paths.
3. Capture later scheduled R5 receipts and D1 row-count/freshness trends at least across one changed-order cycle. A 10-minute lag at arbitrary snapshots is expected; a failed/disarmed tick is not.

P1 — Design/test durable idempotency before cleanup:
- Maintain exact one request key → one business Order ID across retries/timeouts, even after a 7-day or longer cleanup. A 7-day expiration policy is **not** an absolute guarantee against arbitrary old request replay; decide business-specific replay retention horizon and conflict behavior explicitly.
- Never use transient CacheService as the sole duplicate guard; never remove historic replay keys first and assume the check for recent duplicates is equivalent to request-key idempotency.
- Make a persistent request ledger/lookup based on verified live source and actual Orders/Lines identity, with bounded growth and explicit durability, collision, replay-after-timeout, partial-write/reconciliation and backward-compatibility tests. Never allocate canonical IDs independently in D1 while Google can still create Orders.
- Only once the replacement is safely qualified, stage a small exact production patch with backup and reversible rollback; no whole-file replacement from the GitHub Code.gs baseline. Alert proactively on property occupancy and failed same-key replay saves, with zero raw key/value/secret leakage. An alert should not silently retry order creation.
- Existing `t12-script-properties-replay-cleanup-preview.gs` is read-only but age alone is insufficient to authorize delete; successful response, exact key/value private backup, row parity, live intent and explicit owner cohort signoff are needed for any later bounded delete.

P2 — Apps Script cleanup (prepare diff, no blind removal):
- LIVE MUST KEEP: `createManualOrder_`, authorization/session, ScriptLock, data-version, production order/line/fallback read paths, all active triggers, current `R5_Orders_Periodic_20260920` and its handler, migration/rollback code still referenced by active routes.
- CANDIDATES FOR PER-FILE REVIEW: prior R4 one-time helper, fixed-150 replay deletion helper (must never run again), dryrun and short-lived TEMP setup/helpers; do not classify an old filename as unused without checking live callers, trigger names, deployment/version dependence and secrets setup implications.
- A previous deployed Apps Script version is immutable; removing from Head does not rewrite it, but deleting a shared function can break current paths. Capture a tested project backup and exact file/function/trigger inventory before producing delete diffs.

P3 — GitHub cleanup (separate from property quota):
- Isolated repository inventory: 1127 tracked files, including 163 workflows, 23 `cloudflare-d1/t12-preview/` files, 247 `docs/trendos/blackbox/منصة ترند/` historical records, 149 test files. Counts describe presence, **not 1127 redundant artifacts**. GitHub deleting a workflow or source file does NOT free Apps Script Script Properties.
- `main` manual R5 enable/disable workflow and pinned qualification commit must remain as operational rollback support while R5 is live. R4 controlled workflow may still be needed to prove R4 remains OFF; no automatic production deploy may be added to cleanup.
- `docs/trendos/blackbox/`, commit history, CI tests and immutable pinned sources provide audit, dependencies and rollback evidence; use an INDEX / ARCHIVE catalog and workflow permissions review instead of wholesale deletion.
- For every candidate: record exact path, classified role, current import/reference, trigger type (push/dispatch/schedule), production deployment/ref dependencies, CI/test/rollback role, safe archive/removal method, rollback SHA, and a separate approval marker. No `main` deletion until identified, reviewed and separately approved.

## Roadmap checkpoint
- RP-07 CLOSED PASS; T11 Print/Laser/Press/Service D1-first + Apps Script fallback COMPLETE.
- Product roadmap is Phase 1 Core+Cloud, target TrendOS V1 2027-03-01.
- Owner-locked business order: Operator Tasks → Department Invoice + Material Shadow/Parity (Gaber LASER, Wael PRINT) → Laser & Print accounting controls → RP-08.
- Tasks V3 currently on distinct branch `tasks-v3-t2-readonly-wael-canary-20260916`; T2 static source check passed, Sheets v4 enabled only in its isolated project; the temporary `tasksV3LatencySmoke` wrapper was still present at latest 2026-09-18 checkpoint. Its required three read-only latency runs did not happen because TinyFish wallet was negative; official 30-attempt acceptance had NOT passed. Do not begin T3 or alter T1/Tasks production based on static verification alone.
- T12 Cloud canonical Order-create isolated candidate is engineering-qualified but live Version 155 source parity, exclusive numeric ID authority, production gates and owner cutover are outstanding. R5 mirror restoration is not Order-create authority transfer.

## Current hard blocker requiring owner action, NOT source-code authorization
The TinyFish browser wallet is still negative (-0.138766 USD on a read-only 2026-09-20 check); Apps Script live Head/Script Properties/executions cannot be privately inspected or run by the available GitHub/Google Drive metadata tools. After branch-only analysis, an owner-supervised **read-only quota audit** is the next runtime evidence gate. No deletion, restart or production patch can be endorsed from repository code and historic quota counts alone.

## Change record
GitHub-only isolated cleanup/prevention branch. This file adds no running code, database operation, Worker deploy, Apps Script execution, trigger, Property write/delete, secret or production change.