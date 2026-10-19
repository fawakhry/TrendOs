# SERVER-78 — One consolidated six-stage Cloudflare → Ubuntu qualification pass

**Owner direction, 2026-10-20:** combine D01–D06 into one continuous workstream, do not redo completed TrendOS/cloud printshop features. Defer any individual decision needing owner/physical/cloud authority and continue independently executable gates. **One workstream does not erase six actual release evidence requirements.** The authoritative owner queue remains `SERVER69_RELEASE_DECISIONS.json`; this is an execution/evidence receipt, not a replacement queue.

## What truly ran

The unified GitHub Actions workflow `.github/workflows/server78-unified-six-stage-cloudflare-ubuntu-handoff.yml`:
1. Audits the existing six source decisions and fail-closed Cloudflare staging contracts via `server73_six_stage_readiness.mjs`. The `--gate` result **must** be exit code 2 (NO_GO); a false GO fails CI.
2. Reuses the **existing** SERVER-76/77 reader→employee print/laser preview, with fake data, only complete bounded pages; does not launch the user's Print Server.
3. Runs dedicated read-only/credential-leak regression tests for `server78_unified_six_gate_reality.py`.
4. With the **already configured GitHub Actions Cloudflare secrets**, requests bounded **HTTPS GET-only** Cloudflare Worker *deployment metadata*, *deployed script content markers* and **type/name-only** D1/service principal binding metadata. No secret value, Worker source, order/customer data or D1 identifier is printed. Neither Cloudflare nor the physical Ubuntu machine is modified.
5. Publishes a redacted `SERVER78_UNIFIED_RELEASE_REPORT` with six `DEFERRED_NO_GO` gates. CI success represents **audit execution**, not production readiness.

First verified actual run [GitHub Actions #39336869868](https://github.com/fawakhry/TrendOs/actions/runs/39336869868), commit `27a7c1c2499192f8ada7748df2312c9cfeb08dd5`: **SUCCESS**; synthetic SERVER-76 15/15, SERVER-77 10/10, unified reality 12/12, source 6-gate NO_GO as expected, Cloudflare live remote metadata GET succeeded. A follow-up fix deliberately **removes raw deployed-content SHA256 from the report**, because Cloudflare `content/v2` may be multipart with a varying boundary; hashing that envelope incorrectly suggests code changed or matches a particular active version. Source/active-version provenance therefore remains **NOT_PROVEN**, intentionally.

## Active-version identity upgrade (no deployment)

[Updated consolidated Actions #39337402609](https://github.com/fawakhry/TrendOs/actions/runs/39337402609), source/test commit `3d82681051c5a8c65fea466ace67c2c5b6e29548`: **SUCCESS**. Python SERVER-76 **15/15**, SERVER-77 **10/10**, SERVER-78 **15/15**. Cloudflare real **GET-only version detail** independently confirms that the deployment's reported 100%-active `version_id` matches the fetched `/versions/{version_id}` response:
- `trendos` 100% active prefix `803aa6a2-bb4`, version-specific script ETag prefix `8b1ea578cea9` (metadata source `wrangler`).
- `trendos-d1-api` 100% active prefix `2b40f622-60c`, version-specific script ETag prefix `ab8bcbce0265` (metadata source `api`).
- **This verifies identity of Cloudflare's active version, NOT which Git SHA compiled it, nor what routes are live with customer authentication.** No Cloudflare updates or remote customer data queries. Failing intermediate CI on the un-updated fake-version fixture was corrected; the cited latest consolidated run is successful.

## Newly verified live Cloudflare findings

| Object | Concrete live Cloudflare GET evidence | Release implication |
|---|---|---|
| `trendos-d1-api` | Active deployment recorded 2026-10-10; 100% active version prefix `2b40f622-60c`. Deployed-script source includes `/v1/edge/orders/02cr/page`, `/v1/edge/orders/service/page`, `/v1/edge/customers/search`. Runtime Worker settings include a `DB` binding of type `d1`. | **Reuse this existing authoritative order/customer Worker and D1.** Do not build/copy an alternative database. |
| Printshop reader on `trendos-d1-api` | `/v1/printshop/service/orders/page` marker **ABSENT** in current downloaded script, `TRENDOSSHOP_SERVICE_READ_ENABLED` binding **ABSENT**, reader SHA256 digest/principal bindings **ABSENT**. | Real dedicated Ubuntu-to-TrendOS authorization is **NOT LIVE**. The source-only endpoint in GitHub does not replace a controlled Cloudflare release. |
| Signed mirror service | `/v1/service/mirror/stats` marker **ABSENT** in downloaded production `trendos-d1-api` script and replay DO binding **ABSENT** in checked Worker settings. | R5/Apps Script legacy consumers cannot yet safely depend on it. |
| `trendos` | Distinct smaller Worker, active at 100%; no relevant printshop route source markers. | Do not deploy printshop source to wrong Worker. |
| `trendos-d1-staging` | Historic stage exists; 100% active version. | **Do not overwrite**: existing 11 tables and missing independent Access already recorded. |
| `trendos-server68-isolated-stage` | Cloudflare deployment metadata GET returned **404 NOT_FOUND**. | Protected isolated stage source exists locally but remote stage **NOT PROVISIONED**. Do not misreport it as deployed. |

**Not proven:** active Cloudflare version byte-for-byte parity with any Git commit, exact runtime route handler behavior under authenticated identity, live Apps Script trigger inventory, legitimate live Ubuntu machine context or traffic. A missing marker is source-content evidence, not a permission to probe customer records.

## Single ordered action queue, decisions deferred without repeating code

1. **D01 `DEFERRED_NO_GO`** — protected isolated stage (new Worker, synthetic D1, private Access); not provisioned, needs verified account/policy/approval.
2. **D02 `DEFERRED_NO_GO`** — short-lived stage-only machine principal, secret rotation, replay DO, verify server-side denial; actual service identity not configured in production settings.
3. **D03 `DEFERRED_NO_GO`** — five repository-known old reader consumers are source-inventoried, but real R5/Apps Script traffic/trigger migration not proven. Preserve existing R5 pinned-historic-workflow behavior until qualified replacement; avoid breaking operations.
4. **D04 `DEFERRED_NO_GO`** — prove exact `trendos-d1-api` active version↔source parity and secure rollback; separately approve narrow Worker release that adds *only* needed source, protects legacy reads and avoids customer data exposure (`SEC-AP303-02` remains open).
5. **D05 `DEFERRED_NO_GO`** — connect the **real physical Ubuntu host**, with constrained short-lived credentials, outbound-only HTTPS, devices OFF, one supervised read-only call. GitHub Actions runner is **not** the user's Ubuntu machine.
6. **D06 `DEFERRED_NO_GO`** — verify one owner-selected real order's print/laser line identities against the TrendOS authoritative state, no printing/laser/device commands.

**Subsequent physical file dispatch phase:** existing employee queue and local folder workflow may then stage _approved_ files on a separately qualified shop-connected workstation, with R2 provenance, file hashes verified **on the target host**, employee approval, and a safe secure link to the Win7 laser site. No new file storage or website required; the network topology (Ubuntu last verified at home) and device controls are a separate acceptance gate.

## Strict outcome

`UNIFIED_PIPELINE_IMPLEMENTED=YES`; `CLOUDFLARE_REAL_METADATA_READ=YES`; `PRINT_LASER_READER_PREVIEW_OFFLINE_TESTED=YES`; `SIX_LIVE_RELEASE_STAGES_COMPLETED=NO`; `LIVE_UBUNTU_LINK=NO`; `REAL_CUSTOMER_ORDER_READ=NO`; `CLOUD_DEPLOY=NO`; `FILES_TRANSFERRED=NO`; `PRINTER/LASER_OPERATION=NO`. All decisions stay in the existing six-decision queue (not duplicated).

## SERVER-79 continuation — actual Workers.dev publication posture (2026-10-20)

**Proven Cloudflare GET-only:** [unified SERVER-78 CI #39338324836](https://github.com/fawakhry/TrendOs/actions/runs/39338324836), code SHA `cc7adfc5b164374ee4b40e4161668a25fbb10dc0`, **SUCCESS**: existing 15/15 SERVER-76 preview, 10/10 SERVER-77 integration, and **19/19 SERVER-78/79 posture** regressions. The same run verified current Workers.dev `GET /accounts/{account_id}/workers/scripts/{name}/subdomain` booleans without querying any order/customer/D1 row:

| Worker | Workers.dev published | Preview URLs published | Qualification |
|---|---|---|---|
| `trendos` | **true** | **true** | Existing live service; Access/WAF and any row exposure **NOT VERIFIED** |
| `trendos-d1-api` | **true** | **true** | Existing orders/customer Worker; no private machine route deployed, Access/WAF not verified |
| `trendos-d1-staging` | **true** | **true** | **DO NOT REPURPOSE** as protected isolated stage: public workers.dev publication and preexisting D1 tables |
| `trendos-server68-isolated-stage` | **NOT FOUND** | **NOT FOUND** | Dedicated protected stage **NOT PROVISIONED** |

**Interpretation:** `workersDevPublished=true` verifies a Workers.dev deployment URL exists. It **does not prove** any customer/order data are accessible without credentials; no such request has been made. Similarly `workersDevPublished=false` would **not** independently prove Cloudflare Access or private route integrity. The new report explicitly marks `cloudflareAccessVerified=false` and `publicDataExposureProven=false` and annotates D01 and D04 as `DEFERRED_NO_GO`.

**Next independent actions:** Do not enable an unverified production service principal; first qualify a new exact private stage with independent Access, synthetic D1 and DO, then prove deployed source/rollback and old R5/App Script callers with existing endpoint compatibility. The operator's real Ubuntu location/network and one approved real order remain separate from Github-hosted CI. No stage or prod deployment was attempted by this review.

