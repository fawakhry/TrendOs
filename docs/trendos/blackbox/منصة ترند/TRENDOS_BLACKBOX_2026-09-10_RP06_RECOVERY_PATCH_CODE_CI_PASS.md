# TrendOS RP-06 — Recovery Patch Code + CI PASS

Date: 2026-09-10
Repository: `fawakhry/TrendOs`
Working branch: `agent/go-live-2026-09-01-integrity`

## Owner approval

Owner explicitly approved the bounded GitHub-only recovery patch with: `نفذ Recovery Patch`.

Approval record:

`TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_PATCH_OWNER_APPROVED_START.md`

## Patch commits

Writer recovery implementation:

`d8acca532b238ee78497c598bd2fb363c0ffe1db`

Writer blob:

`81e994945af7fefdd38538a7ca569e73483f3d24`

Recovery regression tests:

`7ab1af20cd2b2b73182ca532314fe6da25cd0033`

Test blob:

`05fbd72caca6d9fd5302afa441cf8d38a66b1f7d`

The intermediate writer step was separately recorded before tests were applied, per owner blackbox rule.

## Exact contract retained

The executable remediation plan is still exactly 33 specs.

The normal plan hash is intentionally unchanged and remains locked to:

`5bc903bc8937ac4f523c98dec9e12a0ad6e4bff19928b4a8aa5737da32c94eab`

No retired Invoice spec was reintroduced and no current Invoice/Attendance/Cleaning/Press evidence decision was changed.

## New recovery approval contract

Recovery has a distinct version and distinct one-use Script Property:

- recovery version: `TRENDOS_CORE_P0_REGISTRY_RECOVERY_V1_20260910`
- approval property: `TRENDOS_CORE_P0_REGISTRY_RECOVERY_APPROVAL_V1`
- exact recovery approval hash: `ef3a590e11cd4c273aa552c238f4a1d3878a3bc8c85a944c84a084786d9e9a82`

The recovery hash is tied to:

- the exact 33-spec plan hash;
- the recovery implementation version;
- the exact required prior rollback reason `AUTO_ROLLBACK: post-write evidence or registry verification failed`.

Therefore the prior normal write approval cannot authorize recovery.

## Root-cause fix

Before Registry data append, the writer now forces columns A:G and I in the target rows to plain-text number format (`@`). This protects:

- Metric ID;
- Entity Key;
- Canonical ID;
- Superseded ID;
- Classification;
- Reason;
- Evidence Hash;
- Approved By.

Timestamp column H remains a timestamp and Active? column J remains boolean.

This prevents IDs such as `3536-01` from being stored as DATE/number values by Google Sheets.

## Legacy history compatibility

The existing 66 production Registry history rows are not edited or deleted.

For recovery-state inspection only, the writer reads the displayed `Entity Key` text alongside raw Registry values. This allows the known legacy date-coerced Press keys to be matched to their original visible IDs without rewriting history.

Normal downstream resolution after recovery still uses the ordinary raw Registry reader; the new recovery append stores the latest active keys as real text, so the current active revision becomes compatible with ordinary resolution.

## Bounded recovery semantics

New read-only function:

`trendosCoreP0RegistryRecoveryPreviewV1`

New mutation function, not yet authorized for production execution:

`trendosCoreP0RegistryRecoveryWriteV1`

A mapping is recoverable only when its exact identity history satisfies all of the following:

1. latest exact revision is inactive;
2. latest Reason equals exactly `AUTO_ROLLBACK: post-write evidence or registry verification failed`;
3. latest Evidence Hash equals the exact current spec hash;
4. immediately preceding exact revision is active;
5. preceding active Evidence Hash equals the exact current spec hash.

An `APPROVED_ROLLBACK` or arbitrary inactive state does NOT qualify. The normal writer continues to reject explicitly inactive mappings.

Recovery write also re-runs current live evidence/hash preflight before append, consumes the distinct one-use recovery approval, appends only new history, and performs post-recovery verification. If post-recovery verification fails, it appends inactive recovery rollback revisions rather than editing or deleting history.

## Regression coverage

The test harness now simulates Sheets coercion of values shaped like `3536-01` when plain-text formatting is absent.

Tests verify:

- date-like Press keys stay raw strings after the fixed append;
- the exact 33-spec plan hash does not change;
- recovery hash is distinct and exact;
- approved rollback cannot be recovered;
- a writer AUTO_ROLLBACK history can be recognized even when all 11 numeric-looking Press keys in both active/inactive blocks are represented as Date values but display their original IDs;
- recovery preview is read-only and requires all 33 mappings recoverable;
- stale live evidence prevents recovery and consumes the one-use recovery approval without append;
- successful recovery appends 33 new active revisions, preserving the prior 66 rows, yielding 99 data rows in the isolated test fixture;
- recovered Press Entity Keys are stored as text;
- a second recovery is refused once the latest mappings are active.

## Intermediate CI history

The writer-only intermediate commit `d8acca532b238ee78497c598bd2fb363c0ffe1db` triggered `TrendOS Integrity V1` Run `34467390756` (run number `1564`) and **FAILED** at the existing `Run TrendOS CORE-P0 registry writer tests` step.

Exact failure:

`TypeError: sh.getRange(...).setNumberFormat is not a function`

This was an isolated test-harness mismatch: the recovery writer introduced the real Apps Script `Range.setNumberFormat` call before the FakeRange test double had been extended to implement that API. All earlier steps through CORE-P0 remediation tests passed; later workflow steps were skipped after the test failure.

No production execution or data mutation was associated with this CI failure. The test harness was then updated in commit `7ab1af20cd2b2b73182ca532314fe6da25cd0033` to model `setNumberFormat`, `getDisplayValues`, and the date-coercion behavior itself.

The later exact code+test head is the authoritative gate and passed fully as recorded below. The intermediate failure is preserved as historical evidence and does not supersede the final PASS.

## Final CI

Workflow: `TrendOS Integrity V1`

Run ID: `34467516059`

Run number: `1566`

Head SHA: `7ab1af20cd2b2b73182ca532314fe6da25cd0033`

Conclusion: **SUCCESS**

Job `integrity-foundation` ID `102839451698` — SUCCESS.

Relevant successful steps include:

- TrendOS CORE-P0 remediation tests;
- TrendOS CORE-P0 registry writer tests;
- TrendOS Press integrity tests;
- TrendOS Invoice integrity tests;
- TrendOS Integrity Dashboard tests;
- composed Apps Script module syntax/collision test;
- pre-deploy package safety gate.

Therefore the Recovery Patch code/test gate is **PASS**.

## Diff verification

Comparison from recovery approval commit `aa54159e62d27e42bb4863a3f60e70b7c2f8a985` through test commit `7ab1af20cd2b2b73182ca532314fe6da25cd0033` shows code changes only in:

- `trendos-core-p0-registry-writer-v1.gs`;
- `tests/trendos_core_p0_registry_writer_v1.test.js`;

plus the required intermediate blackbox record.

No `Code.gs`, Cloudflare runtime, production Sheet source rows, D1 data, deploy configuration, feature flags, or workflow/runner was changed.

## Current production state

Production Registry history remains exactly the previously observed failed-write state:

- 33 original active revisions;
- 33 writer AUTO_ROLLBACK inactive revisions;
- latest exact mappings inactive;
- no recovery rows have been appended.

Apps Script Head has NOT been updated to writer blob `81e994945af7fefdd38538a7ca569e73483f3d24` by this GitHub patch step.

## Next bounded gate

Before any production recovery write, a separately approved Apps Script read-only validation step must:

1. update only Apps Script Head `trendos-core-p0-registry-writer-v1.gs` to exact blob `81e994945af7fefdd38538a7ca569e73483f3d24`;
2. Save/reload/exact-verify the source;
3. run `trendosCoreP0RegistryPreviewV1` and require `success=true`, `readOnly=true`, `expectedCount=33`, `actualPlanCount=33`, `errors=[]`, planHash=`5bc903bc8937ac4f523c98dec9e12a0ad6e4bff19928b4a8aa5737da32c94eab`;
4. run `trendosCoreP0RegistryRecoveryPreviewV1` and require `success=true`, `readOnly=true`, `expectedCount=33`, `actualPlanCount=33`, `recoverableCount=33`, `errors=[]`, recoveryHash=`ef3a590e11cd4c273aa552c238f4a1d3878a3bc8c85a944c84a084786d9e9a82`;
5. STOP.

Only after both previews PASS may a new explicit owner approval be requested for `trendosCoreP0RegistryRecoveryWriteV1`.

## Still prohibited

- normal Registry Write retry;
- Recovery Write before the new previews and new explicit approval;
- direct Registry edits/deletes/Active? flips;
- rollback;
- Apps Script Production deploy;
- Code.gs mutation;
- feature flag activation/change;
- source Sheet business-data mutation;
- D1 business-data write;
- merge to main;
- RP-07.

STOP: Recovery Patch code + tests + CI PASS. No production recovery execution occurred.