export const EMPLOYEE_BLOCKER_EVENTS_VERSION='EMPLOYEE_BLOCKER_EVENTS_V1_20261007';

export const EMPLOYEE_BLOCKER_REASON_CODES=Object.freeze({
  MACHINE_BREAKDOWN:Object.freeze({
    code:'MACHINE_BREAKDOWN',
    legacyLabelAr:'عطل ماكينة',
    titleAr:'عطل ماكينة',
    responsibleActor:'MACHINE_AGENT',
    responsibleActorAr:'Machine Agent',
    severity:'CRITICAL',
    ownerActionRequired:false,
    protectedDecision:false
  }),
  MATERIAL_MISSING:Object.freeze({
    code:'MATERIAL_MISSING',
    legacyLabelAr:'خامة ناقصة',
    titleAr:'خامة ناقصة',
    responsibleActor:'MATERIAL_AGENT',
    responsibleActorAr:'Material Agent',
    severity:'HIGH',
    ownerActionRequired:false,
    protectedDecision:false
  }),
  WAITING_CUSTOMER:Object.freeze({
    code:'WAITING_CUSTOMER',
    legacyLabelAr:'انتظار العميل',
    titleAr:'انتظار رد العميل',
    responsibleActor:'COMMS_AGENT',
    responsibleActorAr:'Comms / Customer Service',
    severity:'HIGH',
    ownerActionRequired:false,
    protectedDecision:false
  }),
  PRICE_OR_OWNER_DECISION:Object.freeze({
    code:'PRICE_OR_OWNER_DECISION',
    legacyLabelAr:'محتاج سعر أو قرار',
    titleAr:'سعر أو قرار محمي مطلوب',
    responsibleActor:'OWNER_EXCEPTION_CONSOLE',
    responsibleActorAr:'المالك / Owner Exception Console',
    severity:'HIGH',
    ownerActionRequired:true,
    protectedDecision:true
  }),
  QUALITY_ISSUE:Object.freeze({
    code:'QUALITY_ISSUE',
    legacyLabelAr:'مشكلة جودة',
    titleAr:'مشكلة جودة',
    responsibleActor:'EMPLOYEE_SUPERVISOR',
    responsibleActorAr:'Employee Supervisor',
    severity:'HIGH',
    ownerActionRequired:false,
    protectedDecision:false
  }),
  HELP_NEEDED:Object.freeze({
    code:'HELP_NEEDED',
    legacyLabelAr:'محتاج مساعدة',
    titleAr:'الموظف يحتاج مساعدة',
    responsibleActor:'EMPLOYEE_SUPERVISOR',
    responsibleActorAr:'Employee Supervisor',
    severity:'MEDIUM',
    ownerActionRequired:false,
    protectedDecision:false
  })
});

const EVENT_TYPES=new Set(['REPORTED','ACKNOWLEDGED','RESOLVED']);
const SOURCE_KINDS=new Set(['EMPLOYEE','SUPERVISOR','SYSTEM']);

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}

export function mapLegacyAndonReasonV1(value){
  const key=text(value)
    .toLowerCase()
    .replace(/[إأآا]/g,'ا')
    .replace(/[ى]/g,'ي')
    .replace(/[ةه]/g,'ه')
    .replace(/\s+/g,' ')
    .trim();
  const pairs=[
    ['عطل ماكينه','MACHINE_BREAKDOWN'],
    ['خامه ناقصه','MATERIAL_MISSING'],
    ['انتظار العميل','WAITING_CUSTOMER'],
    ['محتاج سعر او قرار','PRICE_OR_OWNER_DECISION'],
    ['مشكله جوده','QUALITY_ISSUE'],
    ['محتاج مساعده','HELP_NEEDED']
  ];
  const hit=pairs.find(([label])=>key===label);
  return hit?hit[1]:'';
}

export function blockerReasonPolicyV1(reasonCode){
  return EMPLOYEE_BLOCKER_REASON_CODES[upper(reasonCode)]||null;
}

export function blockerWriteAllowedV1(mode){
  return ['SHADOW','CANARY','GENERAL'].includes(upper(mode));
}

export function buildEmployeeBlockerEventV1(input={}){
  const eventType=upper(input.eventType||input.event_type);
  const reasonCode=upper(input.reasonCode||input.reason_code);
  const sourceKind=upper(input.sourceKind||input.source_kind);
  const policy=blockerReasonPolicyV1(reasonCode);
  const blockerId=text(input.blockerId||input.blocker_id);
  const eventId=text(input.eventId||input.event_id);
  const actorId=text(input.actorId||input.actor_id);
  const idempotencyKey=text(input.idempotencyKey||input.idempotency_key);
  const occurredAtMs=num(input.occurredAtMs??input.occurred_at_ms);
  const detailText=text(input.detailText??input.detail_text);

  if(!EVENT_TYPES.has(eventType)) return {ok:false,code:'EVENT_TYPE_INVALID'};
  if(!policy) return {ok:false,code:'REASON_CODE_INVALID'};
  if(!SOURCE_KINDS.has(sourceKind)) return {ok:false,code:'SOURCE_KIND_INVALID'};
  if(!eventId) return {ok:false,code:'EVENT_ID_REQUIRED'};
  if(!blockerId) return {ok:false,code:'BLOCKER_ID_REQUIRED'};
  if(!actorId) return {ok:false,code:'ACTOR_ID_REQUIRED'};
  if(!idempotencyKey) return {ok:false,code:'IDEMPOTENCY_KEY_REQUIRED'};
  if(!occurredAtMs) return {ok:false,code:'OCCURRED_AT_REQUIRED'};
  if(detailText.length>500) return {ok:false,code:'DETAIL_TOO_LONG'};

  return {
    ok:true,
    event:{
      eventId,
      blockerId,
      eventType,
      reasonCode,
      operatorId:text(input.operatorId||input.operator_id),
      department:text(input.department),
      orderId:text(input.orderId||input.order_id),
      lineId:text(input.lineId||input.line_id),
      detailText,
      sourceKind,
      actorId,
      idempotencyKey,
      occurredAtMs
    },
    policy
  };
}

function normalizedEvent(row={}){
  const built=buildEmployeeBlockerEventV1(row);
  return built.ok?{...built.event,policy:built.policy}:null;
}

function compareEvent(a,b){
  if(a.occurredAtMs!==b.occurredAtMs)return a.occurredAtMs-b.occurredAtMs;
  return a.eventId.localeCompare(b.eventId);
}

export function projectEmployeeBlockersV1(events=[]){
  const groups=new Map();
  const invalid=[];
  for(const row of Array.isArray(events)?events:[]){
    const ev=normalizedEvent(row);
    if(!ev){
      invalid.push(row);
      continue;
    }
    if(!groups.has(ev.blockerId))groups.set(ev.blockerId,[]);
    groups.get(ev.blockerId).push(ev);
  }

  const open=[],resolved=[];
  for(const [blockerId,items] of groups){
    items.sort(compareEvent);
    const latest=items[items.length-1];
    const firstReport=items.find(x=>x.eventType==='REPORTED')||items[0];
    const value={
      blockerId,
      reasonCode:latest.reasonCode||firstReport.reasonCode,
      operatorId:latest.operatorId||firstReport.operatorId,
      department:latest.department||firstReport.department,
      orderId:latest.orderId||firstReport.orderId,
      lineId:latest.lineId||firstReport.lineId,
      state:latest.eventType==='RESOLVED'?'RESOLVED':(items.some(x=>x.eventType==='ACKNOWLEDGED')?'ACKNOWLEDGED':'OPEN'),
      reportedAtMs:firstReport.occurredAtMs,
      latestAtMs:latest.occurredAtMs,
      eventCount:items.length,
      responsibleActor:latest.policy.responsibleActor,
      responsibleActorAr:latest.policy.responsibleActorAr,
      severity:latest.policy.severity,
      ownerActionRequired:latest.policy.ownerActionRequired,
      protectedDecision:latest.policy.protectedDecision
    };
    (value.state==='RESOLVED'?resolved:open).push(value);
  }

  open.sort((a,b)=>{
    const rank={CRITICAL:0,HIGH:1,MEDIUM:2};
    return (rank[a.severity]??9)-(rank[b.severity]??9)||a.reportedAtMs-b.reportedAtMs||a.blockerId.localeCompare(b.blockerId);
  });
  resolved.sort((a,b)=>b.latestAtMs-a.latestAtMs||a.blockerId.localeCompare(b.blockerId));

  return {
    version:EMPLOYEE_BLOCKER_EVENTS_VERSION,
    open,
    resolved,
    counts:{
      totalBlockers:open.length+resolved.length,
      open:open.length,
      acknowledged:open.filter(x=>x.state==='ACKNOWLEDGED').length,
      resolved:resolved.length,
      ownerActionRequired:open.filter(x=>x.ownerActionRequired).length,
      invalidEvents:invalid.length
    }
  };
}

function bump(map,key){
  const k=text(key)||'UNSPECIFIED';
  map.set(k,(map.get(k)||0)+1);
}

export function buildEmployeeBlockerSummaryV1(events=[]){
  const projection=projectEmployeeBlockersV1(events);
  const byReason=new Map(),byDepartment=new Map(),byResponsibleActor=new Map();
  let critical=0,high=0,medium=0;
  for(const b of projection.open){
    bump(byReason,b.reasonCode);
    bump(byDepartment,b.department);
    bump(byResponsibleActor,b.responsibleActor);
    if(b.severity==='CRITICAL')critical++;
    else if(b.severity==='HIGH')high++;
    else medium++;
  }
  const list=m=>[...m.entries()].map(([key,count])=>({key,count})).sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key,'ar'));
  return {
    version:EMPLOYEE_BLOCKER_EVENTS_VERSION,
    mode:'READ_ONLY_AGGREGATE',
    counts:{
      ...projection.counts,
      critical,
      high,
      medium
    },
    byReason:list(byReason),
    byDepartment:list(byDepartment),
    byResponsibleActor:list(byResponsibleActor),
    rawBlockerIdsExposed:false,
    rawOrderIdsExposed:false,
    rawLineIdsExposed:false,
    employeeIdentityExposed:false,
    detailTextExposed:false
  };
}
