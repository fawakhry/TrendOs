# TrendOS T12 — Live legacy writer fence and Mahmoud 4322 → 4323 Sheet re-key

Date: 2026-09-28 Cairo
Entry: 451 (after Entry 450 delivered-state correction)
Repository: `fawakhry/TrendOs`
Branch: `cloud-migration-v3-t12-order-create-ci-20260919`

## Result

- Apps Script production fence: **LIVE by successful update of the existing Web App deployment to Version 157** (2026-09-28 18:18 UTC), deployment ID `AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg`.
- Same Web App URL, Execute as Me, Access Anyone. No separate deployment.
- Bound project ID `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`, workbook ID `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`.
- Only Apps Script source files edited: `Code.gs` and `trendos-order-line-integrity-v1.gs`. Script Properties and Triggers were not changed.
- The live `Code.gs` had an additional Integrity V1 route before the GitHub patch's original check site. The fence was placed at the beginning of `doGet`, before that route; `makeOrderId_` throws `T12_CLOUD_ORDER_ID_AUTHORITY`. The supplemental draft submit function checks the same fence.
- GitHub source commits already prepared: `2fd41374cf62b5b7c111270684dc52e8a1731d4f`, `5f46b4c4e51b5c5c6c567468519faffd619f3700`, test `dc30793515766241181866e95d15979a4fdf9d35`. Qualification run `36459402744`, job `109053864185`: SUCCESS.
- **Probe limitation:** An unauthenticated GET to the `/exec?action=createManualOrder` URL could not be read from the current browser (`ERR_BLOCKED_BY_CLIENT` at the response) and terminal request timed out. The deployment success and saved source establish the deployed version; the exact HTTP response code `T12_CLOUD_ORDER_ID_AUTHORITY` remains unobserved over that URL from this environment. Do not record the runtime probe as PASS.

## Google Sheets re-key

Identity was checked live immediately before the edit: `محمود مناع`, `01007131332`, `طباعة`, Order `4322`, Line `4322-01`; operational Order and Line status both `تم التسليم`. No `4323` existed in the operational rows before the edit.

Only these 14 cells changed, in one bounded Sheets batch:

| Sheet | Cells | Before → after |
| --- | --- | --- |
| `الأوردرات` | A713, B713 | `4322` → `4323` |
| `بنود الأوردرات` | A769, B769 | `4322` → `4323` |
| `بنود الأوردرات` | F769 | `4322-01` → `4323-01` (stored as text) |
| `سجل حركة الأوردرات` | B12179, B12185, B12187 | `4322` → `4323` |
| `سجل حركة الأوردرات` | C12179 | `4322-01` → `4323-01` (stored as text) |
| `سجل تنبيهات التشغيل` | D2125 | `4322` → `4323` |
| `سجل تنبيهات التشغيل` | E2125 | `4322-01` → `4323-01` (stored as text) |
| `سجل تنبيهات التشغيل` | K2125, L2125 | Customer message and encoded WhatsApp link: `4322` → `4323` |
| `سجل تنبيهات التشغيل` | P2125 | `STATUS|4322|4322-01|طلب جديد` → `STATUS|4323|4323-01|طلب جديد` |

The status cells `الأوردرات!L713` and `بنود الأوردرات!K769` remain `تم التسليم`. Historical event/status text in the activity log and alert was not altered. The activity rows 12185 and 12187 have a phone-number value in their Line ID column; only their Order ID was re-keyed. `واجهة خدمة العملاء!A713:B713` updated automatically from its calculated source to `4323`; it was not written directly.

## Final workbook search and readback

- Search for `4322` across the workbook's 91 tabs: one unrelated substring remains in `سجل تنبيهات التشغيل!A818`, alert ID `ALT-41C64322`, for Order `3534` / customer `هاجر النادي`. It was deliberately not changed.
- No Mahmoud business reference remains under `4322` or `4322-01`.
- `4323` appears in the verified Mahmoud rows: `الأوردرات!713`, `بنود الأوردرات!769`, `سجل حركة الأوردرات!12179,12185,12187`, `سجل تنبيهات التشغيل!2125`, and calculated `واجهة خدمة العملاء!713`.
- `4323-01` appears in `بنود الأوردرات!F769`, `سجل حركة الأوردرات!C12179`, `سجل تنبيهات التشغيل!E2125/P2125`.
- Readback confirms Order and Line remain `تم التسليم`; no order was reopened or newly created.

## Cloud boundary and owner handoff

`CLOUDFLARE_TOUCHED=NO`
`D1_TOUCHED=NO`

Per Entry 450, D1 Canary Order `4322` remains a historical technical record at runtime status `تم التسليم`. Do not cancel or reassign it. The owner's remaining manual Cloud step is to **retire/prevent its pending outbox** so the canary cannot later write to Sheets. Do not touch real D1 Order `4323` or its outbox as part of this repair.
