# Cloud Migration V3 — T12 Order Create GitHub Prep PASS — 2026-09-19

## Scope
Branch-only preparation for moving canonical Order creation from Google Apps Script / Sheets toward Cloudflare/D1.

Repository: `fawakhry/TrendOs`
T12 branch: `cloud-migration-v3-t12-order-create-ci-20260919`
Base checkpoint: `cloud-migration-v3-t6b-auth-shadow-canary-20260913@f07cc56501fba1c29c0ef72cccda78e494935373`

No production deployment, Cloudflare production mutation, D1 production mutation, Apps Script deployment, Script Property change, Google Sheet write, frontend change, secret change, authority transfer, or `main` change occurred in T12 prep.

## Production evidence boundary
The live Apps Script UI screenshot supplied by the owner on 2026-09-19 shows Production Web App **Version 155**.

However, GitHub is explicitly not authoritative for the byte-exact live Apps Script source. T12 therefore treats:

`productionVersion155SourceExact = PENDING`

No claim is made that repository `Code.gs` equals Version 155.

## Contract review
Reviewed:
- `cloudflare-d1/src/cloud-write.mjs`
- `cloudflare-d1/src/cloud-write-gate.mjs`
- `cloudflare-d1/src/cloud-write-order-contract-v2.mjs`
- `cloudflare-d1/src/cloud-session-bridge-v3.mjs`
- Production shadow entrypoint and T11 retained state.

Key conflict confirmed:
1. Cloud Write V1 can generate `CW-...` IDs directly in D1.
2. The safer V2 canonical intent explicitly refuses preallocated business Order IDs.
3. Current canonical business ID ownership still belongs to the live Apps Script `createManualOrder_` path until an independent T12 design proves a Cloud-native allocation contract with parity and rollback.

Therefore T12 must not wire V1 direct-create as the production Order-create authority.

## T12 implementation created
Added pure, non-routed preflight:
- `cloudflare-d1/src/t12-order-create-preflight.mjs`

Added isolated tests:
- `tests/t12_order_create_preflight.test.mjs`

Added branch-only CI:
- `.github/workflows/trendos-t12-order-create-isolated-ci.yml`

The T12 preflight:
- imports only the pure V2 intent contract;
- does not use D1;
- does not call Apps Script;
- does not read/write Sheets;
- does not use PropertiesService;
- does not call fetch;
- exposes no Worker route;
- is not imported by `index_v2.js`;
- is not imported by legacy `cloud-write.mjs`;
- never authorizes production cutover.

## Qualification evidence
GitHub Actions:
- Workflow: `TrendOS T12 Order Create Isolated CI`
- Run: `35449528052`
- Job: `105914154442`
- Head: `bd5d7fc9bb1a7b181136a1bf05e468682f74065b`
- Conclusion: **SUCCESS**

Runtime-free CI marker:
`T12 isolated fail-closed preflight tests PASS; assertions=20`

## Required evidence gates before any production create cutover
All must independently PASS:
1. `productionVersion155SourceExact`
2. `canonicalCreateParity`
3. `orderAndLineIdAtomicity`
4. `authorizationAndDebtParity`
5. `orderLineAndSummaryParity`
6. `sideEffectAndAccountingParity`
7. `idempotentReplayAndConflict`
8. `timeoutRecoveryNoDuplicate`
9. `d1MirrorAndReadYourWriteParity`
10. `authRevocationAndSessionExpiry`
11. `isolatedRuntimeTests`
12. `rollbackAndReconciliationProven`

Even with all twelve true, the preflight still returns:
`owner-authorized-production-cutover-not-in-scope`

This prevents engineering evidence from silently becoming production authority.

## Rollback plan
Because T12 prep is GitHub-only:
- Production rollback required now: **NONE**.
- Branch rollback: revert T12 commits or delete the isolated branch.
- `main`: unchanged.
- Production Worker: unchanged.
- Production Apps Script Version 155: unchanged.
- Production D1 data/schema/config: unchanged.
- Google Sheets: unchanged.

Future T12 runtime candidate rollback requirements, before any owner-approved canary:
1. Preserve current Apps Script create path untouched as fallback.
2. Keep a hard kill switch that prevents Cloud create routing.
3. Require one idempotency key to map to exactly one Order ID.
4. Cloud candidate must not allocate a production business Order ID until the approved allocation contract is atomic and collision-safe.
5. On timeout/unknown outcome, lookup by idempotency key before retrying.
6. A failed Cloud candidate must fall back before any second authoritative create.
7. No generic outbox drain during create-canary qualification.
8. Rollback must restore frontend create routing without data deletion.

## Current stop point
**T12 GITHUB PREP PASS / PRODUCTION SOURCE EXACTNESS PENDING / NO PRODUCTION CUTOVER AUTHORIZED**

Exact next engineering step:
- obtain byte/function-level evidence for the live Version 155 Order-create path without modifying Production;
- derive a canonical parity matrix for `createManualOrder_`, including Order ID, Line ID, debt/auth, activity log, summary/upsert, queue/data-version, and idempotency behavior;
- build only an isolated Cloud-native candidate after that matrix is complete;
- production mutation remains blocked until explicit owner approval.


## T12 continuation — shadow intent + isolated schema qualification
Additional branch-only artifacts:
- `cloudflare-d1/src/t12-order-create-shadow-intent.mjs`
- `cloudflare-d1/schema-prep/t12-order-create-shadow-v1.sql`
- `tests/t12_order_create_shadow_intent.test.mjs`
- `tests/t12_order_create_shadow_schema.test.mjs`
- `tests/t12_order_create_repo_parity.test.mjs`
- parity matrix: `CLOUD_MIGRATION_V3_T12_ORDER_CREATE_PARITY_MATRIX_2026-09-19.md`

Latest successful isolated CI:
- Run: `35450025684`
- Head: `4f9fad9da2dcd1bdc17affcd758b394b7db07ecc`
- Conclusion: **SUCCESS**
- markers:
  - `T12 isolated fail-closed preflight tests PASS; assertions=20`
  - `T12 repository createManualOrder parity markers PASS; markers=21`
  - `T12 pure shadow-intent planner PASS; no business Order/Line IDs allocated; no runtime wiring.`
  - `T12 shadow schema prep PASS; isolated sqlite constraints and idempotency keys verified.`

The schema is deliberately under `schema-prep/`, not `migrations/`, so it is not part of any automatic/normal Wrangler migration sequence.

The shadow intent deliberately allocates neither a business Order ID nor a Line ID. This avoids dual-authority numeric-ID collision while Google remains able to create orders.

Repository baseline risk evidence:
- V1908 create replay responses are stored in Script Properties under `TRENDOS_CREATE_ORDER_V1908_<requestKey>`;
- repository baseline has no same-key cleanup operation;
- this remains a plausible quota-accumulation mechanism, but live Version 155 root cause is not declared proven without authoritative live-source/property evidence.

No production boundary changed.
