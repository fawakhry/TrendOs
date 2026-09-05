# ACCT-CF-02I — Native CI Wiring Start

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Parent checkpoint: `ACCT-CF-02H`

## Pre-action record
The persistence readiness evaluator and its regression suite now exist. The next material step is to wire both into `TrendOS Accounting Native CI` so every change to this readiness boundary receives executable syntax and regression proof.

This step changes CI coverage only. It does not wire any runtime route, enable any D1 mutation, apply a schema migration, touch Google Sheets / Apps Script, or change financial authority.

## Intended CI additions
- Watch `cloudflare-d1/src/accounting-persistence-readiness-v1.mjs`.
- Watch `tests/cloudflare_accounting_persistence_readiness_v1.test.mjs`.
- Syntax-check the readiness module.
- Run the readiness safety regression suite.

## Safety boundary
- Production Accounting writes remain forbidden.
- Preview writes remain unactivated.
- `authoritativeWrites` remains false.

Status: STARTED
