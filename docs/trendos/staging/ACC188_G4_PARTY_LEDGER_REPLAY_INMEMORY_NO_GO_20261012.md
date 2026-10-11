# ACC-188 — Party ledger exact payment replay before mutable balance guard (synthetic only)

Date 2026-10-12. Finance G4 source/CI only. Production **NO_GO**.

## Proven source defect

Before ACC188, \`partyLedger\` checked \`amount > current outstanding balance\` before consulting the idempotency ledger. When a 60-of-70 customer debt receipt had been COMMITTED and only 10 remained, an identical retried request with the **same key and body** was falsely rejected as overpayment; this is not a new transaction and must return the previously committed response. Same flaw existed for a supplier payment 50-of-60.

## Narrow source correction

Only in the original non-deployed candidate \`cloudflare-d1/src/employee-accounting-native-v1.mjs\`:
- Check the *existing* request key in the real command ledger before mutable outstanding balance ceiling and call the existing \`beginCommandV1\` on the original normalized canonical command. **Only a canonical/operation/hash-matching COMMITTED request is eligible for a replay**; PREPARED, changed amount and cross-operation reuse remain conflicts.
- Newly incoming distinct requests still run balance validation **before** creating PREPARED, so overpayment does not reserve/spend a request or create phantom transaction.
- Existing server-origin authenticated role restriction, D1 prepare/batch SQL, optimistic version guard, CORS, canary, backend OFF/READONLY and frontend OFF have not been weakened.
- No actual production code is deployed. Worker change is source-only within accounting candidate and must pass exact-head CI + review.

## Real native SQL in fake migrated DB regression

New \`tests/easystore_acc188_party_ledger_idempotency_sqlite.test.mjs\` runs exact Worker handler with fake cloud session and latest accounting migrations in discarded Node SQLite \`:memory:\`, checks:
1. Create fake customer debt 70 → receive 60 → 10 left; exact request replay returns COMMITTED, duplicatePrevented, **zero new cash, request, ledger or debt changes**.
2. Changed amount or operation with same key conflict; a **new** 11 payment when 10 remains is rejected without a PREPARED row.
3. New fake supplier invoice 100, first pay 40, supplier due 60, later payment 50 → 10 left. Same-key replay does **not** double-pay/double-debit cash or ledger; cash totals reconcile across customer receipt, supplier purchase and later payment.
4. Client role spoof, backend READONLY finance write block and regressions ACC170/174/187.

No real employee credentials, customer data, actual worker network calls, financial POST, remote D1, migrations or Cloudflare deployment.

**Remaining G1–G5 real approval gates stay OPEN.** Actual financial G4 acceptance NOT_TESTED; sale refunds ACC187 are still NOT_IMPLEMENTED and must not be conflated with this payment replay correction. No production D1 or customer account changed.
