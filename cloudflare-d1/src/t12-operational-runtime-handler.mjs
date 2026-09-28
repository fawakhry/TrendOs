import { verifyOrdersEdgeToken } from './edge-orders-read-v1.mjs';

const BASE='/v1/t12/orders/line-runtime';
const UPDATE_PATH=BASE+'/update';
const NOTIFY_PATH=BASE+'/notify';
const HEALTH_PATH=BASE+'/health';

const STATUSES=new Set([
  'طلب جديد','بدأ التنفيذ','تحت التنفيذ','جاهز للاستلام',
  'تم التسليم','متوقف','مكرر','ملغى'
]);

function text(v){return String(v==null?'':v).trim();}
function origins(env){
  const x=text(env&&env.CORS_ORIGINS).split(',').map(v=>v.trim()).filter(Boolean);
  return x.length?x:['https://fawakhry.github.io'];
}
function cors(req,env){
  const o=text(req.headers.get('Origin')),a=origins(env);
  return {
    'access-control-allow-origin':o&&a.includes(o)?o:a[0],
    'access-control-allow-methods':'GET,POST,OPTIONS',
    'access-control-allow-headers':'content-type,authorization',
    'access-control-max-age':'86400',
    vary:'Origin'
  };
}
function json(data,status,req,env){
  return new Response(JSON.stringify(data),{
    status:status||200,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...cors(req,env)}
  });
}
function bearer(req){
  const m=text(req.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);
  return m?text(m[1]):'';
}
function laneForDepartment(dept){
  const d=text(dept);
  if(d.includes('طباعة'))return 'print';
  if(d.includes('ليزر'))return 'laser';
  return '';
}
function actorAllowed(payload,line){
  const role=text(payload&&payload.role).toLowerCase();
  if(role==='admin')return true;
  const allowed=Array.isArray(payload&&payload.screens)?payload.screens.map(text):[];
  const lane=laneForDepartment(line&&line.department);
  return !lane || allowed.includes(lane) || allowed.includes('service');
}
async function auth(req,env){
  const verified=await verifyOrdersEdgeToken(bearer(req),text(env&&env.EDGE_SESSION_SECRET));
  if(!verified.ok)return {ok:false,response:json({success:false,code:verified.reason},401,req,env)};
  return {ok:true,payload:verified.payload};
}
async function readLine(db,lineId,orderId){
  const row=await db.prepare(`
    SELECT l.line_id AS lineId,l.order_id AS orderId,l.department,
           l.status AS baseStatus,o.notes AS baseNotes,
           r.status AS runtimeStatus,r.notes AS runtimeNotes,
           r.customer_notified AS customerNotified,r.version
      FROM t12_prod_lines l
      JOIN t12_prod_orders o ON o.order_id=l.order_id
      LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
     WHERE l.line_id=? AND l.order_id=?
     LIMIT 1
  `).bind(lineId,orderId).first();
  return row||null;
}
function currentState(line){
  return {
    status:text(line&&line.runtimeStatus)||text(line&&line.baseStatus)||'طلب جديد',
    notes:line&&line.runtimeNotes!=null?text(line.runtimeNotes):text(line&&line.baseNotes),
    version:Number(line&&line.version||0)
  };
}
async function verifyState(db,lineId,orderId,status,notes){
  const row=await db.prepare(`
    SELECT status,notes,version,updated_at AS updatedAt
      FROM t12_prod_line_runtime
     WHERE line_id=? AND order_id=?
     LIMIT 1
  `).bind(lineId,orderId).first();
  if(!row||text(row.status)!==status||text(row.notes)!==notes)return null;
  return row;
}
async function updateLine(req,env,payload){
  let body={};try{body=await req.json();}catch{return json({success:false,code:'invalid-json'},400,req,env);}
  const orderId=text(body.orderId),lineId=text(body.lineId),status=text(body.status),notes=text(body.notes);
  if(!orderId||!lineId)return json({success:false,code:'line-identity-required'},400,req,env);
  if(!STATUSES.has(status))return json({success:false,code:'status-not-allowed'},400,req,env);
  if(notes.length>2500)return json({success:false,code:'notes-too-long'},400,req,env);

  const line=await readLine(env.DB,lineId,orderId);
  if(!line)return json({success:false,code:'cloud-native-line-not-found'},404,req,env);
  if(!actorAllowed(payload,line))return json({success:false,code:'line-screen-forbidden'},403,req,env);

  const actor=text(payload.sub),before=currentState(line);
  if(before.status===status&&before.notes===notes){
    return json({success:true,cloudNative:true,idempotent:true,orderId,lineId,status,notes,version:before.version},200,req,env);
  }

  const eventPayload=JSON.stringify({notesChanged:before.notes!==notes});
  const statements=[
    env.DB.prepare(`
      INSERT INTO t12_prod_line_runtime
      (line_id,order_id,status,notes,updated_by,version,updated_at)
      VALUES (?,?,?,?,?,1,CURRENT_TIMESTAMP)
      ON CONFLICT(line_id) DO UPDATE SET
        status=excluded.status,
        notes=excluded.notes,
        updated_by=excluded.updated_by,
        version=t12_prod_line_runtime.version+1,
        updated_at=CURRENT_TIMESTAMP
    `).bind(lineId,orderId,status,notes,actor),
    env.DB.prepare(`
      INSERT INTO t12_prod_runtime_events
      (order_id,line_id,event_type,old_status,new_status,actor,payload_json)
      VALUES (?,?,?,?,?,?,?)
    `).bind(orderId,lineId,'line-update',before.status,status,actor,eventPayload)
  ];

  try{await env.DB.batch(statements);}catch{
    const recovered=await verifyState(env.DB,lineId,orderId,status,notes);
    if(!recovered)return json({success:false,code:'runtime-update-outcome-unknown-no-retry'},503,req,env);
    return json({success:true,cloudNative:true,ambiguousAckRecovered:true,orderId,lineId,status,notes,version:Number(recovered.version||0)},200,req,env);
  }
  const confirmed=await verifyState(env.DB,lineId,orderId,status,notes);
  if(!confirmed)return json({success:false,code:'runtime-update-not-verified-no-retry'},503,req,env);
  return json({success:true,cloudNative:true,stored:true,orderId,lineId,status,notes,version:Number(confirmed.version||0)},200,req,env);
}
async function notifyLine(req,env,payload){
  let body={};try{body=await req.json();}catch{return json({success:false,code:'invalid-json'},400,req,env);}
  const orderId=text(body.orderId),lineId=text(body.lineId),type=text(body.whatsappType),message=text(body.message);
  if(!orderId||!lineId)return json({success:false,code:'line-identity-required'},400,req,env);
  if(!['ready_notify','status_reply','registration'].includes(type))return json({success:false,code:'whatsapp-type-not-allowed'},400,req,env);
  if(!message||message.length>5000)return json({success:false,code:'message-invalid'},400,req,env);

  const line=await readLine(env.DB,lineId,orderId);
  if(!line)return json({success:false,code:'cloud-native-line-not-found'},404,req,env);
  if(!actorAllowed(payload,line))return json({success:false,code:'line-screen-forbidden'},403,req,env);
  const actor=text(payload.sub),state=currentState(line);
  const notified=type==='ready_notify'?'نعم':text(line.customerNotified);

  const statements=[
    env.DB.prepare(`
      INSERT INTO t12_prod_line_runtime
      (line_id,order_id,status,notes,customer_notified,notified_at,notified_by,
       last_whatsapp_message,last_whatsapp_at,last_whatsapp_by,updated_by,version,updated_at)
      VALUES (?,?,?,?,?,CURRENT_TIMESTAMP,?, ?,CURRENT_TIMESTAMP,?, ?,1,CURRENT_TIMESTAMP)
      ON CONFLICT(line_id) DO UPDATE SET
        customer_notified=CASE WHEN excluded.customer_notified='نعم' THEN 'نعم' ELSE t12_prod_line_runtime.customer_notified END,
        notified_at=CASE WHEN excluded.customer_notified='نعم' THEN CURRENT_TIMESTAMP ELSE t12_prod_line_runtime.notified_at END,
        notified_by=CASE WHEN excluded.customer_notified='نعم' THEN excluded.notified_by ELSE t12_prod_line_runtime.notified_by END,
        last_whatsapp_message=excluded.last_whatsapp_message,
        last_whatsapp_at=CURRENT_TIMESTAMP,
        last_whatsapp_by=excluded.last_whatsapp_by,
        updated_by=excluded.updated_by,
        version=t12_prod_line_runtime.version+1,
        updated_at=CURRENT_TIMESTAMP
    `).bind(lineId,orderId,state.status,state.notes,notified,actor,message,actor,actor),
    env.DB.prepare(`
      INSERT INTO t12_prod_runtime_events
      (order_id,line_id,event_type,old_status,new_status,actor,payload_json)
      VALUES (?,?,?,?,?,?,?)
    `).bind(orderId,lineId,'whatsapp-'+type,state.status,state.status,actor,JSON.stringify({whatsappType:type}))
  ];
  try{await env.DB.batch(statements);}catch{return json({success:false,code:'notification-outcome-unknown-no-retry'},503,req,env);}
  return json({success:true,cloudNative:true,orderId,lineId,whatsappType:type,customerNotified:notified},200,req,env);
}

export function isT12OperationalRuntimePath(path){
  const p=String(path||'').replace(/\/+$/,'')||'/';
  return p===HEALTH_PATH||p===UPDATE_PATH||p===NOTIFY_PATH;
}

export async function handleT12OperationalRuntimeRequest(req,env){
  const url=new URL(req.url),path=url.pathname.replace(/\/+$/,'')||'/';
  if(req.method==='OPTIONS'&&isT12OperationalRuntimePath(path))return new Response(null,{status:204,headers:cors(req,env)});
  if(path===HEALTH_PATH&&req.method==='GET'){
    let ready=false;
    try{
      const rows=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('t12_prod_line_runtime','t12_prod_runtime_events')").all();
      ready=new Set((rows.results||[]).map(r=>text(r.name))).size===2;
    }catch{}
    return json({success:ready,service:'t12-operational-runtime',schemaReady:ready,writeMode:'cloud-native-lines-only'},ready?200:503,req,env);
  }
  if(!isT12OperationalRuntimePath(path))return null;
  if(req.method!=='POST')return json({success:false,code:'method-not-allowed'},405,req,env);
  const a=await auth(req,env);if(!a.ok)return a.response;
  if(path===UPDATE_PATH)return updateLine(req,env,a.payload);
  if(path===NOTIFY_PATH)return notifyLine(req,env,a.payload);
  return json({success:false,code:'not-found'},404,req,env);
}
