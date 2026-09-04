# PERF-CF-02B — D1 Freshness Stability + Polling Coalescing

Date: 2026-09-04  
Branch: `agent/go-live-2026-09-01-integrity`  
Status: **IMPLEMENTED + TESTED + VERIFIED IN CI / NO PRODUCTION CUTOVER**

## Scope

This checkpoint continues the performance lane only. It does **not** resume paused CORE-P0 remediation and does not alter the authoritative-write boundary.

Authoritative writes remain:
- Google Sheets + Apps Script.

Cloudflare/D1 remains:
- read/mirror/performance lane.

## 1. Sustained D1 freshness — PASS

Read-only workflow:
- `TrendOS Cloudflare Freshness Stability`
- run: `33820325930`
- result: **SUCCESS**

Four consecutive observation windows all passed for both live-sync sheets:

| Sample | Orders | Lines | syncedAt UTC | ageSeconds |
|---|---:|---:|---|---:|
| 1 | 274 | 315 | 2026-09-04 00:04:54 | 35 |
| 2 | 274 | 315 | 2026-09-04 00:05:58 | 42 |
| 3 | 274 | 315 | 2026-09-04 00:06:52 | 59 |
| 4 | 274 | 315 | 2026-09-04 00:07:53 | 69 |

For every sample:
- `rowCount == sourceLastRow`
- status = `ready`
- note = `TrendOS orders live sync V1`
- Orders and Lines had the exact same `syncedAt`
- age stayed below the 180-second freshness gate

Conclusion:
- the earlier long freeze was real, but the legacy 1-minute live sync recovered before any Apps Script production mutation was performed in this lane;
- one passing sample was not accepted as proof: four windows were required and passed.

## 2. Atomic recovery path prepared — not deployed to Apps Script Production

Working-branch `cloudflare-d1/D1_Orders_Live_Sync.gs` was hardened to:
- stage Orders + Order Lines under one `runId`;
- promote only after both stages are complete;
- persist attempt/skip/error/success observability;
- fail closed if atomic mirror capability is unavailable;
- install the 1-minute trigger only after a passing first atomic run.

Cloudflare runtime capability probe already verified that these required tables exist:
- `sheet_catalog`
- `sheet_rows`
- `sheet_staging_catalog`
- `sheet_staging_rows`

This atomic Apps Script sender is **prepared/tested on GitHub only**. It has not replaced the production Apps Script live-sync implementation.

## 3. Frontend polling fan-out reduction — implemented on working branch

New coordinator:
- `trendos-poll-coordinator-v1.js`
- visibility-aware
- in-flight coalescing
- minimum-interval throttling
- observability counters for hidden/fresh/coalesced skips

### Operations Hub

Changed:
- removed synthetic `window focus` dispatch from manual refresh;
- manual refresh now calls exposed module refresh functions directly;
- loads the polling coordinator lazily;
- emits one `trendos:refresh` event instead of creating a focus storm.

Reason:
- the previous button could produce duplicate reads because modules already listened to `focus`, then the hub called their refresh methods again.

### Employee Manager

Changed:
- hidden-tab reads are skipped;
- in-flight refreshes are coalesced;
- focus refreshes are throttled;
- the existing two parallel read calls (`getRows` + `getMatbagyNotes`) remain one logical refresh;
- post-write refresh is explicitly forced so user-visible state still updates immediately after sending a reply.

### Press status

Changed:
- hidden-tab reads are skipped;
- in-flight status calls are blocked/coalesced;
- minimum refresh interval added;
- a public `TrendPressControlV1.refresh` function is exposed so Operations Hub can refresh directly without synthesizing focus.

### Customer Feedback

Changed conservatively:
- hidden-tab background scans are skipped;
- scan frequency is locally throttled;
- this path is deliberately **not** routed through the generic read coordinator because `scan` may cause backend state changes.

### Attendance

No production/working-branch behavior change was made in this checkpoint. Attendance is left for a separate sensitive review because its state loader mixes backend state, local fallback, productivity fallback and presence/prayer scheduling.

## 4. CI — PASS

New contract test:
- `tests/trendos_polling_coalescing_v1.test.mjs`

CI workflow updated:
- `.github/workflows/trendos-integrity-v1.yml`

Run:
- `33821150092`
- result: **SUCCESS**

Verified passing steps include:
- Cloudflare Edge Gateway V1
- visibility-aware polling coalescing
- TrendOS integrity foundation
- runtime tools
- CORE-P0 remediation tests
- registry writer tests
- Order/Line
- Attendance/Cleaning
- Press
- Invoice
- WhatsApp
- Customer Manager stable send ID
- Handover/OPS
- ANDON
- Integrity Dashboard
- Fast Auth V2.5 SAFE
- Router
- composed Apps Script collision/syntax gate
- pre-deploy package safety gate

No regression was detected by the existing integrity suite.

## Safety / non-actions

This checkpoint performed **no**:
- production traffic cutover;
- Apps Script production deployment;
- production Apps Script flag change;
- D1 import/migration as part of the polling work;
- authoritative business write migration;
- source Sheet business-data edits;
- CORE-P0 reconciliation or registry write.

A concurrent repository decision commit (`D-022 Matbagy multi-AI room architecture`) was detected and preserved; performance-lane writes were rebased by re-reading the current branch head instead of overwriting concurrent work.

## Exact next step

Continue PERF-CF qualification without cutover:

1. verify authenticated Edge session behavior and Apps Script fallback contract against current Preview;
2. verify browser/module loading contract for the polling coordinator and direct refresh APIs;
3. measure request fan-out/latency under the updated frontend modules;
4. review Attendance polling separately and only change it if a no-regression contract can be demonstrated;
5. keep Production read cutover behind a separate gate requiring sustained freshness, authentication, fallback and rollback evidence.
