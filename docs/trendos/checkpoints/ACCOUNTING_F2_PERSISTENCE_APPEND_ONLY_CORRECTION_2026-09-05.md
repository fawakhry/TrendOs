# TrendOS Accounting F2 — Append-Only Persistence Correction

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Problem found before schema testing
The first prepared schema combined append-only triggers with lifecycle states that implied later UPDATEs:
- idempotency `claimed -> completed`;
- journal `posted -> reversed`.

That is internally inconsistent with immutable financial facts.

## Correction
Updated prepared schema:
`cloudflare-d1/schema-prep/accounting-finance-v1.sql`

Commit:
`3374974c7bf8f980199ff1b3ec67dc02a3a2ef8b`

### Journal state
- journal rows are inserted only as `posted`;
- original journal is never changed to `reversed`;
- reversal state is derived from a separate new journal whose `reversal_of_journal_id` points to the original;
- reversal reason is mandatory when reversal reference exists.

### Idempotency state
- one immutable final decision is inserted per key;
- allowed decisions: `completed`, `failed`, `ambiguous`;
- `completed` requires a journal ID and is intended to be inserted atomically with the journal;
- `failed`/`ambiguous` can reserve the key without a journal;
- there is no `claimed -> completed` UPDATE lifecycle in the prepared append-only schema;
- result JSON is retained with the immutable decision.

## Safety
Still PREPARED ONLY. The SQL remains outside active migrations and has not been applied to D1 or production.

## Exact next step
Validate the corrected schema in an in-memory SQLite test, including immutability and replay constraints.

**Status: CORRECTED BEFORE ANY DATABASE APPLICATION.**
