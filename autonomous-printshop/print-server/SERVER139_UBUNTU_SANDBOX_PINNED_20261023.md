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
