# AP-236 — Immutable diagnostic catalog and real trust-boundary gap review

Status: **SOURCE-ONLY / HOSTED SYNTHETIC TESTS / DEFAULT OFF**. This is not a server agent, a transport, an approved owner identity, or an operating-system sandbox. Code is a specification that cannot execute any command.

## Actual new artifacts

- `trust_boundary.py` defines three frozen, abstract `DiagnosticSpec` values in an immutable catalog: `python_version`, `git_head`, `git_status`. They describe purpose, non-privileged local scope, maximum runtime (5 s), maximum output size (128 or 1024 bytes), no network, no write, no privilege escalation, and no shell. They contain **no executable paths, shell commands or user-supplied file paths**.
- The stable SHA-256 `catalog_digest()` identifies exactly those abstract specifications for code-review reproducibility; a digest is **not** a signature or authority.
- `evaluate_review_handoff(plan, signed_review_verdict, recorded_review_verdict, ...)` strictly compares AP-233 plan shape, AP-234 REVIEW_ONLY result and AP-235 RECORDED_REVIEW_ONLY result. Malformed or mismatching inputs = DENY. Even valid simulated inputs = **BLOCKED / INDEPENDENT_TRUST_AND_SANDBOX_NOT_IMPLEMENTED**, never RUN. No actual command implementation, I/O or authorization.
- Hosted Python 3.12 unit tests cover catalog immutability, absence of command launch/import primitives, exact cross-stage AP-233/234/235 operation parity, payload spoofing, untrusted input rejection, non-leaking output, default OFF, and inability to convert synthetic review receipts into permission to execute.

## Security boundary and missing independent evidence

| Area | Source model | Real requirement before host pilot | Status |
|---|---|---|---|
| Owner approval | AP-234 sample HMAC receipt | owner identity verified via independent trusted channel, scoped consent, expiry, revocation, key rotation | BLOCKED |
| Agent/device identity | `TrendosShop` string is not authentication | separately verified device key and binding, trustworthy attestation, non-exportable secret policy | BLOCKED |
| Consume-once replay/audit | AP-235 synthetic temp SQLite | tamper-aware durable atomic log, journal backup/recovery, tampering/replay/power-loss threat assessment | BLOCKED |
| Command catalog | AP-236 frozen abstract specs | independently audited fixed binaries/paths, code provenance and executable pin, no dynamic command strings | BLOCKED |
| OS sandbox | none | dedicated restricted non-root user, no sudo/dockersock, read-only code, restricted file mount and syscalls, time/output/resource limits | BLOCKED |
| Output minimization | synthetic specification only | redact Git status filenames before upload, block customer or sensitive names, encrypted bounded receipts | BLOCKED |
| Transport | none | owner-approved outbound-only mutually authenticated polling, no inbound listener or exposed SSH/WAN | BLOCKED |
| Kill switch and recovery | none | owner-controlled explicit OFF toggle, expiry, rollback and audit retention | BLOCKED |

## Hard deployment stop conditions

- The iMac is located at HOME per owner evidence, not yet on the printshop Windows 7 LAN. Do not infer access to printer hardware or customer source files. Preserve the literal Windows print directory `D:\\print\\الشغل\\10-2026\\Tooday\\10-10` unchanged and unscanned.
- No change to NetBird OFF policies, Linux SSH/UFW, router, Cloudflare Workers/D1 Production, EasyStore accounting, Windows7 drivers, printer queues, customer originals or paid service.
- Repo is PUBLIC. Do **not** install/register a persistent GitHub Actions self-hosted runner on shared shop hardware as a means of command execution. Hosted CI cannot certify a local host.
- Test booleans, simulated signing keys and synthetic review receipts do **not** provide trusted owner authorization. `AP235` `RECORDED_REVIEW_ONLY` does not cryptographically bind the returned verdict to the specific plan, and the database can be tampered/rolled back; the AP-236 function makes no authorization claim.
- Every diagnostic operation remains `UNIMPLEMENTED`. The immutable abstract catalog cannot authorize even the three read-only commands until the missing independent gates are closed and owner explicitly approves a limited pilot.

## Verification gates

- GitHub commit verified: source availability only.
- Hosted CI passed: synthetic protocol and invariants only.
- Ubuntu service installed/running: **NO**.
- Authentic owner approval verified in runtime: **NO**.
- Trusted remote execution channel established: **NO**.
- Side-effectful production/client operations authorized: **NO**.

**Next candidate AP-237:** GitHub-only design for an owner-operated *offline canary and rollback/kill-switch* that reports exactly its isolation/identity prerequisites, without installing a service or activating remote connectivity. The next real host change requires one explicit owner-reviewed scoped step. This doc is not a blanket instruction to enable local automation.
