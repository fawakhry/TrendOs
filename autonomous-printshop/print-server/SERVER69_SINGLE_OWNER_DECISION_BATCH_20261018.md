# SERVER-69 — One-time owner decisions for Cloudflare / Ubuntu rollout

**Date:** 2026-10-18 · **Repository:** `fawakhry/TrendOs` · **Review:** [Draft PR #190](https://github.com/fawakhry/TrendOs/pull/190).
**Owner instruction:** complete every safely independent source task now, save every external/production decision, do not interrupt the owner for one approval at a time. This file and `SERVER69_RELEASE_DECISIONS.json` are the **single queue** for decisions.

## What is already source-qualified; not live
- SERVER-30/66 existing legacy GET guards — source tested, **not deployed**.
- SERVER-67 metadata + parity signed HMAC GETs, Durable Object replay protection — source tested and local runtime tested; **no remote DO binding**. The namespace selector `authenticated.scope` issue was fixed under SERVER-69A.
- SERVER-68 Apps Script 100-row secure parity pagination and R5 signed metadata-only candidate — source tested, NOT switched on in live Apps Script/R5 workflows.
- SERVER-33/34 existing printshop service orders route + Ubuntu Python HTTPS one-shot reader — source + independent fake tests; SERVER-69 local Workerd synthetic D1 HTTP tested, plus SERVER-69B cross-language Python client → Workerd via **loopback-only injected opener**. The real Ubuntu server, Cloudflare hosted endpoints and customer data were never connected.
- [PR #195](https://github.com/fawakhry/TrendOs/pull/195) manager UI pilot belongs to the other agent and has **no authority** to modify Cloudflare, finance, credentials or Ubuntu jobs. EasyStore finance remains out-of-scope.

## Owner batch (six independent decisions; no one-by-one interruption)
| ID | Scope and required decision | Safest default until authorization |
|---|---|---|
| **D01** | Approve **a separate Cloudflare non-production Worker, fake D1 and non-public test network**, instead of replacing the pre-existing `trendos-d1-staging` (11 pre-existing tables, no dedicated Access app, old bundle unauth GET). | **Do not provision or overwrite** any Worker/D1. |
| **D02** | Approve provision of **stage-only HMAC principals, short-lived machine-reader token and remote Durable Object** using Cloudflare secret store; review rotation/access audit. | No remote credentials or DO migration. |
| **D03** | Confirm live owners of R5, Apps Script triggers, customer bridge and any external callers; approve phased **signed-read client migration/rollback** before blocking legacy GET. | Existing R5/Apps Script workflows unchanged. |
| **D04** | Approve a specific protected **production Worker version & security cutover window**, after exact source identity and reversible rollback are recorded separately for `trendos` and `trendos-d1-api`. | No production deploy, no Access/WAF or worker routing changes. |
| **D05** | Approve the real Ubuntu server's outbound **read-only canary**, credentials/service ownership and revocation, with a present operator; no device execution. | Ubuntu one-shot remains OFF. |
| **D06** | Approve **one** selected live order read/department parity check, no customer directory read and no automatic printing/laser; human operator verifies. | No live order, file generation, print or laser activity. |

**Decisions are recorded in `SERVER69_RELEASE_DECISIONS.json`, all pending; no silent approval.** A CI regression checks the default-OFF controls and scope boundaries. Changing the manifest alone **cannot** grant authority to deploy or handle real customer data.

## Critical ordering and rollback design
1. Keep `trendos-d1-staging` and `trendos-staging` intact. A separate stage must start with **zero real D1 binding**, then owner-approved *new* synthetic DB. Prove Access/host privacy before enabling routes.
2. Stage worker/Durable Object startup flags OFF, install role-separate service identities. With synthetic rows only: test unsigned/wrong-role/expired/replayed HTTP responses and valid metadata + print/laser GET. Document exact new Worker version.
3. **Migrate consumers before denying old reads:** R5 production controlled workflow pins `b7e85647...` and expects anonymous `/v1/mirror/sheets`=200; a signed helper exists but R5 deploy workflow is still old. Apps Script `D1_API_URL` target and live triggers unverified; source opt-in remains OFF. Preserve current flows until inventory/rollback signoff.
4. Snapshot worker source hashes, migration/binding revisions, Access/credential flags, effective roles, and operator ownership. Production rollout requires an approval naming exact target; Cloudflare worker `trendos` **differs** from `trendos-d1-api`.
5. Activate real Ubuntu reader once, verify only print/laser fields and no customer identifiers, then explicitly disable canary/rotate token. Device output OFF. A failure means disable the *new* reader flag/secret and stop canary; **never restore an unauthenticated legacy route** as an unreviewed rollback.
6. A separate D06 approval can test a real order only after stage and production gates. No automatic file, printer or laser execution.

## Verified limitations; never misstate as production readiness
- Previously owner-reviewed `trendos-d1-staging` worker has no dedicated Cloudflare Access application, workers.dev was enabled, owner-provided compiled bundle contains unauthenticated legacy GET paths; *live data exfiltration not tested or claimed*. Existing D1 was a separate database but populated.
- The existing environment's source→deployed SHA parity, service-to-service consumers, remote Durable Object migration, effective WAF/account access, human-facing role authority and Ubuntu-host connectivity still need approval/evidence.
- Synthetic localhost socket + fake SQLite prove a contract, **not Cloudflare-hosted staging** or actual Ubuntu availability. Cross-language Python bridge deliberately swaps only a pinned host request into `127.0.0.1` for CI; it never sends any production token.
- `SEC-AP303-02=OPEN_HIGH`; `REMOTE_STAGE=NO`; `PROD_SECURITY_DEPLOY=NO`; `UBUNTU_REAL=NO`; `FIRST_LIVE_ORDER=NO`.

## Continuation rule
If an upcoming task needs D01–D06, add evidence, identify its owner decision and **move to the next independent GitHub-only task** instead of requesting one approval at a time. Do not mark any decision done until owner provides explicit scoped approval and the actual Cloudflare/Ubuntu proof is recorded. This file avoids repeating architecture debates and historical reconciliation.
