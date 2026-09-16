# T2 UTF-8 V5 — final read-only qualification FAIL

## STEP
Publish existing UTF-8 HMAC correction as a NEW isolated Apps Script deployment, preserve T1 and original T2 V4, then execute Arabic authentication proof and exact 30-sample qualification.

## RESULT
**UTF-8 authentication remediation PASS; overall T2 qualification FAIL. T3 LOCKED.**

### Deployment
- Isolated project: 1F7_z6csPm4Q6Sx-HV59SNDbShqzVcMXfsauZFakLFH_caEYpiCHjTOGV
- Apps Script version: 5
- New deployment: AKfycbz3kOnV85cwZEmUXwTaN4ygUI9vR8nXiW0xqofez6O3NJuwD5o9x2B9Hux253tcDx1eyQ
- URL: https://script.google.com/macros/s/AKfycbz3kOnV85cwZEmUXwTaN4ygUI9vR8nXiW0xqofez6O3NJuwD5o9x2B9Hux253tcDx1eyQ/exec
- Exact repository source blob: 87a94fa4a932eb94a819d7e964eecf3bbfc5626a; explicit Utilities.Charset.UTF_8.
- Temporary old head-only preflight helper removed by exact source replacement before publishing V5.
- New undeployed T2 Worker Version: 67dab1c9-1ced-40c7-9820-f50d911099b3
- Preview alias: t2-utf8-v5-20260916
- Exact version URL: https://67dab1c9-trendos-tasks-v3-t1-preview-20260914.trendmall-contact.workers.dev
- No Worker promotion performed.

### Authentication proof
Three Arabic health smoke calls succeeded, HTTP 200 and expected T2 version/readOnly. Upstream times 1584, 1812, 2620ms. These three smoke calls are excluded from the 30-sample acceptance set. No SIGNATURE_INVALID occurred in smoke or final samples.

### Exact 30-sample results
| Operation | Success | Failure |
|---|---:|---:|
| health | 8/8 | 0 |
| status | 0/8 | 8 |
| flyPrint | 0/7 | 7 |
| pressCandidates | 0/7 | 7 |
| Total | 8/30 | 22 |

- HTTP failures: 22 (HTTP 400, TASKS_V3_PREVIEW_UPSTREAM_TIMEOUT)
- Transport failures: 0
- HTTP-200 semantic failures: 0
- All 22 business-read attempts hit the unchanged 5000ms upstream timeout.
- Success-only p50: 1724.71ms
- Success-only p95: 2359.50ms
- Success-only max: 2359.50ms
- Success-only upstream p50/p95/max: 1617 / 2333 / 2333ms
- All-attempt diagnostic p50/p95/max: 5185.78 / 5241.07 / 5267.97ms
- All-attempt upstream diagnostic p50/p95/max: 5000 / 5000 / 5000ms

Success-only percentiles cover only the eight successful health calls, not successful business reads. All-attempt percentiles include failures and are diagnostic only. Acceptance requires 30/30 and p95 <=2000ms, so both correctness/completion and latency gates FAIL. No sample substitution, timeout increase, acceptance relaxation, or repeat-run selection was used.

### Isolation verification
Apps Script Manage deployments read-only verification after V5 publication confirmed:
- T1 still Version 3, deployment AKfycbya5NyWMpBLEt_wR7Qklq1YC7PPFJI02-M1xKTMgx-0CdoI4zzW0z0rwAix8JYRst6bJA.
- Original T2 still Version 4, deployment AKfycbzo6zcypF7mhECUrfqkP4u0NuzrV373vUQjLMk4o-TMbe4TyV93WkPnrsmeKVHSgCH1Bg.

Cloudflare active T1 before upload, after upload, and after all samples remained:
- Deployment: 42a77742-69f6-40c7-9c6e-bbc310915374
- Version: 62527d93-9078-46c9-a316-132e02ed3194
- Traffic: 100%
- Final evidence: ACTIVE_T1_FINAL_UNCHANGED.

## COMMIT / RUN
- Baseline: eaf0fe65c1ae3f80bc5be9266f74680ee19158ac
- Fix source: b42b4660e1263399b626272c0d3a9ed8aa919113
- Deployment checkpoint: 42f0658ff68e64ef4e5aef978e8dfbb14e42ac43
- Preview config: 817be453345ff4bee378b1c30cf5b2e6023d2782
- Qualification workflow: 9e3f2972f77c029632d8ca20086568077bc43c7e
- Run: https://github.com/fawakhry/TrendOs/actions/runs/35157734701
- Job: 105001059130
- All 30 redacted sample metrics and three smoke results: TASKS_V3_T2_UTF8_V5_30_SAMPLE_EVIDENCE_2026-09-16.json
- Evidence commit: c8126da8a2eb3e1c5a0563507caa5f52716e896e

## PRODUCTION MUTATION
NONE to business data. No Task mutation, claimNext, completeTask, production spreadsheet write, Main Apps Script modification, active T1 deployment change, production route/frontend change, secret-value access/copy/write/rotation, D1 business-write authority transfer, Gaber Material Control, RP-08, merge, force push, or T3. Existing runtime binding was used normally by the isolated preview; only binding names were inspected. Script Properties were not opened or modified in this continuation.

## NEXT STEP
STOP at the new T2 performance decision point. Owner may authorize a scoped T2 read-only latency diagnostic and remediation. Evidence establishes that signature validation now succeeds for Arabic health, while every business-read attempt exceeds the 5s adapter cap. The precise latency source within projection reads is not yet proven. Do not assume UTF-8 alone solves latency, change the timeout/2000ms target, promote the preview, modify T1, or begin T3. Preserve V5 and the failing qualification as the current official state.
