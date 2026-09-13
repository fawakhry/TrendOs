# TrendOS Cloud Migration V3 — Service Lines Header Probe PASS

Date: 2026-09-13 20:54 Africa/Cairo
Controlled branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`

## Completed step

Read-only probe of the current D1 `بنود الأوردرات` mirror header layout.

- workflow: `TrendOS T11 Service Lines Header Probe`
- run: `34775908608`
- job: `103773849140`
- workflow commit: `cdac758dd88268678157aa128cda661de7382ae8`
- result: PASS
- production mutation: NO

## Evidence

Mirror metadata:
- headers: 82
- `syncedAt`: `2026-09-13 18:38:19`
- `sourceLastRow`: 570
- `sourceLastCol`: 82
- status: ready

Relevant one-based columns:
- رقم الأوردر = 1
- كود الأوردر = 2
- اسم الشات / المكتب = 3
- القسم = 5
- رقم البند = 6
- اسم البند / نوع الشغل = 7
- الكمية = 8
- مسؤول القسم = 9
- الأولوية = 10
- الحالة = 11
- رقم العميل = 17

Repo `headersMap_` / `firstCol_` / `valueAt_` semantics are one-based and consistent: `رقم البند` resolves to column 6 and is read as `row[5]`.

## Important conclusion

The repository branch implementation of `getRows_` would expose column 6 as `lineId`. However, live Production Apps Script Service responses observed in the parity runs expose phone/customer-like values as `lineId`. Therefore the deployed Production Apps Script behavior and the repository branch source are not equivalent for this Service field contract.

Do NOT change Production Apps Script to force the repository contract. For the migration, parity must match the currently deployed production behavior first.

## Production state unchanged

- main: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`
- Print/Laser/Press: D1-first with fallback.
- Service: Apps Script.
- all writes: Apps Script/Sheets authoritative.

## Exact next step

Run a read-only live field-origin mapping: fetch current authoritative Service output and the fresh D1 Lines mirror, correlate rows by non-sensitive order identity, and report only column/header match counts (never raw customer values) to identify which source column current Production Apps Script uses for Service `lineId` and other identity fields. Then reproduce that exact deployed contract in a Service-specific D1 candidate.
