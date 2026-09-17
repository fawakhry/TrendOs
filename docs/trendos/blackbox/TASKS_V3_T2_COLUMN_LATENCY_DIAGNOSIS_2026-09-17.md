# T2 column latency diagnosis

## STEP
Resume from 7f76b3935add2a69bd56550e5c005c1c2910f3dd. Verify isolated Apps Script project identity and recover existing Head tasksV3T2LatencyProbe execution logs (Sep 16 2026 3:33:10 PM, as displayed by Apps Script). No duplicate probe run.

## RESULT
Probe completed (execution duration 12.95s). Source lookup 510ms; lastRow 117ms; lastRow=636. Nine sequential column reads, each 635 values: A 2045ms, E 1689ms, F 1506ms, J 1510ms, K 1682ms, M 1115ms, R 975ms, AG 730ms, AS 40ms. Instrumented total 12052ms. Sequential column reads account for 11292ms, proving the observed narrow-column read path exceeds the unchanged 5000ms adapter cap. This does not establish attainable end-to-end p95.

## COMMIT / RUN
Baseline branch head 7f76b3935add2a69bd56550e5c005c1c2910f3dd. Source blob 87a94fa4a932eb94a819d7e964eecf3bbfc5626a. Head editor run tasksV3T2LatencyProbe, completed; logs recovered via Executions Type=Editor. Project ID 1F7_z6csPm4Q6Sx-HV59SNDbShqzVcMXfsauZFakLFH_caEYpiCHjTOGV.

## PRODUCTION MUTATION
NONE. No secret/property access, deployment change, task mutation, spreadsheet write, T1 change or T3 during this recovery.

## NEXT STEP
Evaluate a single Sheets values.batchGet for the same nine narrow ranges with formatted values. Preserve row alignment, filtering, Wael gate, UTF-8 and live read semantics. No caching/freshness change or timeout increase. Validate parity before any new isolated T2 deployment and qualification.
