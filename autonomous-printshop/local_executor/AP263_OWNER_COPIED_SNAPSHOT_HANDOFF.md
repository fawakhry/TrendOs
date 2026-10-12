# AP-263 — Offline, owner-carried AP-260 snapshot handoff (GitHub-only)

**Scope:** deterministic **source-only** verifier of owner-copied AP-260 JSON text; a practical, safe check for manually transferred diagnostic output. This is **not** a ChatGPT-to-Ubuntu connection, host identity proof, an authentication scheme, job dispatcher, installation, automated polling service or a permission to print.

## Reuse, don't duplicate

- **AP-260** `offline_snapshot.py` is the already owner-tested source of fixed, redacted snapshot fields, including explicit `untracked_files=NOT_SCANNED`. AP-262 on Ubuntu proved a one-shot snapshot can be obtained manually; nothing new needs to run there for AP-263.
- **AP-233** `policy.py` and **AP-236** `trust_boundary.py` already define the immutable *candidate* operation IDs (`python_version`, `git_head`, `git_status`) and always-blocked execution gates. AP-263 introduces **no additional operation ID, execution adapter, shell or command policy**.
- **AP-234** signed-review contract, **AP-235** synthetic receipt journal, **AP-237** simulated stop latch and **AP-238** static source integrity checker stay in their existing files; AP-263 does **not** reimplement a signature, token, agent, replay store, audit trail, sandbox or kill switch.

## Function and strict data boundary

`offline_snapshot_handoff.review_owner_copied_snapshot(text, expected_head=..., expected_branch=...)` is a pure Python 3.12 stdlib function; **no CLI, files, subprocess, OS calls or network**. It only evaluates a *separately copied* single-line ASCII JSON string, <=1024 bytes, exactly matching AP-260 v1 nine named string fields. It rejects unexpected/missing/duplicate keys, nonstandard JSON constants, unexpected runtime/production flags, malformed values, extra secrets, changed commit/branch versus caller-supplied pins, and malformed/oversize text. The caller must obtain the independently reviewed branch/commit from trusted workflow context; neither a copied JSON value nor an argument supplied by an untrusted caller proves the source is genuine.

For matching metadata, it produces a bounded `REVIEW_ONLY` or `OWNER_ATTENTION` assessment (depending on the **reported** tracked changes), a SHA-256 fingerprint of canonical JSON for comparison, and the explicitly false flags `host_attested=false`, `execution_authorized=false`, `remote_channel_established=false`, `untracked_files_scanned=false`. No raw input paths/tokens are echoed. The fingerprint is **not** a MAC, signature, provenance proof, nonce/replay check, independent file integrity check or verified audit log. `REVIEW_ONLY` is not `APPROVED`, `RUN` or `CONNECTED`.

## Acceptance and next genuinely operational gate

- GitHub **hosted runner only**, synthetic fixed JSON fixtures and Python stdlib tests. Review associated workflow execution before reporting PASS.
- **Ubuntu untouched**. No new Ubuntu command, Git update, SSH, firewall, NetBird, Win7, production printer, Cloudflare/D1 or finance action is required or permitted by AP-263.
- Until independently implemented and approved: device identity/key revocation, owner authentication, durable anti-replay/tamper-aware audit, rootless OS sandbox with no customer/printer mounts, outbound authenticated transport, and an owner-operated real stop/rollback test are all **BLOCKED**. AP-262 is a local evidence success, not a remote control connection.
- **Next decision point:** agree architecture and threat model for a *future* owner-approved offline-to-outbound diagnostic bridge before adding any listener, service, key, credential, real transport or installer. The owner must separately consent to any physical Ubuntu or network change.
