# Tasks V3 T1.5 — v4 Active-Target Root Cause

Date: 2026-09-15
Branch: `tasks-v3-t15-d1-read-replica-preview-20260915`

## Observed
- T1.5 D1 snapshot table remains empty after v4 Service Binding deployment.
- D1 binding/read path was independently confirmed working.
- Direct scheduled-handler unit/contract path passed.

## Root cause
The T1 Service Binding targets the Worker service's active deployment by default. The authoritative T1 qualification checkpoint records that the unversioned active endpoint still served the pre-existing `Hello World!` deployment, while the qualified T1 code lived only at versioned preview ID `daf384a9-27ae-4260-bf53-1757555caca0` and was never promoted.

Therefore v4 can bind to the correct Worker service name but still call the wrong active version.

## Safe correction
Use Cloudflare `Cloudflare-Workers-Version-Overrides` on the Service Binding subrequest to pin downstream Worker `trendos-tasks-v3-t1-preview-20260914` to version ID `daf384a9-27ae-4260-bf53-1757555caca0`.

This preserves:
- no T1 Active promotion;
- no production route changes;
- no secret changes;
- no Task production mutation;
- Sheets authoritative;
- T1.5 isolated D1 only.

## Current decision
Prepare T1.5 v5 Version Override. T2 remains locked.
