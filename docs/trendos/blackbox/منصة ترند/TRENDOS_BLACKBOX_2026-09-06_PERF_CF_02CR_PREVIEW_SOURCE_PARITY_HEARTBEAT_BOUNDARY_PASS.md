# PERF-CF-02CR — Preview Source Parity / Field Contract / Heartbeat / Final Boundary PASS

Date: 2026-09-06

## Official result

`PREVIEW QUALIFICATION PASS — USER-VISIBLE COMPLETENESS PASS — PRODUCTION FRONTEND D1 READ OFF — NO CUTOVER`

This record closes the qualification work inside 02CR. It does **not** authorize or perform production Worker deployment or frontend D1 activation.

## User-visible incident

The missing-order incident was fixed first by repairing the four legacy Google Sheets view formulas from fixed row ceilings to open-ended ranges. The user explicitly validated the live platform afterward with:

`كده تمام اشتغل`

Therefore the production Apps Script / Sheets lane is currently healthy and remains the active read lane.

## 02CR enrichment synchronization

The approved Apps Script module is live for support mirrors only:

- `العملاء`
- `عملاء منع التسليم بالمديونية`

Exact note:

`PERF-CF-02CR enrichment live sync V1`

Existing Orders Live Sync V2 remains the sole owner of:

- `الأوردرات`
- `بنود الأوردرات`

Exact lines note:

`TrendOS orders live sync V2 quota-aware`

No trigger/property/ownership change was made to Orders Live Sync V2.

## Direct authoritative-source identity/status parity

Because the stored GitHub qualification employee token was stale, parity was completed directly against the authoritative Google Sheet source without asking for or exposing credentials.

Authoritative `بنود الأوردرات` vs isolated Preview `/v1/edge/orders/02cr/page`:

### Print active

- source active rows: `21`
- Preview active rows: `21`
- all are current `Order ID + Line ID + status` identities
- exact active status partition: `طلب جديد = 21`

### Laser active

- source active rows: `18`
- Preview active rows: `18`
- exact active status partition:
  - `طلب جديد = 13`
  - `تحت التنفيذ = 4`
  - `متوقف = 1`

No customer name, phone, notes, or other PII was logged by the parity probe.

## Preview pagination/filter/field-contract qualification

Temporary read-only workflow:

- Run `34005762192`
- Job `101412516340`
- **SUCCESS**
- marker: `PERF_CF_02CR_PREVIEW_PAGINATION_FILTER_FIELD_CONTRACT_PASS_NO_PII`

Verified:

- print active total `21`
- print pageSize=5 reconstruction: `5` pages, exact ordered reconstruction, no duplicate/lost identity
- laser active total `18`
- laser pageSize=5 reconstruction: `4` pages, exact ordered reconstruction, no duplicate/lost identity
- exact status partitions reconstruct the active sets
- priority partitions reconstruct the active sets
- heat-press `only/without` partitions reconstruct the active sets
- Order ID search returns the seeded identity without leakage
- `__READY_PICKUP__` route responds successfully
- every active row carries the expected `38` field-contract keys
- `__DEBT__` remains fail-safe Apps Script fallback:
  - HTTP `409`
  - code `apps-script-required`
  - fallback `apps-script`

Observed active partitions:

### Print

- priority: `عاجل = 1`, `عادي = 20`
- heat: `only = 7`, `without = 14`

### Laser

- priority: `عاجل = 3`, `عادي = 15`
- heat: `only = 0`, `without = 18`

## Mirror qualification during Preview test

All required mirrors were ready and row-parity clean:

- `بنود الأوردرات`: `355 / 355`, note `TrendOS orders live sync V2 quota-aware`
- `العملاء`: `239 / 239`, note `PERF-CF-02CR enrichment live sync V1`
- `عملاء منع التسليم بالمديونية`: `1 / 1`, note `PERF-CF-02CR enrichment live sync V1`

## Enrichment heartbeat proof

Temporary final-boundary workflow:

- Run `34005845935`
- Job `101412745176`
- **SUCCESS**
- marker: `PERF_CF_02CR_HEARTBEAT_FINAL_BOUNDARY_PASS_NO_MUTATION`

Observed support heartbeat at the check:

- `العملاء`
  - sourceLastRow `239`
  - rowCount `239`
  - status `ready`
  - syncedAt `2026-09-06 02:11:10`
  - age about `42 seconds`
- `عملاء منع التسليم بالمديونية`
  - sourceLastRow `1`
  - rowCount `1`
  - status `ready`
  - same syncedAt
  - age about `43 seconds`

This proves the independent 1-minute enrichment trigger is continuing to advance/heartbeat after the initial manual start.

## Final production boundary

Same final-boundary probe verified:

- `cutover=false`
- `sheetsAuthoritative=true`
- 02CL reconcile `enabled=false`
- `genericDrainEnabled=false`
- `pendingOutbox=0`
- unauthenticated production Orders route = `401`
- production frontend D1 Orders read = **OFF**
- production Edge reader loader absent from `main/config.js`

No Worker production deploy, no secret rotation, no authority transfer, no 02CL reopen, and no generic drain action occurred in this qualification.

## Integrity

Same-head TrendOS Integrity V1:

- Run `34005845901`
- **SUCCESS**

Previous extended-parity same-head Integrity:

- Run `34005762217`
- **SUCCESS**

## Cleanup

Temporary probe workflows were removed after evidence collection:

- preview parity cleanup commit `490dec93eac87f73b883aacca59784e5d4e1cbd0`
- final boundary cleanup commit `233294b139f8e396dcfd0645aaba089ffcad5a9d`

Durable 02CR candidate/tests remain in the repository.

## Exact stop point / next gate

02CR is now **qualified in Preview** for source completeness, identity/status parity, pagination, key filters, search, 38-key field shape, support enrichment freshness, and final safety boundary.

Production remains intentionally on Apps Script / Sheets.

The next step is a **new production gate/checkpoint**, not part of this qualification:

1. bounded production Worker deployment of the qualified 02CR operational D1 read implementation,
2. production canary while frontend remains OFF,
3. only after that passes, a separate explicit frontend D1 read activation/cutover decision.

Do not perform those steps without explicit user approval for the new production action.
