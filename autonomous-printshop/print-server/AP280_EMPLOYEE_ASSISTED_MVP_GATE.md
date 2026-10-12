# AP-280 — Employee-assisted Print Server MVP: visible local work queue (GITHUB ONLY)

**Owner decision:** start a practical operator-assisted printshop system first; defer autonomous printing, unattended routing and full AI operation. This stage is a source-only step toward that first operating milestone. Do not call it deployed.

## Existing components reused

- Existing Print Server local HTTP GUI, local persisted order state, folders, manual route selection, order file preview, Windows popup where supported, and separate TrendOS human-start bridge.
- Existing AP-277 local POST authorization, AP-278 static path safety and AP-279 read-only-by-default TrendOS bridge.
- Existing AP-259 Ubuntu GET-only Firefox demo remains the last owner-verified local UI runtime; it is not proof of the new AP-280 code.

## Added concrete employee assistance

1. `src/employee_assist.py` projects an **already registered local order** to one of only two actionable local stages:
   - `NEEDS_WORK_FOLDER`: employee must choose a manual work-category folder.
   - `FOLDER_SELECTED`: a valid manual folder exists; employee must review actual files and **human** approval before preparing any output.
2. A **read-only** `GET /api/employee/queue` uses current `StateStore.orders()` exclusively: no new filesystem scans, no platform HTTP, no login, no state writes and no printer calls. Missing/inconsistent route records remain in the needs-review bucket.
3. The new dashboard panel in `public/index.html`, `app.js`, `styles.css` shows a concise local count, up to 30 suggested actions and links to select the existing order. Unrouted local orders appear first, oldest-first where a trustworthy timestamp is available. All user-controlled fields are HTML-escaped.
4. API explicitly reports `source=LOCAL_PRINT_SERVER_STATE_ONLY`, `authoritativeTrendOSStatus=false`, `designApprovalVerified=false`, `physicalPrintingVerified=false`, `platformBusinessWrites=false`. No operator should interpret this local queue as the source-of-truth order status, actual customer design approval, SLA/overdue determination, Ready/Printed confirmation, or available inventory.
5. If no local orders exist, the interface says so clearly; it does not pretend TrendOS is connected. Employee-assistance is not a substitute for a later scoped read-only TrendOS link.
6. No side effects on EasyStore, Cloudflare production/D1, Win7 shop originals, customer files, printer devices, Ubuntu host services, or GitHub deployment.

## Real hosted test evidence

[GitHub Actions AP-280 run 38309423141](https://github.com/fawakhry/TrendOs/actions/runs/38309423141), job `115011247207`, COMPLETED/SUCCESS. Inspected log evidence:
- `node --check public/app.js` success.
- AP-280 new employee queue tests: `Ran 10 tests in 0.516s`, OK.
- AP-279 shadow bridge regression: `Ran 8 tests in 0.013s`, OK.
- AP-278 path guard regression: `Ran 11 tests in 0.039s`, OK.
- AP-277 write auth regression: `Ran 12 tests in 0.623s`, OK.
- AP-276 original operational regression: `Ran 6 tests in 0.485s`, OK.
- **Total 47/47 synthetic tests PASS**; receipt `AP280_HOSTED_EMPLOYEE_QUEUE_SYNTHETIC=PASS`. This is not an end-to-end live acceptance test.

## What employee-assisted first go-live still needs

- Owner confirms if `TrendosShop` Ubuntu is physically in the printshop or still at home; actual workstation role, shop PC and print devices remain unverified.
- Owner gives separate consent for a **bounded, local, fake-order pilot**, followed one owner-approved Ubuntu command at a time and Terminal screenshot. No automatic Git pull/fetch just to update docs. Confirm the branch code change set, actual host dependencies, stop behavior and CLI flags before suggesting a command.
- Read-only scoped TrendOS employee order access with owner-approved credentials/access and a non-triggering baseline. A shadow bridge will not create folders automatically; a controlled, authorized employee workflow must be qualified separately.
- Approvals cannot be trusted from an arbitrary string; need verifiable source/provenance before using customer assets. AP-278 static symlink checks do not resolve race-free filesystem safety or Windows reparse issues.
- One supervised fake/sample work order from queue -> manual category -> **sample** file review -> controlled ready copy (fake approval only in disposable test) -> staff confirms physical output via a separately approved print canary. No customer originals, printing, running permanent services or changing finance without fresh authority.

**AP280_RESULT=47_OF_47_HOSTED_SYNTHETIC_PASS; AP280_REAL_HOST_DEPLOYMENT=NO; AP280_REAL_ORDER_SYNC=NO; AP280_REAL_PRINTING=NO; NEXT=OWNER_LOCATION_AND_SEPARATE_LOCAL_SYNTHETIC_RUNTIME_CONSENT.**
