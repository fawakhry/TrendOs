# SERVER-82 → 84 — Real synthetic D1 provisioned, linked to UNPUBLISHED Cloudflare stage; production UNCHANGED

**Date:** 2026-10-21 (Egypt, UTC+3). **Owner instruction:** continue the already approved TrendOS/Ubuntu staging integration, using Cloudflare and GitHub, without rebuilding working customer/order systems or importing production rows.

## What has ACTUALLY changed on Cloudflare

- New D1 resource **`trendos-server82-synthetic-20261021`**, created in the existing Cloudflare account around **2026-10-21 16:33 UTC** (19:33 Egyptian time). It contains **exactly one fictional order** `FAKE-S82-ORDER` with **two fictional lines** `FAKE-S82-PRINT` (طباعة, qty=2) and `FAKE-S82-LASER` (ليزر, qty=1), plus minimal synthetic service-reader schema. **No real customers, orders, phone numbers, finance, images or files.**
- The previously created **`trendos-server68-isolated-stage`** Worker was updated on **2026-10-21 ~16:37 UTC**, with **only the new synthetic D1** bound as `DB`, while `workers_dev = false`, `preview_urls = false`, `TRENDOSSHOP_SERVICE_READ_ENABLED = false`, `MIRROR_SERVICE_READ_ENABLED = false`. New active Cloudflare Worker version **`d1a19c15-b745-405f-a926-38148eb12688`**.
- Production **`trendos`** and **`trendos-d1-api`** active versions and D1 binding were not modified by these stage-only actions. The legacy `trendos-d1-staging` was not reused or changed.

## Incident handled: unit test inherited CI credentials and created test D1

1. Initial `SERVER-82` D1 create workflow [Actions #39635430164](https://github.com/fawakhry/TrendOs/actions/runs/39635430164) **FAILED BEFORE CREATION** because Cloudflare D1 list `result_info` legitimately omits `total_pages`. Our overstrict parser incorrectly demanded the field.
2. Fixed the filtered-name D1 list according to Cloudflare D1's documented API (`?name=...`) and added fail-closed duplicate/ignored-filter tests. Next one-shot [Actions #39635791392](https://github.com/fawakhry/TrendOs/actions/runs/39635791392) **FAILED** in the offline-test step, because a test called the live `main(["--create-seed"])` while inheriting the real GitHub Actions Cloudflare token and environment approval. **This unit test unexpectedly created and seeded the new stage-only database** and then failed an assertion. No production database was targeted: the client required the distinct new stage name and a newly allocated database UUID in that execution. **This is still a test isolation defect and must not be described as an all-green isolated test.**
3. Remediation: `test_server82_stage_d1.py` now clears its inherited environment when testing approval-denial (`patch.dict(os.environ, {}, clear=True)`); the workflow's entire unit-test step explicitly sets empty Cloudflare token/account and owner-enabled=false. The executable `--create-seed` **was disabled**; the only remote mode is `--resume-existing`. It verifies the **exact existing** stage D1 name, UUID, creation-time provenance and the two synthetic rows using **SELECT only**. It cannot create a second database or reinsert fake data during resume. New tests prove no INSERT/DDL reaches the resumed database.

## Successful recovery and real post-deploy proof

[**Actions #39636366428**](https://github.com/fawakhry/TrendOs/actions/runs/39636366428) **SUCCESS**, commit `4fba41120338aa34aeb5a73b437cdd6797dfda9d`:
- Exact one-shot/source-parent gate PASS; truly credential-free offline tests PASS.
- Remotely verified existing fake D1 content via **SELECT** only, **no database created** in recovery.
- Prepared D1 binding manifest **in the CI runner only**, never committed D1 UUID, token or temp file to GitHub.
- Wrangler dry-run PASS; actual deployed isolated stage Worker version `d1a19c15-b745-405f-a926-38148eb12688`.
- Cloudflare verified binding type `d1` with the **exact verified stage DB UUID**, both publication flags **false**, both relevant readers **false**.
- No real production worker, order/customer database, R5/Apps Script, physical Ubuntu, spool, printer, laser, local file or API write touched.

[**Independent Cloudflare GET-only Actions #39636769310**](https://github.com/fawakhry/TrendOs/actions/runs/39636769310), commit `8f84469c35bb776c04c5dc9f92da0076930952aa`, **SUCCESS**:
- Verified **stage DB name exactly `trendos-server82-synthetic-20261021`** via read-only Cloudflare D1 metadata API; confirmed stage `DB` binding and unpublished status plus disabled readers. Does **NOT** query customer/production tables.
- Compared active production Worker Cloudflare version IDs against prior verified baseline, **UNCHANGED**:
  - `trendos` `803aa6a2-bb4…`
  - `trendos-d1-api` `2b40f622-60c…`
  - new isolated stage `d1a19c15-b74…`.

## Vital source/deployment divergence

The repository's **`cloudflare-d1/wrangler.server68-isolated-stage.toml` still intentionally has NO D1 binding**. The live stage **does** have the verified synthetic binding, created using a temporary CI-only manifest from `server82_stage_d1.py`. This protects resource IDs and production access in the repo, **but means a future direct deployment of the plain stage TOML might remove the stage DB binding**. Therefore, DO NOT run `wrangler deploy --config cloudflare-d1/wrangler.server68-isolated-stage.toml` against the live stage again without independently checking and reapplying the intended synthetic D1 binding; never substitute `cloudflare-d1/wrangler.toml` or `trendos-main`. Treat any stage deployment as an explicit change with verification and rollback.

## What remains before TrendOS ↔ physical Ubuntu

**D01:** Worker + synthetic stage D1 EXISTS and is unpublished. Still no **independently confirmed private Cloudflare Access route/policy**, nor a remote authenticated service read acceptance check. Therefore **D01 remains NO_GO for live connectivity**.

**D02:** no dedicated short-lived, rotating service principal token configured; stage reader flag OFF. DO binding alone does not grant permission to use stage.

**D03/D04:** existing R5/Apps Script consumers, old risky legacy GET boundary, production version-to-Git parity, narrow-release and rollback still require independent change control. Production Worker source was NOT upgraded.

**D05/D06:** user physical Ubuntu host/session + one owner-selected real order not executed. No printer or laser commands.

**Real state:** `STAGE_WORKER_LIVE=YES`; `ISOLATED_SYNTHETIC_D1_LIVE=YES`; `STAGE_D1_BOUND=YES`; `WORKERS_DEV/PREVIEWS=OFF`; `STAGE_ORDER_READ=OFF`; `PRODUCTION_WORKERS_UNCHANGED_AS_VERIFIED=YES`; `CUSTOMER_DATA_ACCESSED=NO`; `PHYSICAL_UBUNTU_CONNECTED=NO`; `REAL_ORDER_READ=NO`; `D01_D06_FULL_GO=NO`. Existing `SERVER69_RELEASE_DECISIONS.json` continues to default deny.
