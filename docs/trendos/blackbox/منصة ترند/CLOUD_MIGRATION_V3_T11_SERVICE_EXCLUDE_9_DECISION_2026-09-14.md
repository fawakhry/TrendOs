# CLOUD MIGRATION V3 — T11 Service explicit 9-row exclusion decision

Date: 2026-09-14
Branch: cloud-migration-v3-t6b-auth-shadow-canary-20260913

## Owner decision
The owner explicitly approved excluding the 9 `طلب جديد` Orders rows that are present in the D1 Orders mirror but are not part of the deployed Service `__ACTIVE__` result, and requested continuation.

## Qualified production Service contract before this decision
- Deployed Service source is the Orders view, not Order Lines.
- 35/35 deployed Service rows map uniquely to D1 `الأوردرات` rows by order identity.
- Current deployed Service `__ACTIVE__` result is 35 rows:
  - 26 `طلب جديد`
  - 3 `تحت التنفيذ`
  - 2 `متوقف`
  - 3 `تسليم جزئي`
  - 1 `cloud-qualification`
- Nine additional D1 Orders rows with status `طلب جديد` are intentionally excluded from the Cloud Service candidate per owner decision.

## Safety
- No production routing changed in this checkpoint.
- No business write authority changed.
- No Task mutation.
- No secret rotation.
- Service remains on Apps Script until Cloud candidate parity passes.

## Next step
Build a Service-specific D1 candidate from `الأوردرات`, reproducing the deployed 35-row result while explicitly excluding the 9 owner-approved rows, then run live parity before any cutover.
