# SERVER-139 — Ubuntu isolated stage checkpoint

Owner screenshot on October 23, 2026 at 23:12 Cairo time showed a successful detached checkout in the existing Ubuntu stage sandbox.

Previous HEAD: 978b9f2. Current pinned HEAD: e599835802d7d1fe3da9bf1fdda03156ead49bc6. The revision includes SERVER-136 source and its fake-only CI, previously confirmed 11/11 passing. No real GraphQL call has been run, and the underlying stage HTTP 403 remains unresolved.

Next owner action: invoke SERVER-136 script with `--help` using the existing sandbox path, and report the output. The help path makes no network request, accesses no secrets and performs no orders, printing or laser operations.

This is a supplemental Ubuntu server-book entry, preserving existing book history without overwrites.

## SERVER-140 — Ubuntu SERVER-136 CLI help verified (owner screenshot, 2026-10-23 ~23:14 Africa/Cairo)

- Owner executed the CLI help command from the pinned `~/TrendOs-stage-access-sandbox` worktree and received `usage: server136_access_ray_graphql.py ...` together with `SERVER-136 one-shot stage CF-Ray GraphQL lookup (read-only)`.
- Help lists exactly the intended safety gates: `--stage-only-readonly`, `--owner-approved`, `--account-tag ACCOUNT_TAG` (32-hex Cloudflare account ID). Python exited to the shell normally without requesting a token or sending GraphQL/Worker traffic.
- Reverified Cloudflare official documentation on 2026-10-23: https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-access-login-events/ explicitly uses `accessLoginRequestsAdaptiveGroups` filtered by `cfRayId` and bounded datetimes under account tag. https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/ confirms Account → Account Analytics → Read is the designated permission. SERVER-136's query was already fake-tested 11/11 passing; no old SERVER-95 tests repeated.
- Owner Cloudflare dashboard URL from prior screenshots provides a 32-hex **nonsecret** account ID `aeadb43110dbb950f8b1ed7683ad9ce0`; using it here does not expose an API token or Service Secret. Intended query uses only the stage-only Ray `a4f30217e9ef9aca-MRS`, a ±10 minute event window around the observed 22:04 Cairo request, and only a bounded number of non-identity login events. Output is sanitized and excludes raw API records.
- **Next single owner action:** run one stage-only read-only script invocation with both explicit gates and the account ID; the script reads the 0600 local analytics token at `~/.config/trendos-private/cloudflare-stage-analytics-20261023.token` and sends **one GraphQL POST only** to Cloudflare's account analytics API, never to a Worker, D1, an order endpoint or printers/laser. No further secret entry is needed. A GraphQL success or matching event is not proof the stage Worker can authenticate; owner should share only the sanitized terminal output.
- `STAGE_HELP=PASS`; `GRAPHQL_LIVE_QUERY=NOT_YET_EXECUTED`; `HTTP403_ROOT_CAUSE=OPEN`; `PR190=DRAFT`; `PRODUCTION_UNCHANGED=YES`.

## SERVER-142 — GraphQL 200, no matching Ray; SERVER-141 app-only follow-up qualified (owner evidence 2026-10-23 ~23:17 Africa/Cairo; staged development ~23:22)

### Real owner result

- Owner executed previously-approved SERVER-136 single-Ray Cloudflare GraphQL Analytics query on Ubuntu sandbox. Output: `graphqlHttpStatus=200`, `eventsMatched=0`, `decision=UNVERIFIED`, `resultCode=SERVER136_NO_MATCHING_ACCESS_EVENT_UNPROVEN`, `stageAccessAuthenticatedProven=false`, `ordersRead=0`, `productionWorkerTouched=false`, `printerOrLaserCommands=false`.
- The result means the limited account analytics query returned no matching Access auth event for the stage `CF-Ray=a4f30217e9ef9aca-MRS` and specified 20-minute window. It **does not** prove that Access permitted the request or that it did not block the request, and it does not close the original Worker stage `HTTP 403`. A successful `GraphQL HTTP 200` only proves the analytics API accepted and answered the query; it does not prove protected Worker access.
- Cloudflare official evidence: [GraphQL querying login events](https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-access-login-events/) demonstrates matching by 16-hex Ray ID (without colo suffix), and [Service token documentation](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/) explains that strict-mode logs recognized invalid service tokens but not malformed headers or unknown Client IDs. Owner previously found Strict service token authentication **OFF**, so those logging claims must not be over-generalized to this organization.

### Follow-up execution on GitHub

- Implemented **SERVER-141**, separate code file `src/server141_stage_app_access_events.py`, test file `tests/test_server141_stage_app_access_events.py`, and dedicated fake-only workflow `.github/workflows/server141-stage-app-access-offline.yml`. SERVER-136 and SERVER-95 remain unchanged. Code uses the existing 0600 local token file, unchanged stage/owner gates and account-scoping; stage Access app ID was visible in owner dashboard URL (`28859297-b80f-47a7-98ed-78e00efc3204`) and is hardcoded, preventing access to any other Access app. One-hour bounded 2026-10-23 18:30–19:30 UTC window and max 20 groups. Only stage app metadata `appId`, `cfRayId`, `isSuccessfulLogin`, `serviceTokenId`, `approvingPolicyId` is requested; output is sanitized booleans/counts without any other Rays, tokens, users, IPs, or raw errors. Any foreign app record is rejected, and a full 20-item result is marked partial.
- GitHub Actions [SERVER-141 offline run 40018659172](https://github.com/fawakhry/TrendOs/actions/runs/40018659172) **SUCCESS**: `Ran 12 tests`, `OK`, `SERVER141_CI=FAKE_ONLY; LIVE_GRAPHQL_CALLS=0`, `ORDERS_READ=0; PRODUCTION_WORKER_TOUCHED=NO; PRINT_LASER=OFF`. Code revision qualified at `aa2846f4cde7b771172f464d8777033ee60c8ec0`.
- This qualifies the fake-only code path only. **No real SERVER-141 GraphQL query has been performed**; stage Access root cause still open. No production changes, Access policy edits, or machines.

### One next owner Ubuntu step

- Fetch the new code into the existing clean detached sandbox only: `git -C "$HOME/TrendOs-stage-access-sandbox" fetch --no-tags origin refs/heads/release/server68-staging-qualification-20261016`. This does NOT switch HEAD, start the tool, read the secret or send Cloudflare traffic. Verify output, then do a pinned detached switch to `aa2846f4cde7b771172f464d8777033ee60c8ec0` **in a separate owner turn**. Keep all steps one at a time. Do not rerun SERVER-95 or re-create tokens.

`REAL_SERVER136_GRAPHQL=HTTP200_ZERO_ROWS`; `REAL_SERVER141_GRAPHQL=NOT_RUN`; `STAGE_HTTP403_ROOT_CAUSE=UNRESOLVED`; `SERVER141_FAKE_CI=PASS_12`; `PR190=DRAFT`; `PRODUCTION_UNTOUCHED=YES`.


## SERVER-143 — owner fetched qualified SERVER-141 staging revision

- **Owner terminal evidence (2026-10-23 ~23:25 Africa/Cairo)**: Successfully ran only `git -C "$HOME/TrendOs-stage-access-sandbox" fetch --no-tags origin refs/heads/release/server68-staging-qualification-20261016`; terminal confirmed `Receiving objects: 100% (2201/2201)`, `Resolving deltas: 100% (1574/1574)`, and `release/server68-staging-qualification-20261016 -> FETCH_HEAD` before returning to shell. No working-tree switch or program execution occurred in this step.
- A successful `fetch` downloads repository objects and updates FETCH_HEAD but **does not move detached HEAD**. The current isolated Ubuntu sandbox remained pinned at SERVER-136 SHA `e599835802d7d1fe3da9bf1fdda03156ead49bc6` based on the previous verified checkout, unless an unreported user action changed it.
- Confirmed on GitHub that the tested SERVER-141 script and dedicated fake-only workflow both exist at commit `aa2846f4cde7b771172f464d8777033ee60c8ec0`, with 12/12 fake-only tests passed in run 40018659172. Do not chase later documentation-only HEAD, rerun SERVER-95, or expose stored token.
- **Next one-step owner action**: `git -C "$HOME/TrendOs-stage-access-sandbox" switch --detach aa2846f4cde7b771172f464d8777033ee60c8ec0`. This must operate on sandbox only; if Git refuses due to local modifications, do not force/reset.
- `SERVER143_FETCH=SUCCESS`; `SERVER141_CHECKOUT=PENDING`; `REAL_SERVER141_GRAPHQL=NOT_RUN`; `HTTP403_ROOT_CAUSE=UNKNOWN`; `PRODUCTION_AND_DEVICES=UNTOUCHED`.

## SERVER-144 — owner pinned SERVER-141 stage sandbox release (owner Ubuntu screenshot, 2026-10-23 ~23:26 Africa/Cairo)

- Owner successfully executed `git -C "$HOME/TrendOs-stage-access-sandbox" switch --detach aa2846f4cde7b771172f464d8777033ee60c8ec0` **inside the isolated stage test checkout**. Terminal confirmed `Previous HEAD position was e599835 ...` and `HEAD is now at aa2846f ci(server141): isolated fake-only Access app query qualification`. No Git errors appeared.
- The pinned SHA was verified on GitHub to include `autonomous-printshop/print-server/src/server141_stage_app_access_events.py`. 12/12 offline fake-only tests passed in GitHub Actions run 40018659172 prior to owner checkout. PR #190 remains open and draft.
- Stage-only checkout is distinct from primary `~/TrendOs` and the order reader; `git switch --detach` did not run Python, make Cloudflare API calls, read local credential or execute printer/laser commands.
- **Next one owner action:** `python3 "$HOME/TrendOs-stage-access-sandbox/autonomous-printshop/print-server/src/server141_stage_app_access_events.py" --help`. This displays CLI argument options, requires no credential access, and cannot send a request or touch production. Verify local help output before permitting the first live, owner-approved, stage-only GraphQL query.
- `SANDBOX_HEAD=aa2846f4cde7b771172f464d8777033ee60c8ec0`; `SERVER141_INSTALLED=YES`; `SERVER141_HELP=PENDING`; `REAL_SERVER141_GRAPHQL=NOT_RUN`; `HTTP403_ROOT_CAUSE=UNRESOLVED`; `PRODUCTION_AND_DEVICES=UNTOUCHED`.
