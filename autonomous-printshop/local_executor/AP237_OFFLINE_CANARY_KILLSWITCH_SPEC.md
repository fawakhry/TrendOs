# AP-237 — Offline canary / emergency-stop specification (SOURCE ONLY)

**Status: SPECIFICATION + SYNTHETIC TESTS.** Nothing is installed or running on the owner's Ubuntu iMac `TrendosShop`. This document does NOT claim a real kill switch, emergency stop button, host sandbox, owner approval service, network connection or remote execution channel.

## What was implemented

- `autonomous-printshop/local_executor/offline_canary.py`: a pure Python 3.12, standard-library **hypothetical** canary state machine. It has **no filesystem, network, subprocess, OS account, service, mount or production interfaces**.
- It accepts only `OFFLINE_REVIEW` and `EMERGENCY_STOP` events in synthetic test fixtures. The only recognized source states are `SPEC_OFF`, `SPEC_REVIEW_BLOCKED` and `SPEC_STOP_LATCHED`. Unknown states or events fail closed. No ACTIVE/RUN/READY event or output exists.
- The simulated stop event returns `SPEC_STOP_LATCHED`; it stays latched when synthetic review is requested again, and a reset/rearm operation has intentionally **not** been built.
- The ten frozen readiness gate names start with the seven independent AP-236 unresolved security gates and add bounded output/privacy, physical iMac identification, and owner-operated stop/rollback verification. **Even if every caller-supplied Boolean is true, the result remains BLOCKED** (`ALL_CLAIMS_UNVERIFIED_AND_NO_RUNTIME`). Caller Boolean flags are not real device attestation, verified approval, or a runtime control channel.
- Receipts are frozen dataclasses with bounded reason codes and `host_effect=NONE`. `EMERGENCY_STOP` changes nothing on Ubuntu; it is solely a code-level model. Tests must not claim otherwise.

## Required real-world steps — NOT authorized or executed

1. Establish device identity with owner-controlled independent verification; distinguish HOME Ubuntu iMac from a machine on the physical printshop LAN.
2. Engineer an OS sandbox: non-root dedicated account, no root/sudo/dockersock, no Windows7 customer file mounts, read-only app source, no printer rights, bounded CPU/memory/process time and strictly redacted output. Verify on host under a separately approved pilot.
3. Supply independently authenticated and revocable owner approval, signed scoped jobs, durable replay and tamper-aware audit. AP-233 to AP-236 Python sources explicitly do not provide this.
4. Choose owner-approved outbound-only authenticated transport and design a **real** kill switch independent of the process it stops. `SPEC_STOP_LATCHED` in this model cannot stop a daemon, reset a service, isolate a host or revoke a credential.
5. Test physical STOP, reboot, credential revocation, process crash, network loss, disk-full, power loss, recovery and rollback with human authorization and sanitized synthetic data, before considering any live command, even read-only. Fail closed on missing evidence.
6. Provide a single explicit owner-approved go/no-go for a **non-production, read-only local canary** with a precise runbook and rollback; do not infer consent from `go` during source-only AP phases.

## Strict red lines

- No persistent GitHub self-hosted runner registration on the shared Ubuntu iMac in this PUBLIC repo; untrusted PR code must never gain host access.
- No NetBird enrollment/ACL activation, Internet-facing SSH, router forwarding, firewall change, customer copies, Windows7 printer drivers, printer dispatch, EasyStore accounting, or Cloudflare/D1 Production writes. Maintain original shop path exactly as owned: `D:\\print\\الشغل\\10-2026\\Tooday\\10-10`; do not scan or mount it.
- No `apt`, Node install, Git pull/reset or host service activation is part of this stage.
- GitHub-hosted synthetic tests do not attest the physical iMac.

## AP-237 acceptance

- Source-only policy and dedicated unit tests committed to the specified feature branch and PR #95 remains DRAFT/UNMERGED.
- Python 3.12 GitHub-hosted test job passes, with zero secrets/Production/D1/Windows7 host interactions.
- No systemd file, executable agent, authentication transport or host install added.
- The honest next gap is **not more claims of access**; it is an owner-scoped plan for one safe local evidence/identity/isolation canary and its explicit rollback, while separate engineering of real trusted authorization remains BLOCKED.

**AP-238 candidate:** prepare a narrowly scoped, human-reviewable **offline host canary runbook and static artifact integrity bundle** using existing Python stdlib, verified via hosted tests; keep install/host execution OFF pending separate owner approval. Do not promote AP-237 toy `EMERGENCY_STOP` into a real safety control.
