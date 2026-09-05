# TrendOS Black Box — Platform Cloudflare Scope + Current State

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Scope: **TrendOS main platform only**

## Scope clarification

This execution/chat lane is exclusively for the **TrendOS main platform** and its staged migration to **Cloudflare**.

Accounting-specific lanes/checkpoints are out of scope for this chat and must not be mixed into platform migration decisions.

Primary goal:

`TrendOS main platform -> Cloudflare staged migration -> verified production cutover without breaking live operations`

## Canonical platform lane

Use the `PERF-CF` black-box/checkpoint chain for Cloudflare platform migration.

Latest verified platform checkpoint reviewed:

`PERF-CF-02CA FINAL VERIFY`

Status: **VERIFIED PASS — CLOSED**.

## Current verified Production state

- Production Worker: `trendos-d1-api`
- Production Worker version: `2796b73b-5a30-4b4a-af83-eabd15d0062c`
- Production Shadow: **ON**, fixed-synthetic / read-only / mutation-free observer only
- Shadow fingerprint: `66711d7eef8febed69fa59cbd8b5f20146ed82374de55595ae1a126291d3f4b1`
- Shadow live Production business-data reads: **NONE**
- Shadow D1 reads/writes: **NONE**
- Shadow Apps Script calls: **NONE**
- Shadow Sheet writes: **NONE**
- Production Cloud Write: **OFF**
- Cloud writes accepted: **NO**
- Sheets authoritative: **YES**
- Production cutover: **NO**
- Frontend cutover: **NO**
- Normalized-data cutover: **NO**
- D1 migrations at latest platform checkpoint: **NONE**
- Worker secret rotation at latest platform checkpoint: **NONE**

Latest Orders/Lines qualification at 02CA:
- Orders parity: `279/279`
- Lines parity: `321/321`
- mirror note: `TrendOS orders live sync V2 quota-aware`

## Important verified path already completed

The platform Cloudflare lane is not starting from zero.

Already completed/verified in prior `PERF-CF` checkpoints:

1. Cloudflare D1 Orders/Lines mirror path and protected Edge read path.
2. Low-usage heartbeat and dual-signal freshness semantics.
3. Dedicated Staging workbook and Staging Worker isolation.
4. First real canonical Staging order write and idempotent replay.
5. Cloudflare Staging -> Apps Script Staging canonical V2 bridge qualification.
6. Production isolation proving staging qualification data does not leak to Production.
7. Production Shadow wrapper deployment with Shadow OFF / Cloud Write OFF.
8. Controlled enablement of fixed-synthetic Production Shadow observer in read-only mode.
9. Final 02CA verification with Cloud Write still OFF and no production business mutation.

## Current migration boundary

The platform is **partially on Cloudflare**, but the full platform migration is **not complete**.

Cloudflare currently has qualified runtime/read/shadow infrastructure, while:

- Google Sheets + Apps Script remain authoritative for production writes.
- Production Cloud Write remains disabled.
- Frontend cutover remains disabled.
- Normalized-data cutover remains disabled.

## Exact next safe step

Resume from `PERF-CF-02CA FINAL VERIFY`.

Next action must be a **separate read-only Production Shadow stability observation** across repeated samples while Cloud Write remains OFF.

Required invariants:
- same deterministic Shadow fingerprint;
- zero live Production business-data reads by the Shadow observer;
- zero mutations;
- core Worker runtime healthy;
- Cloud Write remains OFF;
- Orders/Lines mirror parity remains valid.

Do not enable Production Cloud Write or frontend cutover as part of this next step.

## Operating rule

For this chat/lane:

- do not restart inventory;
- do not mix Accounting checkpoints into platform decisions;
- do not claim full Cloudflare migration while production writes/frontend cutover remain off;
- continue only from the latest verified `PERF-CF` platform checkpoint;
- record every material platform execution step in the TrendOS black box before moving to the next material step.
