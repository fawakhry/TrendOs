# SERVER-72 — R5 signed-metadata destination canonical authority (SOURCE ONLY)

**Date:** 2026-10-19 · **Branch:** `release/server68-staging-qualification-20261016` · **Review:** [Draft PR #190](https://github.com/fawakhry/TrendOs/pull/190).
**Scope:** Review-only R5 candidate `cloudflare-d1/r5-server68-signed-metadata-preflight.mjs`; no changes to the active R5 deploy workflow, live clients, customer data, Cloudflare, D1, secrets or Ubuntu.

## Proven normalization gap

The old candidate used `new URL(baseUrl)` and compared the parsed hostname and port to the expected hostname. Standards-compliant URL parsing strips an explicitly specified default HTTPS port `:443`, normalizes percent-encoded hostname characters, removes dot segments and trims whitespace. The old code could therefore accept non-canonical raw URL input despite the stated strict destination policy. This is a SOURCE-only input-validation inconsistency; **no leaked credential, exploited service, or deployed R5 consumer is claimed**.

## Safe change on this branch

- Commit [c00b5ace](https://github.com/fawakhry/TrendOs/commit/c00b5ace2e15b1de076bb95d271b480c527edb03) adds a pre-parser raw URL authority gate: HTTPS + exact independently pinned DNS hostname + optional single terminal slash only. It explicitly disallows port syntax (including `:443`), userinfo, arbitrary path/query/fragment, percent-encoded hostname input, dot segments and surrounding whitespace. It then retains parsed URL checks for defense in depth.
- Commit [ea54f3cf](https://github.com/fawakhry/TrendOs/commit/ea54f3cf941e74bc5815abfb34bca1c56fd8f908) adds six synthetic regression cases to `tests/server68_r5_signed_metadata_preflight.test.mjs`, all of which require denial *before* any injected fetch or D1 read.
- The candidate still requires an explicit fetch adapter, an independent hostname pin and a valid metadata-only HMAC service secret; no imports deploy or contact a real domain. Signed reads never fall back to anonymous legacy GET.

## Verified CI evidence (at exact test commit)

- [SERVER-68 isolated stage preflight #39290291630](https://github.com/fawakhry/TrendOs/actions/runs/39290291630) on `ea54f3cf941e74bc5815abfb34bca1c56fd8f908`: **233/233 Node tests PASS; 0 fail**.
- Python Ubuntu one-shot reader **9/9 PASS**; disabled canary CLI **6/6 PASS**.
- Wrangler `deploy --dry-run` **PASS**, with zero deployed Workers or D1 bindings.
- Local Workerd + synthetic SQLite D1 + durable nonce replay + injected Python client **PASS**, no remote Cloudflare, physical Ubuntu or equipment connection.
- This is CI proof of source and mock integration only. **No production fix is verified**.

## Current hard stops and owners

The legacy R5 production workflow `.github/workflows/trendos-r5-periodic-controlled.yml` remains pinned to an older SHA and still expects `GET /v1/mirror/sheets` HTTP 200. Candidate hardening alone cannot make that workflow cutover-safe. **D03 remains EVIDENCE_PENDING** until external consumers, Apps Script live trigger/hostname, phased rollout and rollback are reviewed. D01–D02, D04–D06 remain the single owner approval batch in `SERVER69_RELEASE_DECISIONS.json`.

Existing `trendos-d1-staging` Worker and its populated D1 must not be overwritten. **SEC-AP303-02=OPEN HIGH** (source evidence, actual leak unproven); `PROD_DEPLOY=NO`; `CLOUDFLARE_STAGE_DEPLOY=NO`; `UBUNTU_LIVE=OFF`; `DEVICE_EXECUTION=OFF`; `PR195=UNTOUCHED`; `PR190=DRAFT`.
