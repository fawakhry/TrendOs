/**
 * T12/R4 isolated 128+-shape capacity envelope. PURE COUNTS ONLY.
 * No row values, DB adapter, source credentials, HTTP handler or IO.
 * This is NOT a recovery planner, executable SQL, runtime measurement, or
 * production write authorization. Do not import it into any live route.
 *
 * D1 query counts: https://developers.cloudflare.com/d1/platform/limits/
 * Existing V1 batch statement shape: 2 catalog guards + N row CAS + 2 advances.
 */
export const T12_ISOLATED_RECOVERY_ENVELOPE_V1 =
  'T12_128_CAPACITY_ENVELOPE_ISOLATED_NO_WRITE';
const NAMES=['الأوردرات','بنود الأوردرات'];
const MAX_TAB_ROWS=5000;
const DESIGN_ONLY_MAX_CANDIDATES=160;
const DESIGN_ONLY_MAX_TAIL_GROWTH_PER_TAB=64;
const EXISTING_TOTAL_CEILING=64;
const EXISTING_TAIL_CEILING=5;
const FREE_D1_QUERIES_PER_INVOCATION=50;
const PAID_D1_QUERIES_PER_INVOCATION=1000;
function fail(reason){throw new Error('T12_ENVELOPE_ABORT_'+reason);}
function integer(n,min,max){return Number.isSafeInteger(n)&&n>=min&&n<=max;}
function checkTab(t,name){
  if(!t||t.sheetName!==name)fail('TAB_IDENTITY');
  const {sourceRowCount,d1BaseRowCount,changedExistingRows,
    missingSourceRowsInD1,candidateRowsForUpsert,
    unexpectedRowsInD1,duplicateRemoteRows}=t;
  if(!integer(sourceRowCount,1,MAX_TAB_ROWS)||
      !integer(d1BaseRowCount,1,MAX_TAB_ROWS)||
      d1BaseRowCount>sourceRowCount||
      !integer(changedExistingRows,0,d1BaseRowCount)||
      !integer(missingSourceRowsInD1,0,sourceRowCount)||
      !integer(candidateRowsForUpsert,0,MAX_TAB_ROWS)||
      !integer(unexpectedRowsInD1,0,MAX_TAB_ROWS)||
      !integer(duplicateRemoteRows,0,MAX_TAB_ROWS))fail('INVALID_COUNTS');
  if(unexpectedRowsInD1!==0||duplicateRemoteRows!==0)
    fail('UNEXPECTED_OR_DUPLICATE_REMOTE');
  const tailGrowth=sourceRowCount-d1BaseRowCount;
  if(tailGrowth!==missingSourceRowsInD1||
      candidateRowsForUpsert!==changedExistingRows+missingSourceRowsInD1)
    fail('INCONSISTENT_DELTA');
  if(tailGrowth>DESIGN_ONLY_MAX_TAIL_GROWTH_PER_TAB)
    fail('DESIGN_TAIL_CEILING');
  return {sheetName:name,sourceRowCount,d1BaseRowCount,changedExistingRows,
    missingSourceRowsInD1,candidateRowsForUpsert,tailGrowth};
}
/**
 * This models ONLY counts, not snapshot integrity, CAS preimages, actual byte
 * size, worker billing plan, quota usage, sqlite/D1 timing or exact outcome.
 */
export function assessT12IsolatedRecoveryCapacityV1({tabs}={}){
  if(!Array.isArray(tabs)||tabs.length!==2)fail('TAB_COUNT');
  const checked=NAMES.map((name,i)=>checkTab(tabs[i],name));
  const total=checked.reduce((n,t)=>n+t.candidateRowsForUpsert,0);
  if(total<1||total>DESIGN_ONLY_MAX_CANDIDATES)
    fail('DESIGN_TOTAL_CEILING');
  const requiredStatements=2+total+2; // shape of *existing* V1 CAS batch
  return Object.freeze({
    kind:T12_ISOLATED_RECOVERY_ENVELOPE_V1,
    tabs:checked.map(t=>Object.freeze(t)),
    totalCandidateRowPositions:total,
    hypotheticalExistingV1BatchStatements:requiredStatements,
    existingV1WritePathFits:
      total<=EXISTING_TOTAL_CEILING &&
      checked.every(t=>t.tailGrowth<=EXISTING_TAIL_CEILING),
    hypotheticalFreeInvocationQueryFit:
      requiredStatements<=FREE_D1_QUERIES_PER_INVOCATION,
    hypotheticalPaidInvocationQueryFit:
      requiredStatements<=PAID_D1_QUERIES_PER_INVOCATION,
    unknownActualCloudflarePlan:true,
    unknownRealProposalBytes:true,
    unknownRealSqlAndD1Runtime:true,
    unknownCurrentSourceAndMirrorPreimages:true,
    requiresNewAtomicCasDesignQualification:true,
    requiresDedicatedTestD1Qualification:true,
    requiresSeparateOwnerLiveReadAndWriteConsent:true,
    productionWriteAuthorized:false,
    triggerRestartAuthorized:false,
    cloudCreateCutoverAuthorized:false
  });
}
