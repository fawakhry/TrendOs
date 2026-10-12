# Entry658 — Customer OTP atomic issuance and one-time redemption (SOURCE_ONLY / NO_GO)
Date: 2026-10-13 Africa/Cairo
Branch: `test/zero-google-customer-otp-atomic-off-20261013`
Pinned source: Entry657 Draft PR #128 exact head `5a9c4b3b253841276e71214f1375617a8ac7c4dc`.

## PREPARE — exact owner decision and safe boundary
Owner approved phone verification code → **NEW** cloud password, and requested continuous work with **every step recorded in canonical TrendOS_MASTER_BOOK.md**. This is only approval for the design and repo-only progression: NOT a permission to send actual SMS, register real customers, change customer records, apply migrations, merge Drafts, deploy Cloudflare/Apps Script, access finance, or change staff operations.

Entry657 [#128] introduced UNAPPLIED identity/OTP schema (0032,0034) and pure HMAC policy. Source gap: the repo has not yet implemented atomic concurrency-safe D1 OTP issuance/retry/redeem and delivery confirmation. A pure correct-OTP comparison MUST NOT by itself enroll a customer. Need exact-once DB compare-and-set and bounded issue-rate guard.

## Entry658 source-only steps
1. Prepare pinned isolated branch and record hard stops.
2. Implement **SQL statement contract only** for atomic conditional PREPARED challenge reservation, SMS delivery-ACK transition, verification attempt/one-time consumption CAS and grant rejection. The SQL statements are exported as inert strings from a module **NOT imported by the live Worker**.
3. Prove the SQL against an *entirely disposable in-memory SQLite database* with fake customers, including rate/cooldown, uniqueness, lockouts and replay. Offline Node contract checks forbid sender/network/route/writes during test.
4. Add exact-head GitHub Actions offline CI and append implementation/CI checkpoints to TrendOS master book; stacked Draft PR only.
5. Inspect recurring Cloudflare Workers Builds `trendos-tasks-v3-t1-preview-20260914` FAILURE via available GitHub check metadata **without redeploying or changing settings**; if logs unavailable, preserve that explicit blocker rather than guessing cause.

## Scope/gates
- Future challenge reserve: strict D1 customer portal control CANARY/GENERAL, approved unexpired owner-reviewed grant; matching exact account/customer ID/code; account PENDING. No SMS sent by reserving.
- Max three **reservations** in trailing hour (a conservative upper bound on sends), 60-second cooldown, at most one nonexpired PREPARED/DELIVERED challenge per approved fingerprint. Single DB INSERT ... SELECT decides authorization and rate under SQLite writer serialization.
- Future provider receipt: only confirmed delivery can change PREPARED → DELIVERED, with time/grant checks. Delivery claims are **not** simulated as real in source tests.
- OTP attempt: increment bounded counter and change DELIVERED → VERIFIED/VOID via conditional single SQL UPDATE; verified only if server-side HMAC comparator succeeded and correct state/account phone/grant identity still present, not if client says success; consumed_at timestamp immutable for repeats. Future application must require a separate server-authenticated enrollment proof to set password, since challenge ID alone is NOT authorization.
- All responses to users must be anti-enumeration generic. No real D1/Google/SMS/Cloudflare or customer credentials touched; Native customer login remains OFF. `ZERO_GOOGLE_COMPLETE=NO`.

## RESULT — SOURCE-ONLY SQLITE/CONTRACT PASS / PROD NO_GO

**Step-by-step immutable repository record:**
1. PREPARE log committed `1166425d7874c040790df6856db1235916ba9326`; pinned #128 and explicitly preserved off/no SMS/no migration.
2. Inert conditional D1 SQL strings committed `15b73cb68f081ec8f70702c81a3bb4391fd0459f`, file `cloudflare-d1/src/customer-portal-phone-otp-atomic-sql-v0.mjs`. Server-only future SQL contracts, **NOT connected to Worker or provider**: reserve PREPARED, mark DELIVERED only on future provider confirmation, correct-code one-time VERIFIED CAS, incorrect-code capped attempts/VOID, provider-declared failure VOID.
3. Fake SQLite tests committed `1043be7eca6d64f9682ab3d2166544f512f0071a` in `tests/entry658_customer_phone_otp_atomic_sqlite.test.py`: OFF and unauthorized grant fail-closed; mismatched customer, account and fingerprint denial; only DELIVERED code can be consumed; same code replay returns 0 rows; five wrong attempts VOID; expiry, grant revocation; cooldown 60s; 3 reservations per rolling hour (counts PREPARED and VOID conservatively). SQLite's single statement is atomic; this is **not** proof of full Cloudflare D1 concurrency under actual load.
4. Node source-contract tests committed `c5a8b5da13209a4b7481ea0daafd7bfdb1d0b7ef`. Inert/no network module, no Worker import or SMS delivery; OFF/no account activation.
5. Offline workflow commit `461fd92c6b12497b2c20dd7fea2f240f08903f06` — [GitHub Actions #38316390798](https://github.com/fawakhry/TrendOs/actions/runs/38316390798) **SUCCESS** on exact code+workflow commit: Node syntax and source assertions, in-memory SQLite atomic SQL, no Worker wiring; zero live D1/Cloudflare/Google/SMS/customer/finance/stock reads or writes.
6. TrendOS master book updated append-only, then separate stacked Draft PR created; final exact PR head requires rerun after documentation commits and a second independent security review.

**Important limitations:** these are conditional SQL contracts, not production code calling a live DB. The HMAC/mac MUST be computed in a trusted Worker and `meta.changes===1` proven before a future server flow considers a CAS successful. SMS provider ACK, actual independently consented/verified shared-number screening and subscriber reassignment, atomic per-phone rate/abuse protections over the provider side effect, customer session/password enrollment authorization, and one-time challenge-to-password proof linkage remain **NOT IMPLEMENTED**. A challenge ID or bare VERIFIED database row must never permit account takeover. Current `0034` rate table is unused by this conservative reservation SQL; future production architecture must choose a single authoritative accounting mechanism. Legacy customer fallback and cloud/order/accounting dependencies remain OPEN.

**Separate Cloudflare build blocker:** GitHub check metadata for `trendos-tasks-v3-t1-preview-20260914` repeatedly shows a **failing Workers Builds preview check** on earlier stacked PR heads, but GitHub check output provides only a Cloudflare build ID/link and **no compiler/log error**. The preview Worker is not the Entry658 offline CI. No causal claim or fix without build log and independently authorized diagnostic; absolutely no redeploy/change to Worker or build settings performed.

`ENTRY658_SQLITE_OFFLINE_PASS=YES`
`ENTRY658_SOURCE_ONLY_CODE=YES`
`ENTRY658_SMS_SENT=NO`
`ENTRY658_D1_MIGRATION_APPLIED=NO`
`ENTRY658_ACCOUNT_CREATED=NO`
`ENTRY658_ZERO_GOOGLE_COMPLETE=NO`

