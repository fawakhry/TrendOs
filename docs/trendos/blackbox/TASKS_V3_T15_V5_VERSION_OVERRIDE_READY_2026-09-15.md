# Tasks V3 T1.5 — v5 Version Override Ready

Date: 2026-09-15
Branch: `tasks-v3-t15-d1-read-replica-preview-20260915`

## Root cause confirmed
The T1 Service Binding resolves the downstream Worker's active deployment by default. The authoritative T1 qualification checkpoint records that the unversioned active deployment remained the pre-existing `Hello World!` while the qualified T1 implementation lived only at version ID `daf384a9-27ae-4260-bf53-1757555caca0`.

## v5 correction
T1.5 now sends `Cloudflare-Workers-Version-Overrides` on the Service Binding request, pinning downstream Worker `trendos-tasks-v3-t1-preview-20260914` to version `daf384a9-27ae-4260-bf53-1757555caca0`.

No T1 promotion is required.

## Validation
GitHub Actions run `34981517297`: PASS.
The contract asserts:
- one Service Binding status request;
- exact downstream version-override header;
- D1 snapshot write;
- snapshot version `TASKS_V3_T15_D1_PREVIEW_5_VERSION_OVERRIDE`;
- subsequent D1 read succeeds.

## Guardrails
- no Production route change;
- no active T1 promotion;
- no secret changes;
- no main Apps Script change;
- no Task production mutation;
- T2 remains locked.
