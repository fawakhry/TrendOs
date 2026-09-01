# TrendOS Execution Ledger

> **Canonical step-by-step execution memory.**
> Updated: **2026-09-01 06:20 Africa/Cairo**.
> Purpose: allow any future chat to resume TrendOS without reconstructing work from conversation history.

## Mandatory operating rule

Every material execution step must be recorded here before moving to the next material step.

For each step preserve: action, evidence, PASS/FAIL/PARTIAL/PENDING, production impact, checkpoint/rollback, and exact next step.

Evidence precedence:
`LATEST VERIFIED > EARLIER VERIFIED > DEPLOYED > TESTED > IMPLEMENTED > PREPARED > PLANNED > UNKNOWN`.

A CI PASS is not a production PASS. A prepared file is not a deployment.

---

# 1. Program checkpoint

- Final TrendOS V1 launch target: **01/03/2027**.
- Active lane: **PHASE 1 — TRENDOS CORE + CLOUD**.
- Repository: `fawakhry/TrendOs`.
- Production/default branch: `main`.
- Working branch: `agent/go-live-2026-09-01-integrity`.
- Safety branch: `backup/go-live-2026-08-30-pre-p0`.
- Current pre-deploy candidate branch: `release/integrity-v1-predeploy-2026-08-31-r3`.
- Candidate SHA: `ee03adab4c733aec909511b23dd80f42ad3b927e`.
- Candidate CI run `33384689012` = **SUCCESS**.
- Production Apps Script Web App: Version **144**, deployed Aug 31 2026 3:38 PM in the Apps Script UI.
- Rollback Web App version: **143**, Aug 29 2026 11:37 PM.
- Production workbook: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`.
- Sheets remains authoritative for writes; D1 remains fast read/mirror with Sheets fallback.
- Integrity V1 state: **DEPLOYED IN VERSION 144 + ALL FLAGS OFF + PD-09 PASS; HEALTH APPROVED BUT BLOCKED BY MISSING LIVE ENTRYPOINT WIRING**.

---

# 2. Phase 0 baseline / inventory

## P0-01 Orders / Lines — PASS inventory
- Manual create already had outer ScriptLock + stable replay in main path.
- `submitCustomerDraft_()` lacked one enclosing conversion lock.
- `updateLine_()` lacked unified durable idempotent mutation contract.
- live active Line-ID baseline: zero duplicate non-`مكرر` Line IDs at inspected snapshot.
- Evidence: `docs/trendos/inventory/ORDERS_LINES_INVENTORY.md`.
- Production impact: READ-ONLY.

## P0-02 installed triggers — PASS
- exactly one `d1OrdersLiveSyncTick`.
- Head / Time-driven / every minute.
- Production impact: READ-ONLY.

## P0-03 Invoice / Ready Sweep — baseline FAILs confirmed
- 50 Ready Sweep rows / 47 unique Order IDs.
- duplicate Drafts: `3577`, `3572`, `3569`.
- finalized Order could re-enter sweep/pricing.
- unpriced paths stayed at 0 with blocker.
- Evidence: `docs/trendos/inventory/INVOICE_READY_SWEEP_INVENTORY.md`.
- Production impact: READ-ONLY.

## P0-04 Attendance / Clock-in — baseline FAILs confirmed
- duplicate employee/day sessions existed.
- repeated Resume events existed.
- Clock-in required by config but not enforced before broader activity.
- Cairo day rollover itself worked.
- Evidence: `docs/trendos/inventory/ATTENDANCE_CLOCKIN_INVENTORY.md`.
- Production impact: READ-ONLY.

## P0-05 Cleaning — baseline FAIL confirmed
- 31 rows / 17 unique employee-date pairs / 14 excess duplicates.
- no lock/event key around check->append.
- checklist values could be hardcoded instead of real payload.
- Evidence: `docs/trendos/inventory/CLEANING_INVENTORY.md`.
- Production impact: READ-ONLY.

## P0-06 Press — baseline FAILs confirmed
- source queue snapshot: 8 unique press orders, 0 urgent.
- Start/Stop lacked shared lock/idempotency.
- sessions lacked Order/Line traceability.
- no invented power/rate/cost.
- Evidence: `docs/trendos/inventory/PRESS_INVENTORY.md`.
- Production impact: READ-ONLY.

## P0-07 WhatsApp / Customer Manager / Feedback — PARTIAL/FAIL baseline
- inner append path had Meta-ID duplicate protection in merged lineage.
- unresolved helper/source-composition drift remained.
- outbound send called Meta before durable logical event claim.
- Feedback live data contained duplicate Order IDs.
- Inventory commit: `71aa3dcb00b853b456e6bd16bae0492e0f3a5038`.
- Evidence: `docs/trendos/inventory/WHATSAPP_CUSTOMER_MANAGER_INVENTORY.md`.
- Production impact: READ-ONLY.

## P0-08 Handover / OPS — baseline FAIL confirmed
- live `إدارة - تسليم الشيفت` existed as header-only schema stub, zero records.
- no proven backend writer/Line-ID + shift/businessDate event key.
- generic OPS/ANDON notes were non-idempotent.
- automation queue check->append had race.
- Inventory commit `c301f49337f4a5324242fe98e4645bb68afb89f6`.
- Correction commit `142948d9dd1867c0fd76eac3ae4ae45197832ab7`.
- Production impact: READ-ONLY.

## P0-09 D1 / Auth inventory — PASS/PARTIAL
- legacy auth authoritative against Users sheet.
- atomic Worker promote verified with one D1 batch transaction.
- source-snapshot consistency remained runtime gate because writers did not all share D1 sync lock.
- Production impact: READ-ONLY.

## P0-10 Fast Auth V2.4 review — FAIL PREPARED SOURCE / DO NOT DEPLOY
- prepared sanitizer could cache primitive `password` and `token` fields.
- invalidation helper not wired to lifecycle.
- Review commit: `2e4dc1e6cd867b79f91e47695fd5eeaff621d7d2`.
- Production impact: NONE.

## P0-11 production source reconciliation — PARTIAL documented boundary
Verified:
- Version 143 active.
- live backend `V1932_FULL_GO_LIVE_20260824`.
- Version 143 routes Dashboard -> D1 Primary and Orders page -> D1 Fast V2.
- old V1940 modular manifest predates later consolidated Code lineage.
- do not overwrite production from GitHub `Code.gs`.
- Source reconciliation commit: `ab3e546c40dfdc8529f1e704251024c36baf7f3d`.
- Production impact: READ-ONLY.

---

# 3. Integrity V1 implementation — GitHub only

## I1 shared integrity foundation — CI PASS
File: `trendos-integrity-v1.gs`.
Implements:
- Order/Line ID normalization and text safety.
- Cairo business date/calendar and Friday default closed + Special Schedule override.
- shared ScriptLock wrapper.
- durable idempotency ledger.
- automation-run ledger.
- schema fail-closed behavior.
Production impact: NONE.

## I2 Order / Line Integrity — CI PASS
File: `trendos-order-line-integrity-v1.gs`.
- Line ID authoritative target.
- stale row rejected.
- duplicate active Line fails closed.
- Draft Item collision detection.
- Add Item + Upload + Submit share lock contract.
- Draft Submit reuses checkpointed Order ID on retry/partial failure.
- correction commit `7a5cf846e978110c0111eb4f6461b5d21652e985`.
- checkpoint `e75756feb2f21a0e2f38b71eeaf88a5f5543eabe`.
Production impact: NONE.

## I3 Attendance + Cleaning Integrity — CI PASS
File: `trendos-attendance-cleaning-integrity-v1.gs`.
- one canonical employee/day session.
- start + clock-in atomic under shared lock.
- repeated operational events idempotent/no-op when already applied.
- clock-in prerequisite.
- business calendar enforced.
- Cleaning one employee/day; real checklist payload stored.
- CI `33319559363` SUCCESS.
- checkpoint `c5c5ebf2281064997dac2a3f2353f72409698271`.
Production impact: NONE.

## I4 Press Integrity — CI PASS
File: `trendos-press-integrity-v1.gs`.
- Start/Stop shared lock.
- stable retry-safe Session ID.
- Queue snapshot + Order/Line ledger.
- Stop uses actual completed Line IDs.
- repeated Stop idempotent.
- fail closed on invalid Line IDs/multiple open sessions.
- no invented energy values.
- CI `33320046858` SUCCESS.
- checkpoint `70d604f11bee35fd2e53ee4d83724e9242b9209b`.
Production impact: NONE.

## I5 Invoice / Ready Sweep Integrity — CI PASS
File: `trendos-invoice-integrity-v1.gs`.
- one canonical Draft per Order/revision.
- finalized Orders skipped by normal sweep.
- explicit reopen increments revision.
- finalize request key includes Order + Revision.
- retry-safe writer timeout handling.
- material change during finalize fails closed.
- ambiguous WhatsApp send does not auto-resend.
- CI `33323669244` SUCCESS.
Production impact: NONE.

## I6 WhatsApp / Webhook Integrity — CI PASS
Files:
- `trendos-whatsapp-integrity-v1.gs`.
- `customer-manager-send-integrity-v1.js` frontend shim.
- durable logical send claim before Meta.
- same clientRequestId replay does not resend.
- ambiguous timeout blocks automatic resend.
- frontend reuses same request ID across retry.
- inbound Meta Message ID exact-once contract.
- CI `33324339920` SUCCESS.
- checkpoint `db1da117c3b7aba044bfa61cd2522f2279082e28`.
Production impact: NONE.

## I7 Handover / OPS Integrity — CI PASS
File: `trendos-handover-ops-integrity-v1.gs`.
- structured Handover bound to Line + business date/shift/state.
- state revision model.
- idempotent receipt.
- OPS_REPLY request id.
- OPS_COACH state fingerprint.
- automation durable run claim.
- CI `33326904772` SUCCESS.
Production impact: NONE.

## I8 ANDON Integrity — CI PASS
File: `trendos-andon-integrity-v1.gs`.
- structured event, request id, authenticated employee identity, optional Order/Line binding, resolution path.
Production impact: NONE.

## I9 Integrity Dashboard — CI PASS
File: `trendos-integrity-dashboard-v1.gs`.
- metrics include offending IDs/details, not aggregate counts only.
- latest automation run/error visibility.
- CI `33327350322` SUCCESS.
Production impact: NONE.

## I10 Fast Auth V2.5 SAFE — CI PASS / OPTIONAL ONLY
File: `D1_Fast_Auth_V2_5_Safe.gs`.
- strict cache allowlist; no password/token payload.
- digest key + auth revision invalidation.
- session expiry enforced.
- separate kill switch default OFF.
- CI `33327466500` SUCCESS.
- excluded from first Core activation.
Production impact: NONE.

## I11 Composition Test — PASS
- composed Integrity Apps Script modules load in test harness without duplicate top-level lexical collision/syntax crash.
- CI `33327527682` SUCCESS.
Production impact: NONE.

## I12 Integration Router V1 — CI PASS
File: `trendos-integrity-router-v1.gs`.
- authenticated identity overrides spoofable employee payload.
- admin-only routes enforced.
- dependency health checks required functions.
- master flag `TRENDOS_INTEGRITY_V1_ENABLED` default OFF.
- family flags default OFF: HEALTH, ORDER_LINE, ATTENDANCE_CLEANING, PRESS, INVOICE, WHATSAPP, OPS, AUTOMATION.
- disabled router/webhook returns null and leaves legacy behavior active.
Production impact: NONE.

## I13 Pre-deploy package safety — CI PASS
Created:
- `trendos-integrity-v1.package.json`.
- `tests/trendos_predeploy_package_v1.test.js`.
- `docs/trendos/TRENDOS_INTEGRITY_V1_DEPLOY_MANIFEST.md`.
Rules:
- GitHub `Code.gs` excluded.
- V2.4 forbidden.
- old standalone V1932 overlays forbidden.
- V2.5 optional/excluded from first activation.
- installation != activation.
- all flags default OFF.
- granular flag CI `33328375829` SUCCESS.
- final candidate CI `33328415852` SUCCESS.
Production impact: NONE.

---

# 4. Pre-deploy sequence

## PD-01 freeze deployment candidate — PASS (superseded by R3)
- earlier branch `release/integrity-v1-predeploy-2026-08-30` at SHA `e72d873603841bc8e41bd8c228e3240f2feb2a29` is retained as historical evidence only.
- current approved candidate branch: `release/integrity-v1-predeploy-2026-08-31-r3`.
- current candidate SHA: `ee03adab4c733aec909511b23dd80f42ad3b927e`.
- GitHub ref verification: R3 points exactly to the current candidate SHA.
- CI run `33384689012` = **SUCCESS**.
- Production impact: NONE.

## PD-02 source capture of routing — PASS for supplied current source
Supplied 13,959-line Apps Script snapshot confirms:
- `doGet`: V1932 -> V1900 -> V1898 -> legacy action chain.
- `doPost`: parse JSON -> V1932 -> V1900/V1898 -> legacy/fallthrough.
- V1932 router handles Meta verification and WhatsApp POST before older routers.
- WhatsApp cutover must ensure exactly one handler mutates a Meta payload.
- Production impact: READ-ONLY.

## PD-03 Apps Script write-capability check — ACCESS BOUNDARY CONFIRMED
- GitHub and Sheets/Drive tooling available.
- no direct Apps Script source-project write connector available.
- installation requires controlled user-assisted editor actions.
- Production impact: NONE.

## PD-04A runtime execution baseline — PASS observation
User-provided Execution screenshots on 2026-08-31 show:
- Version 143 serving `doGet/doPost`.
- `d1OrdersLiveSyncTick` executing from Head and completing.
- visible rows mostly Completed.
- one `doGet` was Running at ~81.9s at screenshot time; record as performance observation only, not a failure because final status was not shown.
Checkpoint file: `docs/trendos/checkpoints/PD04_RUNTIME_EXECUTION_BASELINE_2026-08-31.md`.
Commit: `4e48730d7fa4df4bd09635e624dbe8ef343144c3`.
Production impact: READ-ONLY.

## PD-04B current Apps Script editor file-list reconciliation — PASS FOR VISIBLE COLLISION CHECK
User-provided Editor sidebar screenshot on 2026-08-31 shows the following visible files:
1. `appsscript.json`
2. `Code.gs`
3. `AI_Webhook.gs.gs`
4. `OpenAI_Setup.gs`
5. `D1_Migration.gs`
6. `D1_Full_Migration.gs`
7. `D1_Orders_Live_Sync.gs`
8. `D1_Orders_Primary_Read.g...` — UI label truncated; do not invent full editor filename.
9. `D1_Dashboard_Primary_Re...` — UI label truncated; do not invent full editor filename.
10. `D1_Orders_Fast_V2.gs.gs`
11. `Set_D1_URL.gs.gs`

Reconciliation result:
- no `trendos-integrity-*` Core file is currently visible.
- no `D1_Orders_Fast_V2_4.gs` is visible.
- no old standalone V1932 Customer Manager/Attendance/Cleaning/Press overlay files are visible.
- `Code.gs` remains current consolidated nucleus and must not be replaced from GitHub.
- the planned Integrity filenames are uniquely namespaced against this visible list.

Status: **PASS — VISIBLE FILE-LIST COLLISION CHECK**.
Caveat: two long labels are truncated by the editor UI; exact names are not asserted beyond what is visible. This does not block adding the uniquely named Integrity foundation file.
Production impact: READ-ONLY.

---

# 5. EXACT CURRENT STOPPING POINT

**PD-09 — CONTROLLED DEPLOYMENT APPROVAL CHECKPOINT, ALL FLAGS OFF**

Latest user-confirmed Apps Script Head evidence supersedes the older PD-05 first-file checkpoint below. Production Web App Version 143 remains deployed and unchanged.

## PD-05A foundation + public runtime tools — PASS / INSTALLED IN HEAD
- Action: added `trendos-integrity-v1.gs` and `trendos-integrity-runtime-tools-v1.gs` to Apps Script Head.
- Evidence: Apps Script save/parse completed; public `trendosIntegritySelfTestV1` returned `success:true`; every check returned `pass:true`; execution completed.
- Foundation version: `TRENDOS_INTEGRITY_V1_20260830`.
- Runtime tools: R3 fail-closed wrapper; any internal failed check makes the public execution fail.
- Status: **PASS for install/parse/runtime self-test**.
- Production impact: NONE — Head only; Version 143 still serves `doGet/doPost`; no Deploy; flags OFF.
- Rollback: remove only the new Head files if a later composition conflict is proven; Version 143 remains the production rollback.
- Exact next step at completion: install Order/Line file; now completed below.

## PD-05B Order / Line Integrity — PASS INSTALL / FINAL DEPENDENCY VERIFY PENDING
- Action: added and saved `trendos-order-line-integrity-v1.gs` in Apps Script Head.
- Evidence: Apps Script editor save/parse passed.
- Candidate R3 blob SHA: `b8db6ea34ab537b2a6cb79db4c4d0aa1b3d4a2c8`.
- Status: **PASS for install/parse; dependency verification deferred to PD-07**.
- Production impact: NONE — no Run, no Deploy, no flags, no `Code.gs` edit.
- Rollback: remove only this newly added Head file if later composition/dependency evidence fails.
- Exact next step at completion: install Attendance/Cleaning file; now completed below.

## PD-05C Attendance / Cleaning Integrity — PASS INSTALL / FINAL DEPENDENCY VERIFY PENDING
- Action: added and saved `trendos-attendance-cleaning-integrity-v1.gs` in Apps Script Head.
- Evidence: Apps Script editor save/parse passed.
- Candidate R3 blob SHA: `fcb0f0aeee0f1f2a676c0af1c96b8b977d750732`.
- Status: **PASS for install/parse; dependency verification deferred to PD-07**.
- Production impact: NONE — Attendance/Cleaning runtime not run; no Deploy; flags OFF.
- Rollback: remove only this newly added Head file if later composition/dependency evidence fails.
- Exact next step at completion: prepare/install Press file; current step below.

## PD-05D Press Integrity — PASS INSTALL / FINAL DEPENDENCY VERIFY PENDING
- Action: added and saved `trendos-press-integrity-v1.gs` in Apps Script Head.
- Evidence: user-provided Apps Script editor screenshot `1002006707.jpg` on 2026-08-31 shows the Press file in the Files sidebar and the project cloud-save state; no parser/save error is visible.
- Source prepared from approved Candidate R3; expected blob SHA: `38c8ce3a5e0918538db99c913eeb8cb917f52c64`.
- Status: **PASS for visible install/save; source composition/dependency verification deferred to PD-06/PD-07**.
- Production impact: NONE — Head only; no Run; no Deploy; no Script Properties; `Code.gs` unchanged; Version 143 remains production.
- Commit / CI: Candidate `ee03adab4c733aec909511b23dd80f42ad3b927e`; CI run `33384689012` SUCCESS.
- Rollback: remove only the new Press Head file if later composition/dependency evidence fails; Version 143 remains unchanged.
- Visible reconciliation note: screenshot also reveals existing `D1_Orders_Read_Cutover.g...`; it does not collide with Integrity filenames and does not trigger a new inventory.
- Exact next step: prepare and install `trendos-invoice-integrity-v1.gs` from Candidate R3; Save only; do not Run/Deploy/enable flags.

## PD-05E Invoice / Ready Sweep Integrity — PASS INSTALL / FINAL DEPENDENCY VERIFY PENDING
- Action: used the authenticated Apps Script editor to add `trendos-invoice-integrity-v1.gs` to the live project Head from approved Candidate R3, then saved the project to Drive.
- Evidence:
  - exact prepared source blob SHA: `7d42237112a601fea4d2ffcc0765c795226d7dd2`;
  - direct Candidate/blob comparison matched before installation and static JavaScript syntax check passed;
  - live editor shows `trendos-invoice-integrity-v1.gs`, `cloud_done`, and a disabled Save button after save;
  - no save/parser error was shown.
- Status: **PASS for install/save; source composition/dependency verification deferred to PD-06/PD-07**.
- Production impact: NONE — Head only; no Run; no Deploy; no Script Properties; no flags; `Code.gs` unchanged; Version 143 remains production.
- Commit / CI: Candidate `ee03adab4c733aec909511b23dd80f42ad3b927e`; CI run `33384689012` SUCCESS; ledger-only commit on working branch.
- Rollback: remove only the new Invoice Head file if later composition/dependency evidence fails; Version 143 remains unchanged.
- Exact next step: install `trendos-whatsapp-integrity-v1.gs` from Candidate R3; Save only; do not Run/Deploy/enable flags.

## PD-05F WhatsApp / Webhook Integrity — PASS INSTALL / FINAL DEPENDENCY VERIFY PENDING
- Action: added `trendos-whatsapp-integrity-v1.gs` to the live Apps Script Head from approved Candidate R3 and saved the project to Drive.
- Evidence:
  - exact prepared source blob SHA: `c3e59c50f17de2604f0192a5b8f651e53caf9018`;
  - direct Candidate/blob comparison matched and static JavaScript syntax check passed before installation;
  - live editor shows the exact filename, `cloud_done`, and disabled Save after save; no save/parser error was shown.
- Status: **PASS for install/save; source composition/dependency verification deferred to PD-06/PD-07**.
- Production impact: NONE — Head only; WhatsApp runtime not run; no Deploy; no Script Properties; no flags; `Code.gs` unchanged; Version 143 remains production.
- Commit / CI: Candidate `ee03adab4c733aec909511b23dd80f42ad3b927e`; CI run `33384689012` SUCCESS; ledger-only commit on working branch.
- Rollback: remove only the new WhatsApp Head file if later composition/dependency evidence fails; Version 143 remains unchanged.
- Exact next step: install `trendos-handover-ops-integrity-v1.gs` from Candidate R3; Save only; do not Run/Deploy/enable flags.

## PD-05G Handover / OPS Integrity — PASS INSTALL / FINAL DEPENDENCY VERIFY PENDING
- Action: added `trendos-handover-ops-integrity-v1.gs` to the live Apps Script Head from approved Candidate R3 and saved the project to Drive.
- Evidence:
  - exact prepared source blob SHA: `4f2301d2101c45cb21ff8466e09cf63849d12cc8`;
  - direct Candidate/blob comparison matched and static JavaScript syntax check passed before installation;
  - live editor shows the exact filename, `cloud_done`, and disabled Save after save; no save/parser error was shown.
- Status: **PASS for install/save; source composition/dependency verification deferred to PD-06/PD-07**.
- Production impact: NONE — Head only; OPS/Handover runtime not run; no Deploy; no Script Properties; no flags; `Code.gs` unchanged; Version 143 remains production.
- Commit / CI: Candidate `ee03adab4c733aec909511b23dd80f42ad3b927e`; CI run `33384689012` SUCCESS; ledger-only commit on working branch.
- Rollback: remove only the new Handover/OPS Head file if later composition/dependency evidence fails; Version 143 remains unchanged.
- Exact next step: install `trendos-andon-integrity-v1.gs` from Candidate R3; Save only; do not Run/Deploy/enable flags.

## PD-05H Andon Integrity — PASS INSTALL / FINAL DEPENDENCY VERIFY PENDING
- Action: added `trendos-andon-integrity-v1.gs` to the live Apps Script Head from approved Candidate R3 and saved the project to Drive.
- Evidence:
  - exact prepared source blob SHA: `6b61b9f0c4cae9bd47a85f59efd7780e95f04765`;
  - direct Candidate/blob comparison matched and static JavaScript syntax check passed before installation;
  - live editor shows the exact filename, `cloud_done`, and disabled Save after save; no save/parser error was shown.
- Status: **PASS for install/save; source composition/dependency verification deferred to PD-06/PD-07**.
- Production impact: NONE — Head only; Andon runtime not run; no Deploy; no Script Properties; no flags; `Code.gs` unchanged; Version 143 remains production.
- Commit / CI: Candidate `ee03adab4c733aec909511b23dd80f42ad3b927e`; CI run `33384689012` SUCCESS; ledger-only commit on working branch.
- Rollback: remove only the new Andon Head file if later composition/dependency evidence fails; Version 143 remains unchanged.
- Exact next step: install `trendos-integrity-dashboard-v1.gs` from Candidate R3; Save only; do not Run/Deploy/enable flags.

## PD-05I Integrity Dashboard — PASS INSTALL / FINAL DEPENDENCY VERIFY PENDING
- Action: added `trendos-integrity-dashboard-v1.gs` to the live Apps Script Head from approved Candidate R3 and saved the project to Drive.
- Evidence:
  - exact prepared source blob SHA: `3cb1ef31a2d22cc0ebd19f5c4f9bacfa590a20bc`;
  - direct Candidate/blob comparison matched and static JavaScript syntax check passed before installation;
  - live editor shows the exact filename, `cloud_done`, and disabled Save after save; no save/parser error was shown.
- Status: **PASS for install/save; source composition/dependency verification deferred to PD-06/PD-07**.
- Production impact: NONE — Head only; dashboard runtime not run; no Deploy; no Script Properties; no flags; `Code.gs` unchanged; Version 143 remains production.
- Commit / CI: Candidate `ee03adab4c733aec909511b23dd80f42ad3b927e`; CI run `33384689012` SUCCESS; ledger-only commit on working branch.
- Rollback: remove only the new Integrity Dashboard Head file if later composition/dependency evidence fails; Version 143 remains unchanged.
- Exact next step: install `trendos-integrity-router-v1.gs` from Candidate R3; Save only; do not Run/Deploy/enable flags.

## PD-05J Integrity Router — PASS INSTALL / FINAL DEPENDENCY VERIFY PENDING
- Action: added `trendos-integrity-router-v1.gs` to the live Apps Script Head from approved Candidate R3 and saved the project to Drive.
- Evidence:
  - exact prepared source blob SHA: `c4930e1150fd2eaf62616d44f975690108f54816`;
  - direct Candidate/blob comparison matched and static JavaScript syntax check passed before installation;
  - live editor shows the exact filename, `cloud_done`, and disabled Save after save; no save/parser error was shown.
- Status: **PASS for install/save; final source composition/dependency verification deferred to PD-06/PD-07**.
- Production impact: NONE — Head only; router not run and no route enabled; no Deploy; no Script Properties; no flags; `Code.gs` unchanged; Version 143 remains production.
- Commit / CI: Candidate `ee03adab4c733aec909511b23dd80f42ad3b927e`; CI run `33384689012` SUCCESS; ledger-only commit on working branch.
- Rollback: remove only the new Integrity Router Head file if later composition/dependency evidence fails; Version 143 remains unchanged.
- Exact next step: perform PD-06 Save / Parse / composition verification with all flags OFF; do not Deploy.

## PD-06 Save / Parse / composition verification — PASS
- Action: reloaded the live Apps Script Head after the final save, then reconciled the persisted project file list against Candidate R3.
- Evidence:
  - editor returned `cloud_done` and explicit `Saved to Drive` after reload;
  - Save button remained disabled, and no save/parser error was shown;
  - live project contains 23 files total;
  - all 10 ordered Integrity business/core files plus the R3 public runtime-tools helper are present;
  - exact persisted Integrity filename reconciliation returned `missing=[]`;
  - Candidate R3 CI/composition/package gates remain SUCCESS at exact commit `ee03adab4c733aec909511b23dd80f42ad3b927e` (run `33384689012`).
- Status: **PASS — saved/parsing Head composition is complete; runtime dependency health remains PD-07**.
- Production impact: NONE — read-only reload/reconciliation; no Run; no Deploy; no Script Properties; no flags; Version 143 remains production.
- Commit / CI: ledger-only commit on working branch; Candidate R3 unchanged.
- Rollback: remove only the newly installed Integrity Head files if PD-07 proves a dependency/composition failure; Version 143 remains unchanged.
- Exact next step: run the public fail-closed `trendosIntegrityDependencyHealthV1` once and require `codeReady=true`, `missing=[]`, and every feature flag OFF; do not Deploy.

## PD-07 Dependency Health — FAIL / STOPPED BEFORE PD-08
- Action: selected and ran the public `trendosIntegrityDependencyHealthV1` from the saved R3 runtime-tools file; then used the Apps Script debugger without source edits to inspect the branch/result because the execution panel did not surface `Logger.log`.
- Evidence:
  - the Editor execution itself completed in 1.271 s;
  - debugger call stack paused in `trendos-integrity-runtime-tools-v1:20`, inside the fail return reached only when `typeof trendosIntegrityDependencyHealthV1_ !== 'function'`;
  - therefore the live result is `success=false`, `codeReady=false`, `missing=['trendosIntegrityDependencyHealthV1_']`;
  - temporary debugger breakpoint was removed and the debugger was closed.
- Status: **FAIL — dependency health router entry point is not visible to the live Runtime; PD-08 is blocked**.
- Production impact: NONE — health-only execution and debugger inspection; no business function; no Deploy; no Script Properties; no flags; no route activation; Version 143 remains production.
- Commit / CI: Candidate R3 CI remains green, but live runtime evidence supersedes CI for this checkpoint; ledger-only commit on working branch.
- Rollback: no production rollback required. Keep Version 143 unchanged; do not deploy the current Head. If the Router file is proven incomplete or stale, restore only `trendos-integrity-router-v1.gs` from exact R3 blob `c4930e1150fd2eaf62616d44f975690108f54816`.
- Exact next step: inspect the persisted live Router source boundaries and compare it with exact Candidate R3; repair only that file if a mismatch is proven, save, and rerun PD-06/PD-07. Do not continue to PD-08 while `codeReady=false`.

## PD-07R Root-cause diagnosis — FAIL CONFIRMED / REPAIR SET BOUNDED
- Action: copied the persisted live content of every file installed during the authenticated autonomous session and compared its Git blob SHA with Candidate R3.
- Evidence:
  - all six files begin with the Apps Script default wrapper `function myFunction() {`, end with its closing brace, and are exactly 29 characters longer than their approved Candidate source;
  - Invoice live `4e9c34138cf2b2d65bdcabb519d91b852b8db969` vs expected `7d42237112a601fea4d2ffcc0765c795226d7dd2`;
  - WhatsApp live `b567921c53476833ee9a5910ff23deb3e464edcd` vs expected `c3e59c50f17de2604f0192a5b8f651e53caf9018`;
  - Handover/OPS live `0bce26a7bf5e74c4d11196164f21055969ab02be` vs expected `4f2301d2101c45cb21ff8466e09cf63849d12cc8`;
  - Andon live `c799377a0d1ec850f91bc11145500585a077cc5b` vs expected `6b61b9f0c4cae9bd47a85f59efd7780e95f04765`;
  - Dashboard live `f113bc817e2a623a92dbf2bcde409b5f07b95a81` vs expected `3cb1ef31a2d22cc0ebd19f5c4f9bacfa590a20bc`;
  - Router live `73966cdba90f9d032523762a03ae0aed1f8eb36a` vs expected `c4930e1150fd2eaf62616d44f975690108f54816`.
- Root cause: the editor uses macOS shortcuts; `Ctrl+A` did not select the full default file before paste, so approved code was nested inside `myFunction` and its functions were not global.
- Status: **FAIL CONFIRMED, repair scope bounded to these six newly installed files**.
- Production impact: NONE — diagnosis was read-only; no Deploy, properties, flags, or routes; Version 143 unchanged.
- Commit / CI: live mismatch evidence recorded on the working branch; approved Candidate R3 remains unchanged.
- Rollback: restore each affected file to its exact R3 blob; do not touch the four user-installed Integrity files or `Code.gs`.
- Exact next step: repair `trendos-invoice-integrity-v1.gs` using full-file macOS selection, verify its copied live Git blob SHA exactly, save, record the result, then continue through the bounded set one file at a time.

## PD-05R1 Invoice global-scope repair — PASS
- Action: replaced the entire wrapped Invoice file using macOS full-file selection and the exact Candidate R3 content, then saved.
- Evidence: copied live source before save matched Candidate exactly; Git blob SHA `7d42237112a601fea4d2ffcc0765c795226d7dd2`; post-save editor showed `cloud_done`, exact filename without unsaved marker, disabled Save, and no parser/save error.
- Status: **PASS — Invoice functions restored to project-global scope**.
- Production impact: NONE — Head source correction only; no Run/Deploy/properties/flags/routes; Version 143 unchanged.
- Commit / CI: Candidate R3 unchanged; ledger-only commit on working branch.
- Rollback: restore only this file from the same approved R3 blob.
- Exact next step: repair and exact-SHA verify `trendos-whatsapp-integrity-v1.gs`.

## PD-05R2 WhatsApp global-scope repair — PASS
- Action: replaced the entire wrapped WhatsApp file with exact Candidate R3 content and saved.
- Evidence: copied live source matched Candidate exactly; Git blob SHA `c3e59c50f17de2604f0192a5b8f651e53caf9018`; `cloud_done`, disabled Save, no parser/save error.
- Status: **PASS — WhatsApp functions restored to project-global scope**.
- Production impact: NONE — Head correction only; no runtime/deploy/properties/flags/routes; Version 143 unchanged.
- Commit / CI: Candidate R3 unchanged; ledger-only commit on working branch.
- Rollback: restore only this file from the same approved R3 blob.
- Exact next step: repair and exact-SHA verify `trendos-handover-ops-integrity-v1.gs`.

## PD-05R3 Handover / OPS global-scope repair — PASS
- Action: replaced the entire wrapped Handover/OPS file with exact Candidate R3 content and saved.
- Evidence: copied live source matched Candidate exactly; Git blob SHA `4f2301d2101c45cb21ff8466e09cf63849d12cc8`; `cloud_done`, disabled Save, no parser/save error.
- Status: **PASS — Handover/OPS functions restored to project-global scope**.
- Production impact: NONE — Head correction only; no runtime/deploy/properties/flags/routes; Version 143 unchanged.
- Commit / CI: Candidate R3 unchanged; ledger-only commit on working branch.
- Rollback: restore only this file from the same approved R3 blob.
- Exact next step: repair and exact-SHA verify `trendos-andon-integrity-v1.gs`.

## PD-05R4 Andon global-scope repair — PASS
- Action: replaced the entire wrapped Andon file with exact Candidate R3 content and saved.
- Evidence: copied live source matched Candidate exactly; Git blob SHA `6b61b9f0c4cae9bd47a85f59efd7780e95f04765`; `cloud_done`, disabled Save, no parser/save error.
- Status: **PASS — Andon functions restored to project-global scope**.
- Production impact: NONE — Head correction only; no runtime/deploy/properties/flags/routes; Version 143 unchanged.
- Commit / CI: Candidate R3 unchanged; ledger-only commit on working branch.
- Rollback: restore only this file from the same approved R3 blob.
- Exact next step: repair and exact-SHA verify `trendos-integrity-dashboard-v1.gs`.

## PD-05R5 Integrity Dashboard global-scope repair — PASS
- Action: replaced the entire wrapped Integrity Dashboard file with exact Candidate R3 content and saved.
- Evidence: copied live source matched Candidate exactly; Git blob SHA `3cb1ef31a2d22cc0ebd19f5c4f9bacfa590a20bc`; `cloud_done`, disabled Save, no parser/save error.
- Status: **PASS — Dashboard functions restored to project-global scope**.
- Production impact: NONE — Head correction only; no runtime/deploy/properties/flags/routes; Version 143 unchanged.
- Commit / CI: Candidate R3 unchanged; ledger-only commit on working branch.
- Rollback: restore only this file from the same approved R3 blob.
- Exact next step: repair and exact-SHA verify `trendos-integrity-router-v1.gs`.

## PD-05R6 Integrity Router global-scope repair — PASS
- Action: replaced the entire wrapped Router file with exact Candidate R3 content and saved.
- Evidence: copied live source matched Candidate exactly; Git blob SHA `c4930e1150fd2eaf62616d44f975690108f54816`; `cloud_done`, disabled Save, no parser/save error.
- Status: **PASS — Router/dependency functions restored to project-global scope**.
- Production impact: NONE — Head correction only; no runtime/deploy/properties/flags/routes; Version 143 unchanged.
- Commit / CI: Candidate R3 unchanged; ledger-only commit on working branch.
- Rollback: restore only this file from the same approved R3 blob.
- Exact next step: reload Head, reverify all six exact live SHAs and the full persisted file composition, then rerun PD-07.

## PD-06R Post-repair persisted composition verification — PASS
- Action: reloaded the live Apps Script Head, reconciled the full file list, and copied each repaired file back from persisted Head for exact Git-blob verification.
- Evidence:
  - Apps Script returned `Saved to Drive` and `cloud_done`; Save remained disabled;
  - 23 total files, all required Integrity filenames present, file-level `missing=[]`;
  - Invoice, WhatsApp, Handover/OPS, Andon, Dashboard, and Router each match their approved Candidate R3 SHA exactly after reload;
  - all six `wrapped=false`; no default `myFunction` scope remains.
- Status: **PASS — persisted Head composition is repaired and exact for the bounded set**.
- Production impact: NONE — reload/read verification only; no Run/deploy/properties/flags/routes; Version 143 unchanged.
- Commit / CI: Candidate R3 unchanged; ledger-only commit on working branch.
- Rollback: exact R3 blobs remain the rollback source; Version 143 remains production.
- Exact next step: rerun public `trendosIntegrityDependencyHealthV1`, inspect the live result, and require `codeReady=true`, `missing=[]`, master OFF, and every family OFF.

## PD-07R2 Dependency Health retest — PASS
- Action: ran the public `trendosIntegrityDependencyHealthV1` after exact persisted repair.
- Evidence: Apps Script execution log returned:
  - `success=true`;
  - `codeReady=true`;
  - `requiredCount=23`;
  - `missing=[]`;
  - `features.master=false`;
  - every family false: HEALTH, ORDER_LINE, ATTENDANCE_CLEANING, PRESS, INVOICE, WHATSAPP, OPS, AUTOMATION;
  - `optional.fastAuthV25Present=false`;
  - version `TRENDOS_INTEGRITY_ROUTER_V1_20260830`;
  - execution completed.
- Status: **PASS — live code dependencies are complete and every Integrity feature remains OFF**.
- Production impact: NONE — health-only runtime; no business mutation, Deploy, properties, flags, or route activation; Version 143 remains production.
- Commit / CI: live runtime PASS supersedes the earlier live FAIL; Candidate R3 and CI remain unchanged; ledger-only commit on working branch.
- Rollback: disable flags remains the future family rollback; current production rollback is still Version 143.
- Exact next step: execute PD-08 legacy no-change smoke while all flags remain OFF; do not Deploy.

## PD-08 Legacy no-change smoke with flags OFF — PASS
- Action: inspected deployment/runtime history and the trigger inventory after PD-07, without invoking any Integrity business operation.
- Evidence:
  - Overview remains `Status: Deployed` and exposes the active `Version 143` deployment tab;
  - Version 143 shows 75,651 executions in the 7-day summary and its recorded Web App `doPost` executions are Completed;
  - Head execution history after installation contains only the explicitly requested `trendosIntegrityDependencyHealthV1` diagnostic executions; no Integrity business-family function ran;
  - Triggers page says `Showing 1 trigger`; the only trigger is Head / Time-based / `d1OrdersLiveSyncTick`, last observed at Aug 31 2026 3:30:38 PM, with continuing completed every-minute executions;
  - PD-07 independently proves master and every family flag false.
- Status: **PASS — installation alone introduced no deployed route or Integrity business mutation; legacy Version 143 remains production**.
- Production impact: READ-ONLY verification plus prior health-only call; no Deploy, properties, flags, or route activation.
- Commit / CI: live evidence recorded on working branch; Candidate R3 unchanged.
- Rollback: Version 143 remains the active production rollback; no production change exists yet to reverse.
- Exact next step: PD-09 controlled deployment checkpoint. Freeze the exact repaired Head/source evidence, confirm rollback Version 143, and obtain explicit production Deploy approval before creating/updating any deployment; all flags must remain OFF.

## PD-09 Controlled deployment + immediate flags-OFF smoke — DEPLOY PASS / PUBLIC SMOKE PASS / PRIVATE CONSOLE RECHECK PENDING
- Action: after explicit user approval, updated the existing production Web App deployment to Version 144 using the verified Apps Script Head with every Integrity/Fast Auth flag OFF; then issued one non-mutating GET to the preserved production Web App URL.
- Evidence:
  - Apps Script reported `Deployment successfully updated` and `Project deployed successfully`;
  - new production version: **144**, created Aug 31 2026 3:38 PM in the Apps Script UI;
  - description: `TrendOS Integrity V1 R3 - flags OFF - PD-09 2026-09-01`;
  - existing Deployment ID preserved: `AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg`;
  - existing Web App URL preserved;
  - the public production GET returned title **TrendOS V1932** and rendered the expected legacy Trend Mall landing page with employee/customer entry choices;
  - no form, business API, Integrity family function, Script Property, trigger, `Code.gs`, or route setting was changed by the smoke;
  - PD-07 immediately before deployment proved master=false and all eight family flags=false; no Script Property operation occurred during or after deployment;
  - PD-08 immediately before deployment proved exactly one Head time-based `d1OrdersLiveSyncTick`; updating a Web App deployment does not install or modify triggers.
- Status: **PASS for deployment and public legacy response. Private post-deploy execution-history/trigger-page refresh is PENDING because the authenticated Google editor session expired after the deployment; this blocks all family activation but does not invalidate the successful public response.**
- Production impact: **YES — production Web App serves Version 144; Integrity and Fast Auth remain inactive because all flags remain OFF.**
- Commit / CI: approved Candidate R3 `ee03adab4c733aec909511b23dd80f42ad3b927e`; CI `33384689012` SUCCESS; ledger updated from live deployment/public response evidence.
- Rollback: Version 143 remains available on the same deployment ID; restore it immediately if the remaining private-console reconciliation exposes a Version 144 failure.
- Exact next step: restore authenticated access to the bound Apps Script project, verify a Completed Version 144 `doGet`, confirm exactly one `d1OrdersLiveSyncTick`, and confirm no Integrity business-family execution. Record PASS/FAIL before requesting or performing PD-10 HEALTH activation; do not activate any flag yet.

### PD-09 memory synchronization — PASS
- Action: updated `TRENDOS_HANDOFF.md` to make Version 144, the public smoke result, Version 143 rollback, the expired private Google session, and the exact remaining read-only checks the canonical resume point.
- Evidence: handoff commit `7c0d9cab0a86bc7fc25d172bbd692701fd325306` on `agent/go-live-2026-09-01-integrity`.
- Status: **PASS — project memory now resumes from the real post-deploy checkpoint rather than the superseded approval checkpoint**.
- Production impact: NONE — documentation only.
- Commit / CI: handoff commit above; deployment candidate and CI unchanged.
- Rollback: revert only the documentation commit if its recorded facts are disproved by later evidence.
- Exact next step: obtain fresh authenticated editor access and complete the private Version 144 execution/trigger reconciliation; all flags remain OFF.

## PD-09P Private post-deploy console reconciliation — PASS
- Action: restored authenticated access to the bound Apps Script project and completed the three outstanding read-only Version 144 checks.
- Evidence:
  - Executions filtered to `Deployment: Version 144` show Completed Web App `doGet` and `doPost` rows, including `doGet` at Sep 1 2026 3:18:37 AM (1.623 s) and multiple completed `doPost` rows;
  - the filtered Version 144 view exposes no `trendosIntegrity*` business-family execution;
  - Triggers reports `Showing 1 trigger`; the only trigger is Head / Time-based / `d1OrdersLiveSyncTick`, last observed Sep 1 2026 6:48:38 AM.
- Status: **PASS — PD-09 controlled deployment and complete flags-OFF smoke are closed**.
- Production impact: READ-ONLY private-console verification; Version 144 remains active and all flags remain OFF.
- Commit / CI: live runtime evidence recorded on the working branch; Candidate R3 and CI unchanged.
- Rollback: Version 143 remains the deployment rollback; no rollback is required because the smoke passed.
- Exact next step: proceed to the separately approved PD-10 HEALTH-only activation. Inspect the approved property/route/test contract, enable only the minimum HEALTH gates, run its runtime regression, and switch the family OFF immediately on FAIL. Do not activate any other family.

## PD-10 HEALTH activation approval — APPROVED / READY TO EXECUTE
- Action: interpreted the user's direct reply `موافقة` as explicit approval for the first activation family, **HEALTH only**, after the already required PD-09 private-console reconciliation.
- Evidence: approval followed the explicit statement that HEALTH required separate approval; scope is not extended to ORDER_LINE or any later family.
- Status: **APPROVED, NOT YET EXECUTED** — authenticated access is restored and PD-09 is now PASS; HEALTH activation is ready.
- Production impact: NONE — no Script Property, flag, route, trigger, source file, or deployment was changed in this step. Version 144 remains live with all flags OFF.
- Commit / CI: documentation-only working-branch checkpoint; Candidate R3 and CI unchanged.
- Rollback: none required because no activation occurred; Version 143 remains the deployment rollback.
- Exact next step: when authenticated Apps Script access is restored, complete the private Version 144 execution/trigger checks first; only on PASS enable the minimum HEALTH gate(s), run the defined HEALTH runtime regression, and immediately switch the family OFF on FAIL. Do not activate any later family.

## PD-10A HEALTH route-wiring precheck — FAIL / NEW BLOCKER
- Action: before changing any Script Property, copied the current live `Code.gs` read-only from the authenticated editor and searched its exact 13,960-line / 695,246-character source for Integrity Router calls.
- Evidence:
  - exactly one live `doGet(e)` and one live `doPost(e)`;
  - `doGet` dispatches `trendosV1932TryRoute_` -> `trendosV1900TryRoute_` -> `trendosV1898TryRoute_` -> legacy action chain;
  - `doPost` parses payload, dispatches the same three legacy routers, then falls through to legacy actions;
  - live-source occurrences: `trendosIntegrityTryRouteV1_` = 0, `trendosIntegrityTryWebhookV1_` = 0, `trendosIntegrityDependencyHealthV1` = 0;
  - therefore Version 144 contains the installed Router module but its guarded router functions are not called by the live entrypoints.
- Status: **FAIL / ACTIVATION BLOCKED — enabling master+HEALTH now would only change properties; it would not prove the intended Web App HEALTH route or dashboard activation. A false PASS is forbidden.**
- Production impact: READ-ONLY source verification only. No code, Script Property, flag, trigger, deployment, or route changed; Version 144 remains live with every flag OFF.
- Commit / CI: new live-composition evidence supersedes the assumption that flag activation alone was sufficient; Candidate R3 and prior CI did not test live `Code.gs` entrypoint wiring.
- Rollback: none required because HEALTH was not activated; Version 143 remains the deployment rollback.
- Exact next step: obtain explicit approval for a minimal guarded edit to the **current live** `Code.gs` entrypoints (never replace it from GitHub), add route/webhook handoff with flags OFF, save/parse/dependency-test, create Version 145 with flags OFF, run legacy smoke, then activate HEALTH only and run its regression. If live source modification is not approved, keep all flags OFF and stop activation.

### PD-10A memory synchronization — PASS
- Action: updated `TRENDOS_HANDOFF.md` so future execution resumes from the missing live entrypoint-wiring blocker rather than attempting a property-only HEALTH activation.
- Evidence: handoff commit `97f334c197f80b255165b8467232268cba45c0b9`.
- Status: **PASS — canonical memory reflects the new live-source evidence**.
- Production impact: NONE — documentation only.
- Commit / CI: handoff commit above; Candidate R3 unchanged.
- Rollback: revert documentation only if later live evidence disproves the recorded source capture.
- Exact next step: request explicit approval for the bounded current-live-`Code.gs` guarded wiring change; keep Version 144 and every flag unchanged until then.

## PD-05-AUTO Authenticated editor access — PASS / RESOLVED
- Action: established an authenticated cloud-browser session and opened the exact bound Apps Script project for the production workbook.
- Evidence:
  - production workbook Drive ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`;
  - bound Apps Script project ID: `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`;
  - live file list matched the recorded Head state through Press before Invoice installation.
- Status: **PASS — the prior one-time-auth blocker is resolved for the current controlled editor session**.
- Production impact: NONE — access verification plus Head file installation only; Version 143 unchanged.
- Commit / CI: documentation-only checkpoint on working branch; Candidate R3 remains `ee03adab4c733aec909511b23dd80f42ad3b927e`.
- Rollback: close the authenticated editor session; no deployment or property change exists to roll back.
- Exact next step: continue controlled one-file-at-a-time Head installation, saving and recording each result before proceeding.


---

# 6. Remaining pre-deploy sequence

## PD-05 Core file installation
Install only:
1. `trendos-integrity-v1.gs`
2. `trendos-order-line-integrity-v1.gs`
3. `trendos-attendance-cleaning-integrity-v1.gs`
4. `trendos-press-integrity-v1.gs`
5. `trendos-invoice-integrity-v1.gs`
6. `trendos-whatsapp-integrity-v1.gs`
7. `trendos-handover-ops-integrity-v1.gs`
8. `trendos-andon-integrity-v1.gs`
9. `trendos-integrity-dashboard-v1.gs`
10. `trendos-integrity-router-v1.gs`

Do not install GitHub `Code.gs`. Do not install V2.5 yet. Do not install old standalone V1932 modules.

## PD-06 save/parse only
- project must save without syntax/global collision.
- no Deploy.
- no flags enabled.

## PD-07 dependency health
Run public `trendosIntegrityDependencyHealthV1()` manually.
Expected:
- `codeReady=true`.
- `missing=[]`.
- global enabled false.
- family flags false.

## PD-08 legacy no-change smoke with flags OFF
Verify Version 143 behavior unchanged, one D1 sync trigger remains, no Integrity business mutation occurs merely from installation.

## PD-09 controlled deployment checkpoint
Only after PD-04 through PD-08 PASS:
- freeze exact Apps Script source state/version.
- confirm rollback deployment/version.
- deploy with flags still OFF.

## PD-10 family activation/runtime regressions
Order:
1. HEALTH
2. ORDER_LINE
3. ATTENDANCE_CLEANING
4. PRESS
5. INVOICE
6. WHATSAPP outbound + frontend shim
7. WHATSAPP inbound
8. OPS/HANDOVER/ANDON
9. AUTOMATION

Each family: flag ON -> runtime regression -> Expected/Actual PASS|FAIL -> immediate family rollback on FAIL.

## PD-11 D1 consistency regression
Verify Orders+Lines source-snapshot consistency and unsafe-state fallback/reject behavior.

## PD-12 full E2E
`Customer -> Order -> Lines -> production -> Press if applicable -> Ready Sweep -> Invoice -> payment/delivery -> WhatsApp -> Handover/OPS -> D1 read -> Integrity Dashboard`.

## PD-13 GO/NO-GO
GO forbidden until all Core runtime gates pass and zero CORE-P0 blockers remain.

## PD-14 Fast Auth V2.5 separate performance lane
Only after Core correctness is stable; install with V2.5 flag OFF, wire lifecycle invalidation, test auth parity/expiry/invalidation, then enable after PASS.

---

# 7. Resume protocol for any new chat

When user says equivalent of `كمل TrendOS`:
1. read `TRENDOS_PROJECT_MEMORY.md`.
2. read this `TRENDOS_EXECUTION_LEDGER.md`.
3. read `TRENDOS_HANDOFF.md`.
4. read Deploy Manifest for deployment work.
5. check current GitHub branch/candidate before assuming state.
6. resume from **EXACT CURRENT STOPPING POINT**.
7. do not ask user to repeat recorded information.
8. perform all accessible read/search/test/GitHub actions autonomously.
9. ask only for inaccessible Apps Script UI actions, consequential production approval, or evidence that cannot be retrieved otherwise.
10. update this ledger after every material step.

---

# 8. Non-negotiable safety rules

- no destructive cleanup of historical valid data.
- `مكرر` remains historical and excluded from active state.
- Order ID is Order key; Line ID is active Line key.
- no invented prices/payments/stock/states/approvals/press energy values.
- check-then-write requires shared lock or durable claim.
- external sends require logical idempotency before send.
- Sheets remains authoritative write path until separately approved migration.
- never overwrite production from GitHub `Code.gs`.
- never blindly overlay old modular V1932 files on consolidated live lineage.
- Fast Auth V2.4 is forbidden.
- installation and activation are separate.
- master/family flags remain OFF until their exact runtime checkpoint.
- rollback disables code/routing; it does not delete audit/integrity data.
