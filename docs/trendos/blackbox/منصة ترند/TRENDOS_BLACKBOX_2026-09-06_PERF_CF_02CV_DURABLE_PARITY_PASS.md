# PERF-CF-02CV — Durable Working-Branch Parity Pass

Date: 2026-09-06
Repository: `fawakhry/TrendOs`
Production branch: `main`
Working branch: `agent/go-live-2026-09-01-integrity`

## Purpose

This record closes the technical cleanup/parity sub-step after the Production Fly Print lane-stability promotion. It does **not** close PERF-CF-02CV itself; user-visible validation remains required.

## Production remains unchanged

Production main remains:

`3934fa363b113a4bd494ec501fb5f289f2c48ec1`

Production Pages Run:

`34039321631` — **SUCCESS**

Production Worker remains:

`9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` @100%

No Apps Script deploy, Worker deploy, D1 business-data write, authority transfer, secret rotation, 02CL enablement, or generic drain enablement occurred during this parity/cleanup work.

## Durable regression correction

The first permanent Fly Print regression test accidentally coupled two separate concerns:

1. the durable frontend logic contract;
2. the Production-only `app.js` cache-bust token.

The working branch intentionally has its own older V1931 loader/package state, so the durable test was corrected to validate the Fly Print preservation logic only. The Production cache-bust had already been separately qualified by the Production candidate/promotion/Pages sequence.

Permanent test:

`tests/frontend_flyprint_lane_stability_02cv.test.mjs`

It now verifies:

- `preserveFlyPrintAcrossMissingFields(previousRows, nextRows)` exists;
- `loadRows()` uses it before replacing `state.rows`;
- a previously affirmative Fly Print marker survives only when the next payload for the same stable `lineId` omits all Fly Print fields;
- explicit `لا` remains authoritative;
- explicit blank remains authoritative;
- unmatched or unstable identities do not receive an invented marker;
- explicit Arabic Fly Print fields remain authoritative.

## Working-branch parity

The qualified Fly Print app logic already live on Production was copied back to the working branch in a bounded `app.js`-only parity step.

Working parity commit:

`1574151cd27f4143f57606c30137fd1352b43b32`

Commit message:

`Sync qualified 02CV fly-print app logic to working branch`

The parity workflow verified before push:

- Fly Print lane-stability contract — PASS;
- existing 02CV write-consistency contract — PASS;
- JavaScript syntax — PASS;
- exact parity diff — `app.js` only.

The one-use parity workflow was then removed.

Cleanup head used for final Integrity qualification:

`0498988db4ab543701d007905b9576465081f0d6`

## Final durable Integrity qualification

TrendOS Integrity V1 Run:

`34041055864` — **SUCCESS**

On head:

`0498988db4ab543701d007905b9576465081f0d6`

Important passing steps included:

- frontend D1 Orders dual-signal freshness;
- 02CV order status write consistency;
- **02CV Fly Print lane stability**;
- Cloudflare freshness/heartbeat/integration guards;
- polling coalescing;
- TrendOS integrity foundation/runtime tools;
- CORE-P0, order-line, attendance, press, invoice, WhatsApp, handover, ANDON and dashboard integrity;
- composed Apps Script syntax/collision test;
- pre-deploy safety gate;
- accounting domain, transaction, and persistence tests.

## Current 02CV state

**PRODUCTION TECHNICAL + UX + FLY-PRINT LANE-STABILITY PASS — DURABLE INTEGRITY + WORKING-BRANCH PARITY PASS — USER-VISIBLE VALIDATION PENDING**

Remaining user-visible close condition:

1. refresh the live platform once;
2. identify a row with `⚡ طباعة على الطاير`;
3. change/save something or update the sheet;
4. confirm the same Fly Print row keeps its ⚡ marker;
5. confirm a hidden-status save removes the row immediately;
6. confirm no second long Orders loading cycle occurs after save success.

Do not mark PERF-CF-02CV CLOSED until the user confirms the live behavior.
