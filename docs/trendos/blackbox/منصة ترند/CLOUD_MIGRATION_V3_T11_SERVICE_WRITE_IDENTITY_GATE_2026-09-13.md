# Cloud Migration V3 — T11 Service Write Identity Gate

Date: 2026-09-13
Branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`
Result: **GATE IDENTIFIED — NO PRODUCTION CHANGE**

## Evidence
The frontend Service edit path calls `updateLine` with:
- `rowNumber: row.rowNumber`
- `orderId: row.orderId`
- `lineId: row.lineId`

The current Edge Orders adapter normalizes every `updateLine` write by repairing lineId and stripping `rowNumber` whenever a `lineId` exists. This is correct for Print/Laser/Press line-based rows.

However the deployed Service read contract has already been proven to expose:
- `lineId = رقم العميل` (customer phone), not the production Line ID.

The Apps Script `updateLine_` implementation resolves the target in this order:
1. valid `rowNumber` on `بنود الأوردرات`
2. otherwise Line ID match

It does not safely treat a Service customer-phone `lineId` as a Line ID.

## Risk
Enabling Service D1-first through the existing generic adapter without a Service-specific write path can break status/notes writes by removing the only usable authoritative row coordinate and then looking up a customer phone as a Line ID.

## Required mitigation before Service cutover
Keep Sheets/Apps Script as write authority and make Service writes resolve authoritative identity immediately before the write:
1. detect current screen = `service`;
2. call the original Apps Script `getRowsPageV1931` (not Edge) with the target order query;
3. select the matching Service row by order identity;
4. replace write `rowNumber` and `lineId` with the authoritative values returned by Apps Script;
5. execute the original write action;
6. retain the post-write D1 fallback barrier.

Apply the same resolver to identity-sensitive Service actions such as `updateLine` and `markCustomerNotified`; leave Print/Laser/Press behavior unchanged.

No production mutation was performed for this checkpoint.
