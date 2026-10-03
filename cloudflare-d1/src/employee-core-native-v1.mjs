import { verifyEmployeeSessionCloudFirst } from './cloud-session-bridge-v3.mjs';

const ROOT='/v1/employee/core';
const HEALTH=ROOT+'/health';
const READ_ACTIONS=new Set(['getRows','getDashboard','getActivityLog','getTrendMasterCenterV1931']);
const WRITE_ACTIONS=new Set(['bulkUpdateDepartmentStatusV1926','archiveDeliveredDepartmentV1926','updateLine','markCustomerNotified']);
const STATUSES=new Set(['طلب جديد','بدأ التنفيذ','تحت التنفيذ','جاهز للاستلام','تم التسليم','متوقف','مكرر','ملغى']);
const DEFAULT_ORIGINS=[
  'https://fawakhry.github.io',
  'https://trendos-ui.trendmall-contact.workers.dev',
  'http://localhost:8000','http://127.0.0.1:8000','http://localhost:5500','http://127.0.0.1:5500'
];

function text(v){return String(v==null?'':v).trim();}
function key(v){return text(v).toLowerCase();}
function num(v,f=0){const n=Number(v);return Number.isFinite(n)?n:f;}
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});}
function origins(env){const a=String(env&&env.CORS_ORIGINS||'').split(',').map(text).filter(Boolean);return a.length?a:DEFAULT_ORIGINS;}
function cors(req,env){const o=text(req.headers.get('Origin')),a=origins(env);return {'access-control-allow-origin':o&&a.includes(o)?o:a[0],'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization','access-control-max-age':'86400',vary:'Origin'};}
function allowedOrigin(req,env){const o=text(req.headers.get('Origin'));return !o||origins(env).includes(o);}
function normalizeArabic(v){return key(v).replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[ةه]/g,'ه').replace(/\s+/g,' ').trim();}
function customerKey(v){return normalizeArabic(v).replace(/[^0-9a-z\u0600-\u06ff ]/g,' ').replace(/\s+/g,' ').trim();}
function nowCairoDate(){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const x={};for(const z of p)x[z.type]=z.value;return `${x.year}-${x.month}-${x.day}`;
}
function isAdmin(u){return key(u.role)==='admin'||/ضياء|diaa/.test(key([u.username,u.role,u.department].join(' ')));}
function screenMatches(screen,department,heatPress){
  const s=text(screen)||'service',d=text(department);
  if(s==='print')return d.includes('طباعة');
  if(s==='laser')return d.includes('ليزر');
  if(s==='press')return Number(heatPress||0)===1||d.includes('مكبس');
  return true;
}
function screenAllowed(user,screen){
  if(isAdmin(user))return true;
  const s=text(screen)||'service',screens=Array.isArray(user.screens)?user.screens.map(text):[];
  if(screens.length)return screens.includes(s)||screens.includes('service');
  const blob=key([user.role,user.department].join(' '));
  if(s==='print')return /print|طباعة/.test(blob);
  if(s==='laser')return /laser|ليزر/.test(blob);
  if(s==='press')return /press|مكبس/.test(blob);
  return /service|خدمة/.test(blob)||key(user.role)==='service';
}
async function control(env){
  return await env.DB.prepare("SELECT mode,policy_epoch AS policyEpoch,data_version AS dataVersion FROM employee_core_control_v1 WHERE singleton=1 AND marker='ENTRY614_EMPLOYEE_CORE_V1'").first()||{mode:'OFF',policyEpoch:0,dataVersion:1};
}
async function parseBody(req){try{return {ok:true,body:await req.json()};}catch{return {ok:false,response:json({success:false,code:'invalid-json'},400)};}}
async function authenticate(req,body,env){
  const h=text(req.headers.get('Authorization')),m=h.match(/^Bearer\s+(.+)$/i),username=text(body.username||body.name),token=text(m?m[1]:body.token);
  if(!username||!token)return {ok:false,status:401,message:'username and employee session token are required'};
  const v=await verifyEmployeeSessionCloudFirst(username,token,env,'edge');
  if(!v||!v.ok)return {ok:false,status:401,message:text(v&&v.message)||'Employee session rejected'};
  const b=v.body||{},u=b.user||{};
  return {ok:true,authSource:text(v.authSource),user:{
    username:text(u.username||u.name||b.username||username),
    role:key(u.role||b.role||'service')||'service',
    department:text(u.department||b.department),
    screens:Array.isArray(u.screens)?u.screens.map(text):[]
  }};
}
async function event(env,action,entityType,entityId,actor,payload={}){
  await env.DB.prepare("INSERT INTO employee_core_events_v1(action,entity_type,entity_id,actor,payload_json) VALUES(?,?,?,?,?)")
    .bind(action,text(entityType),text(entityId),text(actor),JSON.stringify(payload)).run();
}
async function restrictions(env){
  const q=await env.DB.prepare("SELECT customer_key,customer_name,reason,valid_until FROM employee_core_delivery_restrictions_v1 WHERE active=1").all();
  const map=new Map();
  for(const r of q.results||[]){
    if(text(r.valid_until)&&text(r.valid_until)<nowCairoDate())continue;
    map.set(text(r.customer_key)||customerKey(r.customer_name),r);
  }
  return map;
}
async function coreRows(env,screen='service'){
  const [native,imported]=await Promise.all([
    env.DB.prepare(`
      SELECT l.line_id AS lineId,l.order_id AS orderId,l.ordinal,l.department,l.assigned_to AS assignedTo,
             l.item_name AS itemName,l.qty,l.priority,l.status AS baseStatus,l.heat_press AS heatPress,
             l.fly_print AS flyPrint,l.created_at AS lineCreatedAt,l.updated_at AS lineUpdatedAt,
             o.customer_mode AS customerMode,o.customer_name AS customerName,o.customer_phone AS customerPhone,
             o.external_customer_id AS externalCustomerId,o.source,o.notes AS orderNotes,
             o.created_at AS orderCreatedAt,o.updated_at AS orderUpdatedAt,
             COALESCE(r.status,l.status) AS status,COALESCE(r.notes,o.notes) AS notes,
             COALESCE(r.customer_notified,'') AS customerNotified,COALESCE(r.notified_at,'') AS notifiedAt,
             COALESCE(r.notified_by,'') AS notifiedBy,COALESCE(r.last_whatsapp_message,'') AS lastWhatsAppMessage,
             COALESCE(r.last_whatsapp_at,'') AS lastWhatsAppAt,COALESCE(r.last_whatsapp_by,'') AS lastWhatsAppBy,
             COALESCE(r.updated_at,l.updated_at) AS runtimeUpdatedAt,
             COALESCE(c.debt_amount,0) AS debtAmount,COALESCE(c.notes,'') AS debtNotes,
             '' AS expectedDeliveryAt,'' AS receivedAt,'' AS registrationSent,'t12-prod' AS sourceKind
        FROM t12_prod_lines l
        JOIN t12_prod_orders o ON o.order_id=l.order_id
        LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
        LEFT JOIN t12_customers c ON c.active='نعم' AND (
             (o.customer_phone<>'' AND (c.phone=o.customer_phone OR c.extra_phone=o.customer_phone))
             OR (o.customer_phone='' AND c.customer_name=o.customer_name)
        )
        LEFT JOIN employee_core_archive_lines_v1 a ON a.line_id=l.line_id
       WHERE a.line_id IS NULL
       ORDER BY o.created_at DESC,l.ordinal
    `).all(),
    env.DB.prepare(`
      SELECT l.line_id AS lineId,l.order_id AS orderId,l.source_row AS ordinal,l.department,l.assigned_to AS assignedTo,
             l.item_name AS itemName,l.qty,l.priority,l.status,l.heat_press AS heatPress,l.fly_print AS flyPrint,
             l.updated_at AS lineUpdatedAt,o.customer_name AS customerName,o.customer_phone AS customerPhone,
             '' AS customerMode,'' AS externalCustomerId,COALESCE(l.source,o.source) AS source,
             o.notes AS orderNotes,o.received_at AS orderCreatedAt,o.updated_at AS orderUpdatedAt,
             l.notes,l.customer_notified AS customerNotified,l.notified_at AS notifiedAt,l.notified_by AS notifiedBy,
             l.last_whatsapp_message AS lastWhatsAppMessage,l.last_whatsapp_at AS lastWhatsAppAt,
             l.last_whatsapp_by AS lastWhatsAppBy,l.updated_at AS runtimeUpdatedAt,l.debt_amount AS debtAmount,
             l.debt_notes AS debtNotes,l.expected_delivery_at AS expectedDeliveryAt,l.received_at AS receivedAt,
             l.registration_sent AS registrationSent,'core-import' AS sourceKind
        FROM employee_core_lines_v1 l
        JOIN employee_core_orders_v1 o ON o.order_id=l.order_id
        LEFT JOIN employee_core_archive_lines_v1 a ON a.line_id=l.line_id
       WHERE l.active=1 AND o.active=1 AND a.line_id IS NULL
       ORDER BY l.source_row
    `).all()
  ]);
  const deny=await restrictions(env),byId=new Map();
  for(const r of [...(imported.results||[]),...(native.results||[])]) byId.set(text(r.lineId),r);
  return [...byId.values()].filter(r=>screenMatches(screen,r.department,r.heatPress)).map((r,i)=>{
    const debt=num(r.debtAmount),restriction=deny.get(customerKey(r.customerName));
    const ready=text(r.ready)|| (text(r.status)==='جاهز للاستلام'?'نعم':'');
    return {
      rowNumber:num(r.ordinal,i+1),orderId:text(r.orderId),orderCode:text(r.orderId),lineId:text(r.lineId),
      customer:text(r.customerName),customerPhone:text(r.customerPhone),customerSource:text(r.source),source:text(r.source),
      externalCustomerId:text(r.externalCustomerId),customerMode:text(r.customerMode),department:text(r.department),
      itemName:text(r.itemName),qty:num(r.qty,1),assignedTo:text(r.assignedTo),priority:text(r.priority)||'عادي',
      status:text(r.status)||'طلب جديد',ready,
      heatPress:Number(r.heatPress||0)?'نعم':'لا',flyPrint:Number(r.flyPrint||0)?'نعم':'لا',quickPrint:Number(r.flyPrint||0)?'نعم':'لا',
      debtAmount:debt,debtHold:debt>0?'نعم':'لا',deliveryDebtRestricted:!!(debt>0&&restriction),
      debtRestrictionReason:restriction?text(restriction.reason):'',debtNotes:text(r.debtNotes),
      updatedAt:text(r.runtimeUpdatedAt||r.lineUpdatedAt||r.orderUpdatedAt),notes:text(r.notes),
      customerNotified:text(r.customerNotified),notifiedAt:text(r.notifiedAt),notifiedBy:text(r.notifiedBy),
      lastWhatsAppMessage:text(r.lastWhatsAppMessage),lastWhatsAppAt:text(r.lastWhatsAppAt),lastWhatsAppBy:text(r.lastWhatsAppBy),
      receivedAt:text(r.receivedAt||r.orderCreatedAt),expectedDeliveryAt:text(r.expectedDeliveryAt),
      expectedDeliveryText:text(r.expectedDeliveryAt),overdue:'لا',registrationSent:text(r.registrationSent),
      cloudNative:true,writeAuthority:'cloudflare-d1',dataSource:text(r.sourceKind)||'d1-native',sourceKind:text(r.sourceKind)
    };
  });
}
function dashboard(rows,screen){
  const terminal=new Set(['تم التسليم','مكرر','ملغى']);
  const active=(rows||[]).filter(r=>!terminal.has(text(r.status)));
  const delivered=(rows||[]).filter(r=>text(r.status)==='تم التسليم');
  const ready=(rows||[]).filter(r=>text(r.status)==='جاهز للاستلام');
  const orders=new Set(active.map(r=>r.orderId).filter(Boolean));
  const deliveredOrders=new Set(delivered.map(r=>r.orderId).filter(Boolean));
  const total=Math.max(1,(rows||[]).length),done=delivered.length;
  const completion=Math.round(done*100/total);
  return {
    departmentName:screen==='print'?'الطباعة':screen==='laser'?'الليزر':screen==='press'?'المكبس':'خدمة العملاء',
    byDepartment:{},todayWorkSheets:0,todayWorkLines:0,todayWorkOrders:0,todayOrders:0,
    performanceScore:completion,completionPercent:completion,timeScore:100,
    overdue:(rows||[]).filter(r=>r.overdue==='نعم').length,
    deliveredToday:deliveredOrders.size,readyForPickup:new Set(ready.map(r=>r.orderId)).size,
    urgent:active.filter(r=>text(r.priority)==='عاجل'||text(r.priority)==='VIP').length,
    normal:active.filter(r=>!['عاجل','VIP'].includes(text(r.priority))).length,
    activeOrders:orders.size,debtOrders:new Set((rows||[]).filter(r=>num(r.debtAmount)>0).map(r=>r.orderId)).size,
    heatPress:active.filter(r=>r.heatPress==='نعم').length
  };
}
async function requestLedger(env,requestKey,action,actor,body){
  const keyv=text(requestKey);if(!keyv)return {ok:false,code:'request-id-required'};
  const canonical=JSON.stringify(body||{});
  const old=await env.DB.prepare("SELECT canonical_json AS canonicalJson,response_json AS responseJson,status FROM employee_core_request_ledger_v1 WHERE request_key=?").bind(keyv).first();
  if(old){
    if(text(old.canonicalJson)!==canonical)return {ok:false,code:'request-id-payload-mismatch'};
    if(text(old.status)==='COMMITTED')return {ok:true,replay:true,response:JSON.parse(old.responseJson||'{}')};
    return {ok:false,code:'request-in-flight'};
  }
  await env.DB.prepare("INSERT INTO employee_core_request_ledger_v1(request_key,action,actor,canonical_json,status) VALUES(?,?,?,?, 'PREPARED')")
    .bind(keyv,action,actor,canonical).run();
  return {ok:true,replay:false};
}
async function commitLedger(env,requestKey,response){
  await env.DB.prepare("UPDATE employee_core_request_ledger_v1 SET status='COMMITTED',response_json=? WHERE request_key=?")
    .bind(JSON.stringify(response),requestKey).run();
}
async function activity(env,limit=50){
  const n=Math.max(1,Math.min(Math.trunc(num(limit,50)),200)),all=[];
  const safe=async(sql)=>{
    try{const q=await env.DB.prepare(sql).bind(n).all();return q.results||[];}catch{return [];}
  };
  all.push(...await safe("SELECT created_at AS time,order_id AS orderId,line_id AS lineId,'' AS customer,'' AS department,event_type AS action,old_status AS oldStatus,new_status AS newStatus,actor AS by,payload_json AS details FROM t12_prod_runtime_events ORDER BY event_id DESC LIMIT ?"));
  all.push(...await safe("SELECT created_at AS time,'' AS orderId,entity_id AS lineId,'' AS customer,'' AS department,action,'' AS oldStatus,'' AS newStatus,actor AS by,payload_json AS details FROM employee_core_events_v1 ORDER BY event_id DESC LIMIT ?"));
  return all.sort((a,b)=>String(b.time||'').localeCompare(String(a.time||''))).slice(0,n);
}
async function archivePage(env,page=1,pageSize=10,query=''){
  const p=Math.max(1,Math.trunc(num(page,1))),sz=Math.max(1,Math.min(Math.trunc(num(pageSize,10)),50)),q=text(query);
  const where=q?" WHERE order_id LIKE ? OR customer_name LIKE ? ":"";
  const bind=q?[`%${q}%`,`%${q}%`]:[];
  const countStmt=env.DB.prepare("SELECT COUNT(*) AS n FROM employee_core_archive_orders_v1"+where);
  const count=bind.length?await countStmt.bind(...bind).first():await countStmt.first();
  const sql="SELECT order_id AS orderId,customer_name AS customer,department,archived_at AS archivedAt,(SELECT COUNT(*) FROM employee_core_archive_lines_v1 l WHERE l.order_id=o.order_id) AS lineCount FROM employee_core_archive_orders_v1 o"+where+" ORDER BY archived_at DESC LIMIT ? OFFSET ?";
  const stmt=env.DB.prepare(sql),args=[...bind,sz,(p-1)*sz],res=await stmt.bind(...args).all(),total=num(count&&count.n);
  return {success:true,rows:res.results||[],pagination:{page:p,pageSize:sz,totalRows:total,totalPages:Math.max(1,Math.ceil(total/sz))}};
}
async function trendMaster(env,user,body){
  const [rows,archived,events]=await Promise.all([coreRows(env,'service'),archivePage(env,body.archivePage||1,10,body.archiveQuery||''),activity(env,50)]);
  const materials=await (async()=>{try{return (await env.DB.prepare("SELECT material_name AS material,department,stock_qty AS stock,min_stock AS minimum FROM employee_accounting_materials_v1 WHERE active=1 AND stock_qty<min_stock ORDER BY stock_qty").all()).results||[];}catch{return [];}})();
  const debtCustomers=await (async()=>{try{return (await env.DB.prepare("SELECT customer_name AS name,debt_amount AS debtAmount FROM t12_customers WHERE active='نعم' AND debt_amount>0 ORDER BY debt_amount DESC").all()).results||[];}catch{return [];}})();
  const deny=await restrictions(env);
  const activeByActor=new Map();
  for(const e of events){const actor=text(e.by);if(!actor)continue;const x=activeByActor.get(actor)||{employee:actor,department:'',orderCount:0,total:0,completed:0,overdue:0};x.total++;if(text(e.newStatus)==='تم التسليم')x.completed++;activeByActor.set(actor,x);}
  const kpis=[...activeByActor.values()].map(x=>({...x,completionPercent:x.total?Math.round(x.completed*100/x.total):0,score:x.total?Math.round(x.completed*100/x.total):0}));
  return {
    success:true,
    system:{activeLines:rows.length,archivedLines:(archived.rows||[]).reduce((s,r)=>s+num(r.lineCount),0),dataVersion:num((await control(env)).dataVersion),pagingEnabled:true,duplicateGroups:0,duplicateRows:0,duplicateHealthy:true,deliveryPolicy:'التسليم مفتوح عدا قائمة المنع عند وجود مديونية',invoicePaymentRequired:false,stockAutoDeduct:'عند اعتماد فاتورة القسم'},
    employeePerformance:kpis,stockAlerts:materials,messageQueue:[],archive:archived,
    debtControl:{customers:debtCustomers,restrictions:[...deny.values()].map(r=>({customer:r.customer_name,reason:r.reason,validUntil:r.valid_until,createdBy:'D1',active:true,expired:false}))},
    dayClose:null,
    permissions:{canManageArchive:isAdmin(user)||key(user.role)==='service',canManageDebtRestrictions:isAdmin(user),canRunAutomation:false,canInstallAutomation:false,canCloseDay:isAdmin(user),canManageStock:isAdmin(user)},
    version:'ENTRY614_D1_EMPLOYEE_CORE_V1'
  };
}
async function bulkStatus(env,user,body){
  const screen=text(body.screen),fromStatus=text(body.fromStatus),toStatus=text(body.toStatus),requestId=text(body.requestId);
  if(!screenAllowed(user,screen))return {success:false,message:'ليس لديك صلاحية تغيير حالات هذا القسم جماعيًا.'};
  if(!STATUSES.has(fromStatus)||!STATUSES.has(toStatus)||fromStatus===toStatus)return {success:false,message:'الحالة الحالية أو الجديدة غير مسموح بها.'};
  const led=await requestLedger(env,requestId,'bulkUpdateDepartmentStatusV1926',user.username,{screen,fromStatus,toStatus});
  if(!led.ok)return {success:false,code:led.code};if(led.replay)return led.response;
  const all=await coreRows(env,screen),candidates=all.filter(r=>text(r.status)===fromStatus).slice(0,500);
  const changed=[],skippedDebt={};
  for(const row of candidates){
    if(toStatus==='تم التسليم'&&row.deliveryDebtRestricted){skippedDebt[row.customer||row.lineId]=true;continue;}
    changed.push(row);
  }
  if(changed.length){
    const statements=[];
    for(const row of changed){
      if(row.sourceKind==='core-import'){
        statements.push(env.DB.prepare("UPDATE employee_core_lines_v1 SET status=?,updated_by=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE line_id=? AND active=1")
          .bind(toStatus,user.username,row.lineId));
        statements.push(env.DB.prepare("INSERT INTO employee_core_events_v1(action,entity_type,entity_id,actor,payload_json) VALUES('line-status','line',?,?,?)")
          .bind(row.lineId,user.username,JSON.stringify({orderId:row.orderId,oldStatus:fromStatus,newStatus:toStatus,screen,requestId})));
      }else{
        statements.push(env.DB.prepare(`
          INSERT INTO t12_prod_line_runtime(line_id,order_id,status,notes,updated_by,version,updated_at)
          VALUES(?,?,?,?,?,1,CURRENT_TIMESTAMP)
          ON CONFLICT(line_id) DO UPDATE SET status=excluded.status,updated_by=excluded.updated_by,version=t12_prod_line_runtime.version+1,updated_at=CURRENT_TIMESTAMP
        `).bind(row.lineId,row.orderId,toStatus,row.notes||'',user.username));
        statements.push(env.DB.prepare("INSERT INTO t12_prod_runtime_events(order_id,line_id,event_type,old_status,new_status,actor,payload_json) VALUES(?,?,?,?,?,?,?)")
          .bind(row.orderId,row.lineId,'bulk-status',fromStatus,toStatus,user.username,JSON.stringify({screen,requestId})));
      }
    }
    await env.DB.batch(statements);
    await env.DB.prepare("UPDATE employee_core_control_v1 SET data_version=data_version+1,updated_at=CURRENT_TIMESTAMP WHERE singleton=1").run();
    await event(env,'bulkUpdateDepartmentStatusV1926','screen',screen,user.username,{fromStatus,toStatus,changed:changed.length,requestId});
  }
  const response={success:true,changed:changed.length,affectedOrders:new Set(changed.map(r=>r.orderId)).size,skippedDebt:Object.keys(skippedDebt).length,skippedFinance:0,financeReasons:{},screen,fromStatus,toStatus,requestId,version:'ENTRY614_D1_EMPLOYEE_CORE_V1'};
  await commitLedger(env,requestId,response);return response;
}
async function archiveDelivered(env,user,body){
  const screen=text(body.screen),requestId=text(body.requestId);
  if(!screenAllowed(user,screen))return {success:false,message:'ليس لديك صلاحية أرشفة هذا القسم.'};
  const led=await requestLedger(env,requestId,'archiveDeliveredDepartmentV1926',user.username,{screen});
  if(!led.ok)return {success:false,code:led.code};if(led.replay)return led.response;
  const delivered=(await coreRows(env,screen)).filter(r=>text(r.status)==='تم التسليم').slice(0,500);
  const statements=[];
  for(const r of delivered){
    statements.push(env.DB.prepare(`
      INSERT OR IGNORE INTO employee_core_archive_lines_v1(line_id,order_id,department,item_name,qty,priority,status,notes,snapshot_json,archived_by,request_key)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)
    `).bind(r.lineId,r.orderId,r.department,r.itemName,num(r.qty,1),r.priority,r.status,r.notes,JSON.stringify(r),user.username,requestId));
    if(r.sourceKind==='core-import') statements.push(env.DB.prepare("UPDATE employee_core_lines_v1 SET active=0,updated_by=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE line_id=?").bind(user.username,r.lineId));
  }
  if(statements.length)await env.DB.batch(statements);
  const orders=[...new Set(delivered.map(r=>r.orderId).filter(Boolean))],fully=[],remaining=await coreRows(env,'service');
  for(const orderId of orders){
    if(!remaining.some(r=>r.orderId===orderId)){
      let o=await env.DB.prepare("SELECT order_id,customer_name,customer_phone,department,priority,status,source,notes,raw_json FROM employee_core_orders_v1 WHERE order_id=?").bind(orderId).first();
      if(!o)o=await env.DB.prepare("SELECT order_id,customer_name,customer_phone,department,priority,status,source,notes,'{}' AS raw_json FROM t12_prod_orders WHERE order_id=?").bind(orderId).first();
      if(o){
        fully.push(orderId);
        await env.DB.prepare(`
          INSERT OR IGNORE INTO employee_core_archive_orders_v1(order_id,customer_name,customer_phone,department,priority,status,source,notes,snapshot_json,archived_by,request_key)
          VALUES(?,?,?,?,?,?,?,?,?,?,?)
        `).bind(orderId,text(o.customer_name),text(o.customer_phone),text(o.department),text(o.priority),'تم التسليم',text(o.source),text(o.notes),text(o.raw_json)||JSON.stringify(o),user.username,requestId).run();
        await env.DB.prepare("UPDATE employee_core_orders_v1 SET active=0,updated_by=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE order_id=?").bind(user.username,orderId).run();
      }
    }
  }
  if(delivered.length){
    await env.DB.prepare("UPDATE employee_core_control_v1 SET data_version=data_version+1,updated_at=CURRENT_TIMESTAMP WHERE singleton=1").run();
    await event(env,'archiveDeliveredDepartmentV1926','screen',screen,user.username,{archivedLines:delivered.length,archivedOrders:fully.length,requestId});
  }
  const response={success:true,archivedLines:delivered.length,archivedOrders:fully.length,partialOrders:Math.max(0,orders.length-fully.length),screen,requestId,version:'ENTRY614_D1_EMPLOYEE_CORE_V1'};
  await commitLedger(env,requestId,response);return response;
}

async function updateSingleLine(env,user,body){
  const lineId=text(body.lineId||body.id),status=text(body.status),notes=body.notes==null?null:text(body.notes);
  if(!lineId)return {success:false,message:'lineId مطلوب.'};
  if(status&&!STATUSES.has(status))return {success:false,message:'الحالة غير مسموح بها.'};
  const imported=await env.DB.prepare("SELECT order_id AS orderId,status,notes FROM employee_core_lines_v1 WHERE line_id=? AND active=1").bind(lineId).first();
  if(imported){
    await env.DB.prepare("UPDATE employee_core_lines_v1 SET status=CASE WHEN ?='' THEN status ELSE ? END,notes=CASE WHEN ? IS NULL THEN notes ELSE ? END,updated_by=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE line_id=?")
      .bind(status,status,notes,notes,user.username,lineId).run();
    await event(env,'updateLine','line',lineId,user.username,{orderId:imported.orderId,oldStatus:imported.status,status:status||imported.status});
    return {success:true,lineId,orderId:text(imported.orderId),status:status||text(imported.status),notes:notes==null?text(imported.notes):notes,source:'employee-core-d1'};
  }
  const cloud=await env.DB.prepare("SELECT order_id AS orderId,status FROM t12_prod_lines WHERE line_id=?").bind(lineId).first();
  if(!cloud)return {success:false,code:'line-not-found',message:'البند غير موجود في D1.'};
  await env.DB.prepare(`
    INSERT INTO t12_prod_line_runtime(line_id,order_id,status,notes,updated_by,version,updated_at)
    VALUES(?,?,?,?,?,1,CURRENT_TIMESTAMP)
    ON CONFLICT(line_id) DO UPDATE SET
      status=CASE WHEN excluded.status='' THEN t12_prod_line_runtime.status ELSE excluded.status END,
      notes=excluded.notes,updated_by=excluded.updated_by,version=t12_prod_line_runtime.version+1,updated_at=CURRENT_TIMESTAMP
  `).bind(lineId,cloud.orderId,status,notes==null?'':notes,user.username).run();
  return {success:true,lineId,orderId:text(cloud.orderId),status:status||text(cloud.status),notes:notes||'',source:'t12-prod-runtime'};
}

async function markNotified(env,user,body){
  const lineId=text(body.lineId||body.id),message=text(body.message||body.lastWhatsAppMessage),when=text(body.notifiedAt)||new Date().toISOString();
  if(!lineId)return {success:false,message:'lineId مطلوب.'};
  const imported=await env.DB.prepare("SELECT order_id AS orderId FROM employee_core_lines_v1 WHERE line_id=? AND active=1").bind(lineId).first();
  if(imported){
    await env.DB.prepare("UPDATE employee_core_lines_v1 SET customer_notified='نعم',notified_at=?,notified_by=?,last_whatsapp_message=CASE WHEN ?='' THEN last_whatsapp_message ELSE ? END,last_whatsapp_at=?,last_whatsapp_by=?,updated_by=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE line_id=?")
      .bind(when,user.username,message,message,when,user.username,user.username,lineId).run();
    await event(env,'markCustomerNotified','line',lineId,user.username,{orderId:imported.orderId});
    return {success:true,lineId,orderId:text(imported.orderId),source:'employee-core-d1'};
  }
  const cloud=await env.DB.prepare("SELECT order_id AS orderId,status FROM t12_prod_lines WHERE line_id=?").bind(lineId).first();
  if(!cloud)return {success:false,code:'line-not-found',message:'البند غير موجود في D1.'};
  await env.DB.prepare(`
    INSERT INTO t12_prod_line_runtime(line_id,order_id,status,customer_notified,notified_at,notified_by,last_whatsapp_message,last_whatsapp_at,last_whatsapp_by,updated_by,version,updated_at)
    VALUES(?,?,?,'نعم',?,?,?,?,?,?,1,CURRENT_TIMESTAMP)
    ON CONFLICT(line_id) DO UPDATE SET customer_notified='نعم',notified_at=excluded.notified_at,notified_by=excluded.notified_by,
      last_whatsapp_message=CASE WHEN excluded.last_whatsapp_message='' THEN t12_prod_line_runtime.last_whatsapp_message ELSE excluded.last_whatsapp_message END,
      last_whatsapp_at=excluded.last_whatsapp_at,last_whatsapp_by=excluded.last_whatsapp_by,updated_by=excluded.updated_by,
      version=t12_prod_line_runtime.version+1,updated_at=CURRENT_TIMESTAMP
  `).bind(lineId,cloud.orderId,text(cloud.status),when,user.username,message,when,user.username,user.username).run();
  return {success:true,lineId,orderId:text(cloud.orderId),source:'t12-prod-runtime'};
}

export function isEmployeeCoreNativePath(path){
  const p=String(path||'').replace(/\/+$/,'')||'/';
  return p===ROOT||p===HEALTH;
}

export async function handleEmployeeCoreNativeRequest(request,env){
  const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/';
  if(!isEmployeeCoreNativePath(path))return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(request,env)});
  if(path===HEALTH&&request.method==='GET'){
    let schemaReady=false;
    try{const r=await env.DB.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('employee_core_control_v1','employee_core_request_ledger_v1','employee_core_orders_v1','employee_core_lines_v1','employee_core_archive_orders_v1','employee_core_archive_lines_v1','employee_core_events_v1','employee_core_delivery_restrictions_v1')").first();schemaReady=num(r&&r.n)===8;}catch{}
    const c=schemaReady?await control(env):{mode:'OFF',policyEpoch:0,dataVersion:0};
    return json({success:true,schemaReady,mode:text(c.mode)||'OFF',policyEpoch:num(c.policyEpoch),dataVersion:num(c.dataVersion),actions:[...READ_ACTIONS,...WRITE_ACTIONS],googleBusinessCalls:0,appsScriptBusinessAuthority:false,authBridgeTemporary:true},schemaReady?200:503,cors(request,env));
  }
  if(request.method!=='POST')return json({success:false,code:'method-not-allowed'},405,cors(request,env));
  if(!allowedOrigin(request,env))return json({success:false,code:'origin-forbidden'},403,cors(request,env));
  const parsed=await parseBody(request);if(!parsed.ok)return parsed.response;
  const body=parsed.body||{},action=text(body.action),c=await control(env);
  if(text(c.mode)==='OFF')return json({success:false,code:'employee-core-off'},423,cors(request,env));
  if(text(c.mode)==='READONLY'&&!READ_ACTIONS.has(action))return json({success:false,code:'employee-core-readonly'},503,cors(request,env));
  if(!READ_ACTIONS.has(action)&&!WRITE_ACTIONS.has(action))return json({success:false,code:'employee-core-action-unknown'},400,cors(request,env));
  const a=await authenticate(request,body,env);if(!a.ok)return json({success:false,message:a.message},a.status||401,cors(request,env));
  try{
    let out;
    if(action==='getRows'){
      const screen=text(body.screen)||'service';if(!screenAllowed(a.user,screen))out={success:false,message:'غير مصرح لك بعرض أوردرات هذا القسم.'};
      else {const rows=await coreRows(env,screen);out={success:true,rows,dashboard:dashboard(rows,screen),version:'ENTRY614_D1_EMPLOYEE_CORE_V1'};}
    }else if(action==='getDashboard'){
      const screen=text(body.screen)||'service';if(!screenAllowed(a.user,screen))out={success:false,message:'غير مصرح لك بعرض أوردرات هذا القسم.'};
      else {const rows=await coreRows(env,screen);out={success:true,dashboard:dashboard(rows,screen),version:'ENTRY614_D1_EMPLOYEE_CORE_V1'};}
    }else if(action==='getActivityLog')out={success:true,rows:await activity(env,body.limit)};
    else if(action==='getTrendMasterCenterV1931')out=await trendMaster(env,a.user,body);
    else if(action==='bulkUpdateDepartmentStatusV1926')out=await bulkStatus(env,a.user,body);
    else if(action==='archiveDeliveredDepartmentV1926')out=await archiveDelivered(env,a.user,body);
    else if(action==='updateLine')out=await updateSingleLine(env,a.user,body);
    else if(action==='markCustomerNotified')out=await markNotified(env,a.user,body);
    else out={success:false,code:'employee-core-action-unknown'};
    return json(out,out.success===false?400:200,cors(request,env));
  }catch(err){
    return json({success:false,code:text(err&&err.code)||'employee-core-error',message:text(err&&err.message)||'Employee core failed'},500,cors(request,env));
  }
}
