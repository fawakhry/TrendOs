# TrendOS Cloud Migration V3 — Service Live Field Origin PASS

Date: 2026-09-13 20:56 Africa/Cairo
Controlled branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`

## Completed step

Safe live correlation of current Production Apps Script Service output against the fresh D1 `بنود الأوردرات` mirror, without logging raw customer/business values.

- workflow: `TrendOS T11 Service Live Field Origin`
- run: `34776015478`
- job: `103774141636`
- runner-fix commit: `f53df93b4022cd4c090b74a7c0144e594852cc52`
- result: PASS
- business values exposed in logs: NO
- production business mutation: NO

## Decisive evidence

Live Apps Script Service response:
- rows returned: 35
- rows with non-empty `lineId`: 34
- rows with non-empty `customerPhone`: 34
- `lineId` == `customerPhone` by normalized digits: **34 / 34**

D1 source-column correlation for those same order identities:
- column 17 `رقم العميل`: exact matches **34 / 34**, digit matches **34 / 34**
- canonical column 6 `رقم البند`: not the live Service `lineId` source

Expected D1 header positions:
- canonical Line ID: column 6
- customer phone: column 17

Mirror used:
- `syncedAt`: `2026-09-13 18:38:19`
- source rows: 570

Authoritative Service Apps Script read in the mapping run: ~4901 ms.

## Conclusion

The currently deployed Production Apps Script Service contract intentionally or historically exposes the customer phone field through the response property named `lineId`. This differs from the repository branch implementation, which maps `lineId` to column 6.

For migration parity, the Service-specific D1 candidate MUST reproduce the currently deployed production contract first:
- Service `lineId` = current production customer-phone semantics (source column 17), not canonical Line ID.
- Print/Laser/Press remain on their existing canonical line-level contract and must not be changed.

Do NOT patch Production Apps Script during this migration stage.

## Production state unchanged

- main: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`
- Print/Laser/Press: D1-first with fallback.
- Service: Apps Script.
- all business writes: Apps Script/Sheets authoritative.
- no Task/core-secret/Gaber changes.

## Exact next step

Build a read-only Service-specific D1 candidate using the Lines mirror but with the deployed Service field semantics (`lineId` from column 17). Reproduce the exact active-status and priority filtering/sort contract, compare counts/order/hashes against live Apps Script, and diagnose only aggregate/hash differences. Only after exact parity PASS may a Service D1 route/cutover be prepared.
