# Entry653 — Zero-Google employee legacy proxy retirement (source-only)

Date: 2026-10-13 Africa/Cairo
Repository: fawakhry/TrendOs
Base branch: candidate/t12-full-cloud-cutover-a56-20260929
Pinned base commit: 7d20cfc463ce084ceaba8ac440dffa53512fe662
Work branch: test/zero-google-employee-legacy-proxy-retire-20261013

## PREPARE / E653-S1

Permission: repository-only source and synthetic tests. Owner said "كمل زيرو جوجل"; no permission for Production deploy, live SQL, credentials, customer actions or accounting operations.

Read evidence:
- TrendOS_MASTER_BOOK.md Entry652: Native Auth 6/6, NATIVE_ONLY=true, login/session lifecycle PASS on 2026-10-08.
- config.js: MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=true, legacy employee bridge false, OPS/CORE GENERAL, other domains READONLY.
- cloudflare-d1/src/legacy-browser-transport-v1.mjs still exposes an Apps Script upstream to approved legacy actions, including employee login and business actions.
- employee-api-dispatcher-v1.js routes native employee families to Cloudflare, and customer-session actions to their own existing authority.

Goal: when explicitly configured Native-only, make the legacy browser proxy fail-closed for **all non-customer-session actions**, before shadow lookup and upstream network. Preserve exact customer-session allowlist for separate migration. Reuse employeeAuthNativeOnlyEnabled() parser, no new env/secret, no new production authority.

Expected: with NATIVE_ONLY=true employee/legacy business => 403 LEGACY_EMPLOYEE_UPSTREAM_RETIRED and zero upstream calls; with NATIVE_ONLY=false/missing previous behavior unchanged; customer-session actions still pass through; origin/allowlist/method checks remain intact. Tests must use fictional data and fake upstream only.

STOP: any production deployment, Cloudflare flag change, Google/Apps Script call, D1/stock/financial write, merge, PR approval, or any claim ZERO_GOOGLE_COMPLETE. Existing bridge/upstream source stays for customer migration; final runtime cutover remains NO_GO pending qualification.

## RESULT

Status: PREPARED / SOURCE-ONLY. Actual commits, test outcomes and remaining runtime blocker to be recorded after verification; never infer Production success from source tests.
