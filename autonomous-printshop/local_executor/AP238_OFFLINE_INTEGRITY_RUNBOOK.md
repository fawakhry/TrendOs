# AP-238 — Fixed offline source integrity canary / owner runbook (NOT INSTALLED)

**Evidence level:** SOURCE-ONLY, hosted synthetic tests. This is **not** an iMac app installation, an approved shell channel, an authenticated artifact signature, a persistent service, a real kill switch or an owner-approved host command.

## Scope and immutable allowlist

Exactly five existing Python source artifacts from AP-233–AP-237, in `autonomous-printshop/local_executor/`, are pinned by **SHA-256 and byte length**:
`policy.py`, `authorization_contract.py`, `receipt_journal.py`, `trust_boundary.py`, `offline_canary.py`.

`AP238_SOURCE_MANIFEST.json` pins those bytes and records historical snapshot source commit `3ee1f5b0a01102f53b8f56a355921ea1808616ac`. This is a historical source snapshot, **NOT** a claim that the latest GitHub HEAD or the owner's Ubuntu checkout equals that source commit.

`offline_integrity_check.py` has a duplicate embedded digest allowlist. In a fixed directory it reads **only** those five named code files and its fixed JSON manifest. A normal CLI call accepts **no arguments**, uses Python 3 standard library and outputs a bounded result: `SOURCE_HASHES_MATCH_ONLY` or `BLOCKED`, accompanied by explicit `HOST_ATTESTED=NO; EXECUTOR=OFF`. Unexpected/missing/altered files, invalid/doubled/expanded manifest, bad sizes, symlinks, nonregular files, unsupported O_NOFOLLOW, or path injection are rejected. Reads use Linux O_NOFOLLOW and fstat plus size bounds; no script subprocess, systemctl, Git pull, NetBird enrollment, SSH listener, package installer, API, local network or customer-file access.

The manifest + embedded values are **NOT cryptographically authenticated independently**. An attacker able to rewrite both can forge a pass. Even byte-perfect input does not prove the identity/security of the Ubuntu host, true owner consent, path ownership or any production safety property; parent-directory replacement and host attacker/rollback threats are not resolved.

## Owner-facing runbook — PREPARED BUT **NOT AUTHORIZED TO EXECUTE YET**

**Current operational fact:** at AP-229 the owner screenshot showed Ubuntu checkout on branch `feature/ap155-imac-ssh-service-absent-owner-install-20261012` with local HEAD `113a3f7a756d1d9536a7c26c024d8fff41a7c8a9`, while GitHub documentation/code commits have advanced. Do not assume this static checker exists on that local checkout. No automated transfer or Git update has been approved.

Proposed **future** sequence, each independent approval/screenshot:
1. Owner and assistant independently verify PR #95 current HEAD, reviewed commit, file manifest hashes and the exact intended host. Pin a reviewed **GitHub commit** and verify its source lineage; do not trust copied chat text as independent signature. The manifest hashes only identify five code files.
2. If the owner separately authorizes a bounded Git fetch/check of the already-existing local repository, first review current worktree/upstream and choose a non-destructive fetch strategy. No `git pull`/reset/reclone as a surprise. Do not install a service or run a runner.
3. Only after the checker is present in a reviewed checkout, obtain separate specific permission for exactly **one read-only source check**: `python3 -B autonomous-printshop/local_executor/offline_integrity_check.py` from `$HOME/TrendOs`. No `sudo`, arguments, environment tokens, `pip`, or Node. On mismatch STOP; do not auto-fix, install or update. Screenshot the bounded code only. **THIS COMMAND IS FOR FUTURE REVIEW ONLY, NOT AN INSTRUCTION TO RUN NOW.**
4. On any failure, remain OFF: no service was started, so rollback is simply to stop and leave host unchanged. Any actual network agent, authentic approval service, OS sandbox, reboot/power-loss safety and physical stop switch remain independent owner-approved projects.

## Test-only acceptance

- GitHub-hosted CI with Python 3.12 runs the checker against actual tracked source (never customer data), and copies the six static files into **synthetic temporary fixtures** for tamper/failure tests. The actual hosted script may read its own checked-out five local code files, but not any business files.
- Passing SHA-256/size checks means `SOURCE_HASHES_MATCH_ONLY`; it **does not** imply `SAFE_TO_EXECUTE` or `HOST_READY`.
- No secrets/Cloudflare tokens/D1/Production/Win7/print data included in CI, manifest, logs or runtime.
- PR #95 remains DRAFT/UNMERGED; no deployed Ubuntu runtime, NetBird, network endpoint or host automation built.

**Next recommended AP-239:** a scoped **owner approval gate** for one safe non-destructive read-only host verification / transfer plan, if and only if the owner explicitly consents. In parallel, GitHub-only threat model for independent artifact verification and actual restricted host agent remains work to do. No arbitrary remote execution.
