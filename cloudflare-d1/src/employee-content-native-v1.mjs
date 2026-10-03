import { verifyEmployeeSessionCloudFirst } from './cloud-session-bridge-v3.mjs';

const ROOT='/v1/employee/content';
const HEALTH='/v1/employee/content/health';
const FILE_PREFIX='/v1/employee/content/file/';
const DEFAULT_ORIGINS=[
  'https://fawakhry.github.io',
  'https://trendos-ui.trendmall-contact.workers.dev',
  'http://localhost:8000','http://127.0.0.1:8000','http://localhost:5500','http://127.0.0.1:5500'
];
const READ_ACTIONS=new Set([
  'getPlatformSections','getFranchiseBranches','getServiceProviderRoutes','getMarketplace',
  'getWhiteLabelSettings','getLeadPhoneNumbers','getPlatformAds','getKnowledge','getMatbagyNotes'
]);
const WRITE_ACTIONS=new Set([
  'savePlatformSection','saveFranchiseBranch','assignCustomerBranch','saveServiceProviderRoute',
  'saveMarketplaceVendor','saveMarketplaceProduct','saveWhiteLabelSettings',
  'deletePlatformAd','uploadPlatformAd','saveKnowledge','saveMatbagyNote'
]);
function text(v){return String(v==null?'':v).trim();}
function key(v){return text(v).toLowerCase();}
function yes(v){return v===true||['true','1','yes','نعم'].includes(key(v));}
function safeJson(v,f={}){try{return typeof v==='string'?JSON.parse(v):v&&typeof v==='object'?v:f;}catch{return f;}}
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});}
function origins(env){const a=String(env&&env.CORS_ORIGINS||'').split(',').map(text).filter(Boolean);return a.length?a:DEFAULT_ORIGINS;}
function cors(request,env){const o=text(request.headers.get('Origin')),a=origins(env);return {'access-control-allow-origin':o&&a.includes(o)?o:a[0],'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization','access-control-max-age':'86400',vary:'Origin'};}
function allowed(request,env){const o=text(request.headers.get('Origin'));return !o||origins(env).includes(o);}
function slug(v){const s=text(v).replace(/[^A-Za-z0-9\u0600-\u06FF]+/g,'-').replace(/^-+|-+$/g,'').toUpperCase();return s.slice(0,24);}
function id(prefix,v){return prefix+'-'+(slug(v)||crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase());}
function isAdmin(user){return key(user.role)==='admin';}
function isDiaa(user){return key(user.username)==='ضياء'||key(user.username)==='diaa';}
function isRahma(user){return ['رحمه','رحمة','rahma'].includes(key(user.username));}
function canManage(user,collection){
  if(isAdmin(user)) return true;
  if(['platform_sections','franchise_branches','white_label','platform_ads'].includes(collection)) return isDiaa(user);
  if(['service_provider_routes','marketplace_vendors','marketplace_products'].includes(collection)) return isDiaa(user)||isRahma(user);
  if(collection==='knowledge') return key(user.role)==='service'||isDiaa(user)||isRahma(user);
  if(collection==='notes') return true;
  return false;
}
async function control(env){
  return await env.DB.prepare("SELECT mode,policy_epoch AS policyEpoch FROM employee_content_control_v1 WHERE singleton=1 AND marker='ENTRY614_EMPLOYEE_CONTENT_V1'").first()||{mode:'OFF',policyEpoch:0};
}
async function parseBody(request){try{return {ok:true,body:await request.json()};}catch{return {ok:false,response:json({success:false,code:'invalid-json'},400)};}}
async function auth(request,body,env){
  const h=text(request.headers.get('Authorization')),m=h.match(/^Bearer\s+(.+)$/i);
  const username=text(body.username||body.name), token=text(m?m[1]:body.token);
  if(!username||!token)return {ok:false,status:401,message:'username and employee session token are required'};
  const v=await verifyEmployeeSessionCloudFirst(username,token,env,'edge');
  if(!v||!v.ok)return {ok:false,status:401,message:text(v&&v.message)||'Employee session rejected'};
  const b=v.body||{},u=b.user||{};
  return {ok:true,authSource:text(v.authSource),user:{username:text(u.username||u.name||b.username||username),role:key(u.role||b.role||'service')||'service',department:text(u.department||b.department)}};
}
async function list(env,collection,includeInactive=false){
  const q=includeInactive
    ? await env.DB.prepare("SELECT record_id,record_json,active,sort_order,version,created_at,updated_at FROM employee_content_records_v1 WHERE collection=? ORDER BY sort_order,updated_at DESC").bind(collection).all()
    : await env.DB.prepare("SELECT record_id,record_json,active,sort_order,version,created_at,updated_at FROM employee_content_records_v1 WHERE collection=? AND active=1 ORDER BY sort_order,updated_at DESC").bind(collection).all();
  return (q.results||[]).map(r=>({...safeJson(r.record_json,{}),recordId:r.record_id,active:r.active?'نعم':'لا',sortOrder:Number(r.sort_order||0),version:Number(r.version||1),createdAt:r.created_at,updatedAt:r.updated_at}));
}
async function getOne(env,collection,recordId){
  const r=await env.DB.prepare("SELECT record_id,record_json,active,sort_order,version,created_at,updated_at FROM employee_content_records_v1 WHERE collection=? AND record_id=?").bind(collection,recordId).first();
  return r?{...safeJson(r.record_json,{}),recordId:r.record_id,active:r.active?'نعم':'لا',sortOrder:Number(r.sort_order||0),version:Number(r.version||1),createdAt:r.created_at,updatedAt:r.updated_at}:null;
}
async function upsert(env,collection,recordId,obj,user,active=true,sortOrder=0){
  const existing=await env.DB.prepare("SELECT version FROM employee_content_records_v1 WHERE collection=? AND record_id=?").bind(collection,recordId).first();
  const version=existing?Number(existing.version||1)+1:1;
  await env.DB.prepare(`
    INSERT INTO employee_content_records_v1(collection,record_id,record_json,active,sort_order,updated_by,version)
    VALUES(?,?,?,?,?,?,?)
    ON CONFLICT(collection,record_id) DO UPDATE SET
      record_json=excluded.record_json,active=excluded.active,sort_order=excluded.sort_order,
      updated_by=excluded.updated_by,version=excluded.version,updated_at=CURRENT_TIMESTAMP
  `).bind(collection,recordId,JSON.stringify(obj||{}),active?1:0,Number(sortOrder||0),user.username,version).run();
  await env.DB.prepare("INSERT INTO employee_content_events_v1(collection,record_id,event_type,actor,payload_json) VALUES(?,?,?,?,?)")
    .bind(collection,recordId,existing?'update':'create',user.username,JSON.stringify({version})).run();
  return getOne(env,collection,recordId);
}
async function softDelete(env,collection,recordId,user){
  const r=await env.DB.prepare("UPDATE employee_content_records_v1 SET active=0,updated_by=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE collection=? AND record_id=?").bind(user.username,collection,recordId).run();
  if(!Number(r.meta&&r.meta.changes||0)) return false;
  await env.DB.prepare("INSERT INTO employee_content_events_v1(collection,record_id,event_type,actor) VALUES(?,?,?,?)").bind(collection,recordId,'deactivate',user.username).run();
  return true;
}
function b64Bytes(v){
  const raw=text(v).replace(/^data:[^;]+;base64,/,''); if(!raw)return null;
  const bin=atob(raw), out=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i); return out;
}
async function uploadPublicFile(env,collection,ownerRecordId,user,payload,defaultName){
  if(!payload.base64) return null;
  if(!env.FILES) throw Object.assign(new Error('Cloudflare R2 FILES binding is not configured'),{code:'r2-files-not-configured'});
  const bytes=b64Bytes(payload.base64), mime=text(payload.mimeType)||'application/octet-stream';
  if(!bytes||!bytes.length) throw Object.assign(new Error('Invalid base64 file'),{code:'invalid-file'});
  if(bytes.length>25*1024*1024) throw Object.assign(new Error('File exceeds 25MB'),{code:'file-too-large'});
  const fileId='FILE-'+crypto.randomUUID(), name=text(payload.fileName)||defaultName||'file.bin';
  const r2Key=`employee-content/${collection}/${fileId}/${name.replace(/[^A-Za-z0-9._-]+/g,'_')}`;
  await env.FILES.put(r2Key,bytes,{httpMetadata:{contentType:mime}});
  const base=text(env.FILES_PUBLIC_BASE_URL).replace(/\/+$/,'');
  const publicUrl=base?base+'/'+r2Key:FILE_PREFIX+encodeURIComponent(fileId);
  await env.DB.prepare("INSERT INTO employee_content_files_v1(file_id,collection,owner_record_id,r2_key,file_name,mime_type,size_bytes,public_url,uploaded_by) VALUES(?,?,?,?,?,?,?,?,?)")
    .bind(fileId,collection,ownerRecordId,r2Key,name,mime,bytes.length,publicUrl,user.username).run();
  return {fileId,fileName:name,mimeType:mime,size:bytes.length,fileUrl:publicUrl,thumbnailUrl:publicUrl};
}
async function serveFile(env,fileId){
  const meta=await env.DB.prepare("SELECT r2_key,mime_type FROM employee_content_files_v1 WHERE file_id=?").bind(fileId).first();
  if(!meta||!env.FILES)return new Response('Not found',{status:404});
  const obj=await env.FILES.get(meta.r2_key); if(!obj)return new Response('Not found',{status:404});
  const headers=new Headers(); headers.set('content-type',text(meta.mime_type)||'application/octet-stream'); headers.set('cache-control','public,max-age=3600');
  return new Response(obj.body,{status:200,headers});
}
function codeFor(prefix,value){return id(prefix,value).slice(0,32);}
function cleanRecordBody(body,drop=[]){
  const out={}; for(const [k,v] of Object.entries(body||{})){if(['username','name','token','action','base64','op',...drop].includes(k))continue;out[k]=v;} return out;
}
async function getLeadPhones(env){
  const q=await env.DB.prepare(`
    SELECT phone FROM t12_customers WHERE active='نعم' AND phone<>''
    UNION SELECT extra_phone AS phone FROM t12_customers WHERE active='نعم' AND extra_phone<>''
    UNION SELECT customer_phone AS phone FROM t12_prod_orders WHERE customer_phone<>''
  `).all();
  const phones=[...new Set((q.results||[]).map(r=>text(r.phone)).filter(Boolean))];
  return {success:true,phones,count:phones.length};
}
async function assignCustomerBranch(env,user,body){
  const query=text(body.customerQuery||body.customerCode||body.customerName), branchCode=text(body.branchCode||body.franchiseBranchCode), branchName=text(body.branchName||body.franchiseBranchName);
  if(!query||!branchCode)return {success:false,message:'كود/اسم العميل وكود الفرع مطلوبين.'};
  const qkey=key(query);
  const row=await env.DB.prepare(`
    SELECT customer_id,customer_name FROM t12_customers
    WHERE customer_id=? OR legacy_chat_code=? OR legacy_customer_code=? OR customer_name_key=?
    ORDER BY CASE WHEN customer_id=? THEN 0 WHEN legacy_chat_code=? THEN 1 WHEN legacy_customer_code=? THEN 2 ELSE 3 END
    LIMIT 1
  `).bind(query,query,query,qkey,query,query,query).first();
  if(!row)return {success:false,message:'لم يتم العثور على العميل. استخدم كود الشات أو الاسم كما هو.'};
  await env.DB.batch([
    env.DB.prepare("UPDATE t12_customers SET branch_code=?,branch_name=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE customer_id=?").bind(branchCode,branchName,row.customer_id),
    env.DB.prepare("INSERT INTO t12_customer_events(customer_id,request_key,event_type,actor,payload_json) VALUES(?,?,?,?,?)")
      .bind(row.customer_id,'ZG-BRANCH-'+crypto.randomUUID(),'customer-update',user.username,JSON.stringify({branchCode,branchName,source:'employee-content-v1'}))
  ]);
  return {success:true,customerId:row.customer_id,customerName:row.customer_name,branchCode,branchName,message:'تم ربط العميل بفرع مطبعجي.'};
}
async function action(request,env,body,user){
  const a=text(body.action), includeInactive=yes(body.includeInactive);
  if(a==='getPlatformSections'){
    if(includeInactive&&!canManage(user,'platform_sections'))return {success:false,message:'غير مصرح بإدارة أقسام المنصة.'};
    const rows=await list(env,'platform_sections',includeInactive);
    return {success:true,sections:rows.map(r=>({sectionCode:r.code||r.recordId,...r})),count:rows.length};
  }
  if(a==='savePlatformSection'){
    if(!canManage(user,'platform_sections'))return {success:false,message:'غير مصرح بحفظ أقسام المنصة.'};
    const name=text(body.sectionName||body.name); if(!name)return {success:false,message:'اسم القسم مطلوب.'};
    const recordId=text(body.sectionCode)||codeFor('SEC',name), file=await uploadPublicFile(env,'platform_sections',recordId,user,body,'section.png');
    const obj={...cleanRecordBody(body),code:recordId,name}; if(file)Object.assign(obj,file);
    const row=await upsert(env,'platform_sections',recordId,obj,user,text(body.active)!=='لا',Number(body.sortOrder||0));
    return {success:true,sectionCode:recordId,fileUrl:row.fileUrl||'',fileId:row.fileId||'',thumbnailUrl:row.thumbnailUrl||'',message:'تم حفظ القسم.'};
  }
  if(a==='getFranchiseBranches'){
    if(includeInactive&&!canManage(user,'franchise_branches'))return {success:false,message:'غير مصرح بإدارة الفروع والفرنشايز.'};
    const rows=await list(env,'franchise_branches',includeInactive), publicOnly=yes(body.publicOnly);
    const branches=rows.filter(r=>!publicOnly||(!['مخفي'].includes(text(r.customerVisibility))&&text(r.branchRole)!=='شريك تنفيذ مخفي')).map(r=>({branchCode:r.code||r.recordId,brandName:r.displayName||r.brandName||'',...r}));
    return {success:true,branches,count:branches.length};
  }
  if(a==='saveFranchiseBranch'){
    if(!canManage(user,'franchise_branches'))return {success:false,message:'غير مصرح بحفظ فروع مطبعجي.'};
    const brandName=text(body.brandName); if(!brandName)return {success:false,message:'اسم واجهة الفرع مطلوب.'};
    const recordId=text(body.branchCode)||codeFor('MB',brandName), obj={...cleanRecordBody(body),code:recordId,brandName};
    await upsert(env,'franchise_branches',recordId,obj,user,text(body.active)!=='لا',0);
    return {success:true,branchCode:recordId,message:'تم حفظ فرع/فرنشايز مطبعجي.'};
  }
  if(a==='assignCustomerBranch'){
    if(!canManage(user,'franchise_branches'))return {success:false,message:'غير مصرح بربط العملاء بالفروع.'};
    return assignCustomerBranch(env,user,body);
  }
  if(a==='getServiceProviderRoutes'){
    const rows=await list(env,'service_provider_routes',includeInactive);
    return {success:true,routes:rows.map(r=>({routeCode:r.code||r.recordId,...r})),count:rows.length};
  }
  if(a==='saveServiceProviderRoute'){
    if(!canManage(user,'service_provider_routes'))return {success:false,message:'غير مصرح بحفظ ربط الخدمات.'};
    const serviceName=text(body.serviceName); if(!serviceName)return {success:false,message:'اسم الخدمة مطلوب.'};
    const recordId=text(body.routeCode)||codeFor('SR',serviceName+'-'+text(body.providerName)), obj={...cleanRecordBody(body),code:recordId,serviceName};
    await upsert(env,'service_provider_routes',recordId,obj,user,text(body.active)!=='لا',0);
    return {success:true,routeCode:recordId,message:'تم حفظ ربط الخدمة.'};
  }
  if(a==='getMarketplace'){
    const [vendors,products]=await Promise.all([list(env,'marketplace_vendors',includeInactive),list(env,'marketplace_products',includeInactive)]);
    return {success:true,vendors,products};
  }
  if(a==='saveMarketplaceVendor'||a==='saveMarketplaceProduct'){
    const collection=a==='saveMarketplaceVendor'?'marketplace_vendors':'marketplace_products';
    if(!canManage(user,collection))return {success:false,message:'غير مصرح بإدارة ماركت بليس.'};
    const label=text(a==='saveMarketplaceVendor'?(body.vendorName||body.name):(body.productName||body.name)); if(!label)return {success:false,message:'الاسم مطلوب.'};
    const recordId=text(a==='saveMarketplaceVendor'?body.vendorCode:body.productCode)||codeFor(a==='saveMarketplaceVendor'?'VND':'PRD',label);
    const file=await uploadPublicFile(env,collection,recordId,user,body,'market.png'), obj={...cleanRecordBody(body),code:recordId,name:label}; if(file)Object.assign(obj,file);
    await upsert(env,collection,recordId,obj,user,text(body.active)!=='لا',Number(body.sortOrder||0));
    return {success:true,[a==='saveMarketplaceVendor'?'vendorCode':'productCode']:recordId,message:'تم الحفظ.'};
  }
  if(a==='getWhiteLabelSettings'){
    const row=await getOne(env,'white_label','default'); return {success:true,settings:row||{}};
  }
  if(a==='saveWhiteLabelSettings'){
    if(!canManage(user,'white_label'))return {success:false,message:'غير مصرح بحفظ نسخة مطبعة.'};
    const platformName=text(body.platformName); if(!platformName)return {success:false,message:'اسم المنصة مطلوب.'};
    const obj=cleanRecordBody(body); await upsert(env,'white_label','default',obj,user,true,0);
    return {success:true,settings:await getOne(env,'white_label','default'),message:'تم حفظ إعدادات نسخة المطبعة.'};
  }
  if(a==='getLeadPhoneNumbers'){
    if(!canManage(user,'white_label'))return {success:false,message:'غير مصرح بعرض أرقام العملاء.'};
    return getLeadPhones(env);
  }
  if(a==='getPlatformAds'){
    if(includeInactive&&!canManage(user,'platform_ads'))return {success:false,message:'غير مصرح بإدارة الإعلانات.'};
    const ads=await list(env,'platform_ads',includeInactive); return {success:true,ads,count:ads.length};
  }
  if(a==='deletePlatformAd'){
    if(!canManage(user,'platform_ads'))return {success:false,message:'غير مصرح بحذف الإعلانات.'};
    const adId=text(body.adId||body.id); if(!adId)return {success:false,message:'رقم الإعلان مطلوب.'};
    const ok=await softDelete(env,'platform_ads',adId,user); return ok?{success:true,message:'تم حذف الإعلان.'}:{success:false,message:'الإعلان غير موجود.'};
  }
  if(a==='uploadPlatformAd'){
    if(!canManage(user,'platform_ads'))return {success:false,message:'غير مصرح برفع الإعلانات.'};
    const adId=text(body.adId)||id('AD',''), file=await uploadPublicFile(env,'platform_ads',adId,user,body,'ad.png');
    if(!file)return {success:false,message:'الملف مطلوب.'};
    const obj={...cleanRecordBody(body),adId,...file}; await upsert(env,'platform_ads',adId,obj,user,text(body.active)!=='لا',Number(body.sortOrder||0));
    return {success:true,adId,...file,message:'تم رفع الإعلان.'};
  }
  if(a==='getKnowledge'){
    if(!canManage(user,'knowledge'))return {success:false,message:'ليس لديك صلاحية عرض المعرفة.'};
    let rows=await list(env,'knowledge',true); const category=text(body.category),q=key(body.q||body.search);
    rows=rows.filter(r=>(!category||text(r.category)===category)&&(!q||key([r.title,r.content,r.key,r.keywords].join(' ')).includes(q)));
    const rank={'عالية':0,'عادية':1,'منخفضة':2}; rows.sort((a,b)=>(rank[a.priority]??9)-(rank[b.priority]??9));
    return {success:true,rows,count:rows.length};
  }
  if(a==='saveKnowledge'){
    if(!canManage(user,'knowledge'))return {success:false,message:'ليس لديك صلاحية حفظ معرفة واتس AI.'};
    const title=text(body.title),content=text(body.content); if(!title||!content)return {success:false,message:'العنوان والمحتوى مطلوبين.'};
    const recordId=text(body.id)||'KB-'+crypto.randomUUID().replace(/-/g,'').slice(0,12).toUpperCase();
    const obj={...cleanRecordBody(body),id:recordId,title,content,category:text(body.category)||'قواعد التشغيل',priority:text(body.priority)||'عادية'};
    await upsert(env,'knowledge',recordId,obj,user,text(body.active)!=='لا',0); return {success:true,id:recordId,message:'تم حفظ قاعدة المعرفة.'};
  }
  if(a==='getMatbagyNotes'){
    let rows=await list(env,'notes',true); const category=text(body.category),titlePrefix=text(body.titlePrefix),employee=key(body.employee||body.noteUser),date=text(body.date),limit=Math.max(1,Math.min(Number(body.limit||80),200));
    rows=rows.filter(r=>(!category||text(r.category||'عام')===category)&&(!titlePrefix||text(r.title).startsWith(titlePrefix))&&(!employee||key([r.title,r.content,r.by].join(' ')).includes(employee))&&(!date||text(r.content).includes(`"date":"${date}"`)||text(r.title).includes(date))).slice(0,limit);
    return {success:true,notes:rows};
  }
  if(a==='saveMatbagyNote'){
    const content=text(body.content); if(!content)return {success:false,message:'اكتب النوت.'};
    const recordId='NOTE-'+crypto.randomUUID().replace(/-/g,'').slice(0,8).toUpperCase(), category=text(body.category)||'عام', title=text(body.title)||`نوت مطبعجي - ${category}`;
    const obj={id:recordId,category,title,content,by:user.username,time:new Date().toISOString()}; await upsert(env,'notes',recordId,obj,user,true,Date.now());
    return {success:true,id:recordId,message:'تم حفظ النوت.'};
  }
  return {success:false,code:'content-action-unknown',message:'Employee content action is not supported.'};
}

export function isEmployeeContentNativePath(path){
  const p=String(path||'').replace(/\/+$/,'')||'/';
  return p===ROOT||p===HEALTH||p.startsWith(FILE_PREFIX);
}
export async function handleEmployeeContentNativeRequest(request,env){
  const h=cors(request,env); if(request.method==='OPTIONS')return new Response(null,{status:204,headers:h});
  if(!allowed(request,env))return json({success:false,code:'origin-not-allowed'},403,h);
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(path.startsWith(FILE_PREFIX)&&request.method==='GET')return serveFile(env,decodeURIComponent(path.slice(FILE_PREFIX.length)));
  if(path===HEALTH){
    if(request.method!=='GET')return json({success:false,code:'method-not-allowed'},405,h);
    const c=await control(env); const tables=await env.DB.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('employee_content_records_v1','employee_content_files_v1','employee_content_events_v1')").first();
    return json({success:true,schemaReady:Number(tables&&tables.n||0)===3,mode:text(c.mode)||'OFF',policyEpoch:Number(c.policyEpoch||0),r2Ready:!!env.FILES,googleBusinessCalls:0,appsScriptBusinessAuthority:false},200,h);
  }
  if(path!==ROOT)return json({success:false,code:'not-found'},404,h);
  if(request.method!=='POST')return json({success:false,code:'method-not-allowed'},405,h);
  const parsed=await parseBody(request); if(!parsed.ok)return parsed.response;
  const body=parsed.body||{}, a=text(body.action), c=await control(env);
  if(c.mode==='OFF')return json({success:false,code:'employee-content-off'},503,h);
  if(c.mode==='READONLY'&&!READ_ACTIONS.has(a))return json({success:false,code:'employee-content-readonly'},503,h);
  if(!READ_ACTIONS.has(a)&&!WRITE_ACTIONS.has(a))return json({success:false,code:'employee-content-action-unknown'},400,h);
  const au=await auth(request,body,env); if(!au.ok)return json({success:false,code:'employee-session-rejected',message:au.message},au.status||401,h);
  try{
    const out=await action(request,env,body,au.user);
    return json({...out,authority:'d1-employee-content-v1',authSource:au.authSource},out&&out.success===false?400:200,h);
  }catch(err){
    return json({success:false,code:text(err&&err.code)||'employee-content-failed',message:text(err&&err.message)||'Employee content failed',authority:'d1-employee-content-v1'},err&&err.code==='r2-files-not-configured'?503:500,h);
  }
}
