# SERVER-70 — Legacy D1 read consumers and Apps Script signed-read migration readiness

**Date:** 2026-10-18. **Scope:** Source-only / offline tests. **Authoritative change gate:** D03 in `SERVER69_RELEASE_DECISIONS.json` is **PENDING**, not approved. **Review PR:** [#190](https://github.com/fawakhry/TrendOs/pull/190). No Google Apps Script project modified, no live customer D1, no Cloudflare/WAF/Access change, no production Worker deployment, no Ubuntu call.

## Source-derived inventory (5 repository-known callers)
| Source consumer | Legacy GETs in repository code | Replacement candidate | Live state / release consequence |
|---|---|---|---|
| **R5 periodic controlled** `.github/workflows/trendos-r5-periodic-controlled.yml` | `/v1/mirror/sheets`; pinned old git SHA; checks HTTP **200** after **Production** Wrangler deploy | SERVER-68K HMAC metadata `/v1/service/mirror/sheets` source-only helper | Old production workflow **still unchanged**. Cannot deploy fail-closed 403 without reviewing this dependency and its emergency deploy action. |
| **D1 full migration** `cloudflare-d1/D1_Full_Migration.gs` | `/v1/mirror/stats` | SERVER-67 opt-in signer `D1_Mirror_Service_Read_V1.gs` | Script Property `D1_MIRROR_SERVICE_READ_V1_ENABLED` default OFF. Live Script Properties/trigger not inspected. |
| **Atomic orders live sync** `cloudflare-d1/D1_Orders_Live_Sync.gs` | `/v1/mirror/capabilities`, `/v1/mirror/stats` through `d1FullGet_` | same SERVER-67 scoped metadata signer | Offline VM verifies both signed requests and fail-closed behavior with a fake app environment; live trigger and URL unknown. |
| **Orders parity read cutover** `cloudflare-d1/D1_Orders_Read_Cutover.gs` | `/v1/mirror/sheet` | SERVER-67 **separate parity principal**, secure pagination max 100 when opt-in ON | 500 legacy-page → 100 signed-page source/test compatibility; no live parity or Apps Script deployment. |
| **Customer manager V1934** `customer_manager_d1_bridge_v1934.js` | `/v1/inbox`, `/v1/messages`, `/v1/orders`, `/v1/customer` | no qualified production equivalent at this gate | Hardcoded `trendos` Worker (not `trendos-d1-api`); existing Apps Script fallback is not user authorization or proof of production compatibility. |

**Not an exhaustive live-consumer inventory.** External Apps Script projects, other Workers, service bindings, and integration clients may exist; origin/proxy/Cloudflare policy and exact deployed source version are unverified. `trendos-d1-staging` existing D1 includes 11 preexisting tables and is NOT cleared or repurposed.

## Implemented review-only deliverables
1. `SERVER70_LEGACY_READ_CONSUMER_INVENTORY.json`: machine-readable list, precise source paths and routes, separate Worker distinctions, replacement readiness, and explicit **false** values for all eight live release gates.
2. `tests/server70_legacy_read_consumer_inventory.test.mjs`: regression against those 5 actual source paths and backend deny routes. Fails if important old source contract, pinned R5 post-deploy probe, secure 100-row pagination or default-OFF assumptions are changed without review. **Static test passing does not prove the system is safe for cutover.**
3. `tests/server70_apps_script_live_sync_secure_read_contract.test.mjs`: Node VM with fake Script Properties/Utilities/UrlFetchApp and a fake `.invalid` destination; tests `d1OrdersLiveSyncCapabilities_()` and actual `getD1OrdersLiveSyncStatus()` control flow. Opt-in ON signs `/v1/service/mirror/capabilities` and `/v1/service/mirror/stats` using SERVER-67 metadata HMAC canonical fields and distinct nonces. OFF explicitly preserves legacy GETs; wrong/missing signer, missing metadata secret, 403 response, atomicSupported=false fail without fallback or writes. Existing `D1_Full_Migration.gs` legacy config requires `D1_MIGRATION_SECRET` even for read; test supplies a **synthetic** property. No real credential, deployment, triggers or POST.
4. All above added to the existing `.github/workflows/server68-isolated-stage-preflight.yml`, including path triggers. Production R5 and Apps Script files were **read but not modified**.

## CI outcomes and historical RED → GREEN
- [Actions 39158657640](https://github.com/fawakhry/TrendOs/actions/runs/39158657640): **204/204 PASS** (14 source inventory tests added to former 190), existing Python tests and local Worker/SQLite/DO smoke PASS, Wrangler `--dry-run` PASS.
- [Actions 39158858291](https://github.com/fawakhry/TrendOs/actions/runs/39158858291): initial 8 new Apps Script tests => **211 PASS / 1 FAIL** due missing fake `D1_MIGRATION_SECRET` in the **test VM configuration** for OFF/legacy; no new production bug or code change.
- [Actions 39158915112](https://github.com/fawakhry/TrendOs/actions/runs/39158915112): **212/212 PASS**, original Python SERVER-34 9/9 PASS, Ubuntu CLI 6/6 PASS, local Python → real loopback Workerd fake D1 and Durable Object replay PASS, isolated Wrangler `--dry-run` PASS. **No remote deploy**.
- Existing independent A61 and SERVER-67 CI should be checked on final PR head after documentation updates.

## Decision D03 — safely paused (no serial prompting)
**Evidence obtained:** 5 source paths/consumer contracts and signed offline Live Sync GET compatibility. **Still needed:** actual deployment target and owner of each consumer, live Apps Script trigger inventory/Script Properties (`D1_API_URL` target only, never secret values), customer-manager production fallback/role tests, external clients, staged synthetic remote validation and rollback.
**Default while D03 remains pending:** Keep R5 workflow, Apps Script projects and existing deployed Worker untouched; keep SERVER-66 fail-closed source-only; no "secure release complete" claim. D01/D02/D04/D05/D06 remain separate pending owner decisions in single batch file.

**Status:** `KNOWN_CONSUMERS=5_SOURCE_ONLY`; `LIVE_CALLERS_EXHAUSTIVE=NO`; `APPS_SCRIPT_SIGNED_LIVESYNC_SOURCE_TEST=PASS`; `CI=212_OF_212_PASS`; `D03=PENDING`; `PRODUCTION=UNCHANGED`; `STAGE_REMOTE=NO`; `UBUNTU_LIVE=OFF`; `SEC-AP303-02=OPEN_HIGH`.
