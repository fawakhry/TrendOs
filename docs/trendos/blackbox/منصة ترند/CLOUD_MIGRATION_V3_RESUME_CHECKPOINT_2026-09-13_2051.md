# TrendOS Cloud Migration V3 — Resume Checkpoint

Date: 2026-09-13 20:51 Africa/Cairo
Repository: `fawakhry/TrendOs`
Controlled branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`

## Owner instruction — persistent execution rule

From this checkpoint onward, every completed production or qualification step MUST be written to the TrendOS blackbox/checkpoint before starting the next step. Each record must include the run/commit IDs, PASS/FAIL outcome, current production state, and the exact next step. This is specifically to allow recovery after internet/session interruption without restarting the migration from the beginning.

## Current production state

Production `main` commit: `44e0b01dd636ec81ef2a298b714a329cd3f828c9` (`prod: add qualified press D1 orders reads`).

### Cloud / D1-first reads already retained in production

- Print: D1-first — production cutover PASS, run `34771634432`, production commit `56e586a56c3b7dd91020a0eb074584c9444cd032`.
- Laser: D1-first — qualification PASS run `34771769387`; production cutover PASS run `34771882220`; production commit `b83f63a191568e188082aaecc42bd071ea630d91`.
- Press: D1-first — qualification PASS run `34771947385`; production cutover PASS run `34772000371`; production commit `44e0b01dd636ec81ef2a298b714a329cd3f828c9`.

Frontend D1 read lane keeps fail-safe fallback to Apps Script when the D1/freshness gate rejects the request.

### Still on Apps Script / Sheets

- Service read: NOT cut over; remains Apps Script.
- `__DEBT__`: Apps Script.
- All business writes / order mutations: Sheets + Apps Script authoritative.
- No business-write authority moved to D1.
- Operator Task mutation boundaries remain unchanged.

## Auth state retained

T6B Auth Shadow is retained in production:
- final production run `34768601492`
- Worker Version ID `3b819fd3-e73d-46f8-9150-f73c282706ab`
- D1 table `cloud_auth_sessions_v1`
- TTL 300 seconds
- raw employee token stored in D1: NO
- measured Apps Script auth miss 4105 ms; D1 auth hit 129 ms; Orders-session hit 122 ms.

## Service qualification history and current blocker

Service was deliberately NOT cut over because its contract differs from the line-level department routes.

1. Initial global/service parity gate failed closed; no Service cutover occurred.
2. Screen-view route `/v1/edge/orders/page` was tested. Its D1 service mirror was stale/legacy and did not match authoritative Apps Script Service output.
3. Heartbeat transport was separately probed read-only:
   - run `34772181715` PASS
   - GET heartbeat: HTTP 200, 2429 ms, success=true
   - POST heartbeat: HTTP 200, 1899 ms, success=true
4. Service V2 diagnostic showed heartbeat healthy and D1 gate 200, but the legacy Service view mirror contract was still wrong/stale relative to current Apps Script output.
5. A newer Service contract extraction completed successfully:
   - run `34774706723` PASS (`TrendOS T11 Service Screen Contract`).
6. Exact Service projection attempt from the fresh D1 `بنود الأوردرات` lines mirror:
   - run `34774744376` FAIL (fail-closed; read-only qualification only)
   - candidate from Lines mirror: 32 rows
   - authoritative Apps Script Service: 36 rows
   - missing=36 / extra=32 under the attempted projection
   - mirror syncedAt `2026-09-13 18:13:22`
   - authoritative Apps Script read ~5159 ms
   - failure proves the attempted simple line-level projection does NOT reproduce the Service contract.

Important contract evidence: Apps Script Service rows use an order/customer-style projection where the second identity field may be a phone/customer/legacy key, not the canonical line ID used by Print/Laser/Press. Therefore Service MUST NOT be pointed at the existing department line-level route or a naïve Lines projection.

## Safety invariants at this checkpoint

- Production `main` is stable at `44e0b01dd636ec81ef2a298b714a329cd3f828c9`.
- Print + Laser + Press are D1-first reads with fallback.
- Service remains Apps Script.
- Sheets / Apps Script remain authoritative for all business writes.
- No `EDGE_SESSION_SECRET` change.
- No `TRENDOS_OPERATOR_TASK_PROXY_SECRET` change.
- No `claimNext` or `completeTask` production mutation.
- No Gaber Material Control change.
- No Service cutover until exact Service contract parity is proven.

## Exact next step

Continue from the successful Service contract extraction (`34774706723`) and inspect the extracted authoritative Service filtering/projection/sort logic. Build a read-only D1 Service-specific candidate that reproduces that exact contract, then run live parity against Apps Script. Only after PASS may Service be promoted to D1-first. Do not revisit or redo T6A/T6B/Print/Laser/Press unless new evidence shows regression.
