# Tasks V3 T1 Dashboard Single-File Ready — 2026-09-15

## Context
- Target Worker: `trendos-tasks-v3-t1-preview-20260914`.
- Current active deployment observed in Cloudflare dashboard: `713d75b8` at 100%.
- Runtime configuration observed in dashboard:
  - `TASKS_V3_APPS_SCRIPT_URL` variable present.
  - `TASKS_V3_SHARED_SECRET` secret present/encrypted.
- No secret value was read, copied, logged, or changed.

## Action completed
Created a dashboard-ready single-file T1 read-only candidate derived from the qualified T1 code at commit `c537bd3004e937ad4e40f15acc964eebcbbbf687`:
- `cloudflare-d1/dashboard/tasks-v3-t1-qualified-singlefile-20260915.mjs`

Created contract test:
- `cloudflare-d1/test/tasks-v3-t1-qualified-singlefile.test.mjs`

Created workflow:
- `.github/workflows/trendos-tasks-v3-t1-qualified-singlefile.yml`

Qualification run:
- GitHub Actions run `35008233305`
- Job `contract`: PASS
- Marker: `TASKS_V3_T1_QUALIFIED_SINGLEFILE_PASS`

## Safety
- No Cloudflare deployment was changed by this GitHub step.
- No production route changed.
- No secret changed or exposed.
- No Apps Script deployment changed.
- No task mutation code added.
- No `claimNext` / `completeTask`.
- No T2 or production canary started.

## Next step
In the isolated T1 Worker dashboard only:
1. Open `Edit code`.
2. Replace the editor code with the tested single-file candidate.
3. Use the arrow beside Deploy and choose `Save` (not Deploy) to create a new version without routing traffic to it.
4. Return to Deployments and create a gradual deployment that keeps `713d75b8` at 100% and places the new T1 version at 0%.
5. Then T1.5 can use `Cloudflare-Workers-Version-Overrides` over its Service Binding to target that zero-percent version.
