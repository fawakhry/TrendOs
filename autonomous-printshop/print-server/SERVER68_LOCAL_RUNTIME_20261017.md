# SERVER-68 — actual Cloudflare Worker local-runtime qualification (2026-10-17)
**Branch/PR:** `release/server68-staging-qualification-20261016` / [Draft PR #190](https://github.com/fawakhry/TrendOs/pull/190) (stacked over #187 and #185).
**Status:** local real-runtime synthetic PASS; Cloudflare account/prod untouched. `SEC-AP303-02` remains **OPEN HIGH**.

## Verified output
[GitHub Actions run 39065882866](https://github.com/fawakhry/TrendOs/actions/runs/39065882866): `SERVER-68 Isolated Stage Preflight (No Deploy)` SUCCESS. Job log records:
- `# tests 147`, `# pass 147`, `# fail 0` for Node synthetic source/auth/consumer checks.
- `wrangler@4.149.0 deploy --dry-run` succeeded on **stage-only config** `cloudflare-d1/wrangler.server68-isolated-stage.toml`; no upload/deploy.
- **New actual local Worker runtime**: `SERVER68_LOCAL_REAL_WORKER=PASS; SQLITE_D1_SYNTHETIC=PASS; DO_NONCE_REPLAY=PASS; AUTH_DENY=PASS; NO_REMOTE_DEPLOY=TRUE`. The integration test uses `wrangler dev --local` on `127.0.0.1:8795`; `wrangler d1 execute --local` seeds an isolated temporary SQLite fixture with fake order `FAKE-ORDER-0001`. The scripted smoke verifies both negative HTTP auth and authorized HMAC service reads including fake D1 rows; a repeated signed request returns 409 from actual local Durable Object; no Worker remote URLs or customer data were accessed.
- [Companion actions for same code SHA](https://github.com/fawakhry/TrendOs/commit/93dd4260d60052e040a61c7317b7705c31da3abf): autonomous printshop policy CI SUCCESS; SERVER-67 scoped read CI SUCCESS; A61 transport CI SUCCESS.

## Recovery from the initially failed local emulation
[Initial run 39065826023](https://github.com/fawakhry/TrendOs/actions/runs/39065826023) failed **only at the new local-runtime test**: installed `workerd` embedded in `wrangler@4.149.0` supported compatibility dates through `2026-10-13`, but local test manifest requested `2026-10-16`. The 147 Node tests and stage dry-run passed before that failure. The fixture-only `cloudflare-d1/wrangler.server68-local-runtime.toml` compatibility date was lowered to `2026-10-13`, leaving the original stage config and production config unchanged. Next run passed actual Worker runtime. This is NOT evidence that Production needs its compatibility date changed.

## Strict isolation
- `cloudflare-d1/wrangler.server68-local-runtime.toml`: Worker `trendos-server68-local-only`, `workers_dev=false`, non-routable localhost; D1 binding name `trendos-server68-offline-fixture`, fixture UUID `11111111-1111-4111-8111-111111116868` **not** `trendos-main`.
- `tests/fixtures/server68_local_mirror_fixture.sql`: fake sheet names/orders, no customers, no phone numbers; temporary persisted Wrangler SQLite under Node `mkdtemp` in CI and deleted after test.
- The only HMAC keys used are literal fake development fixture strings passed to `wrangler dev --local --var`; no Cloudflare API token/account ID, and GitHub Actions job never invokes `wrangler deploy` except `--dry-run`.
- **Not a Cloudflare-hosted Stage test**, not real Cloudflare Durable Object storage migration, and not proof that `trendos` version `803aa6a2` source/access is secured. No actual Ubuntu order read or printer activation.

## Pending gates before owner-approved Cloudflare Stage/Production
1. Obtain explicit authorization to create **separate** non-production Worker + DO + synthetic D1 on Cloudflare, with no access to `trendos-main` and no publicly routable service until ready.
2. Validate stage app source and storage persistence under real Cloudflare remote runtime, role-scoped credentials, expired/replayed/invalid HMAC, disabled flags, and test-only read; no customer data.
3. R5 production workflow remains pinned to legacy SHA `b7e85647...` and expects `/v1/mirror/sheets` 200 without auth. Do NOT run/modify production workflow to deploy security gate until its checks and operator rollback are redesigned and independently reviewed.
4. Real Apps Script installed code/triggers, `D1_API_URL`, external consumers, and exact legacy `trendos` Worker source/auth/WAF remain unverified; verify compatibility on stage and plan rollback per consumer.
5. Explicit owner go/no-go for Production worker, change window, bound credentials, disable/rollback procedure, then separate authorization for live Ubuntu connection and first controlled order.

**Outcome:** `LOCAL_WORKER_REAL_RUNTIME=PASS`; `LOCAL_D1_SYNTHETIC_READ=PASS`; `LOCAL_DO_REPLAY=PASS`; `SOURCE_CI=147_OF_147_PASS`; `STAGE_DRY_RUN=PASS`; `REMOTE_STAGE=NOT_DEPLOYED`; `PRODUCTION_CHANGE=NO`; `SEC-AP303-02=OPEN_HIGH`; `UBUNTU_REAL=NOT_CONNECTED`.
