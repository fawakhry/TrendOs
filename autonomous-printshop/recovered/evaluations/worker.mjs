/** Matbagy Evaluations separate Cloudflare pilot (not a TrendOS adapter).
 * API is OFF until MATBAGY_ADMIN_TOKEN secret, independent EVAL_DB and EVAL_FILES
 * are configured. MATBAGY_READER_TOKEN is an optional distinct READ-ONLY secret.
 * Protect the hostname with Cloudflare Access before production use.
 * No AI, WhatsApp outbound, scheduled writes or TrendOS calls in this Worker.
 */
const CORS = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'" };
const ID=/^[a-z0-9][a-z0-9_-]{1,49}$/;
const SOURCE=/^(private|group)\/[a-z0-9][a-z0-9_-]{0,49}$/;
const TOPICS=new Set(['reply_style','product_preference','follow_up','price_process','friction','resolution','agreement',
  'staff_clarity','staff_follow_up','staff_handover','staff_customer_care']);
const STAFF_TOPICS=new Set(['staff_clarity','staff_follow_up','staff_handover','staff_customer_care']);
const ACTIONS=new Set(['check_order','request_missing_file','verify_deadline','clarify_specs',
 'escalate_to_manager','prepare_customer_reply','staff_coaching_review']);
const now=()=>new Date().toISOString();
const error=(message,status=400)=>Response.json({error:message},{status,headers:CORS});
const ok=(payload,status=200)=>Response.json(payload,{status,headers:CORS});
const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)))
    .map(x=>x.toString(16).padStart(2,'0')).join('');
const enc=new TextEncoder();
function tokenEquals(given,token){
 if(typeof token!=='string'||!token)return false;
 const expected='Bearer '+token;
 const a=enc.encode(given),b=enc.encode(expected);
 if(a.length!==b.length)return false;
 let mismatch=0;for(let i=0;i<a.length;i++) mismatch|=a[i]^b[i];
 return mismatch===0;
}
function authorizedRole(req,env){
 const given=req.headers.get('Authorization')||'';
 if(tokenEquals(given,env.MATBAGY_ADMIN_TOKEN))return 'admin';
 if(tokenEquals(given,env.MATBAGY_READER_TOKEN))return 'reader';
 return null;
}
function readerAllowed(path,method){
 return method==='GET'&&(
  /^\/api\/customers\/[a-z0-9_-]{2,50}\/profile-snapshots\/latest$/.test(path)||
  /^\/api\/customers\/[a-z0-9_-]{2,50}\/fingerprint$/.test(path));
}
async function bodyJson(req,max=16000){
 const length=Number(req.headers.get('content-length')||0);
 if(length>max)throw new Error('حجم البيانات تجاوز الحد المسموح');
 const bytes=await req.arrayBuffer();
 if(bytes.byteLength>max)throw new Error('حجم البيانات تجاوز الحد المسموح');
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new Error('صيغة JSON غير صالحة');}
}
const isId=x=>typeof x==='string'&&ID.test(x);
async function customerExists(db,cid){return !!(await db.prepare('SELECT customer_id FROM customers WHERE customer_id=?').bind(cid).first());}
async function validateRefs(db,cid,refs){
 if(!Array.isArray(refs)||!refs.length||refs.length>8)throw new Error('الدليل مطلوب (1-8 رسائل)');
 const uniq=[...new Set(refs)];
 if(uniq.length!==refs.length)throw new Error('أدلة مكررة');
 for(const ref of uniq){
  if(typeof ref!=='string'||!/^((private|group)\/[a-z0-9_-]{1,50})#[0-9a-f]{24}$/.test(ref))
    throw new Error('مرجع دليل غير صالح');
  const message=await db.prepare('SELECT message_id FROM messages WHERE customer_id=? AND source_id=? AND message_id=?')
     .bind(cid,ref.split('#')[0],ref.split('#')[1]).first();
  if(!message)throw new Error('الدليل غير موجود داخل ملف هذا العميل');
 }
 return uniq;
}
export function parseChat(text){
 const lines=text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n');
 const header=/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM|ص|م))?\s+-\s+([^:]+):\s*(.*)$/i;
 const out=[];let current=null;
 for(const line of lines){
  const match=header.exec(line);
  if(match){
   const [,day,month,year,hour,minute,ampm,sender,body]=match;
   let h=Number(hour);if(ampm){if(h<1||h>12)continue;h=h%12+(/PM|م/i.test(ampm)?12:0);}
   const dt=new Date(Date.UTC(Number(year),Number(month)-1,Number(day),h,Number(minute)));
   if(dt.getUTCFullYear()!==Number(year)||dt.getUTCMonth()+1!==Number(month)||dt.getUTCDate()!==Number(day))continue;
   current={message_at:`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T${String(h).padStart(2,'0')}:${minute}`,
     sender:sender.trim().slice(0,200),body:body.slice(0,5000)};out.push(current);
  }else if(current){current.body+='\n'+line.slice(0,5000);current.body=current.body.slice(0,6000);}
 }
 return out;
}
// Profile snapshots are separate from candidate facts and only reference approved facts.
// Versions are monotonic; a caller must state its observed version before appending.
function makePlaybook(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('بصمة غير صالحة');
 const simple=x=>typeof x==='string' && x.length<=240 && !/[\u0000-\u001f]/.test(x);
 const strings=x=>Array.isArray(x)&&x.length<=12&&x.every(simple);
 const p={tone:input.tone,detail_level:input.detail_level,
  response_do:input.response_do,response_avoid:input.response_avoid};
 if(!simple(p.tone)||!simple(p.detail_level)||!strings(p.response_do)||!strings(p.response_avoid))
  throw new Error('بصمة غير صالحة');
 return p;
}
async function approvedFacts(db,cid,ids){
 if(!Array.isArray(ids)||ids.length<1||ids.length>30||new Set(ids).size!==ids.length ||
    !ids.every(x=>typeof x==='string'&&/^[0-9a-f-]{36}$/.test(x)))throw new Error('مراجع الملاحظات المعتمدة غير صالحة');
 for(const fid of ids){
  const fact=await db.prepare("SELECT fact_id FROM profile_facts WHERE fact_id=? AND customer_id=? AND subject_type='customer' AND subject_id=? AND status='verified'").bind(fid,cid,cid).first();
  if(!fact)throw new Error('بصمة تحتوي ملاحظة غير معتمدة');
 }
 return ids;
}
async function upload(req,env){
 const cid=req.headers.get('X-Customer-Id'),source=req.headers.get('X-Source-Id');
 if(!isId(cid)||!SOURCE.test(source||''))return error('معرّف العميل أو المصدر غير صالح');
 if(!(await customerExists(env.EVAL_DB,cid)))return error('العميل غير موجود',404);
 if(!req.headers.get('Content-Type')?.startsWith('text/plain'))return error('ملف TXT فقط في تجربة كلاود');
 const contentLength=Number(req.headers.get('content-length')||0);
 if(contentLength>1000000)return error('الملف أكبر من حد التجربة 1MB',413);
 const bytes=await req.arrayBuffer();if(bytes.byteLength>1000000)return error('الملف أكبر من حد التجربة 1MB',413);
 const digest=await sha(bytes);const exportId=crypto.randomUUID();
 const already=await env.EVAL_DB.prepare('SELECT export_id FROM chat_exports WHERE customer_id=? AND source_id=? AND sha256=?')
    .bind(cid,source,digest).first();
 if(already)return ok({already_imported:true,export_id:already.export_id,new_messages:0});
 const messages=parseChat(new TextDecoder().decode(bytes));
 if(!messages.length)return error('لم نجد رسائل مؤرخة مدعومة');
 if(messages.length>80)return error('ملف التجربة يدعم حتى 80 رسالة في الدفعة');
 const key=`customers/${cid}/exports/${source.replace('/','_')}/${digest}.txt`;
 // R2 original is private; the DB transaction may fail AFTER upload; orphan cleanup is an admin task.
 await env.EVAL_FILES.put(key,bytes,{httpMetadata:{contentType:'text/plain; charset=utf-8'}});
 const steps=[env.EVAL_DB.prepare(`INSERT INTO chat_exports
 (export_id,customer_id,source_id,sha256,r2_key,filename_label,message_count,imported_at)
 VALUES(?,?,?,?,?,?,?,?)`).bind(exportId,cid,source,digest,key,'WhatsApp TXT',messages.length,now())];
 const seen=new Map();let added=0;
 for(const m of messages){
   const core=JSON.stringify([m.message_at,m.sender,m.body]);
   const occurrence=(seen.get(core)||0)+1;seen.set(core,occurrence);
   const fingerprint=await sha(enc.encode(core+'\u0000'+occurrence));
   const mid=(await sha(enc.encode(cid+'\u0000'+source+'\u0000'+fingerprint))).slice(0,24);
   // OR IGNORE is only used for the message unique key; export row is not silently ignored.
   steps.push(env.EVAL_DB.prepare(`INSERT OR IGNORE INTO messages
    (message_id,customer_id,source_id,fingerprint,message_at,sender_label,message_text,export_id,created_at)
    VALUES(?,?,?,?,?,?,?,?,?)`).bind(mid,cid,source,fingerprint,m.message_at,m.sender,m.body,exportId,now()));
 }
 const existing=await env.EVAL_DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE customer_id=?').bind(cid).first();
 const batch=await env.EVAL_DB.batch(steps);
 added=batch.slice(1).reduce((n,x)=>n+(x.meta?.changes||0),0);
 return ok({export_id:exportId,total_in_export:messages.length,new_messages:added,
  already_imported:false,source_id:source,coverage_total_approx:(existing?.n||0)+added},201);
}

export default {
 async fetch(req,env){
  const url=new URL(req.url),path=url.pathname,method=req.method;
  if(method==='GET'&&path==='/health')return ok({service:'matbagy-evaluations-pilot',trendos_connected:false});
  if(!env.MATBAGY_ADMIN_TOKEN||!env.EVAL_DB||!env.EVAL_FILES)return error('خدمة التجربة غير مهيأة بعد',503);
  // A reader must not accidentally become an admin through duplicated secrets.
  if(env.MATBAGY_READER_TOKEN && env.MATBAGY_READER_TOKEN===env.MATBAGY_ADMIN_TOKEN)
    return error('إعدادات الصلاحيات غير آمنة',503);
  const role=authorizedRole(req,env);
  if(!role)return error('دخول غير مصرح به',401);
  if(!path.startsWith('/api/'))return error('المسار غير موجود',404);
  if(role==='reader'&&!readerAllowed(path,method))return error('ليس لديك صلاحية تنفيذ هذا الطلب',403);
  try{
   const db=env.EVAL_DB;
   if(method==='GET'&&path==='/api/customers'){
    const rows=await db.prepare('SELECT customer_id,display_name,created_at FROM customers ORDER BY created_at').all();
    return ok({customers:rows.results||[]});
   }
   if(method==='POST'&&path==='/api/customers'){
    const data=await bodyJson(req),cid=data.customer_id,name=String(data.display_name||'').trim();
    if(!isId(cid)||!name||name.length>150)return error('معرّف أو اسم عميل غير صالح');
    await db.prepare('INSERT INTO customers(customer_id,display_name,created_at) VALUES(?,?,?)').bind(cid,name,now()).run();
    return ok({customer_id:cid,created:true},201);
   }
   if(method==='POST'&&path==='/api/exports/txt')return await upload(req,env);
   const fp=path.match(/^\/api\/customers\/([a-z0-9_-]{2,50})\/fingerprint$/);
   if(method==='GET'&&fp){
    const cid=fp[1];if(!(await customerExists(db,cid)))return error('العميل غير موجود',404);
    const rows=await db.prepare("SELECT fact_id,topic,statement,evidence_refs_json,reviewed_at FROM profile_facts WHERE customer_id=? AND subject_type='customer' AND subject_id=? AND status='verified' ORDER BY reviewed_at DESC LIMIT 100").bind(cid,cid).all();
    return ok({customer_id:cid,verified_facts:(rows.results||[]).map(r=>({...r,evidence_refs:JSON.parse(r.evidence_refs_json),evidence_refs_json:undefined})),
      notice:'تعليمات الرد لا تستخدم نتائج AI غير المعتمدة'});
   }
   // Cross-chat contract: GET latest private snapshot; append an approved one with CAS.
   const profile=path.match(/^\/api\/customers\/([a-z0-9_-]{2,50})\/profile-snapshots$/);
   const latest=path.match(/^\/api\/customers\/([a-z0-9_-]{2,50})\/profile-snapshots\/latest$/);
   if(method==='GET'&&latest){
    const cid=latest[1];if(!(await customerExists(db,cid)))return error('العميل غير موجود',404);
    const row=await db.prepare('SELECT version,playbook_json,approved_fact_ids_json,request_id,created_at,reviewer FROM customer_profile_versions WHERE customer_id=? ORDER BY version DESC LIMIT 1').bind(cid).first();
    if(!row)return ok({customer_id:cid,version:0,profile:null,approved_fact_ids:[]});
    return ok({customer_id:cid,version:row.version,profile:JSON.parse(row.playbook_json),
      approved_fact_ids:JSON.parse(row.approved_fact_ids_json),reviewer:row.reviewer,created_at:row.created_at});
   }
   if(method==='POST'&&profile){
    const cid=profile[1];if(!(await customerExists(db,cid)))return error('العميل غير موجود',404);
    const data=await bodyJson(req),expected=data.expected_version,reviewer=String(data.reviewer||'').trim();
    if(!Number.isSafeInteger(expected)||expected<0||expected>1000000 || !reviewer||reviewer.length>80 ||
      !/^[a-z0-9][a-z0-9_-]{7,79}$/.test(data.request_id||''))return error('الإصدار أو المراجع أو معرّف الطلب غير صالح');
    const playbook=makePlaybook(data.profile);
    const factIds=await approvedFacts(db,cid,data.approved_fact_ids);
    const serialized=JSON.stringify({playbook,approved_fact_ids:factIds,expected_version:expected});
    const hash=await sha(enc.encode(serialized));
    const old=await db.prepare('SELECT version,content_sha256 FROM customer_profile_versions WHERE customer_id=? AND request_id=?').bind(cid,data.request_id).first();
    if(old)return old.content_sha256===hash ? ok({customer_id:cid,version:old.version,already_saved:true}) : error('معرّف الطلب سبق استخدامه بمحتوى مختلف',409);
    const t=now(),version=expected+1;
    const result=await db.prepare(`INSERT INTO customer_profile_versions
     (customer_id,version,request_id,content_sha256,playbook_json,approved_fact_ids_json,reviewer,created_at)
     SELECT ?,?,?,?,?,?,?,? WHERE COALESCE((SELECT MAX(version) FROM customer_profile_versions WHERE customer_id=?),0)=?`)
     .bind(cid,version,data.request_id,hash,JSON.stringify(playbook),JSON.stringify(factIds),reviewer,t,cid,expected).run();
    if(result.meta?.changes!==1)return error('نسخة البصمة تغيرت؛ أعد قراءة أحدث إصدار قبل التحديث',409);
    return ok({customer_id:cid,version,already_saved:false,external_write:false},201);
   }
   if(method==='POST'&&path==='/api/profile/facts'){
    const d=await bodyJson(req),cid=d.customer_id,typ=d.subject_type,sid=d.subject_id;
    if(!isId(cid)||!(await customerExists(db,cid))||!['customer','employee'].includes(typ)||!isId(sid))return error('هوية غير صالحة');
    if(typ==='customer'&&sid!==cid)return error('ملف عميل آخر مرفوض');
    if(typ==='employee'&&!(await db.prepare('SELECT employee_id FROM employees WHERE employee_id=?').bind(sid).first()))return error('الموظف غير معروف');
    if(!TOPICS.has(d.topic)||(STAFF_TOPICS.has(d.topic)!==(typ==='employee')))return error('نوع ملاحظة لا يطابق الطرف');
    const statement=String(d.statement||'').trim();if(statement.length<8||statement.length>900)return error('وصف الملاحظة غير صالح');
    const refs=await validateRefs(db,cid,d.evidence_refs);const id=crypto.randomUUID();
    await db.prepare(`INSERT INTO profile_facts(fact_id,customer_id,subject_type,subject_id,topic,statement,source_type,evidence_refs_json,status,created_at)
     VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(id,cid,typ,sid,d.topic,statement,'observed',JSON.stringify(refs),'candidate',now()).run();
    return ok({fact_id:id,status:'candidate'},201);
   }
   const approve=path.match(/^\/api\/profile\/facts\/([0-9a-f-]{36})\/review$/);
   if(method==='POST'&&approve){
    const data=await bodyJson(req),cid=data.customer_id,reviewer=String(data.reviewer||'').trim();
    if(!isId(cid)||!reviewer||reviewer.length>120||!['verified','disputed'].includes(data.decision))return error('مراجعة غير صالحة');
    const fact=await db.prepare('SELECT status,evidence_refs_json FROM profile_facts WHERE fact_id=? AND customer_id=?').bind(approve[1],cid).first();
    if(!fact||fact.status!=='candidate')return error('ملاحظة سبق مراجعتها أو غير موجودة',409);
    if(data.decision==='verified')await validateRefs(db,cid,JSON.parse(fact.evidence_refs_json));
    const result=await db.prepare("UPDATE profile_facts SET status=?,reviewed_by=?,reviewed_at=? WHERE fact_id=? AND customer_id=? AND status='candidate'")
         .bind(data.decision,reviewer,now(),approve[1],cid).run();
    if(result.meta?.changes!==1)return error('تغيّرت حالة الملاحظة أثناء المراجعة',409);
    return ok({fact_id:approve[1],status:data.decision});
   }
   if(method==='POST'&&path==='/api/actions'){
    const data=await bodyJson(req),cid=data.customer_id;
    if(!isId(cid)||!(await customerExists(db,cid)))return error('العميل غير معروف');
    if(!ACTIONS.has(data.kind))return error('الأمر ليس ضمن القائمة المسموحة');
    const note=String(data.note||'').trim();if(note.length<8||note.length>700)return error('سبب الأمر غير صالح');
    const refs=await validateRefs(db,cid,data.evidence_refs),id=crypto.randomUUID();
    await db.prepare(`INSERT INTO agent_actions(action_id,customer_id,kind,note,evidence_refs_json,status,created_at)
     VALUES(?,?,?,?,?,?,?)`).bind(id,cid,data.kind,note,JSON.stringify(refs),'awaiting_review',now()).run();
    return ok({action_id:id,status:'awaiting_review',external_write:false},201);
   }
   return error('المسار غير موجود',404);
  }catch(err){
   if(/UNIQUE constraint failed/i.test(String(err)))return error('تعارض إصدار أو معرّف طلب؛ اقرأ أحدث بصمة قبل إعادة المحاولة',409);
   // Do not leak SQL, tokens, raw messages or stack traces to the caller.
   const publicErrors=['حجم البيانات تجاوز الحد المسموح','صيغة JSON غير صالحة','الدليل مطلوب (1-8 رسائل)',
       'أدلة مكررة','مرجع دليل غير صالح','الدليل غير موجود داخل ملف هذا العميل'];
   const msg=String(err?.message||'');
   return error(publicErrors.includes(msg)?msg:'تعذّر إتمام الطلب؛ لم يتم إعلان نجاحه',400);
  }
 }
};