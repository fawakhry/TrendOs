# T2 separate Apps Script deployment

## STEP
Save reviewed T2 bridge and create NEW isolated web-app deployment.

## RESULT
Deployment created successfully via New deployment, not Manage deployments edit.

- Project: 1F7_z6csPm4Q6Sx-HV59SNDbShqzVcMXfsauZFakLFH_caEYpiCHjTOGV
- Description: TrendOS Tasks V3 T2 Readonly Wael Canary 2026-09-16
- Version: 4
- Execute as: owner (d.fawakhry@gmail.com)
- Access: Anyone, matching T1; signed POST and configured Wael gate remain required in source.
- Deployment ID: AKfycbzo6zcypF7mhECUrfqkP4u0NuzrV373vUQjLMk4o-TMbe4TyV93WkPnrsmeKVHSgCH1Bg
- Web app URL: https://script.google.com/macros/s/AKfycbzo6zcypF7mhECUrfqkP4u0NuzrV373vUQjLMk4o-TMbe4TyV93WkPnrsmeKVHSgCH1Bg/exec
- T1 remains a distinct version-3 deployment: AKfycbya5NyWMpBLEt_wR7Qklq1YC7PPFJI02-M1xKTMgx-0CdoI4zzW0z0rwAix8JYRst6bJA.

An initial editor paste appended code rather than replacing it; the resulting duplicate-identifier syntax error prevented saving that intermediate state. The editor was corrected before deployment. Final entire editor source was compared via UI copy against reviewed branch source: EXACT MATCH, 10670 characters. Saved state confirmed before New deployment.

## COMMIT / RUN
Source commit 06aea26eb0cf98b5f094dd80e43162711fe96d57; bridge blob 7b6f030981a0bd55395cadf453b726c3755088c7. Behavioral test commit 215742d5d9108bdd07b651d1b991f02951391487. Static contract and mocked valid-signature Wael/role denial tests PASS. Live read qualification NOT YET RUN.

## PRODUCTION MUTATION
NONE to business data. Authorized isolated project head, two added T2 properties, and new T2 deployment only. Existing secrets not read/copied/changed. Main Apps Script, production routes, and T1 deployment not modified.

## NEXT STEP
Read-only health/status preflight before linking isolated T2 Worker. Establish an authorized secret-preserving signing path without copying TASKS_V3_SHARED_SECRET or changing T1. Run at least 30 qualified reads, measure failures and latency, and stop after T2.
