# Cloud Migration V3 — T11 Service Frontend Cutover — 2026-09-14

## Step 1 — Production frontend read-only inspection
Result: **PASS — MINIMAL CUTOVER REQUIRES EXACTLY CONFIG + EDGE ORDERS LOADER ROUTING**

### What was inspected
- Production frontend branch: `main`.
- Current `main` head: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`.
- Current `config.js` blob SHA: `e0d7628caf07aa0fdc820661509c667b59066ba0`.
- Current Orders loader: `trendos-edge-orders-read-v1.js`.
- Prior qualified frontend cutovers:
  - Print: `56e586a56c3b7dd91020a0eb074584c9444cd032`
  - Laser: `b83f63a191568e188082aaecc42bd071ea630d91`
  - Press/current main: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`
- Existing Press production-cutover workflow and rollback pattern were reviewed.

### Current frontend state
`config.js` currently has:
- Edge Orders read enabled globally.
- canary-only disabled.
- allowed screens exactly `['print','laser','press']`.
- loader cache key `20260913-t10-print-laser-press1`.
- Service is therefore still routed to Apps Script by the frontend.

### Critical routing finding
Adding only `service` to `MATBAGY_EDGE_ORDERS_ALLOWED_SCREENS` is **not safe**.

The current `trendos-edge-orders-read-v1.js`:
- hardcodes `QUALIFIED_PAGE_PATH = '/v1/edge/orders/02cr/page'`;
- validates the line-level required mirrors `بنود الأوردرات`, `العملاء`, and `عملاء منع التسليم بالمديونية`;
- applies line-ID normalization intended for Print/Laser/Press line-level reads.

The newly qualified Service route is instead:
- `/v1/edge/orders/service/page`;
- order-level;
- returns `dataSource=d1-edge-orders-service-v1`;
- carries its own `freshness.ok` proof;
- must not be forced through the 02CR line-mirror validator or line-ID repair.

Therefore the smallest correct frontend cutover is exactly:
1. `config.js`: add `service` to the existing allowed-screen set and bump only the loader cache key.
2. `trendos-edge-orders-read-v1.js`: select the Service path only when `screen=service`, validate the Service-specific dataSource/freshness proof, and preserve the existing 02CR path/validation for Print/Laser/Press.

Existing invariants that must remain unchanged:
- `__DEBT__` remains ineligible for Edge and therefore Apps Script.
- all writes remain Apps Script authoritative.
- post-write read barrier remains intact.
- any Edge/session/freshness error falls back to the original Apps Script API.
- Print/Laser/Press behavior must not change.

### Worker qualification prerequisite
Already satisfied before this inspection:
- T11 Worker canary run `34849337401`, attempt `2`, job `104000507950`: PASS.
- retained Production Worker: `7964189a-2456-4f5f-bc22-532ae4971e8c`.
- Service live parity: 35/35, missing 0, extra 0, statusCounts exact, exclusions 9.

### Production mutation
- Production mutation in this step: **NO**.
- Frontend `main` changed: **NO**.
- Worker deploy: **NO**.
- Apps Script deploy: **NO**.
- Business writes: **NO**.
- Write authority change: **NO**.
- Task mutation: **NO**.
- Secret change: **NO**.
- Rollback required: **NO**.

### Current Production State
- Worker: `7964189a-2456-4f5f-bc22-532ae4971e8c` retained.
- Print/Laser/Press: D1-first + Apps Script fallback.
- Service Worker route: qualified/live.
- Service frontend: Apps Script only.
- `__DEBT__`: Apps Script.
- all business writes: Sheets / Apps Script authoritative.

### Next exact step
Create a branch-only T11 frontend candidate test that starts from the exact current `main` versions of `config.js` and `trendos-edge-orders-read-v1.js`, applies only the two-file Service routing patch in a temporary workspace, and proves:
- Service uses `/v1/edge/orders/service/page`;
- Print continues to use `/v1/edge/orders/02cr/page`;
- Service freshness/source validation succeeds for the qualified contract;
- Service failure falls back to Apps Script;
- `__DEBT__` never attempts Edge;
- no write/task/secret/authority behavior changes.

Do not modify `main` until this branch-only candidate passes.

## Step 2 — First branch-only frontend candidate workflow parse
Result: **FAIL — WORKFLOW YAML PARSE/VALIDATION ONLY; NO JOB EXECUTED**

### Identifiers
- Candidate workflow: `cloud-migration-v3-t11-service-frontend-candidate.yml`
- Candidate workflow commit: `113992b708a3781e08f1f2365667062061206afd`
- Run ID: `34852231504`
- Job ID: **none** — GitHub returned an empty jobs list.

### Failure reason
The workflow failed before runner allocation. Inspection showed a Python triple-quoted helper inside a YAML `run: |` block had a closing delimiter that dropped below the block indentation, making the workflow invalid YAML/Actions syntax.

No candidate patch or browser-like test executed, so this failure is not evidence against the Service frontend logic.

### Production mutation
- Production mutation: **NO**.
- `main` changed: **NO**.
- Worker deploy: **NO**.
- Apps Script deploy: **NO**.
- Business write: **NO**.
- Task mutation: **NO**.
- Secret change: **NO**.
- Rollback required: **NO**.

### Current Production State
Unchanged:
- Worker: `7964189a-2456-4f5f-bc22-532ae4971e8c` retained.
- Print/Laser/Press: D1-first + Apps Script fallback.
- Service Worker route: qualified/live.
- Service frontend: Apps Script only.
- `__DEBT__`: Apps Script.
- writes: Sheets / Apps Script authoritative.

### Next exact step
Fix only the branch-side candidate workflow YAML formatting by replacing the problematic multiline Python literal with indentation-safe string construction. Re-run the same branch-only candidate tests. Do not modify `main`.
