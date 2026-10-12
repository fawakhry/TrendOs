# AP-265 — Rootless diagnostic bridge architecture and OFFLINE pilot boundary

**State: GitHub source / hosted synthetic only. Zero host installation, zero network channel.** The AP-265 JSON profile is a *declarative restricted target*, **NOT** a systemd service, sandbox, executable policy, consent form or proof of current Ubuntu configuration. Passing its structural test establishes source consistency only.

## Why this is different from AP-233–AP-264

AP-233 / AP-236 already define the **only three immutable candidate operation IDs** and a blocked, nonexecutable trust model. AP-234 models signatures, AP-235 models a receipt journal, AP-237 models a stop latch, AP-238 checks source bytes, and AP-260 (owner-tested in AP-262) produces a fixed local read-only diagnostic snapshot. AP-263 / AP-264 validate owner-carried results and request/response metadata **without authenticating** them.

The remaining engineering gap is **independent OS-enforced sandboxing, physical device provenance, independently authenticated owner approval, durable non-replay audit, and actual controlled transport/stop**. AP-265 does not duplicate any signature, request/response envelope, journal, dispatcher or transport. It creates a concrete, machine-checkable **least-privilege host boundary specification** to catch accidental permission broadening during future architecture reviews.

## Deliverables — source-only

1. `AP265_OFFLINE_HOST_BOUNDARY_PROFILE.json` — exact reviewed, disabled, HOME Ubuntu `TrendosShop` profile. Target `HOME_UBUNTU_OFFLINE_SYNTHETIC`, `deployment=NOT_INSTALLED`, `transport=OFF`, `approval=NOT_GRANTED`, three abstract candidate operations. Strict sandbox intentions: dedicated non-root identity; no sudo, shell, owner home, customer or Windows7 mounts, financial files, host secrets, CUPS/printers, inbound or outbound traffic during OFFLINE canary; separately staged pinned read-only source view; bounded private future audit, CPU/memory/process/time caps, owner STOP not implemented; no auto restart or pilot execution.
2. `host_boundary_profile.py` — pure Python 3.12, **no CLI or host I/O**, validates single-line ASCII JSON (<=4096 bytes), duplicate fields denied, exact deep equality against the reviewed restricted profile, and rejects any change to the AP-233 and AP-236 three-operation candidate catalog. Even an exact match returns only `BLOCKED/SPEC_MATCH_ONLY_REAL_HOST_GATES_MISSING` with every authority, deployment, identity and stop indicator false. Its SHA-256 is an unauthenticated content fingerprint, not a signature.
3. `tests/test_ap265_host_boundary_profile.py` and a dedicated GitHub-hosted synthetic workflow. Tampered privilege, sudo, network, home/customer/printer/finance/secrets access, operation expansion, missing trusted gates, false approval, invalid/duplicate JSON and other attempts must DENY. No host deployment is part of CI.

## Proposed implementation architecture — NOT approved to activate

**Design preference, subject to explicit owner review:** outbound-only authenticated HTTPS polling by an isolated, owner-enrolled metadata-only component, *after* qualifying an offline manual canary. No Internet-facing SSH, port-forwarding or NetBird ACL changes. Do **not** use a GitHub self-hosted runner on this public repository or treat GitHub Actions as owner-host execution authority. A relay provider/service, any pricing, credentials and enrollment method remain UNSELECTED.

1. **Physical device enrollment (independent gate):** distinguish `TrendosShop` home Ubuntu from the shop's Windows7 LAN. The owner physically verifies device identity and source provenance; a device-specific public-key identity is bound to an owner-controlled approval record out of band. Require revocation and key rotation. Never commit private keys/tokens, never infer identity from hostname, chat, a Git SHA, screenshot text or arbitrary fixture.
2. **OS enforcement (independent gate):** an owner-reviewed one-time **offline pilot** would use a genuinely isolated dedicated unprivileged UID with no sudo, no printer group, no Docker socket, no inherited tokens or unrelated home directories, read-only sanitized/pinned source metadata view, system-level file/device policy and CPU/memory/pids/time caps. The original `$HOME/TrendOs` checkout cannot simply be mounted wholesale without first proving it contains no tracked or nested customer/secret files; Git status can inspect tracked bytes. Never mount customer folders, print queues, `/var/spool/cups`, originals or EasyStore finance into this sandbox. A future source-only spec or `systemd` security directive is **not** proof that sandboxing is actually active; verify on the owner machine with separate consent and negative access tests.
3. **Owner authorization (independent gate):** signed narrowly scoped one-shot read-only metadata requests, exact reviewed operation/catalog version, device public key, bounded time window and unique request nonce; owner must approve a specific scope using an independent trusted channel. AP-234 test HMACs and boolean fixtures are NOT owner identity proof. Failure to verify anything => NO execution.
4. **Transport (independent gate):** only after consent and offline pilot, initiate TLS-authenticated **outbound-only** polling to a named reviewed relay. No inbound listeners, public SSH, blanket file upload, secret export, browser automation on customer apps, Cloudflare Production/D1 or printer access. Explicit allowlist of structured metadata response fields; deny unknown requests, args, paths, code, shell, credentials and write verbs. Block requests when the link is absent, stale, revoked or malformed.
5. **Consume-once audit (independent gate):** atomic durable nonce reservation and tamper-aware redacted receipts bound to exact signed request, device key, authorization decision and result fingerprint; corruption/disk-full/restart/replay -> default deny. AP-235 synthetic SQLite alone is neither cryptographically tamper-aware nor a real permission service. Never expose raw customer pathnames or data.
6. **Emergency OFF (independent gate):** local owner-controllable STOP independent of relay/worker; disabled on startup and after crash/reboot until fresh, explicit approval. Destroy/revoke transport authority and prove process exit; simulate revoked key, relay outage, replay, malformed request, disk-full, power cut and restart using artificial data only. AP-237 simulated `SPEC_STOP_LATCHED` has NO host effect.
7. **Trust chain:** locally approved source pin -> genuine device enrollment -> OS isolation verification -> per-operation independent approval -> durable anti-replay reserve -> bounded execution in vetted fixed code -> redacted signed/auditable output -> owner STOP/revocation. The failure of ANY link keeps both execution and transport OFF.

## Threat analysis and evidence limits

| Threat | Safe design response | Still missing |
|---|---|---|
| Public PR workflow commandeering host | hosted-only CI, no self-hosted runner | owner-controlled physical deployment approval |
| Malicious or replayed request | independent signatures, expiry, nonce, durable store | no real keys/store/clock/verification |
| Identity spoof via hostname or screenshot | enrollment fingerprint + independent owner proof | no physical cryptographic attestation |
| User home or printer/finance access | non-root service + read-only sanitized metadata view + explicit device/mount denial | no real OS sandbox or negative host tests |
| Arbitrary code or shell in diagnostic request | AP-233/236 only 3 abstract IDs; no paths or args | fixed audited implementations and enforcement not deployed |
| Loss of network / relayed STOP failure | local physical OFF + revoke, default OFF on reboot | no real kill switch/service to test |
| Audit corruption/disk-full | fail-closed durable consume-once transactions + tamper-aware chain | synthetic journal only |
| Fake CI green = production-ready | runtime evidence stricter than source/hosted CI | actual owner-approved offline and online canaries |

## Future acceptance gates and explicit permission boundaries

**A. Now:** source-only manifests, contract tests, threat model on GitHub. Never update Ubuntu just for documentation; last physical Ubuntu evidence is AP-262 at local HEAD `a238ce5a830bc5a7968dc020cd8168c85fa8c446`. PR #95 stays DRAFT/UNMERGED.

**B. Separate owner authorization required:** physical identity/isolation inventory for `TrendosShop` that reads *only* agreed OS metadata, not customer/print/finance files. Ask for ONE owner-approved Ubuntu command then wait for screenshot. No automatic host update.

**C. Separate owner authorization required:** offline, non-networked, isolated proof-of-denial canary with dedicated rootless scope, negative access tests, STOP and rollback on synthetic data. Require full review before any installer or OS settings.

**D. Separate owner authorization required:** identity/credential creation and owner-approved outbound-only pilot, including explicit provider/cost, approved endpoints, independent owner consent, durable replay/audit, actual fixed operations and measured STOP tests. No always-on service or automatic restart without further consent.

**E. Not reached:** real ChatGPT-to-Ubuntu connection, unsupervised diagnostic execution, Print Server production readiness, real printing, Windows7 modifications and any EasyStore financial mutation. Never call AP-265 a deployment, installed sandbox, authentic approval or remote agent.

The next practical decision is whether/when the owner authorizes a **bounded physical-host metadata-only isolation inventory** to replace design assumptions with Ubuntu evidence. No command is requested by AP-265 itself.
