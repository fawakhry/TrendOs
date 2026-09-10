# TrendOS Blackbox — Operator Task V2 — Cloudflare Edge -> Apps Script Auth Bridge

Date: 2026-09-10
Status: **DESIGN/PREP — NO SECRET CREATED — NO RUNTIME CHANGE — NO DEPLOYMENT**
Parent architecture: `TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_HYBRID_CLOUDFLARE_DESIGN_PREP.md`

## Problem discovered during OT-00 preparation

The current Cloudflare Edge session token is intentionally short-lived and contains the authenticated canonical username as `sub` plus time/jti claims. It does **not** contain the employee's original Google/TrendOS token.

The current GitHub `operator-task-workflow-v2.gs` candidate authenticates by calling the existing Apps Script `authorize_(username, token)` path. Therefore a Cloudflare Worker that has already verified the Edge session cannot safely call the current Task mutation backend unless a server-to-server trust bridge is added.

This is a design gap only. Nothing is broken in production because Operator Task V2 is not deployed or enabled.

## Rejected approaches

The following are prohibited:

1. putting the employee's original token inside the Edge session JWT-like payload; the payload is signed, not encrypted;
2. returning/storing the employee token in browser-visible long-lived state just so Worker can replay it;
3. disabling Apps Script authorization for `operatorTaskV2`;
4. trusting a client-supplied username without a server-side proof;
5. reusing or exposing `EDGE_SESSION_SECRET` to Apps Script merely for this bridge;
6. writing a parallel D1 Task mutation just to avoid the Google auth problem.

## Approved bridge direction

Use a **dedicated server-to-server HMAC assertion** between Cloudflare Worker and the Apps Script Operator Task adapter.

Provisional secret name:

`TRENDOS_OPERATOR_TASK_PROXY_SECRET`

This secret must be stored only as:

- a Cloudflare Worker secret;
- a Google Apps Script Script Property for the Task bridge.

It must not be committed to GitHub, sent to the browser, logged, or reused as `EDGE_SESSION_SECRET`.

No secret/property is to be created or changed during OT-00.

## Request flow

1. Employee logs in through the existing TrendOS flow.
2. Existing Edge session exchange verifies the employee against Apps Script and issues the short-lived Edge session token.
3. Browser calls the stable Cloudflare Operator Task endpoint using the Edge Bearer token.
4. Worker verifies the Edge token using existing Edge auth.
5. Worker derives canonical employee identity from verified `sub`; it does not trust a body-supplied username.
6. Worker maps the public route to a fixed internal Task operation.
7. Worker creates a short-lived HMAC service assertion over the canonical request.
8. Worker sends the signed internal request to Apps Script.
9. Apps Script verifies the dedicated HMAC, timestamp/skew, canonical operator identity, operation, and idempotency identity before running the Task authority operation.
10. Apps Script remains the authoritative Task mutation layer during the hybrid phase.

## Canonical signed evidence direction

The signed canonical material should include at minimum:

- protocol/version;
- HTTP method;
- internal Task operation;
- canonical operator username;
- Edge session `jti` or equivalent request/session identity;
- request timestamp;
- idempotency key for mutations;
- SHA-256 hash of the normalized request body.

The exact serialization must be deterministic and covered by cross-runtime test vectors so Worker JavaScript and Apps Script produce the same bytes/signature.

## Replay/idempotency boundary

- assertion timestamp must have a narrow accepted skew window;
- mutating calls must require idempotency keys;
- claim-next double-click/retry must not allocate two Tasks;
- complete retry must not create a second completion;
- stale/invalid signatures fail closed;
- an Edge session may never select a different employee identity than its verified `sub`.

The assertion is an authentication bridge, not a replacement for Task state idempotency.

## Role/capability enforcement

Both layers should fail closed:

- Worker limits route capabilities based on verified operator identity/role contract;
- Apps Script Task authority independently enforces Wael/Gaber/manager capability rules before mutation/read release.

Required rules remain:

- Wael: ordinary Task + Fly Print display + scoped Press candidates;
- Gaber: ordinary Laser Task only, no Fly Print, no Press;
- manager: metrics/exception visibility according to later finalized permissions;
- no ordinary backlog endpoint for Wael/Gaber.

## Activation/deployment gates

Before the bridge can be used live, all of the following are required:

1. RP-07 fully closed PASS;
2. Worker bridge code + Apps Script verification code qualified in GitHub CI;
3. deterministic HMAC cross-runtime test vectors PASS;
4. fresh live Apps Script routing inventory;
5. Operator Task modules installed inert/collision-free;
6. dedicated proxy secret created under a separate owner-approved secret/property boundary;
7. backend Operator Task flag still OFF during installation qualification;
8. Worker Operator Task gate still OFF during installation qualification;
9. read-only bridge self-test PASS;
10. separate owner-approved canary activation.

## No-change statement

This design record causes no runtime mutation. As of this checkpoint:

- `TRENDOS_OPERATOR_TASK_PROXY_SECRET`: **NOT CREATED / NOT SET by this work**;
- no Script Property changed;
- no Cloudflare secret changed;
- no Worker production deploy;
- no Apps Script Head change;
- no D1 business write;
- no Source Sheet write;
- no RP-08.

This bridge is part of OT-00 preparation and must remain inert until the post-RP-07 Operator Task rollout boundary.