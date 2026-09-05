# ACCT-CF-02L — Read-Only Persistence Schema Preflight Start

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Parent checkpoint: `ACCT-CF-02K`

## Pre-action record
The persistence readiness boundary is proven live in isolated Preview as `ZERO_WRITE`. The next safe increment is a read-only schema compatibility preflight for the exact tables/columns consumed by `accounting/d1-persistence-adapter-v1.js`.

The preflight will inspect only metadata on an explicitly injected D1-like handle. It will not create tables/indexes/triggers, execute migrations, invoke `batch()`, call statement `run()`, or enable any financial write path.

## Required schema contract
Tables:
- `accounting_operation_idempotency`
- `accounting_stock_movements`

The required columns are derived from the adapter's SELECT/INSERT contract and the prepared `cloudflare-d1/schema-prep/accounting-operations-v1.sql` file.

## Output contract
The preflight must return a deterministic report containing:
- compatible true/false;
- missing tables;
- missing columns per table;
- read-only marker;
- mutationPerformed=false;
- authoritativeWrites=false.

An absent/invalid injected DB handle must fail closed without probing any ambient/production binding.

Status: STARTED
