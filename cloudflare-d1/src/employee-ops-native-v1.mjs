import { verifyEmployeeSessionCloudFirst } from './cloud-session-bridge-v3.mjs';

const ROOT_PATH = '/v1/employee/ops';
const HEALTH_PATH = '/v1/employee/ops/health';
const DEFAULT_ORIGINS = [
  'https://fawakhry.github.io',
  'https://trendos-ui.trendmall-contact.workers.dev',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];
const READ_ONLY_KEYS = new Set([
  'attendanceV1:state','attendanceV1:config',
  'hrV1:myRequests','hrV1:requests','hrV1:employees',
  'cleaningV1:status','pressControlV1:status'
]);
const TERMINAL_LINE_STATUSES = new Set(['تم التسليم','ملغى','مكرر','جاهز للاستلام','تم التنفيذ']);

function text(v){ return String(v == null ? '' : v).trim(); }
function key(v){ return text(v).toLowerCase(); }
function num(v,f=0){ const n=Number(v); return Number.isFinite(n)?n:f; }
function enabled(v){ return v===true || ['true','1','yes','نعم'].includes(key(v)); }
function json(data,status=200,headers={}) {
  return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
}
function configuredOrigins(env){
  const xs=String(env && env.CORS_ORIGINS || '').split(',').map(text).filter(Boolean);
  return xs.length?xs:DEFAULT_ORIGINS;
}
function corsHeaders(request,env){
  const origin=text(request.headers.get('Origin')), allowed=configuredOrigins(env);
  return {
    'access-control-allow-origin': origin && allowed.includes(origin) ? origin : allowed[0],
    'access-control-allow-methods':'GET,POST,OPTIONS',
    'access-control-allow-headers':'content-type,authorization',
    'access-control-max-age':'86400',
    vary:'Origin'
  };
}
function allowedOrigin(request,env){ const o=text(request.headers.get('Origin')); return !o || configuredOrigins(env).includes(o); }
function cairoParts(ms=Date.now()){
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(new Date(ms));
  const out={}; for(const p of parts) out[p.type]=p.value;
  return {dateKey:`${out.year}-${out.month}-${out.day}`, time:`${out.hour}:${out.minute}`};
}
function minutesOf(hhmm){ const m=String(hhmm||'').match(/^(\d{1,2}):(\d{2})$/); return m?Number(m[1])*60+Number(m[2]):0; }
function shortId(prefix){ return prefix+'-'+crypto.randomUUID().replace(/-/g,'').slice(0,8).toUpperCase(); }
function policyKey(action,op){ return text(action)+':'+text(op); }
function canReadInMode(mode,action,op){ return mode==='GENERAL' || (mode==='READONLY' && READ_ONLY_KEYS.has(policyKey(action,op))); }

async function control(env){
  const row=await env.DB.prepare("SELECT mode,policy_epoch AS policyEpoch FROM employee_ops_control_v1 WHERE singleton=1 AND marker='ENTRY614_EMPLOYEE_OPS_V1'").first();
  return row || {mode:'OFF',policyEpoch:0};
}
async function health(env){
  const c=await control(env);
  const tables=await env.DB.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('employee_attendance_days_v1','employee_attendance_pulses_v1','employee_hr_employees_v1','employee_hr_requests_v1','employee_cleaning_daily_v1','employee_press_sessions_v1')").first();
  return {
    success:true, schemaReady:Number(tables && tables.n || 0)===6,
    mode:text(c.mode)||'OFF', policyEpoch:Number(c.policyEpoch||0),
    googleBusinessCalls:0, appsScriptBusinessAuthority:false,
    authBridgeTemporary: true,
    domains:['attendance','hr','cleaning','press']
  };
}
async function parseBody(request){
  try { return {ok:true,body:await request.json()}; }
  catch { return {ok:false,response:json({success:false,code:'invalid-json',message:'Invalid JSON body'},400)}; }
}
async function authenticate(request,body,env){
  const auth=text(request.headers.get('Authorization'));
  const bearer=auth.match(/^Bearer\s+(.+)$/i);
  const username=text(body.username||body.name);
  const token=text(bearer?bearer[1]:body.token);
  if(!username||!token) return {ok:false,status:401,message:'username and employee session token are required'};
  const verified=await verifyEmployeeSessionCloudFirst(username,token,env,'edge');
  if(!verified || !verified.ok) return {ok:false,status:401,message:text(verified&&verified.message)||'Employee session rejected'};
  const b=verified.body||{}, u=b.user||{};
  return {
    ok:true,
    authSource:text(verified.authSource),
    user:{
      username:text(u.username||u.name||b.username||username),
      role:key(u.role||b.role||'service')||'service',
      department:text(u.department||b.department),
      screens:Array.isArray(u.screens)?u.screens.map(text):[]
    }
  };
}
async function writeEvent(env,domain,entityId,eventType,actor,payload,ms=Date.now()){
  await env.DB.prepare("INSERT INTO employee_ops_events_v1(domain,entity_id,event_type,actor,payload_json,created_at_ms) VALUES(?,?,?,?,?,?)")
    .bind(domain,text(entityId),eventType,text(actor),JSON.stringify(payload||{}),ms).run();
}
async function settingMap(env,table){
  const rows=await env.DB.prepare(`SELECT setting_key,value_text FROM ${table} WHERE active=1`).all();
  return Object.fromEntries((rows.results||[]).map(r=>[text(r.setting_key),text(r.value_text)]));
}
async function scheduledStart(env,dateKey){
  const special=await env.DB.prepare("SELECT start_time FROM employee_attendance_special_times_v1 WHERE date_key=? AND active=1").bind(dateKey).first();
  if(special && text(special.start_time)) return text(special.start_time);
  const cfg=await settingMap(env,'employee_attendance_settings_v1');
  return text(cfg.DEFAULT_WORKDAY_START)||'12:00';
}
async function attendanceRow(env,username,dateKey){
  return env.DB.prepare("SELECT * FROM employee_attendance_days_v1 WHERE username_key=? AND date_key=?").bind(key(username),dateKey).first();
}
async function attendanceStart(env,user,source){
  const now=Date.now(), p=cairoParts(now), existing=await attendanceRow(env,user.username,p.dateKey);
  if(existing) return existing;
  const id=shortId('ATT'), scheduled=await scheduledStart(env,p.dateKey);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO employee_attendance_days_v1(attendance_id,date_key,username_key,username,department,role,scheduled_start,started_at_ms,source) VALUES(?,?,?,?,?,?,?,?,?)")
      .bind(id,p.dateKey,key(user.username),user.username,user.department,user.role,scheduled,now,text(source)||'trendos-cloud'),
    env.DB.prepare("INSERT INTO employee_attendance_pulses_v1(attendance_id,pulse_type,source,created_at_ms) VALUES(?,?,?,?)")
      .bind(id,'start',text(source)||'TrendOS',now)
  ]);
  await writeEvent(env,'attendance',id,'start',user.username,{dateKey:p.dateKey,scheduledStart:scheduled},now);
  return attendanceRow(env,user.username,p.dateKey);
}
async function attendanceState(env,user){
  const p=cairoParts(), row=await attendanceRow(env,user.username,p.dateKey);
  const cfg=await settingMap(env,'employee_attendance_settings_v1');
  if(!row) return {success:true,date:p.dateKey,started:false,config:cfg};
  const pulses=await env.DB.prepare("SELECT pulse_type AS type,source,note,response_seconds AS responseSeconds,review_required AS reviewRequired,review_reason AS reviewReason,auto_generated AS autoGenerated,created_at_ms AS createdAtMs FROM employee_attendance_pulses_v1 WHERE attendance_id=? ORDER BY created_at_ms DESC LIMIT 40").bind(row.attendance_id).all();
  return {success:true,date:p.dateKey,started:true,attendance:{
    id:row.attendance_id,scheduledStart:row.scheduled_start,clockInTime:row.clock_in_time,
    differenceMinutes:Number(row.difference_minutes||0),attendanceStatus:row.attendance_status,
    dayStatus:row.day_status,startedAtMs:Number(row.started_at_ms),endedAtMs:row.ended_at_ms==null?null:Number(row.ended_at_ms)
  },pulses:pulses.results||[],config:cfg};
}
async function attendanceAction(env,user,op,body){
  op=text(op||'state');
  if(op==='state'||op==='config') return attendanceState(env,user);
  if(op==='start'){ await attendanceStart(env,user,body.source); return attendanceState(env,user); }
  const p=cairoParts(), row=await attendanceRow(env,user.username,p.dateKey);
  if(!row) return {success:false,code:'attendance-day-not-started',message:'ابدأ يوم العمل أولاً.'};
  const map={pause:'pause',resume:'resume',restStart:'rest_start',prayerStart:'prayer_break_start',confirm:'presence_confirmed',heartbeat:'heartbeat',missedCheck:'missed_check',end:'end_day'};
  const type=map[op]; if(!type) return {success:false,code:'attendance-op-unknown',message:'أمر دوام غير معروف.'};
  const now=Date.now();
  await env.DB.prepare("INSERT INTO employee_attendance_pulses_v1(attendance_id,pulse_type,source,note,response_seconds,review_required,review_reason,auto_generated,created_at_ms) VALUES(?,?,?,?,?,?,?,?,?)")
    .bind(row.attendance_id,type,text(body.source)||'TrendOS',text(body.note),Math.max(0,Math.trunc(num(body.responseSeconds,0))),op==='missedCheck'?1:0,op==='missedCheck'?'لم يتم تأكيد التواجد خلال المهلة':'',(op==='heartbeat'||op==='missedCheck')?1:0,now).run();
  if(op==='end') await env.DB.prepare("UPDATE employee_attendance_days_v1 SET ended_at_ms=?,day_status='ENDED',updated_at=CURRENT_TIMESTAMP WHERE attendance_id=?").bind(now,row.attendance_id).run();
  await writeEvent(env,'attendance',row.attendance_id,type,user.username,{op},now);
  return attendanceState(env,user);
}
async function clockin(env,user){
  const p=cairoParts(), row=await attendanceStart(env,user,'TrendOS');
  if(text(row.clock_in_time)) return {success:true,date:p.dateKey,scheduledStart:row.scheduled_start,clockInTime:row.clock_in_time,differenceMinutes:Number(row.difference_minutes||0),attendanceStatus:row.attendance_status,duplicatePrevented:true};
  const scheduled=text(row.scheduled_start)||await scheduledStart(env,p.dateKey);
  const diff=minutesOf(p.time)-minutesOf(scheduled);
  const status=diff>0?`متأخر ${diff} دقيقة`:diff<0?`مبكر ${Math.abs(diff)} دقيقة`:'في الموعد';
  await env.DB.prepare("UPDATE employee_attendance_days_v1 SET scheduled_start=?,clock_in_time=?,difference_minutes=?,attendance_status=?,updated_at=CURRENT_TIMESTAMP WHERE attendance_id=?")
    .bind(scheduled,p.time,diff,status,row.attendance_id).run();
  await writeEvent(env,'attendance',row.attendance_id,'clockin',user.username,{scheduled,actual:p.time,diff});
  return {success:true,date:p.dateKey,scheduledStart:scheduled,clockInTime:p.time,differenceMinutes:diff,attendanceStatus:status};
}
function adminOrService(user){ return user.role==='admin'||user.role==='service'; }
async function hrAction(env,user,op,body){
  op=text(op||'myRequests');
  if(op==='submitRequest'){
    const id=shortId('HR'), now=Date.now();
    await env.DB.prepare("INSERT INTO employee_hr_requests_v1(request_id,requested_at_ms,username_key,username,request_type,from_value,to_value,duration_text,reason,status) VALUES(?,?,?,?,?,?,?,?,?,'قيد المراجعة')")
      .bind(id,now,key(user.username),user.username,text(body.requestType)||'طلب HR',text(body.from),text(body.to),text(body.duration),text(body.reason)).run();
    await writeEvent(env,'hr',id,'submit-request',user.username,{requestType:text(body.requestType)},now);
    return {success:true,id,message:'تم تسجيل الطلب للمراجعة.'};
  }
  if(op==='employees'){
    if(user.role!=='admin') return {success:false,code:'forbidden',message:'ملفات الموظفين للإدارة فقط.'};
    const q=await env.DB.prepare("SELECT employee_id AS id,display_name AS name,username,primary_department AS department,role,relationship_type AS relationship,compensation_system AS compensation,status FROM employee_hr_employees_v1 ORDER BY display_name").all();
    return {success:true,employees:q.results||[]};
  }
  let sql="SELECT request_id AS id,request_type AS type,username AS employee,from_value AS 'from',to_value AS 'to',duration_text AS duration,reason,status FROM employee_hr_requests_v1";
  const binds=[];
  if(op==='myRequests'){ sql+=" WHERE username_key=?"; binds.push(key(user.username)); }
  else if(op==='requests'){ if(!adminOrService(user)) return {success:false,code:'forbidden',message:'عرض كل طلبات HR للإدارة فقط.'}; }
  else return {success:false,code:'hr-op-unknown',message:'أمر HR غير معروف.'};
  sql+=" ORDER BY requested_at_ms DESC LIMIT 100";
  const stmt=env.DB.prepare(sql); const q=binds.length?await stmt.bind(...binds).all():await stmt.all();
  return {success:true,requests:q.results||[]};
}
async function cleaningAction(env,user,op,body){
  op=text(op||'status'); const dateKey=text(body.date)||cairoParts().dateKey;
  const existing=await env.DB.prepare("SELECT cleaning_id AS id,date_key AS dateKey,completed_at_ms AS completedAtMs,status FROM employee_cleaning_daily_v1 WHERE date_key=? AND username_key=?").bind(dateKey,key(user.username)).first();
  if(op==='status') return {success:true,completed:!!existing,row:existing||null};
  if(op!=='complete') return {success:false,code:'cleaning-op-unknown',message:'أمر النظافة غير معروف.'};
  if(existing) return {success:true,duplicatePrevented:true,message:'التنظيف مسجل بالفعل.'};
  const id=shortId('CLN'), now=Date.now(), scheduled=await scheduledStart(env,dateKey);
  const payload=body.payload&&typeof body.payload==='object'?body.payload:{};
  await env.DB.prepare("INSERT INTO employee_cleaning_daily_v1(cleaning_id,date_key,username_key,username,department,scheduled_start,completed_at_ms,problem_found,problem_details) VALUES(?,?,?,?,?,?,?,?,?)")
    .bind(id,dateKey,key(user.username),user.username,user.department||text(payload.department),scheduled,now,enabled(payload.problemFound)?1:0,text(payload.problemDetails)).run();
  await writeEvent(env,'cleaning',id,'complete',user.username,{dateKey},now);
  return {success:true,message:'تم تسجيل تنظيف وتجهيز المكان.'};
}
async function pressQueue(env){
  const [cloud,imported]=await Promise.all([
    env.DB.prepare(`
      SELECT l.order_id AS orderId,l.priority,l.department,l.heat_press AS heatPress,
             COALESCE(r.status,l.status) AS status
        FROM t12_prod_lines l
        LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
        LEFT JOIN employee_core_archive_lines_v1 a ON a.line_id=l.line_id
       WHERE a.line_id IS NULL AND (l.heat_press=1 OR l.department LIKE '%مكبس%')
    `).all(),
    env.DB.prepare(`
      SELECT order_id AS orderId,priority,department,heat_press AS heatPress,status
        FROM employee_core_lines_v1
       WHERE active=1 AND (heat_press=1 OR department LIKE '%مكبس%')
    `).all()
  ]);
  const seen=new Set(), urgent=new Set();
  for(const r of [...(cloud.results||[]),...(imported.results||[])]){
    if(TERMINAL_LINE_STATUSES.has(text(r.status))) continue;
    const oid=text(r.orderId); if(!oid) continue;
    seen.add(oid);
    if(['عاجل','VIP'].includes(text(r.priority))) urgent.add(oid);
  }
  return {count:seen.size,urgent:urgent.size,orderIds:[...seen]};
}
async function pressSettings(env){ return settingMap(env,'employee_press_settings_v1'); }
function pressAllowed(user){
  if(user.role==='admin') return true;
  return /ريفان|revan|rivan|وائل|wael|ضياء|diaa/i.test(`${user.username} ${user.role} ${user.department}`);
}
async function openPress(env){ return env.DB.prepare("SELECT * FROM employee_press_sessions_v1 WHERE ended_at_ms IS NULL ORDER BY started_at_ms DESC LIMIT 1").first(); }
async function pressStatus(env){
  const q=await pressQueue(env), row=await openPress(env), cfg=await pressSettings(env);
  return {success:true,queue:q,config:{
    batchStart:text(cfg.PRESS_BATCH_START)||'17:00',
    graceMinutes:num(cfg.PRESS_GRACE_MINUTES,15),
    powerKw:num(cfg.PRESS_POWER_KW,0),
    electricityRate:num(cfg.ELECTRICITY_RATE_EGP_KWH,0)
  },session:row?{id:row.session_id,startedAtMs:Number(row.started_at_ms),operator:row.operator_username,queueAtStart:Number(row.queue_at_start||0)}:null};
}
async function pressAction(env,user,op,body){
  if(!pressAllowed(user)) return {success:false,code:'forbidden',message:'متابعة المكبس متاحة لريفان ووائل والإدارة.'};
  op=text(op||'status');
  if(op==='status') return pressStatus(env);
  const now=Date.now(), p=cairoParts(now), cfg=await pressSettings(env);
  if(op==='start'){
    if(await openPress(env)) return {success:false,code:'press-already-running',message:'المكبس مسجل شغال بالفعل.'};
    const q=await pressQueue(env), id='PRESS-'+p.dateKey.replace(/-/g,'')+'-'+crypto.randomUUID().replace(/-/g,'').slice(0,8).toUpperCase();
    await env.DB.prepare("INSERT INTO employee_press_sessions_v1(session_id,date_key,started_at_ms,operator_username_key,operator_username,support_operator,queue_at_start,urgent_queue_at_start,power_kw,electricity_rate) VALUES(?,?,?,?,?,?,?,?,?,?)")
      .bind(id,p.dateKey,now,key(user.username),user.username,text(cfg.PRESS_SUPPORT_OPERATOR)||'وائل',q.count,q.urgent,num(cfg.PRESS_POWER_KW,0)||null,num(cfg.ELECTRICITY_RATE_EGP_KWH,0)||null).run();
    await writeEvent(env,'press',id,'start',user.username,{queue:q},now);
    return {success:true,message:'تم تسجيل تشغيل المكبس.',status:await pressStatus(env)};
  }
  if(op==='stop'){
    const row=await openPress(env); if(!row) return {success:false,code:'press-not-running',message:'لا توجد جلسة مكبس مفتوحة.'};
    const mins=Math.max(0,(now-Number(row.started_at_ms||now))/60000), orders=Math.max(0,Math.trunc(num(body.ordersPressed,0)));
    const q=await pressQueue(env), kw=num(cfg.PRESS_POWER_KW,0), rate=num(cfg.ELECTRICITY_RATE_EGP_KWH,0), kwh=kw>0?kw*(mins/60):0, cost=kwh*rate;
    await env.DB.prepare("UPDATE employee_press_sessions_v1 SET ended_at_ms=?,queue_at_end=?,orders_pressed=?,duration_minutes=?,minutes_per_order=?,power_kw=?,consumption_kwh=?,electricity_rate=?,electricity_cost=?,electricity_cost_per_order=?,updated_at=CURRENT_TIMESTAMP WHERE session_id=?")
      .bind(now,q.count,orders,Math.round(mins*10)/10,orders?Math.round((mins/orders)*10)/10:null,kw||null,kw?Math.round(kwh*1000)/1000:null,rate||null,kw&&rate?Math.round(cost*100)/100:null,orders&&kw&&rate?Math.round((cost/orders)*100)/100:null,row.session_id).run();
    await writeEvent(env,'press',row.session_id,'stop',user.username,{ordersPressed:orders,queue:q},now);
    return {success:true,message:'تم تسجيل قفل المكبس.',status:await pressStatus(env)};
  }
  return {success:false,code:'press-op-unknown',message:'أمر المكبس غير معروف.'};
}

export function isEmployeeOpsNativePath(path){
  const p=String(path||'').replace(/\/+$/,'')||'/';
  return p===ROOT_PATH || p===HEALTH_PATH;
}
export async function handleEmployeeOpsNativeRequest(request,env){
  const cors=corsHeaders(request,env);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:cors});
  if(!allowedOrigin(request,env)) return json({success:false,code:'origin-not-allowed'},403,cors);
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(path===HEALTH_PATH){
    if(request.method!=='GET') return json({success:false,code:'method-not-allowed'},405,cors);
    return json(await health(env),200,cors);
  }
  if(path!==ROOT_PATH) return json({success:false,code:'not-found'},404,cors);
  if(request.method!=='POST') return json({success:false,code:'method-not-allowed'},405,cors);
  const parsed=await parseBody(request); if(!parsed.ok) return parsed.response;
  const body=parsed.body||{}, action=text(body.action), op=text(body.op);
  const c=await control(env);
  if(c.mode==='OFF') return json({success:false,code:'employee-ops-off',message:'Employee Ops Cloud authority is OFF.'},503,cors);
  if(!canReadInMode(c.mode,action,op)) return json({success:false,code:'employee-ops-readonly',message:'Employee Ops writes are not enabled.'},503,cors);
  const auth=await authenticate(request,body,env);
  if(!auth.ok) return json({success:false,code:'employee-session-rejected',message:auth.message},auth.status||401,cors);
  let result;
  if(action==='attendanceV1') result=await attendanceAction(env,auth.user,op,body);
  else if(action==='attendanceClockinV1') {
    if(op && op!=='clockin') result={success:false,code:'attendance-clockin-op-unknown',message:'أمر تسجيل الحضور غير معروف.'};
    else result=await clockin(env,auth.user);
  }
  else if(action==='hrV1') result=await hrAction(env,auth.user,op,body);
  else if(action==='cleaningV1') result=await cleaningAction(env,auth.user,op,body);
  else if(action==='pressControlV1') result=await pressAction(env,auth.user,op,body);
  else result={success:false,code:'employee-ops-action-unknown',message:'Employee Ops action is not supported.'};
  return json({...result,authority:'d1-employee-ops-v1',authSource:auth.authSource},result && result.success===false?400:200,cors);
}
