/* AP-109: aggregate-only D1 owner review. No IO, raw identifiers, or dispatch.
 * AP-106 UTC screenshot is historical; AP-107 Cairo query has not run live.
 * Inputs are assertions from a caller, NOT authenticated runtime proof.
 */
export const FIRST_PILOT_AGGREGATE_REVIEW_VERSION='AP109_FIRST_PILOT_AGGREGATE_REVIEW_V1';

const BUCKETS=Object.freeze({
  AP106_UTC_HISTORICAL:new Set(['OVERDUE_UTC','DUE_TODAY_UTC','FUTURE_UTC']),
  AP107_CAIRO_LOCAL:new Set([
    'OVERDUE_HUMAN_REVIEW','DUE_TODAY_HUMAN_REVIEW',
    'FUTURE_DATE_EVIDENCE_REVIEW','DATE_FORMAT_OR_TIME_REVIEW',
    'INVALID_CALENDAR_DATE_REVIEW','FLY_FLAG_REVIEW'
  ])
});
const REQUIRED_EVIDENCE=Object.freeze({
  DESIGN:Object.freeze(['SAME_LINE_PRIVATE_ASSET_SHA256','STRUCTURED_APPROVAL','PREFLIGHT_PASS','AUTHENTICATED_DESIGN_SOURCE']),
  MATERIAL:Object.freeze(['SAME_LINE_ACTIVE_MATERIAL','AUTHORITATIVE_STOCK','POSITIVE_CONSUMPTION','AUTHENTICATED_MATERIAL_SOURCE']),
  MACHINE:Object.freeze(['SAME_LINE_MACHINE_MAPPING','REGISTERED_MACHINE_ID','SERIAL_OR_ASSET_TAG','HEALTH_OBSERVATION','AUTHENTICATED_MACHINE_SOURCE'])
});
const BASE_COUNTS=()=>({overdue:0,dueToday:0,future:0,requiresDateReview:0,total:0});

function intCount(value){
  return typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=100000;
}
function classify(bucket){
  if(bucket==='OVERDUE_UTC'||bucket==='OVERDUE_HUMAN_REVIEW') return 'overdue';
  if(bucket==='DUE_TODAY_UTC'||bucket==='DUE_TODAY_HUMAN_REVIEW') return 'dueToday';
  if(bucket==='FUTURE_UTC'||bucket==='FUTURE_DATE_EVIDENCE_REVIEW') return 'future';
  return 'requiresDateReview';
}
export function buildFirstPilotAggregateReviewV1({basis,rows,expectedPrintingLines=null,readinessEvidenceRows=null}={}){
  const validBasis=Object.hasOwn(BUCKETS,basis);
  const validRows=Array.isArray(rows)&&rows.length<=20;
  const departments={printing:BASE_COUNTS(),laser:BASE_COUNTS()};
  const problems=[];
  const seen=new Set();
  if(!validBasis) problems.push('UNRECOGNIZED_DATE_BASIS');
  if(!validRows) problems.push('AGGREGATE_ROWS_MISSING_OR_UNBOUNDED');
  if(validBasis&&validRows){
    for(const item of rows){
      const dept=item?.department;
      const bucket=item?.dueBucket;
      const count=item?.lineCount;
      if((dept!=='طباعة'&&dept!=='ليزر')||
         !BUCKETS[basis].has(bucket)||!intCount(count)){
        problems.push('UNRECOGNIZED_OR_INVALID_AGGREGATE_ROW');
        continue;
      }
      const key=dept+'|'+bucket;
      if(seen.has(key)){
        problems.push('DUPLICATE_AGGREGATE_BUCKET');
        continue;
      }
      seen.add(key);
      const dest=dept==='طباعة'?departments.printing:departments.laser;
      dest[classify(bucket)]+=count;
      dest.total+=count;
    }
  }
  if(expectedPrintingLines!==null&&(!intCount(expectedPrintingLines)||
      departments.printing.total!==expectedPrintingLines)){
    problems.push('PRINTING_TOTAL_MISMATCH');
  }
  if(readinessEvidenceRows!==null&&!intCount(readinessEvidenceRows)){
    problems.push('INVALID_HISTORICAL_READINESS_COUNT');
  }
  const valid=problems.length===0;
  // Never emit user-controlled row contents, refs, clock assertions or identifiers.
  // Even a clean owner-console aggregate is not a source-verified same-line line.
  const summary=valid?departments:{printing:BASE_COUNTS(),laser:BASE_COUNTS()};
  return {
    version:FIRST_PILOT_AGGREGATE_REVIEW_VERSION,
    purpose:'FIRST_LINE_HUMAN_EVIDENCE_REVIEW_ONLY',
    classification:valid?'AGGREGATE_VALIDATED_SYNTACTICALLY':'BLOCKED_SAFE',
    sourceBasis:valid?basis:'UNKNOWN',
    dateAuthority:valid&&basis==='AP106_UTC_HISTORICAL'
      ?'HISTORICAL_UTC_NOT_CAIRO_REVALIDATED'
      :valid?'CAIRO_QUERY_CLAIM_NOT_LIVE_VERIFIED':'UNVERIFIED',
    safeSummary:summary,
    historicalReadinessEvidenceRows:valid?readinessEvidenceRows:null,
    observedReadinessNotCurrent:true,
    humanQueues:{
      overdue:'ESCALATE_TO_AUTHORIZED_HUMAN_WITHOUT_AUTOMATED_ASSIGNMENT',
      dueToday:'HUMAN_DEADLINE_REVIEW',
      future:'POTENTIAL_MANUAL_EVIDENCE_REVIEW_ONLY',
      requiresDateReview:'FIX_DATE_OR_FLY_FLAG_MANUALLY'
    },
    evidenceToAcquire:REQUIRED_EVIDENCE,
    sameLineEvidenceVerified:false,
    sourceAuthenticatedForIndividualLine:false,
    pilotLineSelected:false,
    candidateExists:false,
    strictEligible:null,
    assignmentAllowed:false,
    taskClaimAllowed:false,
    readyWriteAllowed:false,
    operatorTaskActivationAllowed:false,
    productionWriteAllowed:false,
    rawOrderIdsExposed:false,
    rawLineIdsExposed:false,
    customerPiiExposed:false,
    validationProblems:problems
  };
}
