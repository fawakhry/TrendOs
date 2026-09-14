# CLOUD MIGRATION V3 — T11 Service candidate live parity PASS

Date: 2026-09-14
Run: 34835539259
Parity workflow commit: b503ca4de65b4ec1a199dfa800ada6eab1e2020e
Candidate qty fix commit: 45b908cfa33940da7e78ee515e86c7431c135fc4

## Result
- PASS
- Candidate active rows: 35
- Apps Script active rows: 35
- Apps Script pagination total: 35
- Missing rows: 0
- Extra rows: 0
- Owner-approved exclusions: 9
- Status counts: exact match
- Apps Script authoritative read duration observed: 10073 ms

Exact status counts on both sides:
- طلب جديد: 26
- جاهز للاستلام: 65 (statusCounts only; excluded from __ACTIVE__ rows)
- تسليم جزئي: 3
- متوقف: 2
- تحت التنفيذ: 3
- cloud-qualification: 1

## Privacy / safety
- Raw excluded order IDs were not logged.
- Customer values were not logged.
- No production business mutation occurred.
- No Worker production deployment yet at this checkpoint.
- Service frontend still uses Apps Script.
- Sheets/Apps Script remains write authority.

## Next step
Deploy only the isolated Service Worker route, qualify it live with authenticated Service session, then separately cut over frontend Service to D1-first only if the live route passes. Existing Print/Laser/Press remain unchanged.
