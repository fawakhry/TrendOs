# TrendOS — Closed Components Registry

> Purpose: keep the active Master Book small without losing repair knowledge. Closed items are skipped during normal new-chat onboarding and are reopened only by the trigger written here. This registry does not delete code or evidence.

## Status vocabulary

- `CERTIFIED_CURRENT`: source + deployed/runtime parity + required tests verified for the currently active component. Can be skipped in onboarding until a reopen trigger occurs.
- `CERTIFIED_HISTORICAL`: a point-in-time event/canary is fully evidenced for its historical date, but it is NOT a claim about current runtime.
- `CLOSED_BY_OWNER_DECISION`: the objective was intentionally retired; do not retry old operational steps automatically.
- `SUPERSEDED_HISTORICAL`: a past interpretation/task was replaced by later evidence and remains audit-only.

**Important:** at the start of this compaction pass, the fixed §11 inventory contains **zero formal CERTIFIED rows**. Therefore no current production subsystem is promoted to `CERTIFIED_CURRENT` by this documentation change.

## Closed items

| Component / history | Closed status | Why it is closed | Reopen only when | Primary evidence |
|---|---|---|---|---|
| Auth Shadow T6B canary, 13 Sep 2026 | `CERTIFIED_HISTORICAL` | The historical canary certificate/run evidence is complete for that dated experiment; later T11/T12 work supersedes it as a statement of current production. | Auditing T6B, investigating an auth regression traceable to that canary, or comparing a new implementation to the old certificate. | Master Book old §8.3; archived T6B certificate; pre-compaction snapshot pointer. |
| `MAP-INCIDENT-SERVICE-RESTORE` interpretation from 24 Sep | `SUPERSEDED_HISTORICAL` | Owner correction established that work was stopped voluntarily for migration/testing and there was no reported active service incident. | A new real production outage is reported with fresh evidence. Do not revive the old incident narrative automatically. | Master Book §6.8; Journal Entry246/248 and owner correction; pre-compaction snapshot. |
| T12 Production D1 historical full-rebase one-shot, Entries374–377 | `CLOSED_BY_OWNER_DECISION` / `DO_NOT_RETRY` | Helper was executed exactly once; JSON result remained unknown, row counts were observed, then owner declared historical completed/delivered orders no longer a cutover objective. The fresh-start CREATE path replaced historical backfill as the objective. | Only if the owner explicitly reopens historical backfill as a business requirement and a new recovery plan is designed from current evidence. Never rerun the old one-shot blindly. | Journal Entries374–377; Master Book old §6.37+Entry377; pre-compaction snapshot. |
| Old inline §8.2 T12 Journal title list | `CLOSED_NAVIGATION_COPY` | It duplicated navigation already available from the canonical append-only Journal. | Only for audit of the old index snapshot. | `TRENDOS_T12_JOURNAL_TITLE_INDEX_SNAPSHOT_2026-09-26.md`. |
| Old inline §11 1185-path inventory table | `CLOSED_HEAVY_REFERENCE` | It is required for coverage accounting, but not for every new chat. It remains an appendix and is opened only when a file/coverage question requires it. | Coverage work, repair of a named file, audit of M/P/A/L classifications, or inventory refresh. | `TRENDOS_COVERAGE_INVENTORY_05ca9c9.md`. |

| Work Queue V1 legacy task system | `SUPERSEDED_HISTORICAL / DO_NOT_ENABLE` | Owner requirements replaced V1 with Operator Task V2. Full review confirms V1 exposes claim/start/pause/resume/complete, Fly Print as an active task, mutable Press batches, and queue tie-break by source row; these conflict with V2. Backend is flag-gated but source remains only for lineage. | Only for audit/regression archaeology or if the owner explicitly reverses the V2 contract. Never enable V1 as a shortcut. | `WORK_QUEUE_V1_CANDIDATE.md`; `work-queue-v1.js`; `work-queue-backend-v1.gs`; contract test; candidate + inertness workflows; Entry391/395. |

| Accounting Black Box checkpoint — 4 Sep 2026 | `CLOSED_HISTORICAL_ARCHITECTURE` | Full document review shows it is a product/architecture checkpoint: Accounting remains separate from Profit Engine/Partner Network, stable Order/Line/entity IDs are required, BOM/inventory must be generic and movement-ledger based, writes idempotent/locked, and Google was authoritative at that historical migration stage. It is not current deployed/runtime evidence. | Reopen only for an Accounting architecture dispute, contract redesign, or tracing why a current accounting rule exists; current implementation/runtime must be read from active accounting source and current evidence. | `TRENDOS_ACCOUNTING_BLACKBOX_2026-09-04.md`; Entry403. |

## Rule for future closure

A component can be removed from mandatory active reading only after one of the statuses above is assigned with evidence and a reopen trigger. A live subsystem must not become `CERTIFIED_CURRENT` merely because tests passed in GitHub; current deployed/runtime identity must also be proven. When source/deployment changes, certification is invalidated or narrowed until reverified.
