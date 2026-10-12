# AP-296 — TrendOS one-shot employee-screen SHADOW qualification (source-only)

**Owner mandate:** start qualifying a limited-privilege employee account for **TrendOS business-order reads** after AP-281's successful real home Ubuntu fake dashboard runtime. **Do not connect to live credentials without an additional reviewed gate.**

## Why the existing Print Server login is NOT the first live test

- `src/trendos_client.py` already implements login, logout and `get_rows(screen)`. `get_rows` sends HTTP **POST** to `/v1/employee/core` with `action=getRows`; this might be a *semantically read-only* business action, but only after the server-side action/role contract is actually checked. POST syntax alone is not a business mutation guarantee, and the action name alone is not proof of lack of side effects.
- Existing local server `POST /api/trendos/login` starts `begin_login` and then `app.bridge.sync_async` on success. The AP-279 `observeOnly=true` guards **order-folder** writes, but the bridge still writes local baseline/audit data. **Do not use existing GUI login or production `run.py` as a no-write read-only qualification**. Existing config also has live TrendOS and Fast Mode defaults but AP-277 prevents unattended main() boot without a reviewed interlock.
- AP-280 employee queue reads already-persisted *local* orders and is not the live TrendOS orders feed. AP-281's verified home Ubuntu dummy dashboard confirms local UI runtime only.

## New safe synthetic source — no live connection

- `src/trendos_shadow_qualifier.py`: transport-independent `qualify_screen_once(client, "print", allowed_screens=("print",))`. Requires an explicitly supplied connected client and one allowed employee-screen name from `service/print/laser/press`. Invokes only `get_rows` **once**, never login/logout/worker/bridge, and refuses non-list, missing, oversized (>5000) or malformed row payloads as UNKNOWN/ERROR rather than reporting 0.
- Returns only aggregate counts: rows, number of distinct order IDs present, line IDs present, number of rows with missing line/status. **No names, personal data, order IDs, passwords, session tokens, business statuses or actual rows in output.** Does not claim real TrendOS order count, employee assignment, design approval, Ready/Printed or printer connectivity.
- `trendos_shadow_schema_demo.py`: intentionally fake-only, no flags, no live mode, no auth, no network, no disk changes. Uses two dummy rows in memory to exercise schema and prints `AP296_FAKE_SHADOW_PASS=YES`. No host command run and **not deployed to the owner's frozen `66b64ab` worktree**.
- `tests/test_ap296_trendos_shadow_schema_synthetic.py`: 15 tests check privacy redaction, screen allowlist, one call, rejection of bad/null/incomplete data, failures sanitized, no network, fake-only CLI and no state mutations.
- `.github/workflows/autonomous-printshop-ap296-trendos-shadow-schema-ci.yml`: Python 3.12 hosted CI with AP-296 through AP-276 regressions. No credentials in runner.

## Verified hosted evidence

[AP-296 run 38316118796](https://github.com/fawakhry/TrendOs/actions/runs/38316118796), job `115033028542`, COMPLETED/SUCCESS. Inspected actual logs: `Ran 15 tests` OK (AP-296); `10` OK (AP-281); `10` OK (AP-280); `8` OK (AP-279); `11` OK (AP-278); `12` OK (AP-277); `6` OK (AP-276) = **72/72 synthetic tests PASS**. Explicit `AP296_REAL_TRENDOS_LOGIN=NO` and `AP296_CUSTOMER_DATA_PLATFORM_WRITES_PRINTERS=OFF`.

## Remaining gates to first genuine TrendOS order read

1. Validate **server-side** `/v1/employee/core` `getRows` action contract, including true business read-only semantics, identity/role limitations, production host allowlist and response schema under minimum privileges. Avoid following untrusted redirects with any credentials, reject insecure transport and unauthorized output; provide a safe timeout and cleanup.
2. Secure a dedicated limited-privilege *employee* account or approved test account with only the one `print` screen if possible. Owner enters any secret locally **not in chat, GitHub, terminal command arguments, screenshots or CI**. No shared administrator login, no credential persistence.
3. Implement/review an **explicit owner-approved** one-shot live harness separate from `run.py` and from existing web UI login callback. Prefer no background polling, no order-folder creation or state files, one screen, one request, privacy-minimized aggregate output, and fixed allowed endpoint. Session auth/logout operations must be separately understood and contract-reviewed, not mislabeled pure GET.
4. Explicit owner consent before any actual external call, Ubuntu staged-source update or credential use. One Terminal command at a time with screenshots that never expose secrets. Tests and any prior host fake demo are not that consent.
5. Only after safe real read qualification, design a bounded **employee-facing orders feed** from authorized TrendOS rows through the existing Operator Task V2 state/permissions model. Never confuse a collection of employee rows with verified task assignment or an order-complete decision. Shop-site operation, Win7 files and physical printing remain separate qualification.

**AP296_STATE=SOURCE_ONLY_HOSTED_TESTED; AP296_TESTS=72_OF_72_PASS; AP296_REAL_TRENDOS_CONNECTION=NO; AP296_OWNER_UBUNTU_NEW_CODE=NOT_STAGED; AP296_CREDENTIALS=NONE; AP296_REAL_DATA=NOT_READ; AP296_NEXT=CONTRACT_AND_LIMITED_ACCOUNT_GATE_THEN_SEPARATE_LIVE_APPROVAL.**
