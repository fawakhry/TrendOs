TrendOS dedicated D1 staging provisioning trigger.

Purpose:
- create or reuse `trendos-staging` only;
- apply tracked D1 migrations only to staging;
- deploy `trendos-d1-staging` only;
- qualify authenticated idempotent Cloud Write and pending outbox;
- reconfirm Production Cloud Write remains OFF.

This trigger does not authorize production Cloud Write.
