# TrendOS Blackbox — RP-07 Runtime Phase 0 Direct Work Inventory FAIL

Date: 2026-09-10
Branch: `agent/go-live-2026-09-01-integrity`
Qualified code candidate: `2152d1d5a90d5c03f9623ee83fd5fcaded8aaeeb`
Source of runtime evidence: owner-supplied ChatGPT Work read-only inspection of the actual bound Apps Script project.

## Decision

**RUNTIME PHASE 0 DIRECT INVENTORY = FAIL-CLOSED / PHASE 1 NOT SAFE.**

This result supersedes the earlier connector-access blocker by providing direct live Apps Script evidence. It does **not** authorize any Script Property change, Head edit, Save, Deploy, business-data mutation, Registry/D1 mutation, main merge, or RP-08.

## Direct live inventory facts

The actual Apps Script project was found. The live project contains the established Integrity modules plus the consolidated `Code.gs` and D1/Cloud-write support files.

The single live owner of `trendosV1932TryRoute_` is:

- `Code.gs`, line 11868;
- one definition only;
- no current duplicate RP-07/Integrity definitions were reported.

Relevant Integrity functions already present:

- `trendosIntegrityTryRouteV1_` in `trendos-integrity-router-v1.gs:70`;
- `trendosPressControlV1_` in `trendos-press-integrity-v1.gs:183`;
- `trendosGoLiveAutopilotV1_` in `trendos-invoice-integrity-v1.gs:299`.

The three RP-07 containment functions are not present in live Head:

- `trendosRp07LegacyAttendanceV1_`;
- `trendosRp07LegacyAttendanceClockinV1_`;
- `trendosRp07LegacyCleaningV1_`.

## Flag-state mismatch

Direct Script Property readback reported:

- `TRENDOS_INTEGRITY_V1_ENABLED=true`;
- `TRENDOS_INTEGRITY_V1_HEALTH_ENABLED=true`;
- `TRENDOS_INTEGRITY_V1_ORDER_LINE_ENABLED=false`;
- `TRENDOS_INTEGRITY_V1_ATTENDANCE_CLEANING_ENABLED=false`;
- `TRENDOS_INTEGRITY_V1_PRESS_ENABLED=false`;
- `TRENDOS_INTEGRITY_V1_INVOICE_ENABLED=false`;
- `TRENDOS_INTEGRITY_V1_WHATSAPP_ENABLED=false`;
- `TRENDOS_INTEGRITY_V1_OPS_ENABLED=false`;
- `TRENDOS_INTEGRITY_V1_AUTOMATION_ENABLED=false`.

Therefore **All flags OFF = NO**.

The live router reports version:

`TRENDOS_INTEGRITY_ROUTER_V1_20260830`

This contradicts the previously assumed flags-OFF runtime baseline and must be treated as a material runtime-state mismatch. No property was changed during inspection.

## Candidate/live blob mismatch

The existing live modules do not match the qualified RP-07 candidate blobs:

- Router live blob: `3d747b99bb06e4865b9936de2a2d42104b3deccc`
- Press live blob: `99857aacc757e9e80589ba5bcab310d8330e6391`
- Invoice live blob: `08128d35fcc0ac1876a8790564cf7377f8869c47`

Qualified candidate blobs remain:

- Router candidate: `34ae925b35fcf8295a8857dfe587cfa26b48b6b8`
- Press candidate: `e63473445a338179ac50f39cb7d3b82424e30af3`
- Invoice candidate: `18dd8783bbf7bf14531bcf7bf7d870d938d82473`

## Collision result

`v1932-router.gs` must **not** be added as a standalone live file because its `trendosV1932TryRoute_` would collide with the current single definition embedded in `Code.gs`.

Any later approved Phase 1 must therefore patch only the exact verified owner function inside the existing `Code.gs` lineage, not replace `Code.gs` wholesale and not add a duplicate standalone router.

## Deployment inventory

Not inspected in this Work pass. The Work session stopped immediately on the active-flag mismatch per the fail-closed instruction.

Therefore Phase 0 is still incomplete even though direct source ownership is now known.

## Required next gate — READ ONLY

Before any property change or Phase 1 install, perform a bounded read-only Phase 0B that answers:

1. current Apps Script deployments/version IDs;
2. exact runtime exposure caused by `master=true` + `HEALTH=true` while all business families are false;
3. whether any production route currently calls the Integrity router/HEALTH path and through which top-level owner;
4. whether disabling master/HEALTH would affect only diagnostic health behavior or any operational dependency;
5. exact pre-change rollback evidence for the two active properties;
6. exact live text/function boundary of `trendosV1932TryRoute_` in `Code.gs` for later narrow patching;
7. re-confirm no duplicate symbols across current Head.

**Do not change either active flag during Phase 0B.**

If Phase 0B proves a narrow safe disable, changing the two active properties must be a separate explicit owner-approved mutation boundary before Phase 1.

## Stop condition

**STOP BEFORE PHASE 1.**

No Apps Script Head edit, Save, Deploy, flag mutation, Source Sheet mutation, Registry mutation, D1 mutation, main merge, data cleanup, or RP-08 occurred in this gate.