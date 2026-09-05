# TrendOS Accounting F2 — Preview caller native CI wiring

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`

## Starting point
Latest documented checkpoint implemented `accounting/preview-persistence-caller-v1.js` and its regression suite, but explicitly left executable Accounting Native CI proof unrecorded.

## Safe execution completed
Updated `.github/workflows/trendos-accounting-native-ci.yml` so changes to the preview persistence caller and its regression test trigger Accounting Native CI. Added syntax checking for the caller and a dedicated regression step:
`node accounting/preview-persistence-caller-v1.test.js`.

## Safety boundary
No migration, deployment, production binding, remote D1 write, Sheets write, cashbox/live-stock mutation, Production Cloud Write, or production cutover was enabled. The existing ZERO_WRITE / production-deny persistence gates remain unchanged.

## Verification
Workflow wiring commit: `874e9a350f7100efa789e7b700956373ce5ba1fa`.
The workflow push itself is expected to trigger Accounting Native CI; CI conclusion must be checked and recorded before this slice is considered CI-PROVEN.
