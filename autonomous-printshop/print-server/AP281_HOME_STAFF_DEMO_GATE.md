# AP-281 — Home-first employee-assisted preview, not printshop deployment

**Date:** 2026-10-13 (owner confirmed `TrendosShop` Ubuntu is presently **at home**, not at the physical printshop). This replaces the open AP-276/AP-280 location question; do not ask the owner for it again without evidence of a changed location.

## Owner decision and shortest practical employee-first path

The owner chooses an initial **employee-assisted** Print Server, not a fully autonomous unattended printshop before any operations. The home Ubuntu system can be used for **UI walkthrough and synthetic state qualification only**. Its location means shop Windows7 workstation, local shared folders, employees' physical print devices, native machine integrations and connectivity/topology remain unqualified. Do not equate a local home HTTP demo with operation at the printshop.

1. **Stage at home with fake data and owner approval:** review source/version drift (owner Ubuntu photographed Git HEAD `a238ce5a830bc5a7968dc020cd8168c85fa8c446` vs GitHub branch), identify existing uncommitted changes and dependencies without Git pull, patch, install or remote agent; obtain the owner's separate approval for any code update. Once approved and the scoped change set is reviewed, allow a SINGLE bounded offline fake staff demo command, then demand direct Terminal screenshot and stop/cleanup evidence. No permanent service.
2. **Employee walkthrough:** show only two fake orders: one missing manual department, one with laser route and generated fake PNG file; visible next-action queue and safe file preview. All HTTP writes/login/sync/print operations must return 403. Confirm UI loads, fake counts, file preview and automatic stop. This verifies UI ergonomics only, **not** live order synchronization.
3. **Shop worksite topology:** before real employees rely on software, separately inventory where the shop operator workstation is, LAN / file storage relationships and devices **without opening real shares or accessing Windows7 originals**, and choose an authorized dedicated onsite print-server host/architecture. The owner may keep `TrendosShop` at home during UI development; **real physical printing cannot be assumed remotely**. No router port forwarding, NetBird/SSH/UFW edits, privileged executor or unreviewed service.
4. **Read-only TrendOS order gate:** owner-approved scoped account/adapter, baseline-only shadow reading and identity/consent verification, no business-state writes or real data in GitHub CI. Later separately authorize locally-created order folders and authentic approval provenance.
5. **Onsite supervised trial:** one fake or owner-approved test print on an explicitly approved physical device, with human operator controlling Ready/Print, stop, receipt, rollback and independent verification before any lasting rollout. EasyStore is out of scope.

## Added AP-281 files and behavior

- `employee_home_demo.py`: wholly synthetic, independent opt-in entrypoint. Uses `offline_pilot.offline_config` to create a brand-new `TemporaryDirectory` with TrendOS Cloud=OFF and Fast Mode=OFF. Seeds exactly two identifiable `DEMO-281-001/002` fake orders, uses existing real `OrderFolderService` for temporary local file/folder fixture only, makes one generated test image, and serves existing HTTP GUI only on ephemeral `127.0.0.1`.
- Dedicated `employee_demo_handler` permits only the required GET routes with fake-only order ID and generated image path restrictions. All POST, PUT, PATCH, DELETE and OPTIONS are blocked, even if a caller has a token. No production `run.py`, customer or Windows7 file path. Default lifetime is **75 seconds**; Ctrl+C/timeout closes socket, joins worker and cleans disposable filesystem.
- UI displays a prominent synthetic-training banner and disables local folder selection and login/settings/sync buttons in this demo. This is display-only state; HTTP access restrictions remain enforced server-side.
- `tests/test_ap281_home_employee_demo_synthetic.py`: 10 hosted tests cover fake queues, file preview, blocked network/login/write, UI banner, generated root containment, automatic cleanup and rejection of unexpected CLI arguments.
- `.github/workflows/autonomous-printshop-ap281-home-employee-demo-ci.yml`: hosted Python 3.12 and `node --check`; 10 AP-281 tests plus 10 AP-280, 8 AP-279, 11 AP-278, 12 AP-277 and 6 AP-276 regression tests.

## Verified GitHub hosted evidence

Initial [run #38310128211](https://github.com/fawakhry/TrendOs/actions/runs/38310128211) failed **one incorrect test assertion**: it expected Python literal backslash escape text in the returned image instead of real PNG byte signature. The real fake-image preview endpoint returned HTTP 200. The assertion was corrected in GitHub commit `af5d1000e009c1932e77717e16a6896f2863b34a`, without loosening the handler's write denial.

[Follow-up run #38310206380](https://github.com/fawakhry/TrendOs/actions/runs/38310206380), job `115013781623`: COMPLETED/SUCCESS, inspected actual logs: `Ran 10 tests` OK + `Ran 10 tests` OK + `Ran 8 tests` OK + `Ran 11 tests` OK + `Ran 12 tests` OK + `Ran 6 tests` OK = **57/57 fake-data tests passed**. `node --check public/app.js` also passed. `AP281_HOSTED_FAKE_EMPLOYEE_DEMO=PASS`; receipts explicitly say owner Ubuntu **NOT EXECUTED**, live Cloud/Win7/customer files/printing OFF, production NOT READY.

## First owner permission gate (not granted yet)

Ask: **"هل توافق أبدأ بفحص قراءة فقط لحالة Git ونسخة المشروع الموجودة على Ubuntu في البيت؟"** On approval provide exactly **one** read-only Terminal command and await screenshot. The command must not fetch, pull, checkout, reset, install packages, touch AppArmor/UFW/SSH/NetBird, launch production or print. Host-specific updates and the fake demo itself require separate plan/approval once source divergence is reviewed.

**AP281_OWNER_MACHINE_LOCATION=HOME_CONFIRMED; AP281_OPERATOR_ASSISTED_PRIORITY=YES; AP281_HOSTED_TESTS=57_OF_57_PASS; AP281_HOST_EXECUTED=NO; AP281_PRODUCTION_READY=NO.**
