# TrendOS Blackbox — RP-07 Remediation Code Candidate PASS

Date: 2026-09-10
Branch: `agent/go-live-2026-09-01-integrity`
Candidate code checkpoint: `2152d1d5a90d5c03f9623ee83fd5fcaded8aaeeb`

## Decision

**RP-07 remediation CODE CANDIDATE = PASS.**

This is a GitHub/code qualification checkpoint only. It does **not** mean RP-07 runtime/data health is PASS and it does **not** authorize Apps Script Production deployment, feature-flag activation, Source Sheet mutation, Registry mutation, D1 business-data mutation, or RP-08.

RP-06 remains COMPLETE and must not be reopened by this work.

## Why remediation was required

The fresh RP-07 live read-only inspection proved new post-RP06 operational P0 failures:

- Attendance duplicate employee/day groups after the approved baseline;
- Cleaning duplicate employee/day groups after the approved baseline;
- closed/delivered orders `3839` and `3841` still carrying invoice Draft rows;
- Heat Press line `3796-01` delivered without evidence satisfying the current exact-Line session contract.

The remediation candidate therefore separates two concerns:

1. **future prevention / containment in code**;
2. **existing production data remediation**, which remains a separate explicit runtime decision.

## Candidate protections now qualified

### Attendance / Cleaning containment

- existing public action names remain compatible;
- legacy mutation paths can be serialized with `ScriptLock` through the RP-07 containment adapter;
- no feature flag is enabled by the code candidate itself;
- no deletion primitive or automatic cleanup is introduced.

### Guarded V1932 → Integrity cutover bridge

- existing legacy action aliases can be offered to the Integrity router first;
- Integrity handles a request only when both master and the matching family flag are enabled;
- when Integrity is absent/off, routing falls back immediately to the containment/legacy path;
- `Code.gs` was not changed by this candidate.

### Press exact-Line traceability

- Integrity Press sessions retain an exact start snapshot of Line IDs;
- stop/close requires completed Line IDs from that session snapshot rather than accepting an untrusted count as authority;
- backend derives completed orders from selected Line IDs;
- frontend candidate supports exact-Line selection while retaining compatibility with legacy count behavior while the PRESS family remains OFF;
- no retrospective Press evidence is fabricated for `3796-01`.

### Invoice lifecycle prevention

- delivered/closed orders are prevented from entering the Integrity prepare path for a new/renewed Draft;
- existing Draft rows for `3839` and `3841` are **not** deleted or silently changed by this code candidate;
- those rows remain a separate data-remediation gate.

## Exact runtime-candidate blobs

The following blobs are locked for the next deployment-planning boundary:

- `trendos-rp07-legacy-containment-v1.gs` = `47d932c76498593063ea6f0289e9c9a663686b0d`
- `v1932-router.gs` = `151134f2517db2ce38cecec4fea59dd2745e8b59`
- `trendos-integrity-router-v1.gs` = `34ae925b35fcf8295a8857dfe587cfa26b48b6b8`
- `trendos-press-integrity-v1.gs` = `e63473445a338179ac50f39cb7d3b82424e30af3`
- `trendos-invoice-integrity-v1.gs` = `18dd8783bbf7bf14531bcf7bf7d870d938d82473`
- `press-control-v1.js` = `cf55e023e23a1ee7dd50d2f8e724763a4e7690ed`

Any runtime execution must re-fetch and exact-verify these blobs against the intended candidate checkpoint before use. A later GitHub change does not silently replace this candidate.

## CI evidence

Final candidate composition is qualified by both gates on commit `2152d1d5a90d5c03f9623ee83fd5fcaded8aaeeb`:

- `TrendOS RP-07 Remediation Containment CI` Run `34490458581` — **SUCCESS**.
- `TrendOS Integrity V1` Run `34490458493` — **SUCCESS**.

Earlier component gates also passed, including the Attendance/Cleaning containment and guarded alias tests; the final two runs above are the authoritative composition evidence.

## Runtime state after this checkpoint

Unchanged:

- no Apps Script Production deployment;
- no Apps Script feature flag activation;
- no Source Sheet business-data mutation;
- no Health sheet rewrite;
- no Registry mutation;
- no D1 business-data mutation;
- no `EDGE_SESSION_SECRET` change;
- no merge to `main`;
- no RP-08 execution.

Existing live P0 data blockers remain unresolved until an explicitly approved data-remediation step and a fresh RP-07 health recheck prove `OPEN_CORE_P0_BLOCKERS=0`.

## Next allowed planning boundary

Prepare a **runtime deployment boundary with all flags OFF**, including exact live Apps Script source inventory, collision detection, save/reload exact verification, dependency-health read-only checks, and a mandatory stop before any family activation.

See:

`TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_DEPLOYMENT_BOUNDARY.md`
