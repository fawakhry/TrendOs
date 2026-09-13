# TrendOS Tasks V3 Review Checkpoint — 2026-09-13

## Production recovery state

- Owner rolled the production Apps Script Web App back from breaking Version 156 to the immediately previous deployed version.
- Exact rollback target version was not independently observed and is intentionally not guessed.
- Owner confirmed the platform became operational again after rollback.
- Production frontend baseline remains `de4d1c010aac521f8e5105c5677c1e0fdd78ca25`.
- Edge Orders Read remains OFF in production frontend, so order reads do not wait on the previously failing Edge session path before Apps Script fallback.

## Review scope completed

Read-only review covered:

- production spreadsheet code archive `سكريبت Apps Script!A1:A8237`,
- current GitHub `Code.gs`,
- current frontend `app.js`,
- Operator Task V2 backend,
- Operator Task V2 Edge proxy,
- Work Queue V1,
- Cloudflare Edge Gateway,
- Cloudflare Operator Task V2 handler,
- previous activation/incident evidence.

Audit report:
`docs/trendos/PLATFORM_CODE_AUDIT_2026-09-13.md`

Architecture plan:
`docs/trendos/TASKS_V3_ISOLATION_AND_PLATFORM_PERFORMANCE_PLAN_2026-09-13.md`

## Validated static audit

Workflow:
`TrendOS Static Source Audit`

Corrected run:
`34741024381` => SUCCESS

Head:
`0ec3e9a56dc92cc09b3389208527e7dd04d2f83a`

Validated source metrics:

- `Code.gs`: 12,025 lines; 628 lexical named function declarations.
- `app.js`: 10,842 lines; 806 lexical named function declarations.

Duplicate lexical declarations are review signals only because some functions are scoped; they are not automatically classified as runtime collisions.

Key hot-path evidence includes repeated full-sheet/full-range reads and schema/setup helpers in read/auth-style functions.

## Tasks V3 T0

Review branch:
`tasks-v3-isolation-review-20260913`

Read-only isolated bridge source:
`tasks-v3-bridge-readonly.gs`

Contract test:
`tests/tasks_v3_readonly_bridge_contract.test.mjs`

Workflow:
`TrendOS Tasks V3 T0 Contract`

Run:
`34741113625` => SUCCESS

Head:
`579e08c1dad4ad199fac04f43c43a90292814c58`

T0 contract guarantees:

- separate-project source only;
- no main `authorize_` dependency;
- no main `findUser_` dependency;
- no main `updateLine_` dependency;
- no direct `بنود الأوردرات` dependency;
- no sheet creation;
- no cell/range writes;
- no row append/delete/clear;
- no Script lock;
- no full `getDataRange()` scan;
- only signed read-only operations: health, status, Fly Print lane, Press candidates;
- no Task mutation routes in T0 source.

No production deployment occurred.

## Main platform performance findings

1. `getRowsPageV1931_` authorizes the request, then calls `getRows_`, which authorizes again. This is redundant auth/users-sheet work.
2. `getRowsPageV1931_` performs response pagination after `getRows_` has already built the complete allowed rows set; it is not storage-level pagination.
3. `getRows_` reads order lines plus customer/debt projections before filtering/slicing in page endpoint.
4. debt restriction reads currently enter an ensure-sheet helper.
5. customer phone/debt map reads currently enter a debt-header ensure helper.
6. `authorize_` can turn invalid/expired session verification into a token-clearing write.
7. several accounting/customer/health-style reads enter ensure/create helpers.

## Locked architecture decision

Do not republish Tasks V2 into the main Apps Script project/router.

Tasks V3 must use a separate Apps Script project + separate Web App deployment and a dedicated operational index/ledger. The main production Apps Script stays isolated from Task rollout.

## Next safe stage

T1 requires provisioning a separate Google Apps Script project/deployment for Tasks V3 (or an equivalent isolated runtime) and a non-production/index fixture for qualification. This requires an authenticated Google owner action; the current browser automation session does not have the owner's Google sign-in.

Before any production Task mutation, T2 read-only Wael canary must pass. Claim/complete remain a separate explicit owner decision after T2.

## Safety boundary retained

- no `EDGE_SESSION_SECRET` rotation/change;
- no `TRENDOS_OPERATOR_TASK_PROXY_SECRET` change;
- no Gaber Material Control enablement;
- no D1 migration;
- no RP-08;
- no production Task mutation;
- Sheets remain authoritative;
- no main Apps Script Task router patch;
- no production Apps Script performance patch from this review branch.
