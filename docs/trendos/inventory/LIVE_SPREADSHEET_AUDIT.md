# TrendOS Phase 0 — Live Spreadsheet Audit

> Scope: direct read-only inspection of the connected production Google Sheet. No spreadsheet mutation was performed.

## Connection status

Direct Google Sheets access is working for:

`TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`

Spreadsheet ID:

`1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

This allows Phase 0 to continue without asking the operator to copy/paste ordinary sheet data manually.

## Live metadata verified

- 87 sheet tabs are present.
- spreadsheet locale: `en_US`.
- spreadsheet metadata timezone: `America/Los_Angeles`.
- sheet `إعدادات المنصة الأساسية` explicitly defines `OPERATION_TIMEZONE = Africa/Cairo`.
- the same settings sheet includes a migration note saying not to change the spreadsheet timezone blindly; old dates/triggers require an organized migration review first.

Therefore the timezone mismatch is **known and intentionally deferred**, not a safe one-click fix.

## Users sheet — direct read findings

The live `المستخدمين` sheet contains the expected authentication columns including:

- username
- department
- role
- active
- password credential material
- last login
- Token

Sensitive values were intentionally not copied into canonical documentation.

The headers `Token` and `آخر دخول` already exist in the live sheet. Therefore current `ensureUsersSetup_()` does not need to add those headers under the presently observed schema, though it still performs header reads on the auth hot path.

## Orders / Lines schema

Live metadata:

- `الأوردرات`: grid 166 rows x 77 columns.
- `بنود الأوردرات`: grid 194 rows x 92 columns.

Current deployed health previously reported used data rows:

- Orders: 152
- Lines: 180

### Duplicate header names in `بنود الأوردرات`

The live header row contains repeated names:

- `تم الإبلاغ بواسطة` x2
- `آخر رسالة واتساب` x2
- `تم إرسال رسالة التسجيل؟` x2
- `الوقت المتوقع` x3
- `مديونية العميل` x2
- `مصدر الطلب` x3
- `أنشئ بواسطة` x2
- `فاصل واتساب` x2
- `أيام استلام العميل` x3

Current `headersMap_(sheet)` iterates left-to-right and assigns `map[key] = i + 1`, so duplicate normalized header names resolve to the **last occurrence**.

This creates a schema-ambiguity risk: code using `h["header"]` silently targets the last duplicate column. Before removing or renaming any duplicate column, data placement and all consumers must be reconciled.

## Duplicate-history rows

A direct live-sheet search of `بنود الأوردرات` found **35 rows whose status is `مكرر`** within the current 194-row grid.

These rows are historical duplicate records and are not automatically evidence of an active duplicate problem. The Core exit gate remains: zero duplicate **active** Line IDs after excluding `مكرر` rows.

No historical row should be deleted merely because its status is `مكرر`.

## Authentication hot-path evidence combined with live sheet

Current code plus live schema now establishes:

`authorize_ -> findUser_ -> ensureUsersSetup_ -> headersMap_ -> full Users getDataRange() -> headersMap_ -> sequential username scan`

`ensureHeaderIfAnyMissing_()` only writes if required headers are absent. The live Users sheet already contains both required headers, so the currently observed path is expected to perform schema reads but not a header-add write during normal auth.

The major confirmed hot-path cost remains synchronous Google Sheets access before D1 V2.3 cache return.

## Security note

The Users sheet contains credential/token material. Canonical inventory must never copy actual credentials/tokens into GitHub. Future auth acceleration must preserve token rotation, logout, password-change invalidation, deactivation and session-expiry semantics.

## Current next audit work

Continue read-only using direct Sheet access + the supplied current `Code.gs` + GitHub:

1. prove zero active duplicate Line IDs.
2. map duplicate-header data placement/consumers.
3. finish auth/session/invalidation inventory.
4. map Invoice, Attendance, Cleaning, Press, WhatsApp, Handover/OPS.
5. reconcile runtime D1 parity.
6. only after Phase 0 inventory, implement shared integrity foundation.

No production mutation is authorized by this audit step.
