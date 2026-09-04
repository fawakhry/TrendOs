TrendOS dedicated D1 staging provisioning trigger.

Purpose:
- create or reuse `trendos-staging` only;
- apply tracked D1 migrations only to staging;
- deploy `trendos-d1-staging` only;
- qualify authenticated idempotent Cloud Write and pending outbox;
- run staging-only remote reconciliation verification without any Sheets write;
- reconfirm Production Cloud Write remains OFF and the staging reconciliation route is absent from Production.

Retry: safety-gate comment false-positive corrected before the first retry.
Retry 2: allow Edge secret propagation before authenticated write qualification; production OFF check now runs even on staging failure.
Retry 3: authenticated API calls use bounded retries and qualification also proves exactly one order/event/outbox row directly in dedicated staging D1.
Remote reconciliation: target must finish as `staging_verified` + `not_written_staging` + `NO_SHEETS_WRITE`.

This trigger does not authorize production Cloud Write or any Google Sheets write.
