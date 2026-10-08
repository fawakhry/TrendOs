# TrendOS T12 — Customer Lane Release Preflight — 2026-10-08

## Authority / scope
Owner approved remediation of historical legacy status authority (with verified backup and no blind status writes), after approving the customer+department duplicate protection and controlled Production rollout. **Runtime truth outranks repo and test.**

## Legacy source diagnosis
- Connected live Google Sheet: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`, tab `بنود الأوردرات`, 250 data rows, including 73 `جاهز للاستلام`; historical tab `أرشيف بنود الأوردرات` has 4,628 delivered rows. Google read only; no edits.
- Live D1: frozen historical mirror `sheet_rows` has 768 rows INCLUDING header; exactly 767 mapped historical business lines. Overlay `t12_legacy_line_runtime` holds 15 reconciliation rows.
- Effective D1 old statuses: delivered=638, ready-for-pickup=73, duplicate=36, cancelled=20, unexpected active statuses=0.
- Owner-authorized independent read-only Google↔D1 parity of all 73 ready line IDs: FNV32 sorted `orderId:lineId` = `c78d9eb6` on BOTH; strong `orderId:lineId:department:normalizedPhone:customerName` = `68772830` on BOTH.
- Historical mirror contains 17 repeated identity events/rows with some contradictory CLOSED labels. Do not deduplicate, delete or bulk overwrite. Exact live OPEN identity+department parity proves no blanket D1 historical status rewrite necessary at this checkpoint. On future changes, use current D1 runtime as authority.
- Read-only audit workflow `.github/workflows/trendos-t12-legacy-status-authority-readonly.yml` run on isolated fix branch `f021f90bd875b13e8e44c51b8a9642d61d8e11ab` = SUCCESS; age of the intentionally-frozen sheet alone is not evidence of 73 false-open blockers.

## Atomic per-customer lane admission (Repo-only)
- `cloudflare-d1/migrations/0012_t12_customer_lane_claim.sql` additive, default inert; NOT applied to live D1.
- `cloudflare-d1/src/t12-general-create.mjs` includes claims in the SAME SQLite D1 batch as order/line/outbox insertion: unique normalized customer identity+department, release of closed claim only on next new CREATE, atomic conflict rollback, and one bounded retry for a partially free MULTI intent. Same logical idempotency key remains authoritative.
- Tests simulate parallel distinct item/qty fingerprints for PRINT and mixed PRINT vs MULTI. Integrated release CI run `37779637589`, job `113319183797`, all steps SUCCESS (SQLite concurrency, partial routing, frontend retry, Entry652 session lifecycle regression).
- `app.js`, `trendos-edge-orders-read-v1.js` integrated on latest source at integration time (`467c5e5fcd0e538a5b57692e630943d6ab500710`) while preserving unrelated Entry652 employee-auth/session changes. No live traffic touched.

## Release gate — BLOCKED_SAFE
- Fresh independently checked live Create API: `T12_GENERAL_CREATE_20261001_DUP_GUARD_V1`, GENERAL (old guard remains live); no lane release or migration.
- Byte-exact read-only bundle workflow `.github/workflows/trendos-t12-release-bundle-readonly-gate.yml`, run `37779969426`, job `113320303364`:
  - LIVE SHA256 `f61e58185ec245b996dcf2aa139805d8bbac7d9d068aa7f8a7514835da3398d4`, 1,024,085 bytes.
  - BASE SHA256 `65ef2c5cc06735d2838ffaa1b8da4d2c46b5ff1666d9c403c6e8e913991f7872`, 858,902 bytes (after matching esbuild relative paths).
  - TARGET SHA256 `09087d1a2fe72de00cde5a76585875ecd82ec65e2eed9e027153a7555b1ae777`.
  - Actual live code diverges substantially from source baseline; exact source parity FAIL => **NO DEPLOY**. Never overwrite current Worker with release bundle until full live module/function inventory identifies drift and qualifies merge.
- D1 Time Travel private recovery bookmark **available** (not printed/exported), recovery point timestamp `2026-10-08T12:52:21Z`, run `37779969426`. This is a short-lived Cloudflare Time Travel recovery reference, NOT an independent exported private backup. The repository is PUBLIC, so do not upload D1 customer-data exports to GitHub artifacts. Never run destructive D1 Time Travel restore automatically.
- During testing, main candidate advanced from `467c5e5fcd0e538a5b57692e630943d6ab500710` to `c03bf6a167190acc3d1db918d2268440ad08f8a8`; update drift required before release.
- No Production order modifications, no D1 writes/migration, no production Workers deploy, no Apps Script writes, no customer data export.
- Current release branch: `release/t12-customer-lane-safe-20261008`; private/isolated fix source: `fix/t12-duplicate-create-durable-20261008` (both repo branches; no client deployment).
- **NEXT SAFE STEP:** determine exact Cloudflare Worker currently deployed source/modules; compare with live bundle, reconcile latest candidate changes and frontend cache-loading wiring, re-run integrated browser/API tests and pre/post deployment gates. Secure an independent PRIVATE rollback backup if any destructive data writes become necessary. Only then controlled deploy with no synthetic business order CREATE, and Worker-only rollback if postflight fails. No fabricated PASS.

**FINAL STATE = SOURCE_INTEGRATED_CI_PASS / LEGACY_OPEN_PARITY_PASS / D1_RECOVERY_POINT_AVAILABLE / PRODUCTION_DEPLOY_BLOCKED_SAFE.**
