# T12 — New cloud-native orders ONLY: close and archive — 2026-11-02

## Owner decision
- Do NOT migrate, restore, close, archive, or touch historical Google orders in this task.
- Employee login + permissions are already handled in Cloudflare on the separate existing track.
- Attendance, time clock, HR, and cleaning are not part of this work.
- Accounts/EasyStore and customer interface are owned by their other development chats.
- ONLY missing work: safe closure and archiving of new orders already created on T12 Cloudflare D1.

## Implementation (source-only; NOT activated in remote Worker)
- New internal module: `cloudflare-d1/src/t12-native-close-archive-v1.mjs`.
- Existing authorized endpoint: `POST /v1/employee/core`, action `closeAndArchiveT12OrderV1`.
- Existing native employee authentication and Core `GENERAL` mode remain mandatory.
- Additional exact environment gate `TRENDOS_T12_NATIVE_CLOSE_ARCHIVE_V1_ENABLED === 'true'`; variable is **absent / OFF by default**.
- Only exact `t12_prod_orders` + `t12_prod_lines` identities, never Google Sheets mirrors or imported historical orders.
- Requires nonempty T12 order, ALL native lines' effective runtime status `تم التسليم`, and admin/service role with service screen.
- Rejects partial previous archives; immutable `t12_prod_orders.status` remains unchanged because CREATE schema permits `طلب جديد` only.
- Existing D1 `employee_core_archive_orders_v1`, `employee_core_archive_lines_v1`, `employee_core_events_v1` reused: no new production migration.
- `DB.batch` transaction writes the order closure, ALL line snapshots and audit event, guarded again by live SQL status. Race or failed batch denies without partial archive.
- `requestId` matches replay as idempotent; mismatching requestId fails closed.
- Existing `archiveDeliveredDepartmentV1926` left untouched and is NOT part of this new path. It must not be activated as a competing archive writer without a later independent review.
- Does **not** send customer notifications, calculate invoices, clear customer debt, or grant financial/print authority.

## Source validation / release gates
- `node --test --no-warnings tests/t12_native_close_archive_v1.test.mjs`: seven local SQLite/source checks including original identity, all delivered, transaction rollback, race, partial-existing archive, replay/duplicate, and integration flag.
- CI: `.github/workflows/t12-native-close-archive-off-ci.yml`, no secrets or cloud credentials.
- Before any production activation: independently verify deployed native employee Core route, control mode, existing archive tables/IDs, debt/delivery policy on actual original backend, exact source version, per-order authenticated synthetic two-user E2E, concurrency/rollback, then owner-approved one-writer controlled canary. The financial receipt/statement clearance belongs to EasyStore owner; this archive module is **not** that clearance.
- Until then: `T12_NATIVE_CLOSE_ARCHIVE_PRODUCTION=OFF`; `GOOGLE_ZERO_CUTOVER_NOT_PROVEN`; no customer/employee production data modified by this PR.
