TrendOS dedicated D1 staging provisioning trigger.

Purpose:
- create or reuse `trendos-staging` only;
- apply tracked D1 migrations only to staging;
- deploy `trendos-d1-staging` only;
- qualify authenticated idempotent Cloud Write and pending outbox;
- reconfirm Production Cloud Write remains OFF.

Retry: safety-gate comment false-positive corrected before the first retry.
Retry 2: allow Edge secret propagation before authenticated write qualification; production OFF check now runs even on staging failure.
Retry 3: authenticated API calls use bounded retries and qualification also proves exactly one order/event/outbox row directly in dedicated staging D1.

This trigger does not authorize production Cloud Write.
