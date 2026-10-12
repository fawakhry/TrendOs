# AP-277 — Fail-closed local HTTP write authorization, source-only

**2026-10-12, owner priority: operational printshop first.**
**Qualification class:** GitHub branch source + hosted synthetic CI only. NOT owner Ubuntu execution, Windows 7 integration, customer handling or printer qualification.

## Why this gate exists

The existing Print Server `src/server.py` had multiple local HTTP POST handlers that could create order folders, change the work-root setting, initiate a TrendOS employee login/sync, select a manual route, or publish a structured approval copy without verifying the caller. Loopback alone does not block untrusted local software or hostile websites from attempting localhost requests. Existing `run.py` loads config with `trendos.enabled=true` and `fastMode.enabled=true` by default. The AP-276 6/6 PASS proved synthetic functionality, NOT authentic local write authorization.

## AP-277 changes (on PR #95 draft branch only)

1. `src.server.PrintServerApp` now starts with `localWriteAccess=LOCKED` unless a **process-scoped secret 32–512 characters** is explicitly supplied through `TRENDOS_PRINTSHOP_WRITE_TOKEN`. Tests can inject an explicitly fake token; it is never loaded from `local.json` and is never included in HTTP status responses.
2. Every HTTP POST goes through a single pre-body authorization boundary. Reject unless expected loopback `Host` and port, present `Origin` (if sent) is exact same-origin HTTP, `Sec-Fetch-Site` is same-origin/none when present, `X-TrendOS-Write-Token` matches via constant-time compare, and `Content-Type` is application/json. Failed requests receive 403/415 and cannot reach any mutating handler; OPTIONS does not grant CORS.
3. Direct production `main()` refuses non-loopback binds. If `trendos.enabled` or `fastMode.enabled` is true, `main()` rejects by default unless `TRENDOS_PRINTSHOP_ALLOW_LIVE=OWNER_APPROVED` is supplied. **Setting the environment variable is a software interlock, not actual consent. No one is authorized to set it or start production until the owner explicitly approves a specific plan.**
4. `public/index.html` has a password-type field for the local write token. The JavaScript sends the token only in the local request header; the UI does not store it in localStorage/cookies/config. User-entered real TrendOS credentials must **never** be used as this local token.
5. AP-276 hosted integration fixture now explicitly uses an unmistakably synthetic 32+ character token, keeping the existing allowed order -> manual folder -> structured approval flow testable.
6. New `tests/test_ap277_write_guard_synthetic.py` tests unauthorized/no-token/bad-token/cross-origin/Host/Sec-Fetch-Site/form content-type and the explicitly authorized fake local flow. New hosted workflow `.github/workflows/autonomous-printshop-ap277-write-guard-ci.yml` runs AP-277 negative tests and the AP-276 regression on GitHub-hosted Python 3.12, with no real Cloudflare, customer directories or printers.

## Existing code left intact / why this is not production security acceptance

- **No** live order login, machine printing, trusted approval provenance, operator account/access-control administration, financial writes or external services were introduced.
- UI GET routes still display paths/state to callers on the local listener, subject to further review. This phase addresses POST mutations, not complete confidentiality on a shared machine.
- File-path traversal and symlink races in existing order-root/ready publishing logic need their own security gate. A bearer token alone cannot validate whether an approval truly came from the customer or protect against compromise of the local OS account.
- `write_token` is process memory/environment, not a multi-user authentication service; token rotation/revocation and physical workstation access have not been proven.
- Any Windows packaging/runtime compatibility and physical printer connectivity remain unqualified.
- New code can break old clients that do not send `X-TrendOS-Write-Token`. This is an **intentional fail-closed** change, not a production deployment.

## Synthetic CI receipt

**Verified actual hosted CI**: [run #38307798630](https://github.com/fawakhry/TrendOs/actions/runs/38307798630), job `115005951150`, COMPLETED/SUCCESS. Inspected job logs: `Ran 12 tests in 0.663s`, `OK` (AP-277 negative/positive authorization); `Ran 6 tests in 0.331s`, `OK` (AP-276 regression). Printed `AP277_HOSTED_GUARD_SYNTHETIC=PASS`, `AP277_OWNER_UBUNTU=NOT_EXECUTED`, `AP277_CUSTOMERS_AND_CLOUD=OFF`, `AP277_PRINTERS=OFF`, `AP277_PRODUCTION_READY=NO`. This is hosted GitHub evidence, **not host or production proof**.

## Safety / next gates

Continue GitHub-only path containment/anti-symlink checks, synthetic audit of approved file copying and explicit read-only TrendOS adapter qualification. Ask owner once: is Ubuntu `TrendosShop` at the printshop or still at home? Only after explicit host approval, give exactly one Ubuntu command and await its Terminal screenshot. No merge, pull/fetch, production launch, printer action, Win7 originals, user/customer/financial data, NetBird, SSH, firewall, paid services or self-hosted runner.
