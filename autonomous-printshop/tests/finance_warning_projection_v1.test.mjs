import assert from 'node:assert/strict';
import {buildFinanceWarningProjectionV1,FINANCE_WARNING_PROJECTION_VERSION} from '../core/finance-warning-projection-v1.mjs';

const observed=buildFinanceWarningProjectionV1({
  accountingMode:'READONLY',
  accountingPolicyEpoch:37,
  workDate:'2026-10-07',
  sourceBusinessRows:20,
  canaryRowsExcluded:4,
  customerDebtParties:3,
  customerDebtAmount:1250.5,
  supplierPayableParties:2,
  supplierPayableAmount:400,
  pendingPurchases:1,
  openDeptLines:4,
  unclassifiedPurchases:1,
  unclassifiedFinalInvoices:2,
  custodySettlementRequired:1,
  dayCloseIntegrityFailures:1,
  currentDayCloseRows:0
});
assert.equal(observed.version,FINANCE_WARNING_PROJECTION_VERSION);
assert.equal(observed.mode,'READ_ONLY_AGGREGATE');
assert.deepEqual(observed.control,{mode:'READONLY',policyEpoch:37,readModeSafe:true});
assert.equal(observed.source.sourceDataPresent,true);
assert.equal(observed.source.positiveSignalsQualified,true);
assert.equal(observed.source.absenceQualified,false);
assert.equal(observed.source.scope,'OBSERVED_POSITIVE_SIGNALS_ONLY');
assert.equal(observed.source.canaryRowsExcluded,4);
assert.deepEqual(observed.debt,{customerParties:3,customerAmount:1250.5,supplierParties:2,supplierAmount:400});
assert.equal(observed.dayClose.blockers,10);
assert.equal(observed.dayClose.state,'BLOCKED');
assert.equal(observed.dayClose.ready,false);
assert.equal(observed.warnings.customerDebtObserved,true);
assert.equal(observed.warnings.supplierPayableObserved,true);
assert.equal(observed.warnings.dayCloseBlocked,true);
assert.equal(observed.warnings.sourceIncomplete,true);

const empty=buildFinanceWarningProjectionV1({
  accountingMode:'READONLY',
  accountingPolicyEpoch:37,
  workDate:'2026-10-07',
  sourceBusinessRows:0,
  canaryRowsExcluded:6,
  customerDebtParties:99,
  customerDebtAmount:999999,
  pendingPurchases:9,
  openDeptLines:8
});
assert.equal(empty.source.sourceDataPresent,false);
assert.equal(empty.source.positiveSignalsQualified,false);
assert.equal(empty.source.reason,'ACCOUNTING_FINANCE_DATA_NOT_POPULATED');
assert.equal(empty.debt.customerParties,0);
assert.equal(empty.debt.customerAmount,0);
assert.equal(empty.dayClose.blockers,0);
assert.equal(empty.dayClose.state,'UNKNOWN_SOURCE_COMPLETENESS');
assert.equal(empty.dayClose.ready,false);
assert.equal(empty.source.canaryRowsExcluded,6);

const canary=buildFinanceWarningProjectionV1({
  accountingMode:'CANARY',accountingPolicyEpoch:38,sourceBusinessRows:3,
  customerDebtParties:1,customerDebtAmount:50
});
assert.equal(canary.control.readModeSafe,true);
assert.equal(canary.source.positiveSignalsQualified,true);
assert.equal(canary.debt.customerAmount,50);
assert.equal(canary.dayClose.ready,false);

const unsafe=buildFinanceWarningProjectionV1({
  accountingMode:'GENERAL',sourceBusinessRows:50,customerDebtParties:2,customerDebtAmount:100
});
assert.equal(unsafe.control.readModeSafe,false);
assert.equal(unsafe.source.positiveSignalsQualified,false);
assert.equal(unsafe.source.reason,'ACCOUNTING_READ_MODE_NOT_SAFE');
assert.equal(unsafe.debt.customerAmount,0);

for(const out of [observed,empty,canary,unsafe]){
  assert.equal(out.accountingWrite,false);
  assert.equal(out.debtRestrictionWrite,false);
  assert.equal(out.dayCloseWrite,false);
  assert.equal(out.customerPiiExposed,false);
  assert.equal(out.partyIdentityExposed,false);
  assert.equal(out.rawOrderIdsExposed,false);
  assert.equal(out.rawInvoiceIdsExposed,false);
  assert.equal(out.employeeIdentityExposed,false);
}
assert.equal(JSON.stringify(empty).includes('CUSTOMER_SECRET'),false);

console.log('FINANCE_WARNING_PROJECTION_V1=PASS');
console.log('FINANCE_ABSENCE_CLAIM=FAIL_CLOSED');
console.log('FINANCE_CANARY_ROWS=EXCLUDED_BY_SOURCE_QUERY');
console.log('ACCOUNTING_WRITE=NO');
console.log('DEBT_RESTRICTION_WRITE=NO');
console.log('DAY_CLOSE_WRITE=NO');
