import { verifyEmployeeSessionCloudFirst } from './cloud-session-bridge-v3.mjs';

const ROOT='/v1/employee/comms';
const HEALTH='/v1/employee/comms/health';
const WEBHOOK='/v1/employee/comms/webhook';
const FILE_PREFIX='/v1/employee/comms/file/';
const DEFAULT_ORIGINS=[
  'https://fawakhry.github.io',
  'https://trendos-ui.trendmall-contact.workers.dev',
  'http://localhost:8000','http://127.0.0.1:8000','http://localhost:5500','http://127.0.0.1:5500'
];
const READONLY=new Set(['customerManagerV1:inbox','customerManagerV1:thread','customerManagerV1:suggest','goLiveAutopilotV1:listDrafts','getOrderConversation']);

function text(v){return String(v==null?'':v).trim();}
function key(v){return text(v).toLowerCase();}
function num(v,f=0){const n=Number(v);return Number.isFinite(n)?n:f;}
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});}
function origins(env){const a=String(env&&env.CORS_ORIGINS||'').split(',').map(text).filter(Boolean);return a.length?a:DEFAULT_ORIGINS;}
function cors(request,env){const o=text(request.headers.get('Origin')),a=origins(env);return {'access-control-allow-origin':o&&a.includes(o)?o:a[0],'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization','access-control-max-age':'86400',vary:'Origin'};}
function originAllowed(request,env){const o=text(request.headers.get('Origin'));return !o||origins(env).includes(o);}
function cleanPhone(v){let d=text(v).replace(/\D/g,'');if(d.startsWith('0020'))d='0'+d.slice(4);else if(d.startsWith('20')&&d.length>=12)d='0'+d.slice(2);else if(d.startsWith('1')&&d.length===10)d='0'+d;return d;}
function metaPhone(v){const d=cleanPhone(v);return d.startsWith('0')?'20'+d.slice(1):d;}
function b64Bytes(v){const raw=text(v).replace(/^data:[^;]+;base64,/,'');if(!raw)return null;const bin=atob(raw),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;}
function riskFor(v){const t=key(v),r=[];if(/شكوى|اشتكي|مشكله|مشكلة|سيء|وحش|اتأخر|متأخر|تأخير|غلط|خطأ|بوظ|تالف/.test(t))r.push('شكوى أو مشكلة جودة/تأخير');if(/خصم|تعويض|استرجاع|refund|فلوس|سعر نهائي|تكلفة نهائية/.test(t))r.push('قرار مالي يحتاج اعتماد');if(/محامي|قانون|بلاغ|شرطة|حماية المستهلك/.test(t))r.push('تصعيد رسمي');return {needsManager:r.length>0,reason:r.join('؛ ')};}
function isManagerUser(user){const blob=key([user.username,user.role,user.department].join(' '));return user.role==='admin'||user.role==='service'||/ضياء|diaa|رحم|revan|rivan|ريفان/.test(blob);}
async function control(env){return await env.DB.prepare("SELECT mode,policy_epoch AS policyEpoch,feedback_enabled_at_ms AS feedbackEnabledAtMs FROM employee_comms_control_v1 WHERE singleton=1 AND marker='ENTRY614_EMPLOYEE_COMMS_V1'").first()||{mode:'OFF',policyEpoch:0,feedbackEnabledAtMs:0};}
async function parseBody(request){try{return {ok:true,body:await request.json()};}catch{return {ok:false,response:json({success:false,code:'invalid-json'},400)};}}
async function authenticate(request,body,env){
  const h=text(request.headers.get('Authorization')),m=h.match(/^Bearer\s+(.+)$/i),username=text(body.username||body.name),token=text(m?m[1]:body.token);
  if(!username||!token)return {ok:false,status:401,message:'username and employee session token are required'};
  const v=await verifyEmployeeSessionCloudFirst(username,token,env,'edge');
  if(!v||!v.ok)return {ok:false,status:401,message:text(v&&v.message)||'Employee session rejected'};
  const b=v.body||{},u=b.user||{};
  return {ok:true,authSource:text(v.authSource),user:{username:text(u.username||u.name||b.username||username),role:key(u.role||b.role||'service')||'service',department:text(u.department||b.department)}};
}
async function event(env,domain,id,type,actor,payload={}){
  await env.DB.prepare("INSERT INTO employee_comms_events_v1(domain,entity_id,event_type,actor,payload_json,created_at_ms) VALUES(?,?,?,?,?,?)")
    .bind(domain,text(id),type,text(actor),JSON.stringify(payload),Date.now()).run();
}
async function latestOrderContext(env,phoneOrOrder){
  const q=text(phoneOrOrder),phone=cleanPhone(q);
  let row=await env.DB.prepare(`
    SELECT order_id AS orderId,customer_name AS customerName,customer_phone AS phone,status,updated_at AS updatedAt
    FROM t12_prod_orders
    WHERE order_id=? OR customer_phone=?
    ORDER BY updated_at DESC LIMIT 1
  `).bind(q,phone).first();
  if(!row) row=await env.DB.prepare(`
    SELECT order_id AS orderId,customer_name AS customerName,customer_phone AS phone,status,updated_at AS updatedAt
    FROM orders WHERE order_id=? OR customer_phone=?
    ORDER BY updated_at DESC LIMIT 1
  `).bind(q,phone).first();
  return row||{orderId:'',customerName:'',phone:phone,status:'',updatedAt:''};
}
async function upsertConversation(env,m){
  await env.DB.prepare(`
    INSERT INTO conversations(phone,customer_name,order_id,status,last_message,last_at,direction,needs_manager,reason,owner,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(phone) DO UPDATE SET
      customer_name=excluded.customer_name,order_id=excluded.order_id,status=excluded.status,
      last_message=excluded.last_message,last_at=excluded.last_at,direction=excluded.direction,
      needs_manager=excluded.needs_manager,reason=excluded.reason,
      owner=CASE WHEN excluded.owner<>'' THEN excluded.owner ELSE conversations.owner END,
      updated_at=CURRENT_TIMESTAMP
  `).bind(m.phone,m.customerName||'',m.orderId||'',m.status||'',m.text||'',m.at||new Date().toISOString(),m.direction||'in',m.needsManager?1:0,m.reason||'',m.owner||'').run();
}
async function appendMessage(env,m){
  const id=text(m.id)||'CM-'+crypto.randomUUID();
  await env.DB.prepare(`
    INSERT OR IGNORE INTO messages(id,phone,customer_name,order_id,direction,text,at,source,send_status,meta_id,needs_manager,reason,by_user,raw_json)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(id,m.phone||'',m.customerName||'',m.orderId||'',m.direction||'in',m.text||'',m.at||new Date().toISOString(),m.source||'TrendOS',m.sendStatus||'',m.metaId||'',m.needsManager?1:0,m.reason||'',m.by||'',JSON.stringify(m.raw||{})).run();
  await upsertConversation(env,{...m,id});
  return id;
}
async function inbox(env,limit){
  const n=Math.max(1,Math.min(Math.trunc(num(limit,80)),200));
  const q=await env.DB.prepare("SELECT phone,customer_name AS customerName,order_id AS orderId,status,last_message AS lastMessage,last_at AS lastAt,direction,needs_manager AS needsManager,reason,owner FROM conversations ORDER BY last_at DESC LIMIT ?").bind(n).all();
  return (q.results||[]).map(r=>({...r,needsManager:!!r.needsManager}));
}
async function thread(env,phone,limit){
  const n=Math.max(1,Math.min(Math.trunc(num(limit,100)),300));
  const q=await env.DB.prepare("SELECT id,direction,text,at,source,send_status AS sendStatus,needs_manager AS needsManager,reason,by_user AS by FROM messages WHERE phone=? ORDER BY at DESC LIMIT ?").bind(phone,n).all();
  return (q.results||[]).reverse().map(r=>({...r,needsManager:!!r.needsManager}));
}
async function openAiReply(env,phone){
  if(!text(env.OPENAI_API_KEY))throw Object.assign(new Error('OPENAI_API_KEY is not configured in Cloudflare'),{code:'openai-not-configured'});
  const ctx=await latestOrderContext(env,phone),msgs=await thread(env,phone,16),last=msgs.length?msgs[msgs.length-1].text:'',risk=riskFor(last);
  if(risk.needsManager)return {reply:'',needsManager:true,reason:risk.reason,context:ctx};
  const history=msgs.map(m=>(m.direction==='in'?'العميل: ':'المكان: ')+m.text).join('\n');
  const prompt=[
    'أنت مساعد خدمة عملاء Trend Mall / مطبعجي بنها. اكتب رد واتساب مصري قصير ومحترم وواضح.',
    'مصدر الحقيقة هو TrendOS. ممنوع اختلاق سعر أو حالة أو موعد. ممنوع وعد بخصم أو تعويض أو Refund.',
    'لو المعلومة غير مؤكدة اطلب معلومة واحدة فقط أو حوّل للمسؤول.',
    'بيانات العميل والأوردر: '+JSON.stringify(ctx),
    'آخر المحادثة:\n'+history,
    'اكتب الرد فقط.'
  ].join('\n\n');
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+text(env.OPENAI_API_KEY),'content-type':'application/json'},body:JSON.stringify({model:text(env.OPENAI_CUSTOMER_MODEL)||'gpt-5.6-luna',input:prompt,max_output_tokens:450})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Object.assign(new Error(text(data&&data.error&&data.error.message)||'OpenAI request failed'),{code:'openai-failed'});
  let reply=text(data.output_text);
  if(!reply)reply=(data.output||[]).flatMap(o=>o.content||[]).map(c=>text(c.text)).filter(Boolean).join('\n');
  return {reply,needsManager:false,reason:'',context:ctx};
}
async function sendWhatsApp(env,phone,message){
  const token=text(env.WHATSAPP_TOKEN),phoneId=text(env.WHATSAPP_PHONE_NUMBER_ID),version=text(env.WHATSAPP_GRAPH_VERSION)||'v23.0';
  if(!token||!phoneId)throw Object.assign(new Error('WhatsApp Cloud API is not configured in Cloudflare'),{code:'whatsapp-not-configured'});
  const r=await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(phoneId)}/messages`,{
    method:'POST',headers:{Authorization:'Bearer '+token,'content-type':'application/json'},
    body:JSON.stringify({messaging_product:'whatsapp',to:metaPhone(phone),type:'text',text:{preview_url:false,body:message}})
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Object.assign(new Error(text(data&&data.error&&data.error.message)||'WhatsApp request failed'),{code:'whatsapp-failed'});
  return {data,metaMessageId:text(data&&data.messages&&data.messages[0]&&data.messages[0].id)};
}
async function customerManager(env,user,op,body){
  if(!isManagerUser(user))return {success:false,message:'مدير العملاء متاح لخدمة العملاء والإدارة فقط.'};
  const phone=cleanPhone(body.phone);
  if(op==='inbox')return {success:true,conversations:await inbox(env,body.limit)};
  if(op==='thread')return {success:true,messages:await thread(env,phone,body.limit),context:await latestOrderContext(env,phone)};
  if(op==='suggest')return {success:true,...await openAiReply(env,phone)};
  if(op==='send'){
    const message=text(body.text||body.message);if(!phone||!message)return {success:false,message:'الهاتف والرسالة مطلوبان.'};
    const risk=riskFor(message);if(risk.needsManager&&user.role!=='admin')return {success:false,message:'الرسالة تتضمن قرارًا حساسًا وتحتاج اعتماد المدير.'};
    const ctx=await latestOrderContext(env,phone),sent=await sendWhatsApp(env,phone,message);
    await appendMessage(env,{phone,customerName:ctx.customerName,orderId:ctx.orderId,status:ctx.status,direction:'out',text:message,source:'WhatsApp Cloud API',sendStatus:'تم الإرسال',metaId:sent.metaMessageId,by:user.username,at:new Date().toISOString()});
    return {success:true,message:'تم إرسال واتساب.',metaMessageId:sent.metaMessageId};
  }
  if(op==='handoff'||op==='resolve'){
    const need=op==='handoff',reason=need?'تصعيد يدوي من خدمة العملاء':'',owner=need?'المدير':user.username;
    await env.DB.prepare("UPDATE conversations SET needs_manager=?,reason=?,owner=?,updated_at=CURRENT_TIMESTAMP WHERE phone=?").bind(need?1:0,reason,owner,phone).run();
    return {success:true,message:need?'تم التصعيد للمدير.':'تمت المعالجة.'};
  }
  return {success:false,message:'أمر مدير العملاء غير معروف.'};
}
async function deliveredCandidates(env,enabledAtMs){
  if(!(enabledAtMs>0))return [];
  const prod=await env.DB.prepare(`
    SELECT o.order_id AS orderId,o.customer_name AS customerName,o.customer_phone AS phone,
           MAX(COALESCE(r.updated_at,l.updated_at)) AS deliveredAt
    FROM t12_prod_orders o
    JOIN t12_prod_lines l ON l.order_id=o.order_id
    LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
    GROUP BY o.order_id,o.customer_name,o.customer_phone
    HAVING COUNT(*)>0 AND SUM(CASE WHEN COALESCE(r.status,l.status)='تم التسليم' THEN 0 ELSE 1 END)=0
  `).all();
  const legacy=await env.DB.prepare(`
    SELECT r.order_id AS orderId,COALESCE(o.customer_name,'') AS customerName,COALESCE(o.customer_phone,'') AS phone,MAX(r.updated_at) AS deliveredAt
    FROM t12_legacy_line_runtime r LEFT JOIN orders o ON o.order_id=r.order_id
    GROUP BY r.order_id,o.customer_name,o.customer_phone
    HAVING COUNT(*)>0 AND SUM(CASE WHEN r.status='تم التسليم' THEN 0 ELSE 1 END)=0
  `).all();
  return [...(prod.results||[]),...(legacy.results||[])].filter(x=>{
    const ms=Date.parse(x.deliveredAt||'');return x.orderId&&cleanPhone(x.phone)&&Number.isFinite(ms)&&ms>=enabledAtMs;
  });
}
async function feedbackScan(env,user,cfg){
  const candidates=await deliveredCandidates(env,Number(cfg.feedbackEnabledAtMs||0));
  if(!(Number(cfg.feedbackEnabledAtMs||0)>0))return {success:false,code:'feedback-not-activated',message:'Feedback activation timestamp is not set.'};
  let queued=0,sent=0,failed=0;
  for(const ev of candidates){
    const old=await env.DB.prepare("SELECT feedback_id FROM employee_feedback_requests_v1 WHERE order_id=?").bind(ev.orderId).first();if(old)continue;
    const feedbackId='FB-'+crypto.randomUUID().replace(/-/g,'').slice(0,8).toUpperCase(),phone=cleanPhone(ev.phone),now=Date.now(),delivered=Date.parse(ev.deliveredAt)||now;
    let status='Pending',meta='';
    try{
      const w=await sendWhatsApp(env,phone,`رأيك يهمنا 🌟\nتم تسليم الأوردر رقم ${ev.orderId}.\nقيّم تجربتك مع Trend Mall من 1 إلى 5.\nولو عندك ملاحظة اكتبها بعد الرقم، مثال: 4 الخدمة ممتازة`);
      status='تم الإرسال';meta=w.metaMessageId;sent++;
    }catch{status='Pending - WhatsApp';failed++;}
    await env.DB.prepare(`
      INSERT INTO employee_feedback_requests_v1(feedback_id,order_id,customer_name,phone,delivered_at_ms,requested_at_ms,request_status,meta_message_id)
      VALUES(?,?,?,?,?,?,?,?)
    `).bind(feedbackId,ev.orderId,text(ev.customerName),phone,delivered,now,status,meta).run();
    await event(env,'feedback',feedbackId,'queued',user.username,{orderId:ev.orderId,status});queued++;
  }
  return {success:true,queued,sent,failed};
}
async function feedbackReply(env,phone,message){
  const m=text(message).match(/^\s*([1-5])(?:\s+([\s\S]*))?$/);if(!m)return false;
  const row=await env.DB.prepare("SELECT feedback_id FROM employee_feedback_requests_v1 WHERE phone=? AND rating IS NULL ORDER BY requested_at_ms DESC LIMIT 1").bind(phone).first();
  if(!row)return false;
  const rating=Number(m[1]),note=text(m[2]),now=Date.now();
  await env.DB.prepare("UPDATE employee_feedback_requests_v1 SET rating=?,customer_note=?,replied_at_ms=?,needs_followup=?,followup_status=?,updated_at=CURRENT_TIMESTAMP WHERE feedback_id=?")
    .bind(rating,note,now,rating<=3?1:0,rating<=3?'مفتوح':'لا يحتاج متابعة',row.feedback_id).run();
  await event(env,'feedback',row.feedback_id,'customer-rating','webhook',{rating});
  return true;
}
async function orderConversation(env,user,body){
  const orderId=text(body.orderId),lineId=text(body.lineId);if(!orderId)return {success:false,message:'رقم الأوردر مطلوب.'};
  const ctx=await latestOrderContext(env,orderId);if(!ctx.orderId)return {success:false,message:'الأوردر غير موجود.'};
  const q=await env.DB.prepare("SELECT id AS messageId,order_id AS orderId,direction AS senderType,by_user AS senderName,text,at AS createdAt,source,send_status AS sendStatus FROM messages WHERE order_id=? ORDER BY at").bind(orderId).all();
  const fq=lineId
    ? await env.DB.prepare("SELECT file_id AS fileId,order_id AS orderId,line_id AS lineId,file_name AS name,mime_type AS mimeType,content_sha256 AS contentSha256,public_url AS url,visible_to_customer AS visibleToCustomer,created_at AS createdAt FROM employee_order_conversation_files_v1 WHERE order_id=? AND line_id=? ORDER BY created_at").bind(orderId,lineId).all()
    : await env.DB.prepare("SELECT file_id AS fileId,order_id AS orderId,line_id AS lineId,file_name AS name,mime_type AS mimeType,content_sha256 AS contentSha256,public_url AS url,visible_to_customer AS visibleToCustomer,created_at AS createdAt FROM employee_order_conversation_files_v1 WHERE order_id=? ORDER BY created_at").bind(orderId).all();
  return {success:true,orderId,lineId,lines:[],files:(fq.results||[]).map(x=>({...x,visibleToCustomer:x.visibleToCustomer?'نعم':'لا'})),messages:q.results||[]};
}
async function sendOrderConversation(env,user,body){
  const orderId=text(body.orderId),message=text(body.message||body.text);if(!orderId||!message)return {success:false,message:'رقم الأوردر ونص الرسالة مطلوبين.'};
  const ctx=await latestOrderContext(env,orderId);if(!ctx.orderId)return {success:false,message:'الأوردر غير موجود.'};
  await appendMessage(env,{phone:cleanPhone(ctx.phone),customerName:ctx.customerName,orderId,direction:'out',text:message,source:'TrendOS Order Conversation',sendStatus:'محفوظ',by:user.username,at:new Date().toISOString(),raw:{lineId:text(body.lineId),visibleToCustomer:text(body.visibleToCustomer)||'نعم'}});
  return {success:true,message:'تم حفظ رسالة المتابعة في محادثة الأوردر.'};
}
async function sha256HexV1(bytes){
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function uploadOrderFile(env,user,body){
  const orderId=text(body.orderId),lineId=text(body.lineId),bytes=b64Bytes(body.base64),name=text(body.fileName)||'proof.bin',mime=text(body.mimeType)||'application/octet-stream';
  if(!orderId||!bytes)return {success:false,message:'بيانات رفع البروفة ناقصة.'};
  if(bytes.length>25*1024*1024)return {success:false,message:'حجم الملف أكبر من الحد المسموح 25MB.'};
  if(!env.FILES)throw Object.assign(new Error('Cloudflare R2 FILES binding is not configured'),{code:'r2-files-not-configured'});
  const ctx=await latestOrderContext(env,orderId);if(!ctx.orderId)return {success:false,message:'الأوردر غير موجود.'};
  const fileId='OCF-'+crypto.randomUUID(),r2Key=`order-conversations/${orderId}/${lineId||'general'}/${fileId}/${name.replace(/[^A-Za-z0-9._-]+/g,'_')}`;
  const contentSha256=await sha256HexV1(bytes);
  await env.FILES.put(r2Key,bytes,{httpMetadata:{contentType:mime},customMetadata:{sha256:contentSha256}});
  const base=text(env.FILES_PUBLIC_BASE_URL).replace(/\/+$/,''),url=base?base+'/'+r2Key:FILE_PREFIX+encodeURIComponent(fileId);
  const messageId=await appendMessage(env,{phone:cleanPhone(ctx.phone),customerName:ctx.customerName,orderId,direction:'out',text:text(body.message||body.text)||'تم رفع ملف/بروفة من الموظف.',source:'TrendOS Order Conversation',sendStatus:'محفوظ',by:user.username,at:new Date().toISOString(),raw:{lineId,fileId}});
  await env.DB.prepare("INSERT INTO employee_order_conversation_files_v1(file_id,order_id,line_id,message_id,r2_key,file_name,mime_type,size_bytes,public_url,visible_to_customer,uploaded_by,content_sha256) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
    .bind(fileId,orderId,lineId,messageId,r2Key,name,mime,bytes.length,url,text(body.visibleToCustomer)==='لا'?0:1,user.username,contentSha256).run();
  return {success:true,message:'تم رفع الملف وحفظه في محادثة الأوردر.',fileUrl:url,fileId,fileName:name,mimeType:mime,contentSha256,thumbnailUrl:url};
}
async function serveFile(env,fileId){
  const row=await env.DB.prepare("SELECT r2_key,mime_type FROM employee_order_conversation_files_v1 WHERE file_id=?").bind(fileId).first();
  if(!row||!env.FILES)return new Response('Not found',{status:404});
  const obj=await env.FILES.get(row.r2_key);if(!obj)return new Response('Not found',{status:404});
  return new Response(obj.body,{status:200,headers:{'content-type':text(row.mime_type)||'application/octet-stream','cache-control':'private,max-age=3600'}});
}
async function goLiveContext(env,orderId){
  const ctx=await latestOrderContext(env,orderId),lines=await env.DB.prepare(`
    SELECT l.line_id AS lineId,COALESCE(r.status,l.status) AS status
    FROM t12_prod_lines l LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
    WHERE l.order_id=?
  `).bind(orderId).all();
  return {ctx,lines:lines.results||[]};
}
async function prepareGoLive(env,orderId,notes){
  const x=await goLiveContext(env,orderId);if(!x.ctx.orderId)return {success:false,message:'رقم الأوردر غير موجود.'};
  const ready=x.lines.length>0&&x.lines.every(l=>['جاهز للاستلام','تم التنفيذ','تم التسليم'].includes(text(l.status)));
  const old=await env.DB.prepare("SELECT draft_id,created_at_ms FROM employee_go_live_drafts_v1 WHERE order_id=?").bind(orderId).first();
  const draftId=old?old.draft_id:'DR-'+crypto.randomUUID().replace(/-/g,'').slice(0,8).toUpperCase(),now=Date.now(),status=ready?'بانتظار حسابات D1':'يحتاج إنهاء التشغيل',blocker=ready?'الحسابات D1 لم تُفعّل بعد لهذا الأوردر.':'الأوردر لم يصل لحالة جاهزة.';
  await env.DB.prepare(`
    INSERT INTO employee_go_live_drafts_v1(draft_id,order_id,customer_name,phone,order_status,status,blocker,notes,created_at_ms,updated_at_ms)
    VALUES(?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(order_id) DO UPDATE SET customer_name=excluded.customer_name,phone=excluded.phone,order_status=excluded.order_status,status=excluded.status,blocker=excluded.blocker,notes=excluded.notes,updated_at_ms=excluded.updated_at_ms,updated_at=CURRENT_TIMESTAMP
  `).bind(draftId,orderId,text(x.ctx.customerName),cleanPhone(x.ctx.phone),text(x.ctx.status),status,blocker,text(notes),old?old.created_at_ms:now,now).run();
  return {success:true,orderId,status,subtotal:0,blocker,lineIds:[],context:x.ctx};
}
async function listDrafts(env,limit){
  const n=Math.max(1,Math.min(Math.trunc(num(limit,100)),300));
  const q=await env.DB.prepare("SELECT draft_id AS id,order_id AS orderId,customer_name AS customerName,phone,order_status AS orderStatus,proposed_total AS subtotal,proposed_paid AS paidSuggested,proposed_remaining AS remainingSuggested,status,blocker,invoice_no AS invoiceNo,final_total AS finalTotal,final_remaining AS remaining,message_status AS messageStatus,meta_message_id AS metaMessageId FROM employee_go_live_drafts_v1 ORDER BY updated_at_ms DESC LIMIT ?").bind(n).all();
  return q.results||[];
}
async function goLive(env,user,op,body){
  if(!isManagerUser(user))return {success:false,message:'مراجعة وتقفيل فواتير الجاهز لخدمة العملاء/الحسابات والإدارة فقط.'};
  if(op==='listDrafts')return {success:true,drafts:await listDrafts(env,body.limit)};
  if(op==='prepareReadyInvoice')return prepareGoLive(env,text(body.orderId),body.notes);
  if(op==='sweepReady'){
    const q=await env.DB.prepare(`
      SELECT o.order_id AS orderId FROM t12_prod_orders o
      WHERE EXISTS(SELECT 1 FROM t12_prod_lines l WHERE l.order_id=o.order_id)
      AND NOT EXISTS(
        SELECT 1 FROM t12_prod_lines l LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
        WHERE l.order_id=o.order_id AND COALESCE(r.status,l.status) NOT IN ('جاهز للاستلام','تم التنفيذ','تم التسليم')
      ) ORDER BY o.updated_at DESC LIMIT ?
    `).bind(Math.max(1,Math.min(Math.trunc(num(body.limit,40)),100))).all();
    let n=0;for(const r of q.results||[]){await prepareGoLive(env,r.orderId,'تجهيز تلقائي من D1 Ready Sweep');n++;}
    return {success:true,prepared:n,drafts:await listDrafts(env,100)};
  }
  if(op==='sendReady'){
    const draft=await env.DB.prepare("SELECT * FROM employee_go_live_drafts_v1 WHERE order_id=?").bind(text(body.orderId)).first();
    if(!draft)return {success:false,message:'مسودة الفاتورة غير موجودة.'};
    if(!text(draft.phone))return {success:false,message:'رقم العميل غير موجود.'};
    const msg=`تم الانتهاء من أوردر حضرتك رقم ${draft.order_id} ✅\n${draft.invoice_no?'رقم الفاتورة: '+draft.invoice_no+'\n':''}إجمالي الفاتورة: ${Number(draft.final_total||draft.proposed_total||0).toFixed(2)} جنيه\nالمتبقي: ${Number(draft.final_remaining||draft.proposed_remaining||0).toFixed(2)} جنيه\nتحب الاستلام من الفرع ولا نرتب لك دليفري؟ 🚚`;
    const sent=await sendWhatsApp(env,draft.phone,msg);
    await env.DB.prepare("UPDATE employee_go_live_drafts_v1 SET message_status='تم الإرسال',meta_message_id=?,updated_at_ms=?,updated_at=CURRENT_TIMESTAMP WHERE order_id=?").bind(sent.metaMessageId,Date.now(),draft.order_id).run();
    await appendMessage(env,{phone:draft.phone,customerName:draft.customer_name,orderId:draft.order_id,direction:'out',text:msg,source:'Go-Live Autopilot D1',sendStatus:'تم الإرسال',metaId:sent.metaMessageId,by:user.username,at:new Date().toISOString()});
    return {success:true,message:'تم إرسال رسالة الجاهزية والفاتورة.',metaMessageId:sent.metaMessageId};
  }
  if(op==='finalizeAndNotify')return {success:false,code:'accounting-d1-authority-not-ready',message:'تقفيل الفاتورة متوقف fail-closed حتى تفعيل Accounting D1 native authority.'};
  return {success:false,message:'أمر Go-Live غير معروف.'};
}
async function webhook(env,request){
  if(request.method==='GET'){
    const u=new URL(request.url),mode=text(u.searchParams.get('hub.mode')),token=text(u.searchParams.get('hub.verify_token')),challenge=text(u.searchParams.get('hub.challenge')),expected=text(env.WHATSAPP_VERIFY_TOKEN);
    if(mode!=='subscribe')return new Response('bad-mode',{status:400});
    if(!expected)return new Response('verify-token-not-configured',{status:503});
    if(token!==expected)return new Response('forbidden',{status:403});
    return new Response(challenge,{status:200,headers:{'content-type':'text/plain'}});
  }
  if(request.method!=='POST')return json({success:false,code:'method-not-allowed'},405);
  const payload=await request.json().catch(()=>({}));if(text(payload.object)!=='whatsapp_business_account')return json({success:true,received:0});
  let count=0,feedbackHandled=0;
  for(const entry of payload.entry||[])for(const ch of entry.changes||[]){
    const value=ch.value||{},names=new Map((value.contacts||[]).map(c=>[text(c.wa_id),text(c.profile&&c.profile.name)]));
    for(const m of value.messages||[]){
      const phone=cleanPhone(m.from),message=text(m.text&&m.text.body);if(!phone||!message)continue;
      const ctx=await latestOrderContext(env,phone),risk=riskFor(message),at=new Date((Number(m.timestamp)||Math.floor(Date.now()/1000))*1000).toISOString();
      await appendMessage(env,{phone,customerName:names.get(text(m.from))||ctx.customerName,orderId:ctx.orderId,status:ctx.status,direction:'in',text:message,at,source:'WhatsApp Cloud API',sendStatus:'مستلمة',metaId:text(m.id),needsManager:risk.needsManager,reason:risk.reason});
      if(await feedbackReply(env,phone,message))feedbackHandled++;count++;
    }
  }
  return json({success:true,received:count,feedbackHandled},200);
}

export function isEmployeeCommsNativePath(path){
  const p=String(path||'').replace(/\/+$/,'')||'/';
  return p===ROOT||p===HEALTH||p===WEBHOOK||p.startsWith(FILE_PREFIX);
}
export async function handleEmployeeCommsNativeRequest(request,env){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(path===WEBHOOK)return webhook(env,request);
  if(path.startsWith(FILE_PREFIX)&&request.method==='GET')return serveFile(env,decodeURIComponent(path.slice(FILE_PREFIX.length)));
  const h=cors(request,env);if(request.method==='OPTIONS')return new Response(null,{status:204,headers:h});
  if(!originAllowed(request,env))return json({success:false,code:'origin-not-allowed'},403,h);
  if(path===HEALTH){
    if(request.method!=='GET')return json({success:false,code:'method-not-allowed'},405,h);
    const c=await control(env),tables=await env.DB.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('employee_feedback_requests_v1','employee_go_live_drafts_v1','employee_order_conversation_files_v1','employee_comms_events_v1')").first();
    return json({success:true,schemaReady:Number(tables&&tables.n||0)===4,mode:text(c.mode)||'OFF',policyEpoch:Number(c.policyEpoch||0),feedbackEnabledAtMs:Number(c.feedbackEnabledAtMs||0),r2Ready:!!env.FILES,whatsappReady:!!(text(env.WHATSAPP_TOKEN)&&text(env.WHATSAPP_PHONE_NUMBER_ID)),openAiReady:!!text(env.OPENAI_API_KEY),googleBusinessCalls:0,appsScriptBusinessAuthority:false,accountingFinalizeReady:false},200,h);
  }
  if(path!==ROOT)return json({success:false,code:'not-found'},404,h);
  if(request.method!=='POST')return json({success:false,code:'method-not-allowed'},405,h);
  const parsed=await parseBody(request);if(!parsed.ok)return parsed.response;
  const body=parsed.body||{},action=text(body.action),op=text(body.op),c=await control(env),pkey=action+(op?':'+op:'');
  if(c.mode==='OFF')return json({success:false,code:'employee-comms-off'},503,h);
  if(c.mode==='READONLY'&&!READONLY.has(pkey)&&!READONLY.has(action))return json({success:false,code:'employee-comms-readonly'},503,h);
  const au=await authenticate(request,body,env);if(!au.ok)return json({success:false,code:'employee-session-rejected',message:au.message},au.status||401,h);
  try{
    let out;
    if(action==='customerManagerV1')out=await customerManager(env,au.user,op||'inbox',body);
    else if(action==='customerFeedbackV1')out=(op==='scan'||!op)?await feedbackScan(env,au.user,c):{success:false,message:'أمر تقييم العملاء غير معروف.'};
    else if(action==='goLiveAutopilotV1')out=await goLive(env,au.user,op||'listDrafts',body);
    else if(action==='getOrderConversation')out=await orderConversation(env,au.user,body);
    else if(action==='sendOrderConversationMessage')out=await sendOrderConversation(env,au.user,body);
    else if(action==='uploadOrderConversationFile')out=await uploadOrderFile(env,au.user,body);
    else out={success:false,code:'employee-comms-action-unknown',message:'Employee comms action is not supported.'};
    return json({...out,authority:'d1-employee-comms-v1',authSource:au.authSource},out&&out.success===false?400:200,h);
  }catch(err){
    return json({success:false,code:text(err&&err.code)||'employee-comms-failed',message:text(err&&err.message)||'Employee comms failed',authority:'d1-employee-comms-v1'},['whatsapp-not-configured','openai-not-configured','r2-files-not-configured'].includes(text(err&&err.code))?503:500,h);
  }
}
