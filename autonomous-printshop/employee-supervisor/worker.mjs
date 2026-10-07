import {
  buildEmployeeBlockerEventV1,
  projectEmployeeBlockersV1,
  buildEmployeeBlockerSummaryV1,
  blockerWriteAllowedV1
} from '../core/employee-blocker-events-v1.mjs';
import {
  readEmployeeSupervisorControlV1,
  recordEmployeeBlockerEventV1
} from '../core/employee-blocker-event-writer-v1.mjs';

const SERVICE='autonomous-printshop-employee-supervisor';
const AUTH_PATH='/v1/employee/auth/session';
const MAX_DETAIL=500;
const DEFAULT_ORIGINS=[
  'https://fawakhry.github.io',
  'https://trendos-ui.pages.dev',
  'https://trendos-ui.trendmall-contact.workers.dev',
  'http://localhost:8000','http://127.0.0.1:8000',
  'http://localhost:5500','http://127.0.0.1:5500'
];

function text(v){return String(v==null?'':v).trim();}
function key(v){return text(v).toLowerCase();}
function json(body,status=200,headers={}){
  return new Response(JSON.stringify(body),{
    status,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}
  });
}
function origins(env){
  const v=String(env&&env.CORS_ORIGINS||'').split(',').map(text).filter(Boolean);
  return v.length?v:DEFAULT_ORIGINS;
}
function cors(request,env){
  const origin=text(request.headers.get('Origin'));
  const allowed=origins(env);
  return {
    'access-control-allow-origin':origin&&allowed.includes(origin)?origin:allowed[0],
    'access-control-allow-methods':'GET,POST,OPTIONS',
    'access-control-allow-headers':'content-type,authorization',
    'access-control-max-age':'86400',
    vary:'Origin'
  };
}
function originAllowed(request,env){
  const origin=text(request.headers.get('Origin'));
  return !origin||origins(env).includes(origin);
}
async function parseBody(request){
  try{return {ok:true,body:await request.json()};}
  catch{return {ok:false,response:json({success:false,code:'INVALID_JSON'},400)};}
}
function bearer(request){
  const h=text(request.headers.get('Authorization'));
  const m=h.match(/^Bearer\s+(.+)$/i);
  return text(m&&m[1]);
}
function isManager(user={}){
  const role=key(user.role);
  return role==='admin'||role==='manager'||role==='supervisor';
}
async function authenticate(request,body,env){
  const username=text(body&&body.username);
  const token=bearer(request);
  if(!username||!token)return {ok:false,response:json({success:false,code:'EMPLOYEE_SESSION_REQUIRED'},401,cors(request,env))};
  if(!env.TRENDOS||typeof env.TRENDOS.fetch!=='function'){
    return {ok:false,response:json({success:false,code:'TRENDOS_AUTH_BINDING_REQUIRED'},503,cors(request,env))};
  }
  const response=await env.TRENDOS.fetch(new Request('https://trendos-d1-api'+AUTH_PATH,{
    method:'POST',
    headers:{'content-type':'application/json','accept':'application/json'},
    body:JSON.stringify({username,token})
  }));
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.success!==true){
    return {ok:false,response:json({success:false,code:'EMPLOYEE_SESSION_REJECTED'},401,cors(request,env))};
  }
  const user=data.user||{};
  return {
    ok:true,
    user:{
      username:text(user.username||user.name||data.username||username),
      role:key(user.role||'service')||'service',
      department:text(user.department)
    }
  };
}
async function health(env){
  const [control,eventRow,task]=await Promise.all([
    readEmployeeSupervisorControlV1(env.DB),
    env.DB.prepare("SELECT COUNT(*) AS n FROM autonomous_employee_blocker_events").first(),
    env.DB.prepare("SELECT mode,(SELECT COUNT(*) FROM operator_tasks) AS tasks FROM operator_task_control WHERE singleton_id=1").first()
  ]);
  return {
    success:true,
    service:SERVICE,
    mode:'EMPLOYEE_SUPERVISOR_BLOCKER_SERVICE',
    controlMode:control.mode,
    controlEpoch:control.epoch,
    eventRows:Number(eventRow&&eventRow.n||0),
    writesAccepted:blockerWriteAllowedV1(control.mode),
    writeAuthority:'AUTONOMOUS_EMPLOYEE_BLOCKER_EVENTS_ONLY',
    operatorTaskMode:text(task&&task.mode)||'OFF',
    operatorTasks:Number(task&&task.tasks||0),
    businessWrites:false,
    orderWrite:false,
    lineWrite:false,
    accountingWrite:false,
    employeeAssignment:false,
    authAuthority:'TRENDOS_NATIVE_SESSION_CONSUMER'
  };
}
async function loadBlockerEvents(env,blockerId=''){
  const sql=blockerId
    ? `SELECT event_id AS eventId,blocker_id AS blockerId,event_type AS eventType,reason_code AS reasonCode,operator_id AS operatorId,department,order_id AS orderId,line_id AS lineId,detail_text AS detailText,source_kind AS sourceKind,actor_id AS actorId,idempotency_key AS idempotencyKey,occurred_at_ms AS occurredAtMs FROM autonomous_employee_blocker_events WHERE blocker_id=? ORDER BY occurred_at_ms,event_id`
    : `SELECT event_id AS eventId,blocker_id AS blockerId,event_type AS eventType,reason_code AS reasonCode,operator_id AS operatorId,department,order_id AS orderId,line_id AS lineId,detail_text AS detailText,source_kind AS sourceKind,actor_id AS actorId,idempotency_key AS idempotencyKey,occurred_at_ms AS occurredAtMs FROM autonomous_employee_blocker_events ORDER BY occurred_at_ms,event_id LIMIT 2000`;
  const q=blockerId?await env.DB.prepare(sql).bind(blockerId).all():await env.DB.prepare(sql).all();
  return q.results||[];
}
function newId(prefix){return prefix+'-'+crypto.randomUUID();}
function clientRequestId(body){
  return text(body&&body.clientRequestId||body&&body.client_request_id);
}
async function reportBlocker(request,body,env,auth){
  const requestId=clientRequestId(body);
  if(!requestId)return json({success:false,code:'CLIENT_REQUEST_ID_REQUIRED'},400,cors(request,env));
  const detail=text(body.detailText||body.detail||'');
  if(detail.length>MAX_DETAIL)return json({success:false,code:'DETAIL_TOO_LONG'},400,cors(request,env));
  const blockerId=newId('BLK');
  const input={
    eventId:newId('EV'),
    blockerId,
    eventType:'REPORTED',
    reasonCode:text(body.reasonCode),
    operatorId:auth.user.username,
    department:text(body.department)||auth.user.department,
    orderId:text(body.orderId),
    lineId:text(body.lineId),
    detailText:detail,
    sourceKind:'EMPLOYEE',
    actorId:auth.user.username,
    idempotencyKey:'REPORT:'+auth.user.username+':'+requestId,
    occurredAtMs:Date.now()
  };
  const valid=buildEmployeeBlockerEventV1(input);
  if(!valid.ok)return json({success:false,code:valid.code},400,cors(request,env));
  try{
    const out=await recordEmployeeBlockerEventV1(env.DB,input);
    return json({success:true,inserted:out.inserted,blockerId:out.blockerId,reasonCode:out.reasonCode,state:'OPEN'},200,cors(request,env));
  }catch(err){
    const code=text(err&&err.code||err&&err.message);
    const status=code==='EMPLOYEE_SUPERVISOR_CONTROL_OFF'?409:400;
    return json({success:false,code:code||'BLOCKER_WRITE_FAILED'},status,cors(request,env));
  }
}
async function currentBlocker(env,blockerId){
  const events=await loadBlockerEvents(env,blockerId);
  const projection=projectEmployeeBlockersV1(events);
  return {
    events,
    open:projection.open.find(x=>x.blockerId===blockerId)||null,
    resolved:projection.resolved.find(x=>x.blockerId===blockerId)||null
  };
}
async function transitionBlocker(request,body,env,auth,eventType){
  const blockerId=text(body.blockerId);
  const requestId=clientRequestId(body);
  if(!blockerId)return json({success:false,code:'BLOCKER_ID_REQUIRED'},400,cors(request,env));
  if(!requestId)return json({success:false,code:'CLIENT_REQUEST_ID_REQUIRED'},400,cors(request,env));
  const current=await currentBlocker(env,blockerId);
  if(!current.open){
    if(current.resolved)return json({success:true,inserted:false,blockerId,state:'RESOLVED'},200,cors(request,env));
    return json({success:false,code:'BLOCKER_NOT_FOUND'},404,cors(request,env));
  }
  if(eventType==='ACKNOWLEDGED'&&!isManager(auth.user)){
    return json({success:false,code:'SUPERVISOR_REQUIRED'},403,cors(request,env));
  }
  if(eventType==='RESOLVED'&&!isManager(auth.user)&&key(current.open.operatorId)!==key(auth.user.username)){
    return json({success:false,code:'BLOCKER_OWNER_OR_SUPERVISOR_REQUIRED'},403,cors(request,env));
  }
  const input={
    eventId:newId('EV'),
    blockerId,
    eventType,
    reasonCode:current.open.reasonCode,
    operatorId:current.open.operatorId,
    department:current.open.department,
    orderId:current.open.orderId,
    lineId:current.open.lineId,
    detailText:text(body.detailText||body.detail||''),
    sourceKind:isManager(auth.user)?'SUPERVISOR':'EMPLOYEE',
    actorId:auth.user.username,
    idempotencyKey:eventType+':'+auth.user.username+':'+requestId,
    occurredAtMs:Date.now()
  };
  try{
    const out=await recordEmployeeBlockerEventV1(env.DB,input);
    return json({success:true,inserted:out.inserted,blockerId,state:eventType==='RESOLVED'?'RESOLVED':'ACKNOWLEDGED'},200,cors(request,env));
  }catch(err){
    const code=text(err&&err.code||err&&err.message);
    const status=code==='EMPLOYEE_SUPERVISOR_CONTROL_OFF'?409:400;
    return json({success:false,code:code||'BLOCKER_WRITE_FAILED'},status,cors(request,env));
  }
}
async function myOpen(request,env,auth){
  const projection=projectEmployeeBlockersV1(await loadBlockerEvents(env));
  const mine=projection.open.filter(x=>key(x.operatorId)===key(auth.user.username)).map(x=>({
    blockerId:x.blockerId,
    reasonCode:x.reasonCode,
    department:x.department,
    orderId:x.orderId,
    lineId:x.lineId,
    state:x.state,
    responsibleActor:x.responsibleActor,
    severity:x.severity,
    ownerActionRequired:x.ownerActionRequired,
    reportedAtMs:x.reportedAtMs,
    latestAtMs:x.latestAtMs
  }));
  return json({
    success:true,
    mode:'EMPLOYEE_SELF_BLOCKER_VIEW',
    blockers:mine,
    employeeIdentityExposedToSelf:false,
    otherEmployeeIdentityExposed:false,
    businessWrites:false
  },200,cors(request,env));
}
async function managerSummary(request,env,auth){
  if(!isManager(auth.user))return json({success:false,code:'SUPERVISOR_REQUIRED'},403,cors(request,env));
  const summary=buildEmployeeBlockerSummaryV1(await loadBlockerEvents(env));
  return json({success:true,summary,businessWrites:false,employeeAssignment:false},200,cors(request,env));
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const path=url.pathname.replace(/\/+$/,'')||'/';
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(request,env)});
    if(!originAllowed(request,env))return json({success:false,code:'ORIGIN_DENIED'},403,cors(request,env));
    if(request.method==='GET'&&(path==='/'||path==='/health')){
      try{return json(await health(env),200,cors(request,env));}
      catch(err){return json({success:false,code:'HEALTH_ERROR',message:text(err&&err.message)},503,cors(request,env));}
    }
    if(request.method!=='POST')return json({success:false,code:'METHOD_NOT_ALLOWED'},405,cors(request,env));
    const parsed=await parseBody(request);
    if(!parsed.ok)return parsed.response;
    const auth=await authenticate(request,parsed.body,env);
    if(!auth.ok)return auth.response;

    if(path==='/blockers/report')return reportBlocker(request,parsed.body,env,auth);
    if(path==='/blockers/acknowledge')return transitionBlocker(request,parsed.body,env,auth,'ACKNOWLEDGED');
    if(path==='/blockers/resolve')return transitionBlocker(request,parsed.body,env,auth,'RESOLVED');
    if(path==='/blockers/my-open')return myOpen(request,env,auth);
    if(path==='/blockers/summary')return managerSummary(request,env,auth);
    return json({success:false,code:'NOT_FOUND'},404,cors(request,env));
  }
};
