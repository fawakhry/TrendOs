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
- The preexisting `archiveDeliveredDepartmentV1926` is **suspended** when `TRENDOS_T12_NATIVE_CLOSE_ARCHIVE_V1_ENABLED=true`, so native close cannot race with legacy bulk archival. Default OFF leaves the existing legacy behavior unchanged; the new native action never touches historical Google orders.
- Does **not** send customer notifications, calculate invoices, clear customer debt, or grant financial/print authority.

## Source validation / release gates
- `node --test --no-warnings tests/t12_native_close_archive_v1.test.mjs`: seven local SQLite/source checks including original identity, all delivered, transaction rollback, race, partial-existing archive, replay/duplicate, and integration flag.
- CI: `.github/workflows/t12-native-close-archive-off-ci.yml`, no secrets or cloud credentials.
- Before any production activation: independently verify deployed native employee Core route, control mode, existing archive tables/IDs, debt/delivery policy on actual original backend, exact source version, per-order authenticated synthetic two-user E2E, concurrency/rollback, then owner-approved one-writer controlled canary. The financial receipt/statement clearance belongs to EasyStore owner; this archive module is **not** that clearance.
- Only activate the flag after a separate operational decision to suspend the old bulk archive writer; confirm active staff processes will not be disrupted.
- Until then: `T12_NATIVE_CLOSE_ARCHIVE_PRODUCTION=OFF`; `GOOGLE_ZERO_CUTOVER_NOT_PROVEN`; no customer/employee production data modified by this PR.

## 2026-11-02 fail-closed hardening
- Original simplified SQLite fixture accidentally omitted the `actor TEXT NOT NULL` constraint on `employee_core_events_v1`. The new race tests initially FAIL 2/11 on that bad fixture, not due to production state. Updated it to the actual migration schema, added explicit constraint-fidelity test.
- In-transaction row-count and delivery-status fence now aborts the entire D1 batch if a line is inserted or a status changes after preflight; `INSERT` does not silently ignore conflicting archive rows.
- Exact same-request replay now checks BOTH complete line count, original request key, order status and one audit event; malformed prior archive cannot be mistaken for success.
- If D1 commits but the HTTP/driver ACK is lost, a single readback reconciles a complete matching archive without reissuing any write.
- Existing employee Core bulk archive is fenced when the new native flag is ON, preserving the one-writer invariant; OFF runtime remains unchanged.
- Scope stays source-only; no actual Cloudflare activation, finance clearance or legacy order modification.

## Post-archive immutability gate — 2026-11-02
- The closure must be terminal: when the exact native-only flag is ON, `nativeT12ArchiveWriteFenceV1` reads the existing D1 archive order/line tables and blocks subsequent direct `updateLine` mutations to archived T12 orders.
- Both existing Cloudflare native write paths are covered: `/v1/t12/orders/line-runtime/update` and Employee Core `updateLine`; both retain their normal behavior when the flag is OFF.
- The archive-state read fails closed (no writes) if the D1/archive tables are missing while enabled. Existing old/imported order handling stays outside this new feature scope.
- This is a JS request-level fence, **not yet a DB-trigger-certified concurrency guarantee**. Before production enablement, verify any other T12 writers cannot edit after archival, and prove no race between this read and a concurrent commit using Workerd/D1 synthetic E2E. No live authorization or deployment in this PR.
- Full test count extended to 15 synthetic in-memory SQLite/source tests; final exact-head CI result must be linked before marking source PASS.
