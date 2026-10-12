# Autonomous Printshop — Signed fictional Ubuntu diagnostic evidence V1 (NO_GO)

**2026-10-12 | Code/replay test ONLY — no real Ubuntu integration**

## Source lineage

Source-only [Draft PR #122](https://github.com/fawakhry/TrendOs/pull/122) is stacked on corrected shared-base Printshop [Draft #121](https://github.com/fawakhry/TrendOs/pull/121), rather than superseded/closed wrong-base PR #120. All are kept unmerged; no deployment. This V1 builds on the already qualified pure `autonomous-printshop/core/ubuntu-offline-diagnostic-envelope-v0.mjs`, existing Printshop autonomy/Operator Task modules and the canonical `autonomous-printshop/MASTER_BOOK.md` history.

## Exact implementation boundary

`core/ubuntu-signed-mock-evidence-v1.mjs` offers a **pure asynchronous verifier** for *fictional fixtures only*. It expects:

- Strict, limited, fixed-field synthetic envelope: `PRINTSHOP_UBUNTU_SIGNED_MOCK_V1` / `SYNTHETIC_SIGNED_TEST_FIXTURE` / `OFFLINE_NO_HOST`, FAKE device + key IDs, safe integer monotonic sequence, issued/expiry timestamps, the V0 synthetic status snapshot and detached base64url Ed25519 signature.
- **Verify-only** WebCrypto Ed25519 public `CryptoKey` and independent **fictional** trust scope supplied by caller: expected device and key ID, last accepted sequence and injected mock clock; no in-band public keys or private keys.
- Explicit canonical signing message and domain separation string; a copied envelope cannot silently alter its signed fields. Signed but structurally-invalid, expired, future, inconsistent-timestamp or duplicate sequence reports fail closed; bounded message size. Positive cryptographic outcome is still `SYNTHETIC_SIGNATURE_VERIFIED_REVIEW_ONLY`.
- **Always** returns `NO_GO`, `realUbuntuConnected=false`, `realPrinterConnected=false`, `executeUbuntuAllowed=false`, `sendPrintJobAllowed=false`, `canUpdateAccountingOrStock=false`. No network/SSH, Linux services, USB device, CUPS/Print Server, real ledger, file reads, credentials, host identifiers or Cloudflare actions.
- Node test fixtures generate **throwaway ephemeral signing keys in test memory**; none are saved, committed, transmitted to a host, or treated as production identities. Existing no-credential PR CI runs the signer/verification negative tests on synthetic data.

## What this does NOT secure yet

**Important:** This mock demonstrates signed-message parsing and negative cases only. It **does NOT implement** real Ubuntu host identity, key provisioning/rotation/revocation, trusted key storage, pinned independent verifier code, mutually authenticated transport, a server endpoint, persistence or atomicity of replay sequences across processes, data signing by a host collector, clock synchronization, durable audit log, safe device discovery, real machine-state observation or any OS command/printing authority.

In particular, `lastSequence` is supplied by the fake caller, not backed by a trusted atomic database. Two independently checked copies of the same message might both pass if a real integration failed to persist the counter. **Never claim this is production replay protection.**

A true deployment design must independently select authenticated provisioning, scoped signing/key verification, short-lived reports with redacted data, persistent monotonic anti-replay with atomic updates, observer read-only permissions and detached operator-owner control. No real integration should be wired until its independent security/privacy review, Ubuntu baseline and machine-hardware readiness are separately approved.

## Source-only proof and gates

At PR #122 initial source head `6dabcb7bf494cf4d4a60b61954fc74568ad825ef`, [GitHub Actions #38290291877](https://github.com/fawakhry/TrendOs/actions/runs/38290291877) **SUCCESS**, including **35/35 new Ed25519 mock tests**, **52/52 V0 synthetic service diagnostics tests**, and **1/1 existing autonomy policy test**. These are **88 source tests** on a fictional dataset, not physical production QA. Updating this document creates a new PR head needing fresh exact-head CI.

`UBUNTU_ED25519_REAL_DEVICE_KEYS=NOT_CREATED`  
`UBUNTU_DEVICE_COLLECTOR=NOT_CREATED`  
`UBUNTU_BRIDGE=NOT_CONNECTED`  
`PRINT_SERVER_PRODUCTION_READY=NOT_VERIFIED`  
`PRINTSHOP_LOCAL_EXECUTION_ALLOWED=NO`  
`FINANCE_RELEASE=NO_GO`  
`G1=OPEN G2=OPEN G3=OPEN G4=OPEN G5=OPEN`

This is an independently reviewable design note, **not** consent to merge, deploy, enable a service or perform real accounting or printing.
