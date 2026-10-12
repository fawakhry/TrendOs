# AP-264 — Owner-carried offline diagnostic exchange, source-only

**Evidence level: GitHub source and hosted synthetic tests only.** No printshop Ubuntu upgrade, host runner, Agent, connected ChatGPT command channel, active listener, scheduled polling, authentication identity, trusted clock, signing keys, persistent audit or production integration exists or is authorized by this change.

## Practical milestone and scope

AP-262 proved, through direct owner Ubuntu terminal screenshot, that AP-260's snapshot runs locally and reports the expected HEAD/branch with `tracked_changes=NO` and `untracked_files=NOT_SCANNED`. AP-263 added pure deterministic JSON content validation. **AP-264 adds the next isolated protocol building block:** a strictly validated *paired request and response*, suitable for a future manually mediated/offline diagnostic handoff. This provides useful correlation logic without making claims of authenticity.

Code: `local_executor/offline_exchange_review.py`. It is a pure stdlib function with **no CLI, files, subprocess, printing, OS commands, HTTP, network, tokens, dependencies or side effects**:
`review_offline_exchange(request_text, response_text, expected_head=..., expected_branch=..., sample_now=..., stop_requested=False)`.

- Strict bounded (ASCII single-line JSON) request <=1536 bytes; response <=2048 bytes, exact envelope fields, duplicate-field rejection at every level, no unknown arguments, paths or remote commands.
- Request's nested `plan` reuses **AP-233's** `POLICY_SCHEMA` and exact 3 allowed *candidate* identifiers `python_version`, `git_head`, `git_status`; `args` must be `{}`. Reuses **AP-236's** immutable catalog and `catalog_digest()`; no second command registry, dispatcher or permission system.
- Matches target `TrendosShop`, strict mode `OFFLINE_OWNER_CARRIED`, independent expected source branch/commit, request ID, candidate operation and plan SHA against the response. The IDs and fingerprints are **correlation data only**, not authenticated identities or single-use tokens. Any copied/modified matching pair could be a forgery.
- Response wraps one synthetic AP-260 snapshot dict and invokes **AP-263's** `review_owner_copied_snapshot` rather than replacing its validation. A reported clean tracked tree yields `MATCHED_REVIEW_ONLY`; a reported dirty tracked tree yields `OWNER_ATTENTION`; invalid or mismatched metadata yields `DENY`.
- Bounded 300-second issuance/expiry checks use *caller supplied sample_now only*. **No trusted clock or independent expiry validation** exists. Even apparent success does not prove freshness, authorization, user/device provenance, security of the machine, host isolation, or whether a result was actually captured on Ubuntu.
- `stop_requested=True` is a local model branch returning `BLOCKED` and `SIMULATED_STOP_NO_HOST_EFFECT`. This is not the real externally operated kill switch proposed by AP-237.
- Every verdict includes `host_attested=false`, `owner_authenticated=false`, `execution_authorized=false`, `remote_channel_established=false`, `durable_replay_protection=false`, `real_stop_installed=false`; no secret/raw path is echoed. Content fingerprints use SHA-256 **without signatures** and are never durable audit receipts.

## Explicit non-goals / future real trust requirements

- AP-234 has a **synthetic-only** signed-review model. AP-235 has a **synthetic-only** receipt SQLite store. They are *not* real owner authentication, tamper evidence or installed audit, and are neither bypassed nor duplicated here.
- AP-237's stop latch is theoretical; AP-238 validates source hashes on reviewed offline files only. Neither proves real device identity, OS sandbox, signing/trust provenance or remote safety.
- An attacker can fabricate both JSON envelopes, forge the target/commit/ID and choose `sample_now`. No matter how perfect AP-264's matching result, it is **never execution authority**. This is the intended fail-closed contract.
- Future candidate architecture, **not authorized for host setup**: independent device enrollment and owner-authenticated/revocable approval; fixed reviewed read-only operations in an OS-enforced dedicated unprivileged sandbox without customer/printer/secrets mounts; outbound-only authenticated relay with narrow allowlist; durable consume-once anti-replay/tamper-aware audit; real operator STOP plus offline recovery; production-independent test canary and rollback.
- Changes to Ubuntu, installing any service/keys, live outbound/inbound links, SSH/UFW/NetBird, GitHub self-hosted runner, Print Server, real orders, EasyStore D1/Cloudflare production, Windows7 originals and merging PR #95 remain disallowed without **separate explicit owner approval**. An Ubuntu Git fetch is not needed merely because this code/doc progresses on GitHub.

## Acceptance / CI

GitHub-hosted Python 3.12 CI runs only in disposable public runner with synthetic data: validates successful correlation without grant, all existing allowed names as abstract metadata only, deny of arbitrary operations/args, request-ID and pin mismatches, exact schema/candidate digest, stale or malformed synthetic time, emergency stop state, nested duplicate fields, invalid snapshots, oversized/non-ASCII input, bounded denied output, stable content fingerprints and no network/subprocess. Verify actual GitHub Actions logs and only then mark AP-264 as hosted PASS. **There is no physical Ubuntu AP-264 test to run or request.**
