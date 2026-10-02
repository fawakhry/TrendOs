# TrendOS T12 — Stale Legacy Orders Diagnosis — Entry596 — 2026-10-02

## الحالة

تشخيص **Read-only** لعطل: أوردرات Legacy قديمة ما زالت ظاهرة Active في TrendOS، وعند محاولة إغلاقها يظهر:
`البند غير موجود في الشيت.`

لا توجد في هذا التشخيص أي كتابة على D1 أو Google Sheets أو Order Status، ولا أي Worker / Frontend / Apps Script deploy.

## Runtime evidence

### D1 mirror
GitHub Actions:
- Run: `37018544009`
- Job: `110875375520`
- Result: `SUCCESS`

Evidence:
```ini
MIRROR_SYNCED_AT=2026-09-26 18:33:08
MIRROR_SOURCE_LAST_ROW=768
MIRROR_ROW_COUNT=768
MIRROR_STATUS=ready
MIRROR_NOTE=TrendOS orders live sync V2 quota-aware
MIRROR_NONEMPTY_LINES=767
MIRROR_ACTIVE_LINES=15
```

### Current Google source
Read-only comparison against current `بنود الأوردرات`:
```ini
CURRENT_NON_HEADER_ROWS=768
CURRENT_ACTIVE_LINES=0
DELIVERED=639
READY_FOR_PICKUP=73
DUPLICATE=36
CANCELLED=20
```

Every one of the 15 rows that D1 still exposes as `طلب جديد` is already `تم التسليم` in the current Google source.

## Exact stale identities

```text
TM2606150097 / TM2606150097-01
TM2606150098 / TM2606150098-01
TM2606150105 / TM2606150105-01
TM2606160146 / TM2606160146-01
4310 / 4310-01
4312 / 4312-01
4313 / 4313-01
4314 / 4314-01
4315 / 4315-01
4316 / 4316-01
4317 / 4317-01
4318 / 4318-01
4319 / 4319-01
4320 / 4320-01
4321 / 4321-01
```

The four TM orders were updated to delivered in the source on 2026-10-01. Numeric legacy Orders 4310 and 4312–4321 were updated to delivered in the source on 2026-09-28.

## Identity corruption evidence

For numeric legacy Orders 4310 and 4312–4321, D1 mirror raw values preserve Google date-coercion. Example:

```text
visible/repaired lineId: 4310-01
raw mirrored value:     4310-01-01T08:00:00.000Z
```

The Edge read layer repairs this class for display. The legacy Apps Script writer does not reverse that repair when searching the raw Google cell.

## Exact error source

`Code.gs -> updateLine_(e)` searches `بنود الأوردرات` for an exact normalized `lineId`. If it cannot resolve a row, it returns:

```text
البند غير موجود في الشيت.
```

The browser Edge wrapper also deliberately strips stale D1 `rowNumber` when a stable `lineId` is present. This protects against writing to a shifted row, but means the repaired identity must resolve correctly. For the date-coerced historical rows it does not.

## Root cause

```ini
ROOT_CAUSE=STALE_D1_BASE_SNAPSHOT_PLUS_LEGACY_DATE_COERCED_LINE_ID_WRITE_MISMATCH
ORDER_RECORDS_LOST=NO
CURRENT_SOURCE_ALREADY_DELIVERED=YES
D1_STALE_ACTIVE_ROWS=15
```

There are two separate facts behind the symptom:

1. D1 base mirror is stale at 2026-09-26, so it still paints 15 already-delivered rows as active.
2. Some historical Line IDs were coerced by Google into date-like values; D1 repairs them for reading, while the legacy Apps Script update path compares against the raw source identity.

## Unsafe fixes rejected

- Do not trust stale D1 `rowNumber` and write to Google by coordinate.
- Do not manually rewrite the immutable `sheet_rows` mirror as if it were a current synchronization.
- Do not patch/deploy Apps Script v159 as the default solution.
- Do not hide the 15 rows only in frontend code with a hard-coded exception list.

## Durable Zero-Google direction

Add a D1-native Legacy Line Runtime Overlay:

1. Additive D1 table for current status/notes of legacy lines, separate from immutable mirror snapshot.
2. Resolve legacy identity from D1 mirror, including 02CX date-coercion repair.
3. Apply runtime overlay before Orders filtering/paging.
4. Route stable legacy `updateLine` writes to Cloud/D1.
5. Preserve employee screen permissions and delivery/debt gate.
6. Reconcile the exact 15 already-delivered identities into the overlay only under an explicit bounded Production operation.
7. Do not change Order IDs.

Repo qualification begins with migration `0011_t12_legacy_line_runtime.sql`; Production remains unchanged until separately authorized.
