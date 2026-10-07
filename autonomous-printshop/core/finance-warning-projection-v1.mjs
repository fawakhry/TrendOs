export const FINANCE_WARNING_PROJECTION_VERSION='FINANCE_WARNING_PROJECTION_V1_20261007';

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function count(v){const n=Number(v);return Number.isFinite(n)&&n>0?Math.trunc(n):0;}
function amount(v){const n=Number(v);return Number.isFinite(n)&&n>0?Math.round(n*100)/100:0;}
function epoch(v){const n=Number(v);return Number.isFinite(n)&&n>=0?Math.trunc(n):0;}

export function buildFinanceWarningProjectionV1(row={}){
  const mode=upper(row.accountingMode)||'OFF';
  const policyEpoch=epoch(row.accountingPolicyEpoch);
  const readModeSafe=mode==='READONLY'||mode==='CANARY';

  const sourceBusinessRows=count(row.sourceBusinessRows);
  const canaryRowsExcluded=count(row.canaryRowsExcluded);
  const sourceDataPresent=sourceBusinessRows>0;
  const positiveSignalsQualified=readModeSafe&&sourceDataPresent;
  // There is no finance-history completeness receipt yet. Positive observed
  // warnings are safe to surface, but absence cannot be treated as proof.
  const absenceQualified=false;

  let sourceReason='ACCOUNTING_FINANCE_DATA_NOT_POPULATED';
  if(!readModeSafe)sourceReason='ACCOUNTING_READ_MODE_NOT_SAFE';
  else if(sourceDataPresent)sourceReason='ACCOUNTING_FINANCE_OBSERVED_ONLY';

  const customerDebtParties=count(row.customerDebtParties);
  const customerDebtAmount=amount(row.customerDebtAmount);
  const supplierPayableParties=count(row.supplierPayableParties);
  const supplierPayableAmount=amount(row.supplierPayableAmount);

  const pendingPurchases=count(row.pendingPurchases);
  const openDeptLines=count(row.openDeptLines);
  const unclassifiedPurchases=count(row.unclassifiedPurchases);
  const unclassifiedFinalInvoices=count(row.unclassifiedFinalInvoices);
  const custodySettlementRequired=count(row.custodySettlementRequired);
  const dayCloseIntegrityFailures=count(row.dayCloseIntegrityFailures);
  const currentDayCloseRows=count(row.currentDayCloseRows);
  const dayCloseBlockers=
    pendingPurchases+
    openDeptLines+
    unclassifiedPurchases+
    unclassifiedFinalInvoices+
    custodySettlementRequired+
    dayCloseIntegrityFailures;

  const dayCloseState=dayCloseBlockers>0
    ? 'BLOCKED'
    : (absenceQualified?'READY':'UNKNOWN_SOURCE_COMPLETENESS');

  return {
    version:FINANCE_WARNING_PROJECTION_VERSION,
    mode:'READ_ONLY_AGGREGATE',
    workDate:text(row.workDate),
    control:{
      mode,
      policyEpoch,
      readModeSafe
    },
    source:{
      sourceDataPresent,
      sourceBusinessRows,
      canaryRowsExcluded,
      positiveSignalsQualified,
      absenceQualified,
      reason:sourceReason,
      scope:'OBSERVED_POSITIVE_SIGNALS_ONLY'
    },
    debt:{
      customerParties:positiveSignalsQualified?customerDebtParties:0,
      customerAmount:positiveSignalsQualified?customerDebtAmount:0,
      supplierParties:positiveSignalsQualified?supplierPayableParties:0,
      supplierAmount:positiveSignalsQualified?supplierPayableAmount:0
    },
    dayClose:{
      pendingPurchases:positiveSignalsQualified?pendingPurchases:0,
      openDeptLines:positiveSignalsQualified?openDeptLines:0,
      unclassifiedPurchases:positiveSignalsQualified?unclassifiedPurchases:0,
      unclassifiedFinalInvoices:positiveSignalsQualified?unclassifiedFinalInvoices:0,
      custodySettlementRequired:positiveSignalsQualified?custodySettlementRequired:0,
      integrityFailures:positiveSignalsQualified?dayCloseIntegrityFailures:0,
      currentCloseRows:positiveSignalsQualified?currentDayCloseRows:0,
      blockers:positiveSignalsQualified?dayCloseBlockers:0,
      state:positiveSignalsQualified?(dayCloseBlockers>0?'BLOCKED':'UNKNOWN_SOURCE_COMPLETENESS'):'UNKNOWN_SOURCE_COMPLETENESS',
      ready:false
    },
    warnings:{
      customerDebtObserved:positiveSignalsQualified&&customerDebtParties>0,
      supplierPayableObserved:positiveSignalsQualified&&supplierPayableParties>0,
      dayCloseBlocked:positiveSignalsQualified&&dayCloseBlockers>0,
      sourceIncomplete:!positiveSignalsQualified||!absenceQualified
    },
    accountingWrite:false,
    debtRestrictionWrite:false,
    dayCloseWrite:false,
    customerPiiExposed:false,
    partyIdentityExposed:false,
    rawOrderIdsExposed:false,
    rawInvoiceIdsExposed:false,
    employeeIdentityExposed:false
  };
}
