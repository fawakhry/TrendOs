# T2 UTF-8 isolated Apps Script V5 deployment

## STEP
Resume from eaf0fe65c1ae3f80bc5be9266f74680ee19158ac and publish the existing UTF-8 remediation, without restarting T2.

## RESULT
PASS — new separate Apps Script deployment created; final HTTP qualification pending.

Verified signed-in isolated project 1F7_z6csPm4Q6Sx-HV59SNDbShqzVcMXfsauZFakLFH_caEYpiCHjTOGV. Existing T2 V4 deployment was inspected, not edited. Head previously contained the old HMAC overload and an old head-only preflight helper. Replaced head with exact reviewed repository bridge; UI copy comparison EXACT MATCH, saved state confirmed. Head-only helper excluded from new deployment.

- Source fix commit: b42b4660e1263399b626272c0d3a9ed8aa919113
- Source blob: 87a94fa4a932eb94a819d7e964eecf3bbfc5626a
- New Apps Script version: 5
- New deployment ID: AKfycbz3kOnV85cwZEmUXwTaN4ygUI9vR8nXiW0xqofez6O3NJuwD5o9x2B9Hux253tcDx1eyQ
- New URL: https://script.google.com/macros/s/AKfycbz3kOnV85cwZEmUXwTaN4ygUI9vR8nXiW0xqofez6O3NJuwD5o9x2B9Hux253tcDx1eyQ/exec
- Description: TrendOS Tasks V3 T2 Readonly Wael Canary UTF-8 fix 2026-09-16
- Execute as owner; access Anyone, same as existing deployment; signed assertion and Wael gate required.
- T2 V4 retained: AKfycbzo6zcypF7mhECUrfqkP4u0NuzrV373vUQjLMk4o-TMbe4TyV93WkPnrsmeKVHSgCH1Bg
- T1 deployment not edited.

## COMMIT / RUN
Baseline eaf0fe65c1ae3f80bc5be9266f74680ee19158ac. Existing UTF-8 CI 35152830234 PASS retained as prior evidence. This step did not rerun qualification or assert live authentication success.

## PRODUCTION MUTATION
NONE to business data, Main Apps Script, active T1, routes, or secrets. Script Properties not opened or changed. Only authorized isolated head and NEW T2 deployment created.

## NEXT STEP
Point a new undeployed T2 Worker version preview at V5, using existing inherited binding without copying/changing secrets. Small Arabic health proof, exact 30-sample read-only qualification, and active T1 before/after preservation. Acceptance 30/30 and p95 <=2000ms; adapter timeout remains 5000ms. T3 LOCKED.
