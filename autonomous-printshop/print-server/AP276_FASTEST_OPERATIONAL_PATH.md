# AP-276 — Fastest safe route from proven Ubuntu demo to an autonomous printshop

**Priority pivot (owner instruction, 2026-10-12):** focus on **operational printshop go-live** before VM / Bubblewrap / direct ChatGPT-to-Ubuntu execution. No rewriting completed AP-245–AP-275 work. VM and remote-agent architecture are DEFERRED. This file is an engineering/qualification runbook, not a production deployment or owner consent for Ubuntu/network/customer/printer actions.

## What has actually been proven

- **AP-247–AP-259** existing offline Print Server loopback-only GET demo, desktop START/STOP and Firefox, actual owner Ubuntu receipt `OWNER_STOP`, `ELAPSED_SECONDS=19.407`, `HTTP_STOPPED=YES`, `TEMP_CLEANED=YES` (software receipt, not independent FS forensic audit). DO NOT repeat without a demonstrated regression.
- **AP-260/262** a bounded local read-only Git/Python snapshot actually ran on Ubuntu; this is a diagnostic, not a remote agent or Print Server production proof.
- **AP-267–AP-273** bwrap/namespace path blocked and AppArmor log diagnosis inconclusive as to exact root cause. No reason to disable AppArmor or install a VM merely to qualify the Print Server.
- **AP-276 newly qualified on hosted Ubuntu 3.12 CI**: six integration tests use the **already existing** `src.server.PrintServerApp`, `make_handler`, `src.platform_bridge.TrendOSStatusBridge`, `src.folders.OrderFolderService`, `src.state.StateStore` and `offline_pilot.offline_config`. A fake employee rows source and a synthetic temporary filesystem exercise:
  - boot of existing app over ephemeral loopback HTTP with TrendOS CLOUD=OFF, Fast Mode/UI popup OFF, and state/ready/orders paths inside temp;
  - baseline only and subsequent human-start status -> local order root exactly once; no unapproved automatic work-category inference;
  - synthetic HTTP POST claim -> explicit manual work-category -> local route and `x` folder -> synthetic file approval/hash -> ready-queue copy, with no Design READY or platform business mutation;
  - denial of FREE_TEXT/rejected/hash-mismatch approvals and files outside order root;
  - no external employee login, network polling or production startup.
  **GitHub hosted only:** `tests/test_ap276_operational_flow_synthetic.py`, `.github/workflows/autonomous-printshop-ap276-operational-flow-ci.yml`; real run [38306335428](https://github.com/fawakhry/TrendOs/actions/runs/38306335428), job `115001166421`, `Ran 6 tests in 0.330s`, `OK`, `AP276_HOSTED_OPERATIONAL_SYNTHETIC=PASS`. This is not production or owner Ubuntu verification.

## Critical blockers on the shortest path — don't skip

1. **Determine physical deployment target and safe routing.** Last known Ubuntu `TrendosShop` was an owner-operated home iMac; location/connection to actual shop printers/Windows7 network must be explicitly confirmed, not assumed. Print Server V0.2 documentation calls the production bridge a **Windows** print-server flow; Windows topmost chooser is Windows-only while base Python HTTP code can run on Linux. The tested Ubuntu Firefox demo is **not** the complete Windows printshop application.
2. **Production entry is not the offline demo.** `print-server/src/config.py` defaults `trendos.enabled=true`, an actual Cloudflare endpoint, `fastMode.enabled=true`, folder writes and persistent state. `print-server/run.py` writes logs and starts long-lived server/watcher/bridge. Do NOT start `run.py` on owner Ubuntu or Win7 as a shortcut or rely on the AP-247 test flags to guard it.
3. **Local mutation endpoint security requires review before connecting real orders:** `src.server.make_handler` exposes POST routes for folder creation and approval/file copy at loopback, with no independently verified caller authorization in the shown handler; loopback binding alone is not sufficient proof of authentication or CSRF resistance. AP-276 tests these paths only with **fake data on a disposable CI host**; such success is NOT security qualification for real customer orders.
4. **No approval/printed-state inflation:** the bridge observes *human status transitions* and does not grant actual claim/write authority, Design READY, Machine READY, physical printing confirmation, finance mutation, or unattended production orders. `x` folder watcher is just a local signal. Authentic production steps need their own approved evidence and human safety gate.
5. **Existing shop files and devices** remain untouched: Windows7 originals, customer work folder paths, printer spool, CUPS, GitHub runner, real orders, EasyStore finance, Cloudflare Production/D1, live credentials and production traffic are OUT OF SCOPE for GitHub-only AP-276.

## Practical next five gates (owner approves host/customer access separately)

**Gate 1 — Target and workstation fact:** ask owner only one question: **is Ubuntu `TrendosShop` physically in the printshop now, or still at home?** If at home, prioritize real production-location topology and a safe method to view the shop without remotely opening windows/printers. Do not assume the present OS is a production replacement for Windows7.

**Gate 2 — Fail-closed launch qualification on host:** after explicit owner approval and code path qualification, one command at a time on Ubuntu. Start a **bounded local synthetic operational test only**, with TrendOS network adapter OFF, no production config, no real orders or printer access; stop cleanly and review receipts/screenshots. Never `fetch` Ubuntu just to update the master book.

**Gate 3 — Security review before live local writes:** verify local API write authentication/origin/cross-site protections, safe absolute data paths, no symlink traversal, no untrusted approval token or free-form path escalation; install no service, network listener or new package until reviewed and explicitly authorized. Test on sanitized fixtures first.

**Gate 4 — Owner-authorized real *read-only* integration:** connect only to separately approved TrendOS employee read adapter through a scoped account/approved network, no production business mutation. Baseline must be non-triggering, counts and lineage verified, with a local STOP and dry-run receipt. No customer row export into CI.

**Gate 5 — Controlled physical canary:** once machine/shop locality, real printer interface, originals, design approval, route and safe shutdown are separately qualified and explicitly authorized, run exactly ONE monitored fake/test print job on a non-production target (or owner-approved real device) and verify direct physical output, pause/stop, rollback, audit and no account writes. Only then discuss durable production runtime and bounded autonomy; no default autonomous printing.

## Stop/rollback and decisions

- **Safe present operating mode:** keep the already owner-qualified AP-259 disposable demo and the AP-262 local diagnostic available. Source-only AP-276 tests are not an installer or an on-host execution connection.
- **No source migration requested:** last photographed owner Ubuntu source HEAD `a238ce5a830bc5a7968dc020cd8168c85fa8c446`. GitHub-only AP-276 code/tests remain in PR #95, Draft/Unmerged.
- **Real go-live cannot be inferred from hosted tests:** it requires a confirmed physical workstation, actual authenticated order read, safe folder storage, operator workflow, print device integration, and owner-authorized production canary. Keep customer, finance and production print writes OFF before explicit owner choice.

## Single next owner question

**Is `TrendosShop` Ubuntu physically at the printshop or still at home?** The answer determines the safest and shortest branch of operational deployment. Do not start the real `run.py`, modify the shop Windows7 workstation or bring up remote infrastructure merely to answer that question.
