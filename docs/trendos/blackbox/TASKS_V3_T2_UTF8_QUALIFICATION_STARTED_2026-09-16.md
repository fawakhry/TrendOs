# T2 UTF-8 V5 qualification started

## STEP
Wire new undeployed T2 version preview to the new V5 Apps Script deployment and run the existing acceptance harness.

## RESULT
IN PROGRESS — no PASS claimed. Existing version-preview isolation method retained from official prior checkpoint. No Worker version promotion.

Config commit 817be453345ff4bee378b1c30cf5b2e6023d2782 changes only T2 preview upstream URL to V5. Workflow commit 9e3f2972f77c029632d8ca20086568077bc43c7e uses distinct preview alias t2-utf8-v5-20260916, adds three health-only Arabic authentication proofs, and compares active T1 again at final completion. Existing 30-sample qualification harness and 5000ms adapter timeout unchanged.

Expected operation mix: health 8, status 8, flyPrint 7, pressCandidates 7. Acceptance requires 30/30 semantic success, zero HTTP/transport/semantic failures, p95 <=2000ms. Arabic smoke calls are excluded from the 30 samples.

## COMMIT / RUN
Run 35157734701, job 105001059130, commit 9e3f2972f77c029632d8ca20086568077bc43c7e. Initial read-only safety gate and T2 contracts passed; qualification still running at this checkpoint.

## PRODUCTION MUTATION
No business mutation, no active T1 deployment modification, no production route change, no secret value read/copy/write/rotation. Existing Cloudflare binding reused by an undeployed version. No T3.

## NEXT STEP
Collect complete run metrics, preserve failures without retry-based sample substitution, verify active T1 unchanged, and record final T2 result. Stop after T2 regardless of result.
