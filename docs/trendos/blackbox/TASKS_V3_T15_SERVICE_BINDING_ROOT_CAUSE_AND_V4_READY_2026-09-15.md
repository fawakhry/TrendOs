# TrendOS Tasks V3 T1.5 — Service Binding Root Cause + v4 Ready

Date: 2026-09-15
Branch: `tasks-v3-t15-d1-read-replica-preview-20260915`

## Confirmed state
- T1.5 public read path reaches the isolated D1 binding and returns `TASKS_V3_T15_REPLICA_EMPTY` while the snapshot table is empty.
- Direct unit execution of the `scheduled()` handler passes and persists a synthetic snapshot.
- Cloudflare Cron is configured and the dashboard `Next` schedule advances, but no snapshot is written.
- Existing T1.5 v3 refresh called the T1 preview Worker via the public `workers.dev` URL from another Worker.

## Root cause
Cloudflare documents that same-zone Worker-to-Worker communication to a Worker on a route or `workers.dev` subdomain must use a Service Binding. The public Worker-to-Worker fetch path used by v3 is therefore not a valid internal refresh transport.

This also explains the observations:
- External GitHub probe -> T1 preview succeeds because it is not Worker-to-Worker.
- Direct scheduled unit test succeeds because it used a fake source implementation.
- Real scheduled Worker refresh does not produce a D1 snapshot.

## v4 fix
Created:
- `cloudflare-d1/dashboard/tasks-v3-t15-preview-worker-v4-service-binding.single.mjs`
- `cloudflare-d1/test/tasks-v3-t15-v4-service-binding.mjs`
- `.github/workflows/trendos-tasks-v3-t15-v4-service-binding.yml`

v4 changes only the asynchronous refresh transport:
- `TASKS_V3_T1_SERVICE` Service Binding is required.
- No `TASKS_V3_T1_SOURCE_URL` dependency in v4.
- Refresh still performs read-only `status` only, with one bounded retry.
- D1 remains isolated preview database.
- Sheets remain authoritative.
- Fetch/read hot path remains Worker -> D1 only.
- No secrets added or changed.
- No claim/complete or other Task mutations.
- No Production route or T2 changes.

Snapshot version after successful refresh:
`TASKS_V3_T15_D1_PREVIEW_4_SERVICE_BINDING`

## Validation
GitHub Actions run: `34979341748`
Result: PASS

## Next step
In Cloudflare T1.5 preview Worker only:
1. Add Service Binding named `TASKS_V3_T1_SERVICE`.
2. Target service: `trendos-tasks-v3-t1-preview-20260914`.
3. Replace Dashboard `worker.js` with the v4 single-file bundle and deploy.
4. Keep isolated D1 binding, snapshot-age variable, and Cron.
5. Wait for one Cron cycle and verify the snapshot row in D1.
6. If snapshot appears, run the 30-read qualification.

Production mutation: NONE.
