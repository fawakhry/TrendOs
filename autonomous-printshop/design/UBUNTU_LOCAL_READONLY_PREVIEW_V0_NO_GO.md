# Autonomous Printshop — Ubuntu manual local read-only process preview V0

**2026-10-12 | SOURCE-ONLY | UNINSTALLED | UNEXECUTED ON OWNER'S UBUNTU | NO_GO**

## Purpose and lineage

This is a small **potential local program source**, not an existing installed service or a ChatGPT connector. It extends [Draft PR #122](https://github.com/fawakhry/TrendOs/pull/122) and [Draft #121](https://github.com/fawakhry/TrendOs/pull/121), preserving the newer shared platform Printshop canonical book and existing Printshop production/shadow authority. It does not incorporate pending separate AP-134 iMac pilot/hardware feasibility, which remains conditional on physical/boot/backups/owner decisions. The earlier experimental Print Server was **not** proven fit for real production.

## What the program actually does (IF a human later explicitly runs it)

- `autonomous-printshop/local-ubuntu/manual-readonly-preview-v0.mjs` is a **manual-only** Node.js CLI. It has **no daemon, timer, network listener, upload, polling, SSH, shell invocation, service-control, printer action, or filesystem read/write**. It accepts only `--help` or `--preview-local`; with no arguments or unexpected arguments it performs **no machine sampling** and stops.
- A human would have to deliberately invoke `node autonomous-printshop/local-ubuntu/manual-readonly-preview-v0.mjs --preview-local` **after separate review and host setup consent**. If run then, it uses ONLY four built-in `node:os` getters: `platform()`, `uptime()`, `totalmem()`, and `freemem()`. None have been called on the user's Ubuntu machine in this work. This collects coarse process-visible metrics only; there are **no CUPS/Printer Server probes**, no job/USB/spool reads.
- `autonomous-printshop/local-ubuntu/read-only-process-preview-v0.mjs` projects those readings to only `memoryPressure=NORMAL|ELEVATED|HIGH|UNKNOWN` and `uptimeBand=UNDER_1_HOUR|ONE_TO_24_HOURS|OVER_24_HOURS|UNKNOWN`, with a fixed generic `NOT_PROBED` state for six conceptual services. It does **not print raw hostname, username, IP, device IDs, environment variables, customer records, order IDs, exact uptime or memory numbers, paths, file contents, secrets, system logs or queue info**.
- Any input that is not a strict plain Linux four-field numeric metrics record, has unknown/accessor/hidden fields or implausible values is refused. The result is always marked **unsigned and untrusted**, `hostIdentityVerified=false`, `ubuntuDistributionVerified=false`, `printerReadyVerified=false`, `printServerProductionReady=false`, `connectedToChatGPT=false`, `canPrint=false`, `financeRelease=NO_GO` and `printshopRelease=NO_GO`.

## Security boundaries and what remains missing

**No authenticated real host evidence exists.** The local CLI's result is intentionally **not** compatible with the fictional signed V1 envelope; `reviewSignedUbuntuMockEvidenceV1` must reject it. The V1 crypto mock has **no real keys, trust store, replay database or endpoint**. A future collector, independently verified signed transport and persistent atomic replay protection are separate design/owner gates; they are not silently created here. Attesting the OS distribution and physical printer/CUPS health requires another independently reviewed process. Never infer a green printer from process uptime/memory.

The GitHub Actions job runs `node --check` for the two local program files and **pure fixture tests** of the projector and static CLI guard, alongside existing fake diagnostic/crypto/autonomy regressions. The CI **does not run `--preview-local` on any machine**, does not connect to Ubuntu and does not sample GitHub runner health or production records.

A future human-approved test on a genuine local Ubuntu device would be **read-only**, not machine operation; still requires identity/privacy review and manual host consent. Running or installing this program on the owner's computer, creating network transport, exposing logs, controlling the print server, and executing arbitrary shell or print commands are NOT authorized by this PR.

## Independent source-only acceptance

- Require exact-head PR GitHub Actions success on this source change and on the append-only `autonomous-printshop/MASTER_BOOK.md` update.
- Keep this PR OPEN DRAFT / UNMERGED; no second independent reviewer is currently available. Successful tests do not grant any owner release or authority to bypass code review.
- The only canonical Printshop progress/history is `autonomous-printshop/MASTER_BOOK.md` in **TrendOS**, not `TrendOS_MASTER_BOOK.md` or EasyStore's original accounting book.

`LOCAL_LINUX_MANUAL_PREVIEW=SOURCE_ONLY_NOT_RUN`  
`UBUNTU_HOST_DISTRIBUTION_AND_IDENTITY=NOT_VERIFIED`  
`PRINT_SERVER_AND_CUPS=NOT_PROBED`  
`CHATGPT_UBUNTU_BRIDGE=NOT_CREATED`  
`PRINTER_PRODUCTION_READINESS=NOT_QUALIFIED`  
`G1=OPEN G2=OPEN G3=OPEN G4=OPEN G5=OPEN FINANCE_RELEASE=NO_GO`
