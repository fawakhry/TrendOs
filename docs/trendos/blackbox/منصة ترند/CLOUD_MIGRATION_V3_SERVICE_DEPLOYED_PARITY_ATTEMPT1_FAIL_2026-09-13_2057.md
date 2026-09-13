# TrendOS Cloud Migration V3 — Service Deployed Contract Parity Attempt 1 FAIL-CLOSED

Date: 2026-09-13 20:57 Africa/Cairo
Controlled branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`

## Completed step

Compared a Service-specific D1 candidate using the confirmed deployed Service semantics (`lineId` from `رقم العميل`, column 17) against live Production Apps Script Service output.

- workflow: `TrendOS T11 Service Deployed Contract Parity`
- run: `34776075462`
- job: `103774304606`
- workflow commit: `83fbe4e06edd248c579865350e32c683bd50b469`
- result: FAIL-CLOSED / read-only
- Production business mutation: NO
- Service cutover: NO

## Results

- D1 candidate rows: 31
- Apps Script Service rows: 35
- Apps Script reported totalRows: 35
- missing from D1 candidate: 13
- extra in D1 candidate: 9
- Apps Script read latency: ~6224 ms
- D1 Lines mirror `syncedAt`: `2026-09-13 18:38:19`

Missing-by-status aggregate:
- طلب جديد: 9
- تسليم جزئي: 3
- cloud-qualification: 1

Extra-by-status aggregate:
- طلب جديد: 7
- تحت التنفيذ: 2

D1 raw status distribution at the compared snapshot:
- ملغى: 13
- تم التسليم: 416
- مكرر: 35
- طلب جديد: 24
- جاهز للاستلام: 74
- متوقف: 2
- تحت التنفيذ: 5

## Interpretation

The field-contract mismatch was materially reduced after mapping Service `lineId` to column 17, confirming the field-origin result. The remaining mismatch is strongly consistent with freshness drift: the D1 Lines mirror snapshot was roughly 17 minutes old at comparison time and did not contain live statuses such as `تسليم جزئي` seen in Apps Script output.

Therefore exact Service parity must not be judged or cut over against this stale snapshot.

## Production state unchanged

- main: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`
- Print/Laser/Press: D1-first with freshness fallback.
- Service: Apps Script.
- all writes: Apps Script/Sheets authoritative.

## Exact next step

Diagnose and restore/trigger the existing safe Orders/Lines mirror freshness path, without moving write authority. Verify a fresh Lines mirror first, then rerun the same Service deployed-contract parity. Do not alter Service routing until exact parity PASS.
