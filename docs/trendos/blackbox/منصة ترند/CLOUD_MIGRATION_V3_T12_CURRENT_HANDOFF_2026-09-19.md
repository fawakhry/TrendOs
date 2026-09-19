# Cloud Migration V3 — T12 CURRENT HANDOFF — 2026-09-19

## Status
**T12 GITHUB-ONLY ENGINEERING PASS / ISOLATED SHADOW CREATE QUALIFIED / PRODUCTION UNCHANGED / LIVE VERSION 155 EXACT SOURCE STILL PENDING**

## Repository / branch
- Repository: `fawakhry/TrendOs`
- T12 isolated branch: `cloud-migration-v3-t12-order-create-ci-20260919`
- T12 base: `f07cc56501fba1c29c0ef72cccda78e494935373`
- Qualified code head before this handoff: `b1d506ca076651907e80dd1bce53829b5ba6d89f`
- Production frontend `main`: unchanged at `02ce4a11fdd822e75906d4fadc4bc0dca3dea9a9`

## Production boundary
No Production mutation occurred.

Unchanged:
- Apps Script production deployment/version;
- production Google Sheets data;
- Script Properties;
- triggers;
- Cloudflare production Worker;
- D1 production schema/data;
- Worker vars/secrets;
- frontend `main`;
- business-write authority.

Current authority remains:
- Google Sheets / Apps Script authoritative for business writes;
- D1-first reads retained according to T11;
- no Order-create authority transfer.

## Version 155 evidence
Owner-provided live Apps Script Executions UI on 2026-09-19 showed Web App `Version 155`.

But no authoritative byte/function export of live Version 155 source has been obtained in this T12 lane. Therefore:
- `productionVersion155SourceExact = PENDING`;
- repository `Code.gs` is a comparison baseline only;
- T12 does not assume repo source equals deployed Version 155.

## Repository create-order findings
Repository baseline `createManualOrder_` includes:
- authorization and create permission;
- global ScriptLock;
- V1908 request-idempotency replay;
- registered/external customer identity;
- debt lookup/restriction annotation;
- department / heat-press / fly-print normalization;
- recent duplicate guard;
- open-order reuse and age policy;
- numeric business Order ID allocation via Script Properties;
- line-number allocation from existing source rows;
- multi-department split;
- order-summary write/resync;
- line writes;
- activity log;
- Trend Master queue;
- data-version bump;
- saved-response replay.

Repository baseline also stores V1908 saved create responses under:
`TRENDOS_CREATE_ORDER_V1908_<requestKey>`

No same-key cleanup was found in the repository baseline. This is a plausible quota-accumulation mechanism relevant to the 2026-09-19 PropertiesService incident, but is not declared the proven live Version 155 cause.

## ID authority blocker
A concurrent production canary cannot safely let Apps Script and D1 independently allocate the same numeric business Order ID namespace.

T12 therefore does **not** allocate business Order IDs or Line IDs in its current Cloud shadow lane.

The future production create-cutover must establish an exclusive allocation-authority boundary before the first authoritative Cloud create.

## T12 branch-only implementation
Added:
- `cloudflare-d1/src/t12-order-create-preflight.mjs`
- `cloudflare-d1/src/t12-order-create-shadow-intent.mjs`
- `cloudflare-d1/src/t12-order-create-shadow-store.mjs`
- `cloudflare-d1/t12-preview/order-create-shadow-handler.mjs`
- `cloudflare-d1/schema-prep/t12-order-create-shadow-v1.sql`
- `tests/t12_order_create_preflight.test.mjs`
- `tests/t12_order_create_repo_parity.test.mjs`
- `tests/t12_order_create_shadow_intent.test.mjs`
- `tests/t12_order_create_shadow_schema.test.mjs`
- `tests/t12_order_create_shadow_store.test.mjs`
- `tests/t12_order_create_shadow_handler.test.mjs`
- `.github/workflows/trendos-t12-order-create-isolated-ci.yml`

Documentation:
- `CLOUD_MIGRATION_V3_T12_ORDER_CREATE_GITHUB_PREP_PASS_2026-09-19.md`
- `CLOUD_MIGRATION_V3_T12_ORDER_CREATE_PARITY_MATRIX_2026-09-19.md`

## Safety design
The T12 shadow path:
- is default OFF;
- is not wired into `src/index_v2.js`;
- is not wired into `production-shadow/index.js`;
- is not referenced by production `wrangler.toml`;
- uses a dedicated schema under `schema-prep/`, not `migrations/`;
- touches only `t12_*` shadow tables in isolated tests;
- requires Edge auth when its isolated HTTP handler is explicitly enabled;
- allocates no production Order ID;
- allocates no production Line ID;
- never reports Production cutover authority.

## Latest isolated CI
Workflow: `TrendOS T12 Order Create Isolated CI`

Latest qualified run:
- Run: `35450375982`
- Head: `b1d506ca076651907e80dd1bce53829b5ba6d89f`
- Conclusion: **SUCCESS**

PASS markers:
- `T12 isolated fail-closed preflight tests PASS; assertions=20`
- `T12 repository createManualOrder parity markers PASS; markers=21`
- `T12 pure shadow-intent planner PASS; no business Order/Line IDs allocated; no runtime wiring.`
- `T12 shadow schema prep PASS; isolated sqlite constraints, idempotency keys, and rollback atomicity verified.`
- `T12 isolated D1 shadow store PASS; auth gate, atomic batch, replay, conflict and rollback verified.`
- `T12 isolated shadow HTTP handler PASS; default-off, auth, idempotency, conflict, no production wiring.`

## Rollback
Current T12 rollback is repository-only:
1. revert T12 commits or delete the T12 branch;
2. no Production rollback is required because Production was not changed.

Any future production canary must preserve:
- current Apps Script create path until the authority boundary is switched;
- a hard Cloud-create kill switch;
- lookup-before-retry by idempotency key;
- exact one request key -> one business Order ID;
- atomic Order + Lines creation;
- read-your-write verification;
- rollback routing without deleting business data;
- no generic outbox drain during qualification.

## Exact current stop point
**T12 isolated Cloud shadow-create engineering is qualified in GitHub. Production create cutover is blocked only at the next evidence boundary, not by missing branch scaffolding.**

Next technical work that does not mutate Production:
1. obtain authoritative live Version 155 create-function/source evidence;
2. complete exact parity reconciliation against the repo matrix;
3. design and test exclusive business Order-ID authority transfer;
4. add isolated authoritative-create candidate tests only after 1-3;
5. keep Production mutation blocked until explicit owner decision.
