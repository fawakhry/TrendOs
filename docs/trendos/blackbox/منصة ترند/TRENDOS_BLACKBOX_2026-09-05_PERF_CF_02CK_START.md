# TrendOS Blackbox — PERF-CF-02CK START

Date: 2026-09-05
Scope: TrendOS main platform / Cloudflare only.

## User authorization

User requested that platform blackbox information first be isolated under `منصة ترند`, then instructed: `وبعدها كمل`.

## Starting point

- Previous checkpoint: `PERF-CF-02CJ — VERIFIED PASS — CLOSED`.
- Production Cloud Write: ON.
- `writesAccepted=true`.
- `schemaReady=true`.
- Migration ledger: clean, pending migrations = 0.
- Production cutover: OFF.
- Sheets / Apps Script: authoritative.
- Production Shadow: ON, deterministic, read-only, mutation-free.

## 02CK objective

Build and run the first bounded Production Cloud Write business-write qualification without frontend cutover and without rotating the existing Production Edge session secret.

## Safety finding before execution

The current Production Edge session signing secret is a Cloudflare Worker secret and is not readable back from Cloudflare. An older Production deploy workflow generated its signing secret ephemerally, installed it, then deleted local signing material. Rotating it solely for qualification would invalidate current signed sessions and is not an acceptable qualification shortcut.

Therefore 02CK must use the canonical employee authentication route:

`POST /v1/edge/session`

which verifies an existing employee session through Apps Script, then returns a short-lived Edge token. The Cloud Write route remains fail-closed and authenticated.

## Qualification harness

Created:

`.github/workflows/trendos-production-cloud-write-business-qualification.yml`

The harness performs read-only Production preflight, requires the authenticated employee-session path, creates at most one clearly synthetic D1 order `CW-PROD-QUAL-<run-id>`, omits customer phone, replays the same idempotency key, requires exactly one pending outbox item, verifies post-write boundaries and Shadow mutation-free state, and never rotates Worker secrets or enables cutover.

If dedicated automation employee credentials are not configured, the workflow exits safely after preflight with no Production write.

## Status at START

`PERF-CF-02CK`: harness prepared; controlled qualification run pending.
