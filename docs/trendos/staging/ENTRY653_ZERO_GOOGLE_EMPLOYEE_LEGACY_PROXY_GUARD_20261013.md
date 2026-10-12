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

Status: SOURCE_TEST_PASS / PR_DRAFT_PENDING. Source-only GitHub Actions run https://github.com/fawakhry/TrendOs/actions/runs/38312278054 completed SUCCESS on head a0c208c6c4934cec3f92c333f258612a22357bba. Both Node syntax and existing legacy transport + Entry653 synthetic regression passed; 0 Production tests and 0 real Google calls. Since book/status documentation commits advanced HEAD afterward, exact-final-PR-head CI requires a new read-only PR-triggered test. Do not merge until that run is PASS and reviewer/runtime gates are addressed.

Commits: PREPARE 8894e0422820f0d82b50cbc0ca1f68bcd57cf795; handler f045a06b35b95135567095fb5225e4247fa78653; synthetic test d9a32246952607bd7f0f73a9a0a02271a4d8ff98; workflow a0c208c6c4934cec3f92c333f258612a22357bba; master-book append 5d98fee1eaf6a883369e84af3e55ef69678e849b.

Next: open Draft PR against pinned shared platform candidate; obtain exact-head source CI and independent review; then read-only Production qualification before any controlled deployment. Customer-session migration stays OPEN; no ZERO_GOOGLE_COMPLETE claim.
