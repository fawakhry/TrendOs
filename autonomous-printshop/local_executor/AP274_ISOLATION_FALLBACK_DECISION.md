# AP-274 — Isolation fallback decision after owner AP-267..AP-273 evidence

**Status: GITHUB-ONLY ENGINEERING DECISION, NO PILOT AUTHORIZED.** This document does not deploy a sandbox, agent, VM, container, service, credentials, network transport, printer interface, or host command. It is an evaluation framework, not a proof of host readiness.

## Current host observations (do not re-test without new technical justification)

- **AP-262:** exact one-shot offline read-only `offline_snapshot.py --snapshot` ran successfully on owner's `TrendosShop` Ubuntu, local code HEAD `a238ce5a830bc5a7968dc020cd8168c85fa8c446`. No ChatGPT execution channel.
- **AP-266:** uid/euid 1000, CapEff nonzero NO, current shell AppArmor confined NO, NoNewPrivs 0, Seccomp 0; kernel AppArmor enabled, user namespaces sysctl 1, cgroup v2 path present, `bwrap` and `unshare` binaries present. These do not prove isolation, delegated controls or ability to create namespaces.
- **AP-267:** transient non-root bwrap sandbox probe failed `BWRAP_START_FAILED` with raw stderr suppressed.
- **AP-268:** smaller bwrap probe failed `PERMISSION_OR_SECURITY_POLICY`, a *coarse code-generated category*.
- **AP-269:** AppArmor enabled, `kernel.apparmor_restrict_unprivileged_userns=1`; `kernel.apparmor_restrict_unprivileged_unconfined=0`; `kernel.unprivileged_userns_clone=1`; `user.max_user_namespaces=26428`; bwrap regular non-SetUID file. Policy involvement plausible; exact causality unknown.
- **AP-270:** targeted kernel audit query returned `APPARMOR_DENIAL_VISIBLE=YES`, `BWRAP_DENIAL_VISIBLE=YES`, no literal `userns_create` match.
- **AP-271:** 4 bwrap-tagged AppArmor `CAPABILITY` denial **records** in bounded window; exact capname and correlation to failed child not proven. One program may generate multiple records.
- **AP-272:** same general-denial-first journal sample returned 0 target records and no capname, which cannot refute older AP-271 events.
- **AP-273:** bwrap-first `journalctl` query took `JOURNAL_ACCESS_OR_SIZE` early exit, which **combines** nonzero subprocess return and output >65536 bytes. It does not establish which cause occurred. No successful bwrap sandbox has ever been verified.

### Hard stop for repeated diagnostics

No loop of ever-wider `journalctl` scans, no speculative sysctl/AppArmor disable, `sudo bwrap`, setting executable SetUID, `chmod`, direct Docker socket use, containers sharing customer files, GitHub self-hosted runner, SSH exposure or unrestricted systemd service. Neither weak shell tests nor green hosted CI can substitute for an independently verified OS boundary.

## Decision options (evaluation only)

| Option | Benefit | Important limitation / new approvals | Disposition |
|---|---|---|---|
| A. Keep existing manual AP-260 snapshot and owner-carried AP-263/264 validators | Already has real owner-host screenshot; requires no new service, network or filesystem privileges | Manual transfer, no remotely automated diagnosis; copied JSON is unauthenticated | **SAFE FALLBACK NOW** |
| B. Bubblewrap with an independently reviewed, minimum AppArmor profile | Potentially narrow in-host sandbox without VM | Namespace/profile operation causes not established; profile provisioning/alteration requires privileged host change, custom rule review and negative runtime tests; never disable global protection | **BLOCKED; do not trial blindly** |
| C. User-level systemd isolation with future fixed read-only diagnostics | Supports resource/service policies conceptually | Some filesystem namespacing/hardening flags in user managers may be unavailable or rely on similar unprivileged namespaces; user service alone is not a privacy boundary; must verify each restriction on owner host | **UNQUALIFIED; design only** |
| D. Dedicated rootless OS account + strict DAC/ACL, limited fixed metadata files | Simple access separation for a non-production canary | Unprivileged UID is insufficient if host groups, mounts, broader ACLs, network or printer devices accessible; provisioning/config changes require owner consent and negative access tests | **UNQUALIFIED; never claim complete containment** |
| E. Disposable offline VM on home Ubuntu or distinct non-production computer | Stronger hardware/guest boundary for untrusted experiments, avoids relying on blocked host unprivileged bwrap route; easy to discard test VM once isolated | Hardware virtualization/support and resources unknown; hypervisor/VM installation, disk use, image provenance, clipboard/shared-folder/USB/network defaults and cost must be separately reviewed and owner-approved; VM escape/host risks still exist | **PREFERRED FUTURE CANARY *CANDIDATE*, NOT AUTHORIZED** |

**Why offline VM is the leading *candidate* rather than a decision to deploy it:** it avoids requiring weakened AppArmor rules for the blocked in-host `bwrap` path and can keep the original printshop and accounts outside the guest. It is not automatically safer if shared folders, clipboard, printers, host sockets, USB passthrough or network are enabled. A guest login and ordinary Python installation is not a remote ChatGPT execution channel.

## Concrete, minimal, reversible acceptance gates

1. **Owner selects an option explicitly.** Present costs and exact host change commands *before* consent. No mandatory purchase or third-party paid provider.
2. **Host readiness review** (only when separately approved): for a VM, limited read-only metadata of available virtualization support, storage/RAM budget and installed hypervisor; no `apt`, `modprobe`, disk partition, privileged launch or network changes. If a separate device is selected, review its provenance and isolation without touching shop originals.
3. **Disposable offline pilot** (separate explicit approval): one fixed synthetic metadata result, no customer/printer/financial/source-data mounts, no network interface/transport, no shared clipboard, no credentials, no host home path; checked source pin and hard memory/CPU/disk caps. Empty guest snapshot/rollback documented before launch.
4. **Negative proofs** on that actual runtime (not merely source design): verify it cannot access owner-home/customer/Win7 originals, print sockets/groups, cloud keys, EasyStore, LAN, API credentials or outbound/inbound network; verify its process and all descendants terminate and rollback leaves no persistent service.
5. **Real identity/approval/transport only *after* offline pilot:** independently scoped, revocable owner and device identity; immutable candidate metadata diagnostics from AP-233/236; durable consume-once audit (AP-235 only synthetic), real local STOP (AP-237 only spec), owner-approved fixed outbound authenticated route/provider/cost and loss-of-network failure tests. No self-hosted GitHub Actions runner.
6. **No promotion to production without measured host proof:** hosted Python tests and owner-copied read-only receipts do not qualify live Print Server, Windows7, print spool or actual shop production. PR #95 stays DRAFT/UNMERGED until explicit owner review and approval.

## Owner decision requested before host work

**Default:** continue current read-only manual snapshot and GitHub-hosted coding while leaving all blocked host features OFF. If owner approves a next *physical* step, propose a separate **one-command, read-only VM feasibility inventory**; do not run it merely because this document exists. Ask whether owner prefers an offline VM on `TrendosShop` or a dedicated non-production machine, taking available hardware and operational simplicity into account.

**GitHub test evidence:** this is a design review, not a running test. No claims of PASS on Ubuntu isolation, installed hypervisor, trusted identity, replay-proof bridge or remote controller.
