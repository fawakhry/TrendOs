# ACCT-CF-02K — Preview Live Persistence Readiness Probe Start

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Parent checkpoint: `ACCT-CF-02J`

## Pre-action record
The source commit that added the runtime diagnostic endpoint (`d0ff927ef8ad7b0e5e28754ce3182c55273e9042`) received a successful `TrendOS Accounting Preview Runtime` verification run `33941131280`, proving the isolated Preview converged to Accounting Native V0.7.

The existing runtime workflow does not yet probe `/v1/accounting/persistence-readiness` directly. The next material increment is therefore a dedicated public Preview runtime probe workflow for this GET-only endpoint.

## Probe requirements
- wait until `/v1/accounting/integration` reports the source Accounting Native version;
- GET `/v1/accounting/persistence-readiness` must return 200;
- current isolated Preview must remain `ZERO_WRITE`, `ready=false`, `authoritativeWrites=false`, `mutationPerformed=false`;
- POST to the diagnostic endpoint must return 405 and remain non-authoritative/non-mutating;
- no migration, D1 write, Google Sheets / Apps Script mutation, secret write, or financial cutover.

The workflow is verification-only and uses the existing public isolated Preview URL.

Status: STARTED
