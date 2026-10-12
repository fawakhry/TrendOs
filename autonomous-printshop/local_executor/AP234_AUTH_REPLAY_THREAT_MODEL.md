# AP-234 — Signed-review and anti-replay **model** (SOURCE ONLY; NO EXECUTION)

**Status:** Hosted synthetic CI candidate only; NOT an authenticated remote command channel; NOT an Ubuntu deployment. Exact original AP-233 `policy.py` default-OFF guards are unchanged.

## What is in scope

`authorization_contract.py` is a deterministic pure Python 3.12 standard-library evaluator, not a server. It models a narrow request proposal (target `TrendosShop`, one of `python_version/git_head/git_status`, no arguments, pinned 40-byte Git SHA, short validity interval) and an independent owner *REVIEW_ONLY* receipt. It requires two distinct supplied HMAC-SHA256 keys, exact canonical JSON, tight integer timestamp/expiry checks, a supplied current time, an externally supplied nonempty-validated replay-journal snapshot and a separately supplied pinned commit. The owner receipt is cryptographically bound to the exact proposed payload.

Default call = DENY. A fully valid synthetic request returns **REVIEW_ONLY / NO_EXECUTOR_OR_DURABLE_REPLAY_STORE**, plus a synthetic replay fingerprint. Never returns RUN/EXECUTE. No shell, HTTP listener, file I/O, SSH/NetBird/GitHub runner hooks, or business-side mutations are present.

Test keys are fixed dummy bytes **only inside the unit test fixture**; the repository stores no real credentials or signing keys.

## Evidence limits (critical)

- HMAC is **symmetric**. An independent trusted issuing/approval service, role key isolation, key rotation/revocation and secure key storage are NOT built. A caller-supplied `owner_key`, `trusted_now`, `pinned_commit` or `seen_tokens` argument is NOT itself verified by the model. The labels `controller-synthetic-v1` and `owner-synthetic-v1` are demonstration labels, not credentials.
- `seen_tokens` is a **supplied in-memory snapshot**, NOT an append-only persistent replay database. A caller can lie about it or lose it across process restarts; therefore anti-replay is only a *model* and is NOT sufficient for any side-effectful action. The replay token is shown solely so synthetic tests can inject it into the next call.
- `trusted_now` is synthetic. Real clock trust/synchronization and skew tolerance need separate review. A valid signature does not authorize any filesystem, printer or production action.
- An authentic owner approval must be independently verified, narrowly scoped, auditable and revocable; string/boolean payload fields and this function are not a consent mechanism. No deploy or host runtime is authorized.
- Repo is PUBLIC; DO NOT enroll a persistent self-hosted runner on the working Ubuntu shop host. Node.js installation is not a prerequisite. Keep existing Cloudflare/D1 and EasyStore authority unchanged.

## Required next stages (not installed here)

1. Independent owner authentication + signed scope/approval receipt with revocation, expiry, separate keys, audit privacy.
2. Durable atomic consume-once replay ledger with rollback-safe timestamps and tamper-aware retention, startup default-deny if store missing.
3. OS sandbox and credentials: dedicated non-root account, no sudo/privileged sockets, immutable operation table, fixed paths, read-only repo, strict process/network limits, no printing/Windows7/customer data.
4. Transport: authenticated outbound-only proposal and response channel only after owner approval; no incoming SSH/WAN/router port forwarding; NetBird policy OFF until separate authorization.
5. Negative testing for expiry, replay, wrong identity, signature stripping, key compromise/revocation, link outage, reboot, disk-full, log leaks, malicious PR, OS account escape and kill-switch recovery.
6. Runtime canary must require explicit owner-approved change after every gate passes. Until then, **NO REAL EXECUTOR AND NO CHATGPT SHELL ACCESS**.

## Acceptance

- Code and tests committed on feature PR: SOURCE_ONLY.
- Hosted Python unittest PASS: SYNTHETIC VERIFIED; not an authorization to run.
- Ubuntu installer/service: NONE.
- Cloudflare/Production/D1/Windows7/printer/customer-file change: NONE.

**Next step AP-235 candidate:** source-only durable receipt/store design, adversarial crash/replay tests using synthetic temporary storage in hosted CI, without opening a network listener or deploying anything.
