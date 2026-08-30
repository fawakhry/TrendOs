# TrendOS Integrity V1 — Regression Coverage

> Purpose: separate **CI contract evidence** from **runtime production/staging evidence**.
>
> A CI PASS is not a production PASS.

## Status vocabulary

- `CI PASS`: deterministic contract exercised in GitHub test harness.
- `SOURCE PASS`: implementation/static contract verified but scenario not executed end-to-end.
- `LIVE BASELINE PASS/FAIL`: read-only production data evidence from the pre-fix baseline.
- `RUNTIME PENDING`: must be executed after controlled installation/activation.
- `PRODUCTION PASS`: forbidden until the real deployed route and live regression are verified.

## Master regression mapping

| ID | Scenario | Current Integrity V1 evidence | Runtime status |
|---|---|---|---|
| REG-01 | same Order create event x2 | Draft Order-ID checkpoint/reuse is `CI PASS`; second allocation reuses `4001` and allocator is called once | RUNTIME PENDING full create x2 |
| REG-02 | same Line create event x5 | active duplicate Line-ID resolution/fail-closed + Draft Item collision detection are `CI PASS`; actual create-x5 full route not yet run | RUNTIME PENDING |
| REG-02A | live active Line-ID baseline | pre-fix live snapshot had zero Line IDs with >1 non-`مكرر` active row | LIVE BASELINE PASS; post-deploy recheck pending |
| REG-03 | concurrent Order/Line writes | shared ScriptLock design is present and composition-tested | RUNTIME PENDING real concurrent requests |
| REG-04 | Line ID `3637-02` literal | normalization keeps literal `3637-02` and rejects Date objects | CI PASS; live write/read pending |
| REG-05 | Line ID `3647-01` literal | same centralized normalization contract | CI PASS; live write/read pending |
| REG-06 | Line ID `3651-02` literal / no date coercion | Date-like objects/strings rejected by foundation; historical live queue proved old coercion existed | CI PASS contract / LIVE historical FAIL / runtime repair pending |
| REG-07 | Clock-in/start x2 | second Start leaves one attendance row and one start pulse; existing clock-in is reused | CI PASS |
| REG-08 | fallback after Clock-in | canonical employee/day session is reused; duplicate historical sessions are detected rather than spawning another | CI PASS contract; runtime pending |
| REG-09 | Resume x5 rapidly | when state is already `working`, repeat Resume is no-op and no new pulse is appended | CI PASS contract; runtime x5 pending |
| REG-10 | activity before required Clock-in | new attendance route enforces clock-in before operational events | SOURCE PASS; explicit runtime scenario pending |
| REG-11 | day rollover | business date is Cairo-based and employee/day lookup is keyed by date | SOURCE PASS; runtime midnight scenario pending |
| REG-12 | Friday without Special Schedule | shared Business Calendar returns closed day; Attendance and Cleaning create no records | CI PASS |
| REG-13 | Friday with Special Schedule | foundation calendar test opens Friday when exact active Special Schedule exists | CI PASS foundation; integrated runtime pending |
| REG-14 | Cleaning submit x2 | first complete writes one row with real checklist values; second returns `alreadyDone` and row count stays unchanged | CI PASS |
| REG-15 | create press-required Line -> Press View | normalized source Queue contract exists; view integration remains deployment/runtime work | RUNTIME PENDING |
| REG-16 | Press Source Queue = Press View Queue | Integrity Dashboard compares source/view IDs and flags mismatch | CI PASS detector; runtime parity pending |
| REG-17 | Press Start x2 | open-session checkpoint returns/reuses the same open Session rather than creating another | CI PASS module contract |
| REG-18 | Press Close x2 | closed Session returns same result and no second close mutation | CI PASS module contract |
| REG-19 | press-completed Line without session | Dashboard detects completed Press Line IDs absent from session evidence | CI PASS detector; runtime pending |
| REG-20 | Ready Sweep x10 unchanged | canonical Draft resolver fails closed on duplicate Draft rows; Prepare reuses same revision/signature; finalized Orders skip | CI PASS contract; runtime x10 pending |
| REG-21 | Finalize x10 | first finalize writes once; repeat sees Finalized and writer is not called again; timeout retry reuses identical request key | CI PASS |
| REG-22 | finalized/delivered Order + Sweep | active Final Invoice causes Prepare/Sweep skip instead of Draft recreation | CI PASS |
| REG-23 | approved-priced Order exact total | finalize harness uses approved calculated subtotal; exact live pricing-source mapping still must be verified | RUNTIME PENDING |
| REG-24 | unpriced Order | source keeps zero subtotal + blocker; pre-fix live baseline also showed explicit pricing blocker | CI/SOURCE PASS + LIVE BASELINE PASS |
| REG-25 | inbound WhatsApp same Meta ID x5 | inbound durable event key is Meta Message ID; completed retry returns prior result; local append is idempotent | CI PASS contract; Meta webhook runtime x5 pending |
| REG-26 | outbound retry | stable `clientRequestId`; completed retry does not call Meta again; ambiguous send stays CLAIMED and auto-retry is blocked | CI PASS backend + frontend |
| REG-27 | duplicate Handover | same Line/date/shift/employee/state fingerprint returns same Handover record; changed state creates new revision | CI PASS |
| REG-28 | repeated OPS follow-up without state change | OPS_REPLY uses request ID; OPS_COACH uses Line/state fingerprint and repeat returns same event | CI PASS |
| REG-29 | two concurrent Trend Master runs | durable hourly run key + idempotency claim + automation run ledger; failed run requires explicit retry | CI PASS sequential/retry contract; true concurrent runtime pending |
| REG-30 | D1 unsafe/partial state | existing D1 read fallback/source contracts previously mapped; Integrity V1 does not weaken fallback | RUNTIME forced-failure pending |
| REG-31 | Line mutation while Orders+Lines stage | new Line mutation uses shared ScriptLock, but production D1 sync/writers are not wired to Integrity V1 yet | RUNTIME PENDING after wiring |

## Additional Integrity V1 gates

| Gate | Evidence | Status |
|---|---|---|
| Apps Script modules compose in one V8 scope | `tests/trendos_integrity_composition_v1.test.js` | CI PASS before router; router-inclusive rerun in current CI lane |
| Router default OFF | `TRENDOS_INTEGRITY_V1_ENABLED` absent/false => no route/webhook handling | CI test added; current lane pending/then must stay green |
| Employee cannot spoof Handover/ANDON identity | Router derives employee/department from authenticated session | CI test |
| Admin-only OPS Coach/resolve/automation | router authorization wrappers | CI test |
| Pre-deploy package excludes GitHub `Code.gs` | machine-readable package + safety gate | CI test added |
| Fast Auth V2.4 excluded | package gate forbids V2.4 refs | CI test added |
| Fast Auth V2.5 caches no password/token | strict allowlist + raw cache scan test | CI PASS |
| Fast Auth V2.5 invalidation revision | logout/password/Active hooks bump auth revision | CI PASS contract; lifecycle wiring runtime pending |
| Integrity Dashboard has counts + drill-down IDs | synthetic multi-failure snapshot test | CI PASS |
| Open ANDON detector | Dashboard + structured ANDON ledger | CI PASS |
| last automation success/error | Dashboard derives latest run state | CI PASS |

## What GitHub CI cannot prove

GitHub tests deliberately do not claim:

1. exact Version 143 source-file composition.
2. Apps Script save/parse behavior inside the actual production project.
3. actual Google Sheets permissions/column formatting after install.
4. real concurrent Apps Script executions and LockService timing.
5. Meta/WhatsApp network behavior.
6. D1/Worker forced outage fallback.
7. production D1 source-snapshot consistency after new writer wiring.
8. exact approved pricing mapping against live financial data.
9. real Press frontend Source/View parity.
10. all 20 end-to-end operator scenarios.

Those remain runtime gates.

## Required runtime test order after approved installation

Feature flag remains OFF during installation and source validation. After approval, activate/migrate route families one at a time:

1. health/read-only smoke.
2. Order/Line test records.
3. Attendance/Clock-in and Cleaning.
4. Press source/start/stop.
5. Invoice prepare/finalize/reopen on controlled test Orders.
6. outbound WhatsApp controlled test recipient.
7. inbound WhatsApp repeated Meta test payload.
8. Handover/OPS/ANDON.
9. Trend Master automation wrapper.
10. D1 consistency/failure lane.
11. Fast Auth V2.5 separately.
12. full E2E pack.

After each family, refresh `إدارة - صحة النظام` and re-run the relevant live baseline counts.

## Decision boundary

Current branch may be called:

**IMPLEMENTED + CI TESTED (where stated) + NOT DEPLOYED**.

It must not be called production-fixed, production-verified, or GO until the runtime column is green and the full GO/NO-GO gates pass.
