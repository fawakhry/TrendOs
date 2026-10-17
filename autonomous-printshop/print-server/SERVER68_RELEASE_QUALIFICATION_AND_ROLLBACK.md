# SERVER-68 — isolated staging preflight, release authority and rollback
**Date:** 2026-10-16 · **Type:** SOURCE + GitHub Actions dry-run only · **Worker publish:** NONE
**Review branch:** `release/server68-staging-qualification-20261016` · **Draft PR:** [#190](https://github.com/fawakhry/TrendOs/pull/190), stacked on Draft [#187](https://github.com/fawakhry/TrendOs/pull/187) and Draft [#185](https://github.com/fawakhry/TrendOs/pull/185).
**Open issue:** `SEC-AP303-02=OPEN_HIGH`, production exposure not established; do **not** infer this patch protects deployed `trendos`.

## Directly verified source/CI outcomes

| Qualification | Evidence | Result |
|---|---|---|
| Isolated Worker source target | `cloudflare-d1/wrangler.server68-isolated-stage.toml`: `trendos-server68-isolated-stage`, entrypoint `production-shadow/index.js` | PASS (static) |
| Distinct from production | No `routes`, no Cloudflare account, no D1 binding, `workers_dev=false`, all mirror/employee/printshop/write flags OFF | PASS (static) |
| Durable Object source configuration | SQLite DO `MirrorServiceNonceGuardV1`, `MIRROR_SERVICE_READ_REPLAY_DO` class binding + migration; class exported in entrypoint | PASS (source only); **not provisioned** |
| Nonce replay | Atomic single nonce consumption, synthetic concurrent duplicate receipts return `200` + `409` | PASS (Node fake storage); not real Cloudflare storage |
| Other auth/consumer compatibility | SERVER-30, 56, 66, 67 and new SERVER-68 offline tests, synthetic `.invalid`/fake D1 | **142/142 PASS** |
| Wrangler bundle check | [GitHub Actions run 38958797757](https://github.com/fawakhry/TrendOs/actions/runs/38958797757): `npx --yes wrangler@4.149.0 deploy --config cloudflare-d1/wrangler.server68-isolated-stage.toml --dry-run --outdir /tmp/trendos-server68-offline`; output ~905.65 KiB, gzip ~188.44 KiB | **PASS, NO DEPLOY** |
| Cloudflare stage Worker | Not created, never uploaded | **NOT DONE** |
| Real D1, live customer rows, Ubuntu connectivity | No calls made | **NOT TESTED** |

The isolated stage TOML intentionally does not contain any D1 binding or secrets. This validates *bundling/denial only*, not positive read functionality on a real Cloudflare Worker. A future positive-read canary requires a distinct, owner-approved **synthetic D1 database** and synthetic identity secret provisioning, never `trendos-main` at this gate.

## Critical compatibility blockers (NO-GO for the existing worker)
1. `cloudflare-d1/D1_Full_Migration.gs`: `d1FullGet_('/v1/mirror/stats')`; source now includes an **OFF by default** opt-in signer in PR #187. Deployment and trigger configuration of this Apps Script source are not verified.
2. `cloudflare-d1/D1_Orders_Live_Sync.gs`: `/v1/mirror/capabilities` and `/v1/mirror/stats`. These rely on `d1FullGet_` but `D1_API_URL` live value and schedule remain unverified. Test stage+rollback before replacing reads.
3. `cloudflare-d1/D1_Orders_Read_Cutover.gs`: `/v1/mirror/sheet`. Approved service signer limits rows to 100/sheet to protect data, **the old client historically requested `limit=500`**, a now-addressed source mismatch: SERVER-68 updates `d1OrdersReadPageSizeV1_()` to use `100` **only** with explicit secure-client opt-in and retain legacy `500` while OFF. New fake 125-row paging regression checks two `100`-row requests, opt-in revert to 500, and missing-signer fail-closed. Live Apps Script deployment and parity are **NOT VERIFIED**.
4. `.github/workflows/trendos-r5-periodic-controlled.yml`: manual production workflow pins git SHA `b7e85647ac205b93f22e9f9ea1da58b21d54e4c0`, and its post-deployment gate explicitly expects **HTTP 200 from the old `GET /v1/mirror/sheets`**. That code must not be silently reused against a legacy fail-closed deployment; stage an updated R5 qualification workflow with explicit operator review/rollback.
5. Customer bridge V1934 still calls legacy `trendos` for inbox/messages/customer/orders; fallback mock tests passed in SERVER-56/61, but external clients and actual production browser behavior remain unknown. **Frontend fallback != server-side authorization.**
6. Exact `trendos` deployed version prefix `803aa6a2` was observed on Cloudflare and source bundle viewed, but no Git commit/source artifact equality or route/WAF config was verified. `cloudflare-d1/wrangler.toml` instead targets independent `trendos-d1-api`; never cross-target this as a shortcut.

## Deployment authority gates
- **Gate A — Source/CI:** passed for the *isolated config*, 142/142 offline and bundler. Review Draft PR #190 and its stacked dependencies; do not merge or automatically deploy.
- **Gate B — Consumer readiness:** fail until all R5 + Apps Script + customer-manager consumers and external callers are identified with replacement route compatibility, page size, status/error cases, and separate OFF rollback flags. **The 500-to-100 source adapter is written/tested; runtime parity and every other consumer still require sign-off.**
- **Gate C — Worker identity and credentials:** establish read-only version provenance, isolated staging environment and synthetic DB, DO storage/namespace and scope verification, service secret rotation and audit logging without customer identifiers. No token sharing in GitHub or screenshots.
- **Gate D — Negative + positive stage tests:** check anonymous, expired, incorrect role, replay, browser Origin, oversize page, unavailable DB fail before D1; prove approved metadata/rows in synthetic D1 only. Verify that a DO migration is applied and a nonce survives Worker restart as needed.
- **Gate E — Canary and rollback:** snapshot the current deployment's version/source identifiers before change. Test migration order: provision new secure reader disabled → provision authorized clients disabled → synthetic read validation → switch client opt-in on controlled canary → deny legacy GET after clients complete cutover. If failure, turn **off only the new service/client flags and restore approved safe client path**, not blindly redeploy vulnerable legacy code. Each permission/flag/data authority change requires owner review.
- **Gate F — Production approval:** separate owner authorization explicitly naming Cloudflare Worker, change window, version, test plan and rollback owner. Without this, **NO Production deploy, D1 binding, Access/WAF, GitHub merge or Ubuntu live read**.

## Consequence for the owner's requested milestones
- **SERVER-68 code/CI preflight:** PASS.
- **SERVER-68 staging runtime and production go-live:** BLOCKED by Gates B–F.
- **SERVER-69 Ubuntu service connection:** NOT STARTED ON PRODUCTION; offline reader exists (SERVER-33/34), remains default OFF.
- **SERVER-70 one live order:** NOT TESTED; no printing/laser launch.

**Persisted status:** `WRANGLER_DRY_RUN=PASS`; `TESTS=142_OF_142_PASS`; `STAGE_DO_CONFIG=SOURCE_ONLY`; `STAGE_CLOUDFLARE=NOT_DEPLOYED`; `PRODUCTION_CHANGE=NO`; `SEC-AP303-02=OPEN_HIGH`; `R5_COMPATIBILITY=BLOCKED`; `ORDERS_CUTOVER_PAGE_SIZE=PATCHED_SOURCE_ONLY`; `UBUNTU_LIVE=NO`; `PRINT_LASER=OFF`.


## Follow-up SERVER-68B — local real workerd/D1/DO (2026-10-17)
- [GitHub Actions run 39065882866](https://github.com/fawakhry/TrendOs/actions/runs/39065882866) **SUCCESS** with 147/147 offline regressions plus actual loopback Wrangler Worker, synthetic sqlite D1, Durable Object nonce consumption and HMAC read/deny/replay: `SERVER68_LOCAL_REAL_WORKER=PASS; SQLITE_D1_SYNTHETIC=PASS; DO_NONCE_REPLAY=PASS; AUTH_DENY=PASS; NO_REMOTE_DEPLOY=TRUE`.
- Source paths: `wrangler.server68-local-runtime.toml` (unique Worker, fake D1 UUID, no Cloudflare Production), `tests/fixtures/server68_local_mirror_fixture.sql`, `tests/server68_wrangle_local_runtime_smoke.mjs`. First local run failed only because local workerd binary accepted compatibility dates through 2026-10-13; **fixture-only** date reduced from 2026-10-16. Stage/Production manifests are unchanged.
- [Full local runtime proof & limits](SERVER68_LOCAL_RUNTIME_20261017.md). Actual **Cloudflare-hosted Stage remains NOT DEPLOYED**; Durable Object remote storage, service secrets and customer/R5 contracts remain unverified. Distinguish real local workerd from real remote Cloudflare Production.
