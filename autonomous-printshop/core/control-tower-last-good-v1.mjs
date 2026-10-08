export const CONTROL_TOWER_LAST_GOOD_VERSION='CONTROL_TOWER_LAST_GOOD_V1_20261008';
export const CONTROL_TOWER_LAST_GOOD_MAX_AGE_MS=5*60*1000;

function count(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>0?Math.trunc(n):0;
}
function fail(code){
  return {
    success:false,status:'UNAVAILABLE_FAIL_CLOSED',code,
    financialReadinessCurrent:false,ownerDecisionsCurrent:false,
    operatorTaskActivationAllowed:false,financialExecutionAllowed:false,
    accountingWrite:false,d1Mutation:false
  };
}
function sourceQualified(source,at){
  if(!source||source.success!==true||source.mode!=='CONTROL_TOWER_SHADOW') return false;
  if(!source.source||source.source.authority!=='trendos-main-d1') return false;
  if(source.writesAccepted!==false||source.d1Mutation!==false||source.employeeAssignment!==false) return false;
  if(source.piiExposed!==false||source.rawOrderIdsExposed!==false||source.rawLineIdsExposed!==false||source.employeeIdentityExposed!==false) return false;
  const produced=Date.parse(source.generatedAt);
  return Number.isFinite(produced)&&produced<=at&&at-produced<=CONTROL_TOWER_LAST_GOOD_MAX_AGE_MS;
}
export function createControlTowerLastGoodGateV1(options={}){
  const maxAgeMs=Number.isFinite(options.maxAgeMs)&&options.maxAgeMs>0
    ?Math.min(Math.trunc(options.maxAgeMs),CONTROL_TOWER_LAST_GOOD_MAX_AGE_MS)
    :CONTROL_TOWER_LAST_GOOD_MAX_AGE_MS;
  let lastGood=null;
  return Object.freeze({
    observe(source,at=Date.now()){
      if(!Number.isFinite(at)||!sourceQualified(source,at)) return fail('LIVE_SOURCE_NOT_QUALIFIED');
      // Preserve only PII-free, non-actionable operational aggregates.
      // Never store Finance, approval, employee identities, canary readiness,
      // owner decisions, raw line/order IDs or full upstream payload.
      const operations=source.operations&&source.operations.counts||{};
      const deadlines=source.operations&&source.operations.deadlineRisk||{};
      lastGood=Object.freeze({
        observedAt:at,generatedAt:source.generatedAt,
        rowCount:count(source.source.rowCount),
        waiting:count(operations.ordinary),
        inProgress:count(operations.inProgress),
        overdueOrders:count(deadlines.overdueOrders),
        atRisk24hOrders:count(deadlines.atRisk24hOrders)
      });
      return {success:true,status:'FRESH_OBSERVED',observedAt:at,version:CONTROL_TOWER_LAST_GOOD_VERSION};
    },
    degraded(at=Date.now()){
      if(!Number.isFinite(at)||!lastGood) return fail('NO_QUALIFIED_LAST_GOOD');
      // Freshness follows the source timestamp; observation cannot renew it.
      const ageMs=at-Date.parse(lastGood.generatedAt);
      if(at<lastGood.observedAt||ageMs<0||ageMs>maxAgeMs) return fail('LAST_GOOD_EXPIRED');
      return {
        success:true,status:'LAST_GOOD_STALE_DIAGNOSTIC_ONLY',
        version:CONTROL_TOWER_LAST_GOOD_VERSION,
        cacheScope:'WORKER_ISOLATE_BEST_EFFORT',
        asOf:lastGood.generatedAt,ageMs,maxAgeMs,
        displayWarningAr:'مصدر Control Tower غير متاح الآن؛ الأرقام المعروضة قديمة للمتابعة فقط، وليست دليلاً على الحالة الحالية أو الجاهزية المالية.',
        operationalDiagnostic:{
          rowCount:lastGood.rowCount,
          waiting:lastGood.waiting,
          inProgress:lastGood.inProgress,
          overdueOrders:lastGood.overdueOrders,
          atRisk24hOrders:lastGood.atRisk24hOrders
        },
        financialReadinessCurrent:false,ownerDecisionsCurrent:false,
        operatorTaskActivationAllowed:false,financialExecutionAllowed:false,
        accountingWrite:false,d1Mutation:false,
        noStaleFinanceOrProtectedDecisions:true
      };
    }
  });
}
