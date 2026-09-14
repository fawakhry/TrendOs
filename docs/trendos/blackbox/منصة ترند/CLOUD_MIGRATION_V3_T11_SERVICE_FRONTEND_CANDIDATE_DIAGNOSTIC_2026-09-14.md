# Cloud Migration V3 — T11 Service Frontend Candidate Diagnostic — 2026-09-14

## Candidate attempt after YAML repair
Result: **FAIL-CLOSED — TEMP PATCH BASELINE ASSERTION ONLY; NO PRODUCTION MUTATION**

### Identifiers
- Workflow: `TrendOS T11 Service Frontend Candidate`
- Run ID: `34852423028`
- Job ID: `104003428330`
- Workflow/fix commit: `2b2a024496ebd6e568211c5adf4004c1d68bbb78`
- Production Worker remained: `7964189a-2456-4f5f-bc22-532ae4971e8c`

### What passed
- Workflow YAML/Actions parsing: PASS.
- Runner allocation: PASS.
- Hard branch-only scope gate: PASS.
- Exact `main` head guard `44e0b01dd636ec81ef2a298b714a329cd3f828c9`: PASS.
- Candidate files were copied only into `/tmp/t11-service-frontend`.

### Failure
The temporary patch stopped on:
`unexpected loader metadata baseline`

Reason: the test expected the exact `pagePath + maxMirrorAgeMs` metadata anchor to occur twice. Direct inspection of current `main` shows the two exported objects use different indentation, so the exact four-space anchor occurs once and the six-space anchor occurs once. This is a candidate-test assumption error, not a frontend runtime failure.

The browser-like Service/Print/fallback/debt tests were skipped because the patch gate failed first.

### Production mutation
- Production frontend mutation: **NO**.
- `main` changed: **NO**.
- Worker deploy: **NO**.
- Apps Script deploy: **NO**.
- Business write: **NO**.
- Write authority change: **NO**.
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
- all writes: Sheets / Apps Script authoritative.

### Next exact step
Correct only the temporary candidate metadata patch to handle the two known indentation variants separately, then rerun the same branch-only behavioral tests. Do not modify `main`.
