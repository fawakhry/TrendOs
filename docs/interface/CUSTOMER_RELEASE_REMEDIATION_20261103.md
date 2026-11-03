# Customer release remediation — 2026-11-03

Owner request: fix the remaining privacy/upload problems and activate the customer portal. This authorizes continuing release preparation and a qualified rollout; the previously approved design needs no renewed approval. Owner-private Sites access is unchanged. This report does not certify the legacy backend or turn a source test into production evidence.

## Implemented in the original frontend

- `customerRequestFence()` binds each response and upload continuation to the original customer object, code, token and, for writes, draft object. A delayed orders response/error after logout or relogin is ignored, including the same displayed name or the same code. Old create/item/file/submit responses cannot alter the next account or unlock its active operation.
- File sizes are checked before creating a remote item, avoiding a predictable partial item for an invalid/oversized file.
- The existing legacy writer has no idempotency contract. As soon as an item/official-submit request may have reached it, `draft.writeUncertain` prevents another add or official submit until all required responses are confirmed. A missing second-file or submit response cannot silently trigger another server write through this tab. The customer sees a visible stop message in the chat and summary; submit is disabled.
- A successful complete item clears the stop state. A successful official order can be submitted only once from the current draft. An account/draft change invalidates old in-flight continuations. Starting a new draft warns that it does not cancel remote data that might already exist.

**Scope of the correction:** same-tab duplication prevention and account-response isolation. It is not backend transactionality, remote rollback, recovery after reload, or safe automatic retry. An uncertain remote item/file/order still needs operator reconciliation. Other devices or old frontend versions remain subject to the backend risk. No new identity store, writer, Google fallback or persistent credential/byte storage was added.

## Executed validation

64 Node tests passed, including 12 new dynamic tests executing the original app functions with deferred responses and synthetic fault injection. Cases cover a lost item response, lost second attachment response after simulated storage, lost official submit response, invalid size before writes, normal success, same-name account replacement, same-code relogin, late error, switch during item/file/draft creation and switch during official submission. Syntax checks and `git diff --check` passed.

Actual Chrome UI testing uses the exact original customer markup/functions and the messenger presenter with synthetic API replies and `connect-src 'none'`. Repeated clicks after a simulated lost save response leave the mock server-item counter at one and the summary's official-submit button disabled with a clear reason. This is frontend testing, not a real Cloudflare customer login or a live media/privacy test.

Reproduction: `node tests/customer_messenger_browser_fixture.cjs /absolute/disposable/qa-directory`; the optional “فقد رد الحفظ” control exists only in that generated test fixture.

## Actual Cloudflare control-plane preflight

[Diagnostic PR343](https://github.com/fawakhry/TrendOs/pull/343), source `e92012d71904624a34915e11be5e5de7cee8ecf4`; [run 41683153912](https://github.com/fawakhry/TrendOs/actions/runs/41683153912), job `126081816538`, SUCCESS at **2026-11-03 17:19:49 UTC / 19:19:49 Cairo**. Reused the original isolated resolver pinned at `6b31228887f9073c1aa8c6f2c06597b194f567df` and performed GET only.

| Readback | Observed |
|---|---|
| Exact existing isolated Worker and original separate synthetic D1 | Matched |
| workers.dev / preview | OFF / OFF |
| All 11 customer Stage flags | OFF |
| R2 bindings on this Stage Worker | **0** |
| Exact pinned Stage Access app | One match |
| Policies | Deny Everyone + one Service Auth |
| Single-header Service Auth mode | False |

No public Worker HTTP, D1 row query, R2 object access, policy/token change, deployment or production mutation. The diagnostic workflow was removed at `478838c07e1ff4f407de32a6f740cf1641ab57e2`; PR343 closed unmerged. The last actual authenticated HTTP result remains the previously documented Nov2 **403**, not a new HTTP success or a newly repeated denial.

A follow-up read-only diagnosis checks whether a hostname policy takes precedence over the Worker app and checks the current dedicated token's enabled/expiry/client-ID metadata and credential whitespace/quotes. Metadata does not prove the Client Secret is valid. Its actual result is appended when verified.

## Remaining release work

| Blocker | Required outcome |
|---|---|
| Legacy order-name fallback and public Drive sharing | Deploy a qualified original-backend remediation or complete the existing Native replacement; frontend filtering cannot certify ownership |
| Private media | Provision/bind the original isolated private storage, qualify ownership/integrity/scanner/private-viewer behavior; current Stage has no R2 binding |
| Official order handoff | Qualify the original Native draft-to-T12 single writer and multi-item/file link; Stage currently proves drafts/preflight, not official customer submission |
| Authenticated remote transport | Root Service Auth GET now PASS; next pass full two synthetic-account E2E with rejection of unauthorized reads/uploads |
| Release | Verify exact live source/bindings, rollback and owner-authorized customer rollout; preserve existing staff/finance/order changes |

`SOURCE_SAFETY_FIX=IMPLEMENTED_AND_TESTED`; `BACKEND_P0_REMEDIATED_LIVE=NO`; `REMOTE_CUSTOMER_E2E=NOT_PASSED`; `CUSTOMER_LIVE_ACTIVATION=OFF`; `OPENAI_PAID=OFF`; owner-private Site remains a synthetic review.


## Verified closure of the private Stage HTTP admission blocker

PR344 / run41687721840 / job126097793498 confirmed no matching root-hostname app in returned inventory, current dedicated token enabled/unexpired, raw client-ID equality and no stored secret whitespace/quotes/newlines. Read-only tool removed1afba57e; PR closed unmerged.

PR345 initial run41688398842 / job126100169660 captured Cloudflare **1010** on all three requests; valid-credential Ray `a54d3c149a0c3be5-MEM` at17:52:46UTC. The [official Error1010 guidance](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1010/) explicitly documents workers.dev rejection of the default Python urllib User-Agent and recommends a descriptive application identifier.

Set truthful `User-Agent: TrendOS-Customer-Stage-Qualification/1.0`, with redirects disabled. No identity impersonation, token/policy change or security feature disablement. Exact new source8d7804b756abd6ac107a2b4f06ef3fcb38e4269d / [run41688741445](https://github.com/fawakhry/TrendOs/actions/runs/41688741445) / job126101362369 **SUCCESS**: no auth302, deliberately wrong secret302, correct existing token404 with original Worker JSON code `CUSTOMER_STAGE_ROUTE_NOT_FOUND` and source `customer-stage-isolated-v0`. Valid Ray `a54d3f4f185f6ee6-DFW` at17:54:59UTC /19:54:59 Cairo. Both finally and independent always step verified workers.dev/preview OFF afterward. All feature flags stayed OFF, no customer login or data writes. Temporary source/workflow removed62c9f00226cf3090cfce5a17949b10659ef3395b; PR345 closed unmerged.

This supersedes the old unclassified403 as the latest HTTP admission result for **this isolated Worker only**. Full remote customer login, private R2/media, actual T12 order handoff and production rollout remain outstanding.


## Final source merge and remaining provider authorization

[PR347](https://github.com/fawakhry/TrendOs/pull/347) merged at `fc54fa7f18d594f0db1b31aafa446cc56f46fe6f`; exact source `31392a74b0e8240e424eb13164ab91d302090ef9`. Source Actions41689971403/41689971306/41689971462 SUCCESS. Separate Cloudflare Workers Builds tasks-v3-t1-preview check failed on source AND unchanged base main; no detailed build log was exposed, and this unrelated preview release is not certified. Ordinary merge only; no rule/check disabled. Screenshot: [uncertain write stop](assets/customer-release-uncertain-stop-20261103.jpg).

[PR346](https://github.com/fawakhry/TrendOs/pull/346), source38b871b5, [run41689690324](https://github.com/fawakhry/TrendOs/actions/runs/41689690324), job126104701440 FAILURE at18:01:07UTC /20:01:07 Cairo: first R2 inventory GET returned403/error10000 under existing CLOUDFLARE_API_TOKEN. Stopped before bucket-create POST. No bucket, object, binding, deployment, new token, permission or billing change. Workflow removed5769f38d; PR closed unmerged.

This is **R2 control-plane authorization**, separate from the fixed workers.dev client1010. It does not establish whether R2 billing is enabled. Need owner-authorized same-account `Workers R2 Storage Write` provisioning access for one specified new private empty Stage bucket `trendos-customer-stage-private-synthetic-20261103-v0`. Prefer a dedicated short-lived token in GitHub Actions secret `CLOUDFLARE_R2_STAGE_API_TOKEN`; do not paste credentials into chat, broaden the Worker/D1 token or enable public storage. That dedicated credential has NOT been created/configured, and the historical one-shot must be adapted to use it only for R2 before a new authorized run.

Customer runtime remains OFF. Backend privacy remediation, actual private files/viewer/scanner, original T12 official handoff and full remote synthetic customer E2E are still pending. New UI safety prevents dangerous same-tab retries and stale-account display; it does not claim to fix the legacy server or activate production.
