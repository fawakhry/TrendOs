# PERF-CF-02A — Cloudflare Preview Safety / Auto Deploy

Date: 2026-09-04 Africa/Cairo
Branch: `agent/go-live-2026-09-01-integrity`
Lane: `PHASE 1 — TRENDOS CORE + CLOUD / PERFORMANCE`

## Result

**PASS — isolated Cloudflare Preview deploy and runtime safety gate verified. No production traffic cutover.**

## Expected

1. Existing GitHub/Cloudflare automation must be usable without recreating credentials.
2. Preview must not apply D1 migrations.
3. Cloudflare business-write lane must remain explicitly OFF.
4. Cloud-write health must be read-only and must not initialize schema.
5. Anonymous protected Edge requests must fail closed.
6. A Cloud-write mutation request while the lane is OFF must fail closed without D1 mutation.
7. Apps Script + Google Sheets remain authoritative for writes.
8. `config.js`, GitHub Pages, Version 146, Script Properties, triggers, business flags, Registry, source Sheets, and `Code.gs` must remain unchanged.

## Discovery / hardening before PASS

The pre-existing Preview workflow was not sufficiently isolated for this contract:

- it contained a remote `d1 migrations apply` step against the configured `trendos-main` binding;
- the existing Cloud-write health/handler could call schema initialization before the write kill switch, so a nominal health/disabled request could perform DDL.

These were treated as safety defects in the Preview path and corrected before accepting any successful Preview run. This checkpoint does **not** infer that any historical run actually mutated D1; it records the code-path risk and the verified final behavior.

## Implemented safety changes

- Removed all D1 migration application from `.github/workflows/trendos-cloudflare-edge-preview.yml`.
- Added fail-closed `cloudflare-d1/src/cloud-write-gate.mjs`:
  - read-only health uses SELECTs only;
  - when `TRENDOS_CLOUD_WRITE_V1_ENABLED=false`, mutation routes return 423 before legacy schema/write code;
  - if write is ever explicitly enabled later, Edge authentication is required before delegation.
- Routed `cloudflare-d1/src/index_v2.js` through the safety gate.
- Added `tests/cloudflare_preview_safety_v1.test.mjs`.
- Added dedicated `cloudflare-d1/preview/wrangler.toml`:
  - Worker `trendos-edge-gateway-preview`;
  - `TRENDOS_CLOUD_WRITE_V1_ENABLED="false"`;
  - existing `trendos-main` is bound for read verification only;
  - no `migrations_dir`.
- Replaced the hanging direct `npx wrangler` CI path with official `cloudflare/wrangler-action@v3`.
- Added runtime propagation retry and post-deploy probes.

## Relevant commits

- `855ef4be7df08948b3ddd0b6bfb6d733c050fda0` — remove Preview D1 migration behavior.
- `6d8d50732f9c8152ee2d61854972fde2f52c7c30` — fail-closed Cloud-write gate.
- `ccf6f6eddc03e24a8fe2cf098f0d503eca36b887` — initial Preview safety test.
- `5b650a6e8e58eb3a2d4a99fb950d67990fed49f8` — route Cloud writes through gate.
- `0621bd570a9fa9ba9e1dfdede5c28c3f6a446cab` — runtime safety probes.
- `28fa2b505cb1671986af2a4506a63c7718943d92` / `4c96cccc88e2ecd4b0bcdbc6c7b6286d252c2c32` — fix migration-guard false positive.
- `14a9d7cde5b10ad018ab27ebd26963276905cf53` — bounded non-interactive attempt; direct npx path later replaced after timeout evidence.
- `7a815bc38f82da640e858993e609c12c38190fd1` — isolated Preview Wrangler config.
- `d6ce49395f2294ffc9e7f3d627b57ca224984530` — Preview config safety assertions.
- `2219cea1f3ac6d99532e7bdfa10bc416a7ec2497` — official Cloudflare Wrangler Action.
- `748e7752be20f79f9ee2183ce20b9a9ec1102313` — hardened runtime propagation checks; final verified PASS head for this checkpoint.

## Transient CI evidence

- Run `33816897560`: failed before deploy only because the safety regex matched its own guard text. No Cloudflare deploy occurred.
- Run `33817348003`: all prechecks passed but direct `npx wrangler deploy` timed out after 180 seconds without output. This was a CI invocation/tooling failure; no production cutover occurred.
- Run `33817730510`: official Cloudflare action successfully uploaded secret and deployed Preview; immediate health request returned 404 before propagation, so the runtime gate correctly remained non-PASS.

## Final verified runtime evidence

GitHub Actions:

- Workflow: `TrendOS Cloudflare Auto Preview`
- Run: `33817812642`
- Job: `100853724981`
- Head: `748e7752be20f79f9ee2183ce20b9a9ec1102313`
- Result: **SUCCESS**

Cloudflare Preview:

- Worker: `trendos-edge-gateway-preview`
- URL: `https://trendos-edge-gateway-preview.trendmall-contact.workers.dev`
- deployed Version ID: `1de87702-393c-4388-8070-63e2c36c0562`
- D1 binding: `trendos-main`
- Cloud write flag: `TRENDOS_CLOUD_WRITE_V1_ENABLED="false"`

Runtime probes:

### Edge health — PASS

HTTP 200 on first final-run attempt:

```json
{"success":true,"service":"trendos-edge-gateway-v1","database":true,"authConfigured":true,"upstreamConfigured":true,"cutover":false}
```

### Anonymous protected Edge route — PASS

`GET /v1/edge/whoami` returned HTTP 401:

```json
{"success":false,"message":"Unauthorized edge session","code":"invalid-token-format"}
```

### Cloud-write health — PASS / READ-ONLY

HTTP 200:

```json
{"success":true,"service":"trendos-cloud-write-v1","database":true,"enabled":false,"authConfigured":true,"writesAccepted":false,"schemaReady":false,"pendingOutbox":null,"schemaMutationFree":true,"cutover":false,"sheetsAuthoritative":true}
```

### Mutation route while OFF — PASS / FAIL-CLOSED

`POST /v1/cloud/orders` returned HTTP 423:

```json
{"success":false,"message":"Cloud write lane is installed but disabled","enabled":false,"cutover":false,"sheetsAuthoritative":true}
```

## Actual production impact

**NONE to the serving platform.**

- Production Apps Script remains Version 146.
- Master + HEALTH remain ON only.
- ORDER_LINE / ATTENDANCE_CLEANING / PRESS / INVOICE / WHATSAPP / OPS / AUTOMATION remain OFF.
- Fast Auth remains OFF/absent.
- Apps Script + Google Sheets remain authoritative writes.
- No frontend traffic was cut over.
- `config.js` and GitHub Pages were not changed.
- No source Sheet, Script Property, trigger, Registry state, or `Code.gs` was changed.
- CORE-P0 `3536-01` lane remains paused and untouched.

## Rollback

No production rollback is required because production traffic was not changed. Preview rollback is limited to redeploying a prior Preview Worker version or removing the Preview Worker if necessary; do not alter production merely to roll back this Preview checkpoint.

## Exact next step

**PERF-CF-02B — read-only performance/parity qualification of the Preview path.**

1. Measure repeated Preview Edge/D1 read latency.
2. Inspect/verify D1 freshness and Orders+Lines source-snapshot/parity mechanisms already present in the repository.
3. Verify authenticated-session/fallback contracts without logging or inventing employee credentials.
4. Identify the highest-cost frontend polls and prepare visibility-aware/coalesced read migration on the working branch only.
5. No Production read cutover until a separate gate has Worker health, D1 parity/freshness, auth, Apps Script fallback, performance evidence, and rollback.