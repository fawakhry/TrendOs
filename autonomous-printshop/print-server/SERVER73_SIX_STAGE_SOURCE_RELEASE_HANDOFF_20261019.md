# SERVER-73 — Six-stage Cloudflare / R5 / Ubuntu execution handoff (OFFLINE ONLY)

**Date:** 2026-10-19 · **PR:** [#190 DRAFT](https://github.com/fawakhry/TrendOs/pull/190) · **Scope:** TrendOS source, Cloudflare staging security, HMAC/D1, legacy consumers, printshop Ubuntu read-once. **No production authority implied by broad instruction to continue development.**
**Existing owners/boundaries:** Manager/employee PR #195 and EasyStore finance excluded; do not edit frozen unified TrendOS master book. This note supplements the original `UBUNTU_SERVER_BOOK.md` and the single D01–D06 queue; it is not another decision ledger.

## What was already built (reused; not recreated)

- SERVER-66/67 fail-closed legacy mirror routes, metadata/parity HMAC identities and replay-guard Durable Object source.
- SERVER-68 isolated Worker config: `workers_dev=false`, default OFF, no D1/Account ID/route and a DO migration *source definition only*. Never deploy the local fixture config.
- SERVER-68/70 R5 signed metadata candidate and Apps Script opt-in signer; SERVER-71 independent hostname Script Property pin; SERVER-72 raw canonical R5 target guard, 233/233 source CI on `365cda51...`.
- SERVER-69 source route `GET /v1/printshop/service/orders/page` and Python `read_trendosshop_once`, local workerd/synthetic SQLite D1/DO/print/laser tests, source canary CLI OFF by default.
- 5 repository-known historical read consumers in `SERVER70_LEGACY_READ_CONSUMER_INVENTORY.json`. That inventory is expressly not a list of all live clients.

## New implemented source work: SERVER-73

1. `autonomous-printshop/print-server/tools/server73_six_stage_readiness.mjs`: local Node.js reader of the **existing** release decision queue, source consumer inventory, stage TOML, signed R5/Apps Script candidates, service reader policy and Ubuntu CLI. Enforces default OFF, exactly six open decisions, staged Worker isolation, no deployed machine principal, unchanged legacy R5 dependency and no verified live consumers. Produces a deterministic redacted JSON `NO_GO` verdict for all 6; never contacts Cloudflare/GitHub remote, reads credentials, opens networks, writes files, provisions resources, or issues approvals. `--report` exits zero to inform CI; `--gate` exits 2 because release is NO_GO; unexpected source drift exits 3.
2. `tests/server73_six_stage_source_readiness.test.mjs`: true offline regression for decision and source snapshot, deliberate detection of forged approval, unapproved D1 binding, workers.dev exposure, accidentally enabled staging flags, forged provisioning or live consumer migration, incompatible R5 historic workflow changes, and mandatory nonzero `--gate`.
3. `tests/server69_ubuntu_python_to_local_workerd.py`: the **existing** cross-language local Workerd test now additionally calls the **existing real disabled CLI function** `run_canary_once` with a fixture environment and injected strict loopback-only HTTP opener. Verifies missing one approval flag causes zero HTTP, both *synthetic* gates permit only one GET per print/laser screen, output is counts-only and no printer/D1/customer writes. This is never a real owner authorization or a remote test.
4. CI `.github/workflows/server68-isolated-stage-preflight.yml`: includes new auditor tests and CLI smoke, prints informative NO_GO report without trying deployment; existing Wrangler is `deploy --dry-run` only.

## Six stages — source completion vs release qualification

| Stage | Executed or prepared in repository | What is NOT executed; approval/evidence gate |
|---|---|---|
| **D01 — isolated Cloudflare staging** | Existing separate source TOML audited for no public workers.dev, D1, secrets, routes or enabled writes. | No isolated *remote* Worker, Access policy, synthetic remote D1, approved account/network or worker version. Do not reuse existing `trendos-d1-staging` (11 existing tables). |
| **D02 — machine and metadata credentials** | HMAC metadata/parity scopes, replay DO source, short-lived reader identity policy and deny tests are already implemented, source auditor verifies no provisioned role. | No stage credential issued or stored remotely, no key rotation/revocation proof, no remote Durable Object binding/migration or privileged endpoint testing. |
| **D03 — consumers** | Reused R5 signed helper, Apps Script opt-in hostname pin/100-row pagination, five-source-caller inventory, local HMAC fake tests. | Real R5 workflow still pinned to `b7e85647...` and tests legacy `GET /v1/mirror/sheets` **HTTP 200**, live Apps Script triggers/properties/hosts, other callers and customer-manager fallback not verified. Cannot turn off old GET on any deployed Worker. |
| **D04 — production security release** | Reviewed release rollback risks and built source fail-closed gates / offline rehearsal. | Not proved deployed source SHA→Cloudflare version for either `trendos` or `trendos-d1-api`, no existing Worker snapshots, change window, approved staged rollback or production deployment. `SEC-AP303-02=OPEN_HIGH` based on uploaded old bundle, actual data exposure untested. |
| **D05 — real Ubuntu read-only** | Existing Python read-once source + dormant CLI; new real CLI→local workerd synthetic test with separate two-flag checks. | No physical Ubuntu login, credential, routing, operator present, Cloudflare remote read or scheduling. Device controls and file writes remain OFF. |
| **D06 — one real order** | Existing local synthetic D1 rows segregate print and laser and prohibit customer/finance fields; new CLI contract returns counts-only. | No selected real order, approval for PII-safe one-order sample, live count reconciliation, print/laser machine test or production acceptance. |

## Required dependency and actual rollout order after individually scoped approval

D01 protected isolated remote stage **before** D02 stage-only identity + replay DO. With synthetic records, prove signed/unsigned/wrong-role/replay/no-redirect outcomes and a versioned rollback. Then D03 owner-verified consumers: R5 secure metadata helper **must replace old anonymous GET condition before production fail-closed release**; real Apps Script deployments must receive the independently approved exact hostname pin and scoped secrets without logging; review external/manager consumers separately. D04 production release only with explicit Worker-by-Worker version provenance, reviewed snapshots and a security-preserving rollback strategy; never fall back to anonymous legacy GET as an emergency fix. D05 one physical Ubuntu read-only canary with outbound-only HTTPS, revocable short-lived bearer, CLI owner gates, no shell/device/print actions. D06 one specifically selected order, compare department counts and identities under human supervision, then revoke canary/rotate credentials. Fail closed on any mismatch; do not trigger printer or laser. The future automatic production scheduler/file routing needs a *separate* workstream after this six-gate acceptance.

## Evidence required to change NO_GO

- D01: named staging account scope + private endpoint/Access evidence + fresh non-production D1 + verified deployed SHA.
- D02: secrets stored solely in approved secret store + identity/role proof + DO nonce test receipts + revocation drill.
- D03: exhaustive signed-versus-legacy caller inventory, actual R5 and Apps Script cutover proof + approved rollback with no auth downgrade.
- D04: exact live source/deployed hashes + backups + production target name/time/approver + reversible fail-closed deployment.
- D05: actual Ubuntu OS/network/operator and authorized client identity, one outbound read with equipment disabled.
- D06: explicit read-only consent and named test order/window, department parity results, zero device/file/finance mutations.

**Decision record:** `SERVER69_RELEASE_DECISIONS.json` remains authoritative and unchanged. Owner sentence “do all six steps” is instruction to *complete all independently safe preparation*, not sufficient evidence of a specific production target/version/window or permission to use actual customers. If any independent owner approval remains missing, release evaluator must report `NO_GO`. No secrets in GitHub or chat.

**Verified new proof:** [GitHub Actions #39292772509](https://github.com/fawakhry/TrendOs/actions/runs/39292772509) on exact code/config commit `5914f8eff9d32104bbad1946eb802b816a8650d6` **243/243 Node PASS, zero FAIL**, Python one-shot **9 PASS**, disabled CLI **6 PASS**, local Workerd/D1/DO **PASS**, newly integrated real dormant CLI→strict injected loopback Workerd **PASS**, Wrangler `deploy --dry-run` **PASS**, **ZERO REMOTE DEPLOY**. This source-qualified SHA precedes subsequent documentation and decision-queue-only commits; latest-head Actions must be verified separately. The preceding SERVER-72 baseline (233/233 Node, Python 9+6) was also PASS. This report is not a claim that new changes passed before their CI run is inspected. `PR190=DRAFT`; `SEC-AP303-02=OPEN_HIGH`; `CLOUDFLARE_PRODUCTION=UNCHANGED`; `UBUNTU_REAL=OFF`; `LIVE_ORDER=NONE`; `PRINT_LASER_EXECUTION=OFF`.
