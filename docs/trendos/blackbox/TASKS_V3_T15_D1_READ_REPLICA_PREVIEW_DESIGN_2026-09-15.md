# TrendOS Tasks V3 — T1.5 D1 Read-Replica Preview Design — 2026-09-15

## Decision
Owner approved an architecture change after T1 proved that Apps Script synchronous upstream latency cannot reliably satisfy the <=2s p95 gate.

T1.5 removes Apps Script from the synchronous HTTP read path while preserving Google Sheets as the authoritative Tasks V3 source.

## Architecture

Read path:

`Client -> isolated T1.5 Worker -> isolated preview D1 snapshot`

Refresh path:

`Cloudflare scheduled event -> existing signed T1 Apps Script health + status -> atomic D1 snapshot upsert`

Apps Script is therefore outside the request hot path.

## Authority and staleness
- Google Sheets remain authoritative.
- D1 is a read replica only.
- One atomic snapshot stores source health + WAEL status, including flyPrint and pressCandidates.
- Snapshot refresh runs out of band.
- Reads fail closed with HTTP 503 if no snapshot exists or the snapshot exceeds the configured max age.
- No fallback from D1 reads to Apps Script is permitted.

## Scope
Preview only. WAEL only. Read-only operations only:
- health
- status
- flyPrint
- pressCandidates

Explicitly excluded:
- claimNext
- completeTask
- T2 Production canary
- production D1 writes
- main Apps Script changes
- secret rotation/change
- V2 fallback
- write-authority transfer

## Isolation
A NEW isolated D1 database is required before deploy:
`trendos-tasks-v3-t15-preview-20260915`

The production `trendos-main` D1 database and id are forbidden in T1.5 preview files.

The Wrangler file is committed only as `.example` with a placeholder database id so accidental deploy is impossible before the isolated preview database exists.

## Acceptance target
Before T1.5 can replace the failed T1 read architecture:
- contract tests PASS
- 30/30 read-only health calls succeed
- synchronous upstream timing = 0 ms
- read p95 <= 2s
- stale snapshot fails closed
- no production mutation
- no read fallback to Apps Script

T2 remains locked even if T1.5 passes. T2 requires separate explicit owner approval.
