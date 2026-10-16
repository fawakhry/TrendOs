# AP-298 — Strict Print-Only Synthetic Qualification / NO_GO

**Date:** 2026-10-16. **Source:** `fawakhry/TrendOs` Draft PR #138.  
**Parent:** AP-296 one-shot aggregate qualification and AP-297 mismatch analysis.  
**Host:** `TrendosShop` remains at home and is **NOT UPDATED** by this branch.

## What this adds

The pure fixture function `src/trendos_print_scope_gate.py::qualify_print_fixture_once` rejects:

- Administrative or service roles, or a simulated employee whose granted screens contain anything besides `["print"]` (including `["print","press",""]` from an older candidate Worker implementation).
- Claimed departments other than literal `طباعة`, or rows lacking that department.
- Routes other than the *frontend's candidate* `/v1/edge/orders/02cr/page`. This is NOT a proof that the deployed server hosts it.
- Any credential or unexpected field in the synthetic grant.
- Invalid/incomplete responses, malformed rows, and oversized (>5000) snapshots.

On accepted *fake-only* responses it reuses AP-296 `qualify_screen_once`, requesting one in-memory `print` snapshot and returning only aggregate counts, not the original order IDs, names, phone numbers, or tokens. The function has no CLI, network client, credential loader, printer operations, log writer or persistent state.

**Limitations:** The synthetic `grant` argument is untrusted caller-supplied data. Even when the fixture passes, `serverSideRoleVerified=false`, `productionRouteVerified=false`, `liveOrderReadPerformed=false`, `productionGo=false`. Its output must NEVER authorize a real request, role escalation, shift update, customer read or print job.

## Hosted synthetic tests — verified

- [GitHub Actions run 38909869852](https://github.com/fawakhry/TrendOs/actions/runs/38909869852), job `117002698599`, completed `success`.
- 17 AP-298 unit tests + 15 retained AP-296 tests = **32/32 PASS**; reviewed job log shows `Ran 17 tests`, `Ran 15 tests`.
- Runner is GitHub-hosted Python 3.12, `permissions: contents: read`, checkout credentials not persisted; test fixtures are fake, no secret declarations in workflow.
- This is **SOURCE_ONLY HOSTED CI** and is not a connection to Ubuntu or Cloudflare.

## Current integration mismatch — DO NOT hide

1. The default-branch frontend `trendos-edge-orders-read-v1.js` selects a qualified `GET /v1/edge/orders/02cr/page` route after `POST /v1/edge/orders/session`. Its current deployed runtime and exact backend contract have **not** been verified here.
2. Inspected older Worker source `cloudflare-d1/src/edge-orders-read-v1.mjs` in candidate branch `candidate/t12-full-cloud-cutover-a56-20260929` uses `/v1/edge/orders/page`, and its role `print` includes `press` and an empty screen — **not print-exclusive**. Do not treat this older branch as a deployment audit.
3. AP-296's existing `src/trendos_client.py` sends `action=getRows` through `POST /v1/employee/core`. The modern frontend's `getRowsPageV1931` read contract is different. Do not invoke the legacy GUI login or regular `run.py` to guess.
4. GitHub currently shows only encrypted secret *names*: `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN`, `TRENDOS_PROD_QUALIFY_USERNAME`, and `TRENDOS_PROD_QUALIFY_PASSWORD`. Values, active authentication, scopes and association with Diaa are unknown. Historical `401 / Session miss` exists for a prior attempted token. **Never print or reuse privileged/expired credentials.**

## Required gates before first live read

**G1 – Route & policy:** independently identify the deployed `02cr/page` implementation and prove server-enforced `print`-only filtering/identity, no other department access, pagination/freshness, and documented response type. A client-side screen label does not count.

**G2 – Identity:** create or select an approved **dedicated low-privilege test employee** with only required read permissions and valid expiry. No shared owner/admin identity or broad Diaa privilege. Provisioning is a production authorization change and requires separate owner approval.

**G3 – Isolation:** write/test an outbound HTTPS-only one-shot adapter as a separate, disabled-by-default entrypoint; allowlisted host and path, trust chain/TLS validation, no cross-host redirects, one page, a bounded timeout and maximum bytes, and sanitized outputs. No callback to `PrintServerApp` bridge, file/folder writes or background worker. Add adversarial synthetic tests first.

**G4 – Explicit owner go-live permission:** only after G1-G3 reviewed, request a single user-approved host command to stage only reviewed code, and another explicit approval for a one-off real authenticated read. Never transfer credentials in chat or GitHub logs; do not run a Github self-hosted runner or expose SSH.

**G5 – Production readiness:** live proof of an authorized `print`-only read, zero business mutations and zero customer leakage in reports, stop/cleanup receipt and owner review. Physical printers, Win7 original files, EasyStore accounting, stock and D1 writes remain independently blocked.

## Status

`AP298_FAKE_TESTS=32/32_PASS`, `AP298_LIVE_ROUTE=NOT_VERIFIED`,
`AP298_IDENTITY_PRINT_EXCLUSIVE=NOT_PROVEN`,
`AP298_REAL_LOGIN=NO`, `AP298_HOST_DEPLOY=NO`,
`AP298_PR=DRAFT_UNMERGED`, `AP298_PRODUCTION=NO_GO`.

**Canonical documents:** [Printshop master book](../MASTER_BOOK.md); [Ubuntu server log](UBUNTU_SERVER_BOOK.md), checkpoint `SERVER-20261016-14`.
