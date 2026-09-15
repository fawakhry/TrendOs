# Tasks V3 T1 — Version Override Deployment Requirement

Date: 2026-09-15

Observed on isolated Worker `trendos-tasks-v3-t1-preview-20260914`:

- Deployment History currently contains only deployed versions such as `713d75b8`, `809e29e5`, `36f1f17d`, and `b80ae97f`.
- Qualified T1 version `daf384a9-27ae-4260-bf53-1757555caca0` does not appear in Deployment History, confirming it is not in the current deployment.
- Cloudflare Version Overrides only apply to versions present in the current deployment, including versions set to 0% traffic.

Safe next step:

- Create a gradual deployment on this isolated T1 Worker only.
- Keep current active version `713d75b8` at 100%.
- Add qualified version `daf384a9-27ae-4260-bf53-1757555caca0` at 0%.
- Do not route normal traffic to the qualified version.
- Do not touch `trendos-main`, main Apps Script, secrets, or production routes.

This enables the T1.5 Service Binding request to target the qualified T1 version via `Cloudflare-Workers-Version-Overrides` without changing ordinary traffic.
