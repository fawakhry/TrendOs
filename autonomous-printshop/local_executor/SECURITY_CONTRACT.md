# AP-233 — Local diagnostic executor SECURITY DESIGN (SOURCE-ONLY / DEFAULT OFF)

Status: **PROTOTYPE POLICY + SYNTHETIC TESTS ONLY**. Not installed on `TrendosShop`, not a running agent, not a remote ChatGPT execution capability.

## Why this is separate from Cloudflare

TrendOS's qualified production orders/API/D1 and the EasyStore finance authority stay where they are. This small future Ubuntu component would only be a **local, bounded diagnostic bridge**. It does not migrate or replace Cloudflare Workers/D1 and has no print or customer-data rights. The documented Windows portable Print Server V0.2 is a different component, and must not be installed or run against Win7 originals without separate authorization.

## Implemented now (source contract)

- `policy.py` is Python 3.12-compatible standard-library code containing a **pure** `qualify_plan(...)` function. It is deliberately **not runnable as a server** and has no host command execution implementation.
- The exact v1 request schema only accepts `schema`, `operation`, `commit`, `request_id`, `args: {}`. Only `python_version`, `git_head` and `git_status` are candidate diagnostic **names**, not functions that actually run.
- No arbitrary commands, paths, arguments, environment variables, package installs, shell, network listener, secrets, SSH, sudo, API writes or client-file operations are accepted.
- Local owner gate, non-root and isolated-host assertions must all be explicitly true, and the requested 40-character Git commit must match an independently supplied pin **even for a PLAN_ONLY response**. All defaults deny.
- Even with all booleans true, the result is `PLAN_ONLY / NO_EXECUTOR_IMPLEMENTED`. These input flags are **not cryptographic evidence**. This Python function is not itself an authorization boundary.
- Policy responses are bounded result codes, never echo job data, tokens or identifiers. A source-level test checks no subprocess/network/system-call imports are added to the policy.
- GitHub-hosted ephemeral CI tests synthetic inputs with Python standard library; no production credentials, D1, printshop/Ubuntu network, external job dispatch or self-hosted runner.

## Threat model and mandatory gates before any local deployment

1. **Public repository adversary:** do not register a persistent self-hosted GitHub Actions runner on this working printshop iMac. Untrusted public PR or compromised workflow must not obtain host command execution or secrets. Hosted CI remains preferred for repo tests.
2. **Identity and authorization:** design a verifiable offline/online request authentication scheme with replay protection, expiry, pinned reviewed commit, explicit owner approval for side effects and audit provenance. `owner_gate=True` is just a synthetic fixture; never use it as real approval.
3. **OS isolation:** owner-approved dedicated locked-down non-root identity, no sudo/no docker socket, read-only code mount, explicit per-path allowlist, no Win7/production/SSH key/customer original mounts, bounded CPU/memory/disk/process/time, no ambient inherited credentials.
4. **Network isolation:** default no listener / no inbound exposure / no SSH internet / no port-forwarding. Outbound-only authenticated polling over an approved channel is a *proposal*, not authorized or built here. Keep NetBird ACLs OFF until separately reviewed.
5. **Fixed operations only:** one audited implementation per immutable operation ID, no shell, no eval, no arbitrary user-chosen paths/args, no untrusted repository hooks; fixed paths and executables subject to on-host verification. No operator write, CI workflow runner enrollment, Cloudflare deploy, D1 mutation, printer dispatch or filesystem transfer.
6. **Operational discipline:** append-only redacted run receipts, bounded retention, tamper-aware audit, user-facing kill switch, offline failure mode, code review + non-production canary, deny/replay/timeout/hijack tests, rollback and explicit owner go/no-go.
7. **Location boundary:** current Ubuntu iMac is at home, so it cannot be assumed on the Windows7 printshop LAN. Preserve original leaf exactly `D:\\print\\الشغل\\10-2026\\Tooday\\10-10`; no modification, scanning or copying.
8. **No installation by repository changes:** this design has no OS service, no systemd unit, no NetBird join, no package installation, no developer token and no private environment access.

## Acceptance and proof separation

- Source present in feature PR = `REPO_ONLY`.
- Synthetic policy tests passing under hosted CI = `TESTED_SYNTHETIC`, **not** a safe deployed system.
- Permission/security review, physical host deployment and trusted owner-run health proof = `PENDING`.
- Real assistant-to-Ubuntu trusted command channel = `NOT_ESTABLISHED`.

**Next decision gate:** review authenticated local agent *transport* and OS-sandbox plan without enabling anything; the first real execution of a diagnostic must be approved separately after threat-model closure. Never auto-activate because CI passes.
