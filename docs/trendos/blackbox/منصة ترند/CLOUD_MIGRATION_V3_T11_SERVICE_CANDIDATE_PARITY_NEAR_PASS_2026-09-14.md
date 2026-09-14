# CLOUD MIGRATION V3 — T11 Service candidate parity near-pass

Date: 2026-09-14
Run: 34835246364
Workflow commit: a3b5e75534cc305c69333abf36e00a31731a4260

## Result
- FAIL-CLOSED before production deployment.
- Candidate active rows: 35
- Apps Script active rows: 35
- Apps Script pagination total: 35
- Owner-approved exclusions: 9
- Status counts: exact match
- Multiset difference: 1 missing / 1 extra

Exact status counts on both sides:
- طلب جديد: 26
- جاهز للاستلام: 65 (statusCounts only; not in __ACTIVE__ rows)
- تسليم جزئي: 3
- متوقف: 2
- تحت التنفيذ: 3
- cloud-qualification: 1

## Safety
- No production Worker deploy.
- No frontend Service cutover.
- Service remains Apps Script.
- No business mutation, Task mutation, secret change, or write-authority change.

## Next step
Identify only the differing field name for the single mismatched Service row, without logging order/customer values, correct the candidate mapping, and rerun parity.
