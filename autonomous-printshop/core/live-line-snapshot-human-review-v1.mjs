/* AP-116: in-memory FIRST LINE human review envelope for continuously
 * changing TrendOS. Never selects a line from aggregate counts or triggers work.
 * Caller claims are NOT independent authentication or source verification.
 * Only a protected host may supply internal keys; none are returned.
 */
import {reviewPrivateSameLineProvenanceV1} from './private-line-provenance-review-v1.mjs';
export const LIVE_LINE_SNAPSHOT_REVIEW_VERSION='AP116_LIVE_LINE_SNAPSHOT_REVIEW_V1';
const MAX_SOURCE_AGE_MS=60*1000;
const safeMs=v=>Number.isSafeInteger(v)&&v>0?v:null;
const str=v=>typeof v==='string'?v.trim():'';
const ZERO_STATUS=Object.freeze({DESIGN:'SOURCE_SNAPSHOT_NOT_QUALIFIED',
  MATERIAL:'SOURCE_SNAPSHOT_NOT_QUALIFIED',MACHINE:'SOURCE_SNAPSHOT_NOT_QUALIFIED'});

function cairoDay(nowMs){
  try{
    const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Cairo',
      day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(new Date(nowMs));
    const map=Object.fromEntries(parts.map(p=>[p.type,p.value]));
    return map.year+'-'+map.month+'-'+map.day;
  }catch{return null;}
}
function canonicalDay(value){
  const input=str(value);
  let day=input;
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(input)){
    const [d,m,y]=input.split('/');
    day=y+'-'+m+'-'+d;
  }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;
  const parsed=new Date(day+'T00:00:00.000Z');
  if(!Number.isFinite(parsed.getTime())||
    parsed.toISOString().slice(0,10)!==day)return null;
  return day;
}
function nonFly(v){
  return v===false||v===0||
    (typeof v==='string'&&['0','false','no','لا'].includes(v.trim().toLowerCase()));
}
function deny(reason){
  return {
    version:LIVE_LINE_SNAPSHOT_REVIEW_VERSION,
    purpose:'FIRST_LINE_HUMAN_EVIDENCE_REVIEW_ONLY',
    status:'BLOCKED_SAFE',
    reviewReason:reason,
    manualReviewPacketExists:false,
    privateSnapshotBound:false,
    sourceAttestationOnly:true,
    sourceAuthenticatedIndependently:false,
    evidenceStatusByKind:{...ZERO_STATUS},
    sameLineEvidenceVerified:false,
    pilotLineSelected:false,
    strictEligible:null,
    assignmentAllowed:false,taskClaimAllowed:false,readyWriteAllowed:false,
    operatorTaskActivationAllowed:false,productionWriteAllowed:false,
    orderIdsExposed:false,lineIdsExposed:false,customerPiiExposed:false,
    sourceRefsExposed:false,machineSerialExposed:false
  };
}
export function buildLiveLineSnapshotHumanReviewV1({
  rows=[],events=[],source={},selectedPrivateLineKey,nowMs
}={}){
  const now=safeMs(nowMs);
  const observed=safeMs(source?.observedAtMs);
  if(!now)return deny('CLOCK_UNVERIFIED');
  if(source?.kind!=='D1_QUALIFIED_SHADOW'||
     source?.authorizedRead!==true||source?.snapshotComplete!==true)
    return deny('SOURCE_ENVELOPE_NOT_ATTESTED');
  if(!observed||observed>now||now-observed>MAX_SOURCE_AGE_MS)
    return deny('SNAPSHOT_STALE_OR_FUTURE');
  if(!Array.isArray(rows)||!Array.isArray(events)||
     rows.length>1000||events.length>5000)
    return deny('BOUNDED_SNAPSHOT_NOT_PROVEN');
  const key=str(selectedPrivateLineKey);
  if(!key||key.length>256)return deny('EXPLICIT_PRIVATE_LINE_REQUIRED');
  // The caller must select one private line in an authorized workspace.
  // No sort/order/priority selection is allowed by this pure helper.
  const matches=rows.filter(r=>r&&typeof r==='object'&&str(r.lineId??r.line_id)===key);
  if(matches.length!==1)return deny('PRIVATE_LINE_MISSING_OR_AMBIGUOUS');
  const line=matches[0];
  if(line.lineActive!==true||line.orderActive!==true||line.archived!==false||
     str(line.status)!=='طلب جديد')
    return deny('LINE_STATUS_OR_ARCHIVE_REVIEW');
  if(!['طباعة','ليزر'].includes(str(line.department)))
    return deny('LINE_DEPARTMENT_UNQUALIFIED');
  if(!nonFly(line.flyPrint))return deny('FLY_FLAG_REVIEW');
  const date=canonicalDay(line.dueDate);
  const today=cairoDay(now);
  if(!date||!today)return deny('DUE_DATE_UNVERIFIED');
  if(date<=today)return deny(date<today?'OVERDUE_HUMAN_ESCALATION':
    'DUE_TODAY_HUMAN_REVIEW');
  const evidence=reviewPrivateSameLineProvenanceV1({
    privateLineKey:key,events,nowMs:now,sourceAccessVerified:true
  });
  // The evidence source and D1 freshness remain caller-attested. Even a
  // syntactically valid private packet cannot certify source provenance.
  return {
    ...deny('EXTERNAL_DESIGN_MATERIAL_MACHINE_PROOFS_REQUIRED'),
    status:'HUMAN_REVIEW_ONLY',
    reviewReason:'FUTURE_DATE_PRIVATE_SOURCE_ATTESTED_ONLY',
    manualReviewPacketExists:true,
    privateSnapshotBound:true,
    evidenceStatusByKind:{...evidence.statusByKind}
  };
}
