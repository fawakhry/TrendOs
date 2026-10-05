import { verifyEmployeeSessionCloudFirst } from './cloud-session-bridge-v3.mjs';

const ROOT='/v1/employee/accounting';
const HEALTH='/v1/employee/accounting/health';
const DEFAULT_ORIGINS=[
  'https://fawakhry.github.io',
  'https://trendos-ui.trendmall-contact.workers.dev',
  'http://localhost:8000','http://127.0.0.1:8000','http://localhost:5500','http://127.0.0.1:5500'
];
const READ_ACTIONS=new Set(['getAccounting','getDeptInvoiceDraftV1887','getPartyAccountV1858','getCustomerAccountV1915','getEasyStoreCustomers','searchCustomers','getEasyStoreSuppliers','easyStoreSystemHealth','calculateAccountingLaserQuoteV1913','getDailyDepartmentReportV1920','previewAccountingAutomationV1921']);

function text(v){return String(v==null?'':v).trim();}
function key(v){return text(v).toLowerCase();}
function num(v,f=0){const n=Number(String(v==null?'':v).replace(/[^0-9.\-]/g,''));return Number.isFinite(n)?n:Number(f||0);}
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});}
function origins(env){const a=String(env&&env.CORS_ORIGINS||'').split(',').map(text).filter(Boolean);return a.length?a:DEFAULT_ORIGINS;}
function cors(request,env){const o=text(request.headers.get('Origin')),a=origins(env);return {'access-control-allow-origin':o&&a.includes(o)?o:a[0],'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization','access-control-max-age':'86400',vary:'Origin'};}
function originAllowed(request,env){const o=text(request.headers.get('Origin'));return !o||origins(env).includes(o);}
function uid(prefix){return prefix+'-'+crypto.randomUUID().replace(/-/g,'').slice(0,12).toUpperCase();}
function parseJson(v,f=[]){try{const x=typeof v==='string'?JSON.parse(v):v;return x==null?f:x;}catch{return f;}}
function commandErrorV1(code,message){const e=new Error(message);e.code=code;return e;}
function stableValueV1(v){
  if(Array.isArray(v))return v.map(stableValueV1);
  if(v&&typeof v==='object'){
    const out={};
    for(const k of Object.keys(v).sort()){
      if(['token','password','oldPassword','newPassword','confirmPassword','employeePassword','_ts','username'].includes(k))continue;
      out[k]=stableValueV1(v[k]);
    }
    return out;
  }
  return v;
}
function canonicalCommandJsonV1(body){return JSON.stringify(stableValueV1(body||{}));}
async function sha256HexV1(value){
  const bytes=new TextEncoder().encode(String(value||''));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function evidenceRefsV1(body){
  const v=body&&body.evidenceRefs!==undefined?body.evidenceRefs:body&&body.evidence_refs;
  const parsed=parseJson(v,Array.isArray(v)?v:[]);
  return Array.isArray(parsed)?parsed.map(text).filter(Boolean).slice(0,50):[];
}
function sourceSystemV1(body){return text(body&&body.sourceSystem||body&&body.source_system||body&&body.connectorSource)||'EasyStore';}
function correlationIdV1(body,requestKey){return text(body&&body.correlationId||body&&body.correlation_id||body&&body.orderId||requestKey);}
async function beginCommandV1(env,auth,operation,body,entityId=''){
  const requestKey=text(body&&body.requestId||body&&body.idempotencyKey||body&&body.clientRequestId);
  if(!/^[\p{L}\p{N}_:.\-]{12,180}$/u.test(requestKey))throw commandErrorV1('accounting-idempotency-key-required','requestId/idempotencyKey صالح مطلوب لتأمين الحركة.');
  const canonical=canonicalCommandJsonV1(body),hash=await sha256HexV1(canonical);
  const existing=await env.DB.prepare("SELECT operation,canonical_json AS canonicalJson,request_hash AS requestHash,status,response_json AS responseJson FROM employee_accounting_request_ledger_v1 WHERE request_key=?").bind(requestKey).first();
  if(existing){
    if(text(existing.operation)!==text(operation)||text(existing.canonicalJson)!==canonical|| (text(existing.requestHash)&&text(existing.requestHash)!==hash)){
      throw commandErrorV1('accounting-idempotency-conflict','معرف الطلب مستخدم من قبل لبيانات مختلفة.');
    }
    if(text(existing.status)==='COMMITTED')return {requestKey,canonical,hash,replay:true,response:parseJson(existing.responseJson,{})};
    throw commandErrorV1('accounting-command-in-progress','الحركة بنفس معرف الطلب قيد التنفيذ أو تحتاج مراجعة تعافٍ.');
  }
  const c=await control(env),sourceSystem=sourceSystemV1(body),correlationId=correlationIdV1(body,requestKey),evidence=evidenceRefsV1(body);
  await env.DB.prepare(`
    INSERT INTO employee_accounting_request_ledger_v1
      (request_key,operation,actor,canonical_json,entity_id,status,request_hash,source_system,correlation_id,evidence_refs_json,policy_epoch,command_version)
    VALUES(?,?,?,?,?,'PREPARED',?,?,?,?,?,'A2_COMMAND_V1')
  `).bind(requestKey,text(operation),auth.user.username,canonical,text(entityId),hash,sourceSystem,correlationId,JSON.stringify(evidence),Number(c.policyEpoch||0)).run();
  return {requestKey,canonical,hash,replay:false,sourceSystem,correlationId,evidence,policyEpoch:Number(c.policyEpoch||0)};
}
async function commitCommandV1(env,ctx,response){
  await env.DB.prepare("UPDATE employee_accounting_request_ledger_v1 SET status='COMMITTED',response_json=?,updated_at=CURRENT_TIMESTAMP WHERE request_key=? AND status='PREPARED'")
    .bind(JSON.stringify(response||{}),ctx.requestKey).run();
  return response;
}
async function auditEventV1(env,ctx,entityType,entityId,eventType,actor,payload={},autonomyLevel='HUMAN'){
  await env.DB.prepare(`
    INSERT INTO employee_accounting_events_v1
      (entity_type,entity_id,event_type,actor,payload_json,created_at_ms,request_key,correlation_id,source_system,evidence_refs_json,policy_epoch,autonomy_level)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(text(entityType),text(entityId),text(eventType),text(actor),JSON.stringify(payload||{}),Date.now(),
    text(ctx&&ctx.requestKey),text(ctx&&ctx.correlationId),text(ctx&&ctx.sourceSystem)||'EasyStore',JSON.stringify(ctx&&ctx.evidence||[]),
    Number(ctx&&ctx.policyEpoch||0),text(autonomyLevel)||'HUMAN').run();
}

function accountingMode(user){
  const blob=key([user.username,user.role,user.department].join(' '));
  if(user.role==='admin'||/ضياء|diaa/.test(blob))return 'full';
  if(/رحمه|رحمة|rahma|ريفان|ريڤان|revan|rivan/.test(blob))return 'final';
  if(user.role==='print'||/وائل|wael/.test(blob))return 'print';
  if(user.role==='laser'||/جابر|gaber|jaber/.test(blob))return 'laser';
  return 'none';
}
function departmentForMode(mode){return mode==='print'?'طباعة':mode==='laser'?'ليزر':'';}
async function control(env){return await env.DB.prepare("SELECT mode,next_invoice_number AS nextInvoiceNumber,policy_epoch AS policyEpoch FROM employee_accounting_control_v1 WHERE singleton=1 AND marker='ENTRY614_ACCOUNTING_V1'").first()||{mode:'OFF',nextInvoiceNumber:1,policyEpoch:0};}

async function writeCanaryPolicyV1(env){
  try{
    const r=await env.DB.prepare("SELECT enabled,allowed_usernames_json AS allowedUsersJson,allowed_actions_json AS allowedActionsJson,max_amount AS maxAmount,expires_at_ms AS expiresAtMs,policy_epoch AS policyEpoch FROM employee_accounting_write_canary_v1 WHERE singleton=1 AND marker='EASYSTORE_A2_WRITE_CANARY_V1'").first();
    if(!r)return {exists:false,enabled:true,allowedUsers:[],allowedActions:[],maxAmount:0,expiresAtMs:0,policyEpoch:0};
    return {
      exists:true,
      enabled:Number(r.enabled||0)===1,
      allowedUsers:(parseJson(r.allowedUsersJson,[])||[]).map(key).filter(Boolean),
      allowedActions:(parseJson(r.allowedActionsJson,[])||[]).map(text).filter(Boolean),
      maxAmount:Math.max(0,num(r.maxAmount)),
      expiresAtMs:Math.max(0,Math.trunc(num(r.expiresAtMs))),
      policyEpoch:Math.max(0,Math.trunc(num(r.policyEpoch)))
    };
  }catch{
    return {exists:false,enabled:true,allowedUsers:[],allowedActions:[],maxAmount:0,expiresAtMs:0,policyEpoch:0};
  }
}
function writeAmountV1(body){
  const b=body||{};
  const vals=[
    num(b.amount),num(b.total),num(b.finalTotal),num(b.manualAmount),
    num(b.paid),num(b.openingDebt||b.opening||b.debt),
    num(b.qty)*num(b.unit||b.unitPrice||b.unitCost)
  ].map(x=>Math.abs(x)).filter(Number.isFinite);
  return vals.length?Math.max(...vals):0;
}
async function enforceWriteCanaryV1(env,auth,action,body){
  if(READ_ACTIONS.has(action))return {allowed:true,read:true};
  const p=await writeCanaryPolicyV1(env);
  if(!p.enabled)return {allowed:true,canary:false,policyEpoch:p.policyEpoch};
  if(!p.exists)throw commandErrorV1('employee-accounting-canary-policy-missing','سياسة كاناري الكتابة غير جاهزة؛ تم منع الحركة.');
  if(p.expiresAtMs>0&&Date.now()>p.expiresAtMs)throw commandErrorV1('employee-accounting-canary-expired','نافذة كاناري الحسابات منتهية؛ تم منع الحركة.');
  if(!p.allowedUsers.includes(key(auth&&auth.user&&auth.user.username)))throw commandErrorV1('employee-accounting-canary-user-blocked','هذا المستخدم غير مسموح له بكاناري كتابة الحسابات.');
  if(!p.allowedActions.includes(text(action)))throw commandErrorV1('employee-accounting-canary-action-blocked','هذه الحركة غير مسموحة داخل كاناري الحسابات.');
  const amount=writeAmountV1(body);
  if(p.maxAmount>0&&amount>p.maxAmount+0.000001)throw commandErrorV1('employee-accounting-canary-amount-blocked','قيمة الحركة أعلى من حد كاناري الحسابات.');
  return {allowed:true,canary:true,policyEpoch:p.policyEpoch,amount};
}

async function parseBody(request){try{return {ok:true,body:await request.json()};}catch{return {ok:false,response:json({success:false,code:'invalid-json'},400)};}}
async function authenticate(request,body,env){
  const h=text(request.headers.get('Authorization')),m=h.match(/^Bearer\s+(.+)$/i),username=text(body.username||body.name),token=text(m?m[1]:body.token);
  if(!username||!token)return {ok:false,status:401,message:'username and employee session token are required'};
  const v=await verifyEmployeeSessionCloudFirst(username,token,env,'edge');
  if(!v||!v.ok)return {ok:false,status:401,message:text(v&&v.message)||'Employee session rejected'};
  const b=v.body||{},u=b.user||{},user={username:text(u.username||u.name||b.username||username),role:key(u.role||b.role||'service')||'service',department:text(u.department||b.department)};
  const mode=accountingMode(user);if(mode==='none')return {ok:false,status:403,message:'ليس لديك صلاحية حسابات مطبعجي.'};
  return {ok:true,authSource:text(v.authSource),user,mode,department:departmentForMode(mode)};
}
function permissions(auth){return {
  mode:auth.mode,department:auth.department,
  canManageMaterials:auth.mode==='full',
  canCloseFinalInvoice:auth.mode==='full'||auth.mode==='final',
  canEnterDeptLine:['full','print','laser'].includes(auth.mode),
  canEnterPurchaseInvoice:auth.mode==='full',
  canEnterDailyPurchase:auth.mode==='print'||auth.mode==='laser',
  canApproveDailyPurchases:auth.mode==='full',
  canManageCustody:auth.mode==='full',
  canCloseDepartmentDay:auth.mode==='full',
  canClassifyLegacy:auth.mode==='full',
  canReversePurchases:auth.mode==='full',
  canSeeCosts:auth.mode==='full',
  canSeeProfitReports:auth.mode==='full'
};}
async function event(env,entityType,entityId,eventType,actor,payload={}){
  await env.DB.prepare("INSERT INTO employee_accounting_events_v1(entity_type,entity_id,event_type,actor,payload_json,created_at_ms) VALUES(?,?,?,?,?,?)")
    .bind(entityType,text(entityId),eventType,text(actor),JSON.stringify(payload),Date.now()).run();
}
async function rows(env,sql,bind=[]){const s=env.DB.prepare(sql),q=bind.length?await s.bind(...bind).all():await s.all();return q.results||[];}
function materialView(r){return {
  id:r.material_id,materialName:r.material_name,department:r.department,materialKind:r.material_kind,
  materialClass:r.material_class,unit:r.unit,stockQty:Number(r.stock_qty||0),minStock:Number(r.min_stock||0),
  unitCost:Number(r.unit_cost||0),computedUnitCost:Number(r.computed_unit_cost||r.unit_cost||0),
  salePrice:Number(r.official_sale_price||0),componentsJson:r.components_json,formula:r.formula,notes:r.notes,
  active:r.active?'نعم':'لا',version:Number(r.version||1)
};}
function templateView(r){return {
  id:r.template_id,department:r.department,category:r.category,itemName:r.item_name,size:r.size,materialName:r.material_name,
  outputCount:Number(r.output_count||0),inkCost:Number(r.ink_cost||0),fixedCost:Number(r.fixed_cost||0),
  computedUnitCost:Number(r.computed_cost||0),salePrice:Number(r.suggested_sale_price||0),
  componentsJson:r.components_json,notes:r.notes,active:r.active?'نعم':'لا',version:Number(r.version||1)
};}
function deptLineView(r){return {
  id:r.accounting_line_id,orderId:r.order_id,lineId:r.line_id,customerName:r.customer_name,department:r.department,
  itemType:r.item_type,itemName:r.item_name,qty:Number(r.qty||0),materialName:r.material_name,
  materialConsumption:Number(r.material_consumption||0),materialCost:Number(r.material_cost||0),
  operatingCost:Number(r.operating_cost||0),otherCost:Number(r.other_cost||0),totalCost:Number(r.total_cost||0),
  systemCost:Number(r.system_cost||0),systemSalePrice:Number(r.system_sale_price||0),salePrice:Number(r.sale_price||0),
  lineTotal:Number(r.sale_price||0),profit:Number(r.profit||0),billingStatus:r.billing_status,
  approvalStatus:r.approval_status,approvedBy:r.approved_by,approvalBatchId:r.approval_batch_id,
  stockDeducted:!!r.stock_deducted,closeStatus:r.close_status,invoiceNo:r.final_invoice_no,notes:r.notes,version:Number(r.version||1)
};}
function invoiceView(r){return {
  invoiceNo:r.invoice_no,orderId:r.order_id,customerName:r.customer_name,
  lineIds:parseJson(r.accounting_line_ids_json,[]),manualItem:r.manual_item,manualAmount:Number(r.manual_amount||0),
  subtotal:Number(r.subtotal||0),discount:Number(r.discount||0),finalTotal:Number(r.final_total||0),
  paid:Number(r.paid||0),remaining:Number(r.remaining||0),paymentMethod:r.payment_method,
  department:r.finance_department,status:r.status,createdBy:r.closed_by,notes:r.notes,createdAtMs:Number(r.created_at_ms||0)
};}
async function summary(env,auth){
  let filter='',bind=[];if(auth.mode==='print'||auth.mode==='laser'){filter=' WHERE department=?';bind=[auth.department];}
  const r=(await rows(env,`SELECT department,COUNT(*) AS count,SUM(sale_price) AS sales,SUM(total_cost) AS cost,SUM(profit) AS profit FROM employee_accounting_dept_lines_v1${filter} GROUP BY department`,bind))
    .map(x=>({department:x.department,sales:Number(x.sales||0),cost:auth.mode==='full'?Number(x.cost||0):'',profit:auth.mode==='full'?Number(x.profit||0):'',count:Number(x.count||0)}));
  return {byDepartment:r};
}
async function getAccounting(env,auth){
  const deptFilter=(auth.mode==='print'||auth.mode==='laser')?' WHERE department=?':'',bind=deptFilter?[auth.department]:[];
  const mats=(await rows(env,'SELECT * FROM employee_accounting_materials_v1'+deptFilter+' ORDER BY material_name',bind)).map(materialView);
  const temps=(await rows(env,'SELECT * FROM employee_accounting_templates_v1'+deptFilter+' ORDER BY item_name',bind)).map(templateView);
  const dlines=(await rows(env,'SELECT * FROM employee_accounting_dept_lines_v1'+deptFilter+' ORDER BY updated_at DESC LIMIT 500',bind)).map(deptLineView);
  const invoices=(auth.mode==='full'||auth.mode==='final')?(await rows(env,'SELECT * FROM employee_accounting_final_invoices_v1 ORDER BY created_at_ms DESC LIMIT 300')).map(invoiceView):[];
  return {success:true,permissions:permissions(auth),materials:mats,templates:temps,deptLines:dlines,finalInvoices:invoices,sales:[],purchases:[],dailyPurchases:[],custodyEntries:[],custodySummary:[],departmentDayCloses:[],unclassifiedRows:[],wasteLines:[],stockMoves:[],summary:await summary(env,auth),version:'ENTRY614_D1_ACCOUNTING_V1'};
}

async function customerBalanceByName(env,name){
  const c=await env.DB.prepare("SELECT customer_id AS customerId FROM t12_customers WHERE lower(customer_name)=lower(?) ORDER BY updated_at DESC LIMIT 1").bind(text(name)).first();
  if(!c)return 0;
  return partyBalanceV1(env,'customer',text(c.customerId));
}
function customerViewV1(r){
  const balance=num(r.current_balance);
  return {
    customerId:text(r.customer_id),id:text(r.customer_id),name:text(r.customer_name),customerName:text(r.customer_name),
    manager:text(r.manager),phone:text(r.phone||r.extra_phone),mobile:text(r.phone||r.extra_phone),extraPhone:text(r.extra_phone),
    type:text(r.customer_type),active:text(r.active),debt:balance,debtAmount:balance,currentBalance:balance,remainingBalance:balance
  };
}
async function getEasyStoreCustomersV1(env,b){
  const limit=Math.max(1,Math.min(Math.trunc(num(b.limit,500)),1000));
  const list=await rows(env,`
    SELECT c.customer_id,c.customer_name,c.manager,c.phone,c.extra_phone,c.customer_type,c.active,
      COALESCE((SELECT pb.balance FROM employee_accounting_party_balances_v1 pb
        WHERE pb.party_type='customer' AND pb.party_id=c.customer_id LIMIT 1),0) AS current_balance
    FROM t12_customers c
    WHERE c.active='نعم'
    ORDER BY c.updated_at DESC,c.customer_name
    LIMIT ?
  `,[limit]);
  return {success:true,customers:list.map(customerViewV1),version:'A1_D1_READ_MODEL_V1'};
}
async function searchCustomersV1(env,b){
  const q=key(b.q);
  if(!q)return {success:true,customers:[],version:'A1_D1_READ_MODEL_V1'};
  const like='%'+q+'%';
  const list=await rows(env,`
    SELECT c.customer_id,c.customer_name,c.manager,c.phone,c.extra_phone,c.customer_type,c.active,
      COALESCE((SELECT pb.balance FROM employee_accounting_party_balances_v1 pb
        WHERE pb.party_type='customer' AND pb.party_id=c.customer_id LIMIT 1),0) AS current_balance
    FROM t12_customers c
    WHERE c.active='نعم'
      AND lower(c.customer_name || ' ' || c.manager || ' ' || c.phone || ' ' || c.extra_phone || ' ' || c.customer_type) LIKE ?
    ORDER BY c.updated_at DESC,c.customer_name
    LIMIT 12
  `,[like]);
  return {success:true,customers:list.map(customerViewV1),version:'A1_D1_READ_MODEL_V1'};
}
function supplierViewV1(r){
  const balance=num(r.current_balance);
  return {
    partyId:text(r.party_id),id:text(r.party_id),name:text(r.display_name),supplierName:text(r.display_name),
    phone:text(r.phone),address:text(r.address),active:Number(r.active||0)===1,
    currentBalance:balance,balance,debt:balance,notes:text(r.notes)
  };
}
async function getEasyStoreSuppliersV1(env,b){
  const limit=Math.max(1,Math.min(Math.trunc(num(b.limit,500)),1000));
  const list=await rows(env,`
    SELECT p.party_id,p.display_name,p.phone,p.address,p.notes,p.active,
      COALESCE(
        (SELECT pb.balance FROM employee_accounting_party_balances_v1 pb
         WHERE pb.party_type='supplier' AND pb.party_id=p.party_id LIMIT 1),0
      ) AS current_balance
    FROM employee_accounting_parties_v1 p
    WHERE p.party_type='supplier' AND p.active=1
    ORDER BY p.updated_at_ms DESC,p.display_name
    LIMIT ?
  `,[limit]);
  return {success:true,suppliers:list.map(supplierViewV1),version:'A1_D1_READ_MODEL_V1'};
}

async function getCustomerAccountV1915V1(env,auth,b){
  if(!['full','final'].includes(auth.mode))return {success:false,message:'حسابات العملاء عند ضياء / رحمه / ريفان فقط.'};
  const requested=text(b.customerId||b.customerName||b.partyName||b.name);
  if(!requested)return {success:false,message:'اختر العميل أولًا.'};
  let customer=await env.DB.prepare(`
    SELECT customer_id,customer_name,manager,phone,extra_phone,customer_type,active
    FROM t12_customers
    WHERE customer_id=? OR customer_name=?
    ORDER BY updated_at DESC LIMIT 1
  `).bind(requested,requested).first();
  if(!customer){
    customer=await env.DB.prepare(`
      SELECT customer_id,customer_name,manager,phone,extra_phone,customer_type,active
      FROM t12_customers
      WHERE lower(customer_name)=lower(?)
      ORDER BY updated_at DESC LIMIT 1
    `).bind(requested).first();
  }
  if(!customer)return {success:false,message:'العميل غير موجود في سجل العملاء. اختر الاسم من القائمة.'};
  const tx=await rows(env,`
    SELECT transaction_id AS id,created_at_ms AS createdAtMs,operation,operation_label AS operationLabel,
      amount,payment_method AS paymentMethod,ref_no AS refNo,balance_before AS balanceBefore,
      balance_after AS balanceAfter,created_by AS createdBy,notes,request_key AS requestId,source
    FROM employee_accounting_party_ledger_v1
    WHERE party_type='customer' AND party_id=?
    ORDER BY created_at_ms DESC
    LIMIT 200
  `,[customer.customer_id]);
  const balance=await partyBalanceV1(env,'customer',text(customer.customer_id));
  const view=customerViewV1({...customer,current_balance:balance});
  return {
    success:true,customer:view,partyName:view.name,balance,transactions:tx,
    permissions:{canCollect:true,canAdjust:auth.mode==='full'},
    version:'A1_D1_READ_MODEL_V1'
  };
}
async function easyStoreSystemHealthV1(env,auth){
  const c=await control(env);
  const prepared=await env.DB.prepare("SELECT COUNT(*) AS n FROM employee_accounting_request_ledger_v1 WHERE status='PREPARED'").first();
  const openLines=await rows(env,`
    SELECT accounting_line_id AS id,order_id AS orderId,department,
      CASE WHEN approval_status='معتمد من القسم' THEN 1 ELSE 0 END AS approved
    FROM employee_accounting_dept_lines_v1
    WHERE final_invoice_no=''
    ORDER BY updated_at DESC LIMIT 100
  `);
  const lowStock=await rows(env,`
    SELECT material_name AS material,department,stock_qty AS stock,min_stock AS minimum
    FROM employee_accounting_materials_v1
    WHERE active=1 AND min_stock>0 AND stock_qty<=min_stock
    ORDER BY material_name LIMIT 100
  `);
  const pendingCount=Number(prepared&&prepared.n||0);
  return {
    success:true,
    healthy:pendingCount===0,
    message:pendingCount===0?'D1 accounting read model is healthy.':'يوجد طلب حسابات غير مكتمل يحتاج مراجعة.',
    version:'A1_D1_READ_MODEL_V1',
    checks:{
      duplicateLedgerRequests:[],
      duplicateCashboxRequests:[],
      pendingRequestLedgerCount:pendingCount,
      automationPreview:{
        pendingPurchases:[],
        openDeptLines:openLines,
        openCustodies:[],
        unclassified:[],
        lowStock,
        partial:true,
        unavailableDomains:['daily-purchases','custody','day-close']
      }
    },
    control:{mode:text(c.mode),policyEpoch:Number(c.policyEpoch||0),authoritativeWrites:text(c.mode)==='GENERAL'},
    permissions:permissions(auth)
  };
}

async function calculateAccountingLaserQuoteV1913V1(env,auth,b){
  if(!['full','laser'].includes(auth.mode))return {success:false,message:'حاسبة الليزر متاحة لجابر وضياء فقط.'};
  const materialId=text(b.materialId),materialName=text(b.materialName||b.material);
  const pieceWidth=num(b.pieceWidth||b.width),pieceHeight=num(b.pieceHeight||b.height);
  const qty=Math.max(1,num(b.qty,1));
  const wastePercent=Math.max(0,num(b.wastePercent||b.waste));
  if((!materialId&&!materialName)||pieceWidth<=0||pieceHeight<=0)return {success:false,message:'الخامة وطول وعرض القطعة مطلوبة.'};

  let material;
  if(materialId){
    material=await env.DB.prepare(`
      SELECT material_id,department,material_name,raw_width,raw_height,unit_cost,computed_unit_cost,official_sale_price,active
      FROM employee_accounting_materials_v1
      WHERE material_id=? AND active=1
      LIMIT 1
    `).bind(materialId).first();
  }else{
    material=await env.DB.prepare(`
      SELECT material_id,department,material_name,raw_width,raw_height,unit_cost,computed_unit_cost,official_sale_price,active
      FROM employee_accounting_materials_v1
      WHERE material_name=? AND active=1
        AND (?='full' OR department IN ('ليزر','مشترك',''))
      ORDER BY CASE WHEN department='ليزر' THEN 0 WHEN department='مشترك' THEN 1 ELSE 2 END,updated_at DESC
      LIMIT 1
    `).bind(materialName,auth.mode).first();
  }
  if(!material)return {success:false,message:'الخامة غير مسجلة: '+(materialName||materialId)};

  const rawWidth=num(material.raw_width),rawHeight=num(material.raw_height);
  const sheetCost=num(material.computed_unit_cost)||num(material.unit_cost);
  const officialUnitSale=num(material.official_sale_price);
  if(rawWidth<=0||rawHeight<=0||sheetCost<0)return {success:false,message:'أبعاد وتكلفة الشيت غير مكتملة للخامة '+text(material.material_name)};

  const sheetArea=rawWidth*rawHeight;
  const pieceArea=pieceWidth*pieceHeight;
  const consumedAreaPerPiece=pieceArea*(1+wastePercent/100);
  if(consumedAreaPerPiece>sheetArea)return {success:false,message:'مقاس القطعة أكبر من مساحة الشيت بعد الهالك.'};

  const piecesByLayout=Math.max(
    Math.floor(rawWidth/pieceWidth)*Math.floor(rawHeight/pieceHeight),
    Math.floor(rawWidth/pieceHeight)*Math.floor(rawHeight/pieceWidth)
  );
  const materialCostPerPiece=sheetCost*consumedAreaPerPiece/sheetArea;
  const customerUnitSale=num(b.customerUnitSale||b.salePrice||b.unitSalePrice);
  const factor=Math.max(0,num(b.saleFactor||b.factor)||2.2);
  const suggestedUnitSale=customerUnitSale||officialUnitSale||(auth.mode==='full'?materialCostPerPiece*factor:0);

  const result={
    success:true,version:'A1_D1_READ_MODEL_V1',
    materialId:text(material.material_id),materialName:text(material.material_name),
    sheetWidth:rawWidth,sheetHeight:rawHeight,pieceWidth,pieceHeight,qty,wastePercent,
    consumedAreaPerPiece,consumedAreaTotal:consumedAreaPerPiece*qty,
    estimatedPiecesPerSheet:piecesByLayout,
    materialCostPerPiece,materialCostTotal:materialCostPerPiece*qty,
    officialUnitSale,customerUnitSale,suggestedUnitSale,suggestedTotalSale:suggestedUnitSale*qty
  };
  if(auth.mode!=='full'){
    delete result.materialCostPerPiece;
    delete result.materialCostTotal;
    delete result.officialUnitSale;
    delete result.customerUnitSale;
  }
  return result;
}


function workDateKeyV1(value){
  const raw=text(value);
  const m=raw.match(/\d{4}-\d{2}-\d{2}/);
  if(m)return m[0];
  try{
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const map=Object.fromEntries(parts.map(x=>[x.type,x.value]));
    return map.year+'-'+map.month+'-'+map.day;
  }catch{return new Date().toISOString().slice(0,10);}
}
function accountingDepartmentV1(value){
  const k=key(value);
  if(k.includes('ليزر')||k.includes('laser'))return 'ليزر';
  if(k.includes('طباع')||k.includes('print'))return 'طباعة';
  if(k.includes('كل')||k.includes('all')||k.includes('اجمالي')||k.includes('إجمالي'))return 'كل الأقسام';
  return '';
}
async function custodySummariesV1(env,workDate){
  const events=await rows(env,`
    SELECT employee_key AS employee,department,movement_type AS movementType,amount,ref_no AS refNo
    FROM employee_accounting_custody_events_v1
    WHERE work_date=?
    ORDER BY created_at_ms
  `,[workDate]);
  const closes=await rows(env,`
    SELECT custody_close_id AS closeId,employee_key AS employee,department
    FROM employee_accounting_custody_closes_v1
    WHERE work_date=?
  `,[workDate]);
  const closeMap=new Map(closes.map(x=>[key(x.employee)+'|'+text(x.department),text(x.closeId)]));
  const groups=new Map();
  for(const e of events){
    const k=key(e.employee)+'|'+text(e.department);
    if(!groups.has(k))groups.set(k,{employee:text(e.employee),department:text(e.department),workDate,handed:0,approvedPurchases:0,returned:0,reimbursed:0,reversedPurchases:0,balance:0});
    const g=groups.get(k),a=num(e.amount),t=text(e.movementType);
    if(t==='HANDOFF'){g.handed+=a;g.balance+=a;}
    else if(t==='PURCHASE_SETTLEMENT'){g.approvedPurchases+=a;g.balance-=a;}
    else if(t==='PURCHASE_REVERSAL'){g.reversedPurchases+=a;g.balance+=a;}
    else if(t==='RETURN'){g.returned+=a;g.balance-=a;}
    else if(t==='EXTRA_PAYMENT'){g.reimbursed+=a;g.balance+=a;}
  }
  const out=[];
  for(const [k,g] of groups){
    g.employeeReturns=Math.max(0,g.balance);
    g.companyOwes=Math.max(0,-g.balance);
    g.closeId=closeMap.get(k)||'';
    g.closed=!!g.closeId;
    for(const n of ['handed','approvedPurchases','returned','reimbursed','reversedPurchases','balance','employeeReturns','companyOwes'])g[n]=Number(num(g[n]).toFixed(2));
    out.push(g);
  }
  return out;
}
async function automationPreviewV1(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'مركز متابعة اليوم والتقفيل التلقائي عند ضياء فقط.'};
  const workDate=workDateKeyV1(b.workDate||b.date);
  const pendingPurchases=await rows(env,`
    SELECT daily_purchase_id AS id,request_key AS requestId,work_date AS workDate,employee_key AS employee,
      department,supplier_party_id AS supplierPartyId,supplier_name AS supplier,material_id AS materialId,
      material_name AS material,qty,unit_cost AS unit,total,payment_method AS paymentType,paid,remaining AS remain,
      status,stock_status AS stockStatus
    FROM employee_accounting_daily_purchases_v1
    WHERE work_date=? AND status='PENDING'
    ORDER BY created_at_ms
  `,[workDate]);
  const openDeptLines=await rows(env,`
    SELECT accounting_line_id AS id,order_id AS orderId,line_id AS lineId,department,
      CASE WHEN approval_status='معتمد من القسم' THEN 1 ELSE 0 END AS approved
    FROM employee_accounting_dept_lines_v1
    WHERE work_date=? AND final_invoice_no=''
    ORDER BY created_at
  `,[workDate]);
  const openCustodies=(await custodySummariesV1(env,workDate)).filter(x=>!x.closed);
  const custodySettlementRequired=openCustodies.filter(x=>Math.abs(num(x.balance))>0.001);
  const unclassifiedPurchases=await rows(env,`
    SELECT purchase_id AS id,'purchase' AS entity,supplier_name AS party,total AS amount
    FROM employee_accounting_purchase_invoices_v1
    WHERE work_date=? AND status='POSTED' AND trim(department)=''
  `,[workDate]);
  const unclassifiedInvoices=await rows(env,`
    SELECT invoice_no AS id,'finalInvoice' AS entity,customer_name AS party,final_total AS amount
    FROM employee_accounting_final_invoices_v1
    WHERE work_date=? AND trim(finance_department)='' AND accounting_line_ids_json IN ('','[]')
  `,[workDate]);
  const unclassified=[...unclassifiedPurchases,...unclassifiedInvoices].map(x=>({...x,date:workDate}));
  const closes=await rows(env,`
    SELECT day_close_id AS id,department,work_date AS workDate,integrity_status AS integrityStatus,created_at_ms AS createdAtMs
    FROM employee_accounting_day_closes_v1
    WHERE work_date=?
    ORDER BY created_at_ms DESC
  `,[workDate]);
  const closedDepartments=closes.map(x=>text(x.department)).filter(Boolean);
  const lowStock=await rows(env,`
    SELECT material_id AS materialId,material_name AS material,department,stock_qty AS stock,min_stock AS minimum
    FROM employee_accounting_materials_v1
    WHERE active=1 AND min_stock>0 AND stock_qty<=min_stock
    ORDER BY department,material_name
  `);
  const blockers=[];
  if(pendingPurchases.length)blockers.push('يوجد '+pendingPurchases.length+' بند مشتريات ينتظر الاعتماد');
  if(openDeptLines.length)blockers.push('يوجد '+openDeptLines.length+' بند قسم لم يُقفل في فاتورة نهائية');
  if(unclassified.length)blockers.push('يوجد '+unclassified.length+' سجل مالي لليوم غير مصنف');
  if(custodySettlementRequired.length)blockers.push('يوجد '+custodySettlementRequired.length+' عهدة بها مبلغ يجب تسويته قبل التقفيل');
  return {success:true,preview:{workDate,pendingPurchases,openDeptLines,openCustodies,custodySettlementRequired,unclassified,closedDepartments,lowStock,blockers,ready:blockers.length===0,version:'A1_D1_READ_MODEL_V1'}};
}
async function dailyDepartmentReportV1(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'تقارير الأرباح والتقفيل عند ضياء فقط.'};
  const workDate=workDateKeyV1(b.workDate||b.date),requested=accountingDepartmentV1(b.department||'كل الأقسام');
  if(!requested)return {success:false,message:'اختر الليزر أو الطباعة أو كل الأقسام.'};
  const all=requested==='كل الأقسام';
  const invoices=await rows(env,`
    SELECT invoice_no AS invoiceNo,accounting_line_ids_json AS lineIds,finance_department AS financeDepartment,
      final_total AS finalTotal,paid,remaining,payment_method AS paymentMethod,manual_cost AS manualCost
    FROM employee_accounting_final_invoices_v1
    WHERE work_date=?
  `,[workDate]);
  const deptLines=await rows(env,`
    SELECT accounting_line_id AS id,final_invoice_no AS invoiceNo,department,sale_price AS sale,total_cost AS cost
    FROM employee_accounting_dept_lines_v1
    WHERE work_date=? AND final_invoice_no<>''
  `,[workDate]);
  const report={workDate,department:requested,sales:0,actualJobCost:0,purchases:0,waste:0,wasteRecovered:0,netWaste:0,profit:0,receipts:0,payments:0,cash:0,instapay:0,credit:0,custodyHanded:0,custodyPurchases:0,custodySettlement:0,custodyBalance:0,unclassifiedSales:0,unclassifiedPurchases:0,lineCount:0};
  const byInvoice=new Map();
  for(const l of deptLines){
    if(!byInvoice.has(l.invoiceNo))byInvoice.set(l.invoiceNo,[]);
    byInvoice.get(l.invoiceNo).push(l);
  }
  for(const inv of invoices){
    const ls=byInvoice.get(inv.invoiceNo)||[];
    if(ls.length){
      const totalSale=ls.reduce((a,x)=>a+num(x.sale),0);
      for(const l of ls){
        if(!all&&text(l.department)!==requested)continue;
        const ratio=totalSale>0?num(l.sale)/totalSale:0;
        report.sales+=num(inv.finalTotal)>0?num(inv.finalTotal)*ratio:num(l.sale);
        report.actualJobCost+=num(l.cost);
        report.credit+=num(inv.remaining)*ratio;
        const paid=num(inv.paid)*ratio,m=key(inv.paymentMethod);
        if(m.includes('انستا')||m.includes('insta'))report.instapay+=paid;else report.cash+=paid;
        report.lineCount++;
      }
    }else{
      const d=accountingDepartmentV1(inv.financeDepartment);
      if(!d){if(all)report.unclassifiedSales+=num(inv.finalTotal);continue;}
      if(!all&&d!==requested)continue;
      report.sales+=num(inv.finalTotal);report.actualJobCost+=num(inv.manualCost);report.credit+=num(inv.remaining);
      const m=key(inv.paymentMethod);if(m.includes('انستا')||m.includes('insta'))report.instapay+=num(inv.paid);else report.cash+=num(inv.paid);
    }
  }
  const purchases=await rows(env,`
    SELECT department,total FROM employee_accounting_purchase_invoices_v1
    WHERE work_date=? AND status='POSTED'
  `,[workDate]);
  for(const p of purchases){
    const d=accountingDepartmentV1(p.department);
    if(!d){if(all)report.unclassifiedPurchases+=num(p.total);continue;}
    if(all||d===requested)report.purchases+=num(p.total);
  }
  const wastes=await rows(env,`
    SELECT department,amount,recovered_amount AS recovered FROM employee_accounting_waste_v1
    WHERE work_date=?
  `,[workDate]);
  for(const w of wastes){const d=accountingDepartmentV1(w.department);if(d&&(all||d===requested)){report.waste+=num(w.amount);report.wasteRecovered+=num(w.recovered);}}
  const cashRows=await rows(env,`
    SELECT department,movement_type AS movementType,amount,payment_method AS paymentMethod
    FROM employee_accounting_cashbox_v1 WHERE work_date=?
  `,[workDate]);
  for(const c of cashRows){
    const d=accountingDepartmentV1(c.department);if(!all&&d!==requested)continue;
    const t=key(c.movementType);
    if(t.includes('receipt')||t.includes('قبض')||t.includes('تحصيل')||t.includes('return'))report.receipts+=num(c.amount);else report.payments+=num(c.amount);
  }
  const custody=await custodySummariesV1(env,workDate);
  for(const c of custody){if(!all&&c.department!==requested)continue;report.custodyHanded+=num(c.handed);report.custodyPurchases+=num(c.approvedPurchases);report.custodySettlement+=num(c.returned)+num(c.reimbursed);report.custodyBalance+=num(c.balance);}
  report.netWaste=Math.max(0,report.waste-report.wasteRecovered);
  report.profit=report.sales-report.actualJobCost-report.netWaste;
  for(const k of ['sales','actualJobCost','purchases','waste','wasteRecovered','netWaste','profit','receipts','payments','cash','instapay','credit','custodyHanded','custodyPurchases','custodySettlement','custodyBalance','unclassifiedSales','unclassifiedPurchases'])report[k]=Number(num(report[k]).toFixed(2));
  const closes=await rows(env,`
    SELECT day_close_id AS id,work_date AS workDate,department,report_json AS reportJson,integrity_status AS integrityStatus,
      notes,actor,created_at_ms AS createdAtMs
    FROM employee_accounting_day_closes_v1
    ORDER BY created_at_ms DESC LIMIT 30
  `);
  return {success:true,report,closes,version:'A1_D1_READ_MODEL_V1'};
}



function componentRowsV1(value){
  const rows=parseJson(value,[]);
  if(!Array.isArray(rows))return [];
  return rows.map(x=>({
    materialId:text(x&&x.materialId),
    materialName:text(x&&x.materialName||x&&x.material||x&&x.name),
    qty:num(x&&x.qty||x&&x.quantity||x&&x.consumption||x&&x.unitConsumption),
    extraCost:num(x&&x.extraCost||x&&x.extra)
  })).filter(x=>x.materialId||x.materialName);
}
function materialIsCompositeV1(row){
  const k=key(row&&row.material_kind);
  return k==='composite'||k.includes('مكونات')||componentRowsV1(row&&row.components_json).length>0;
}
async function accountingCostGraphV1(env){
  const materials=await rows(env,"SELECT material_id,department,material_name,material_kind,unit_cost,computed_unit_cost,components_json,active,version FROM employee_accounting_materials_v1 ORDER BY material_id");
  const byId=new Map(materials.map(x=>[text(x.material_id),x]));
  const byName=new Map();
  for(const m of materials){
    const k=key(m.material_name);
    if(!byName.has(k))byName.set(k,[]);
    byName.get(k).push(m);
  }
  function resolveComponent(parent,c){
    if(c.materialId&&byId.has(c.materialId))return byId.get(c.materialId);
    const list=byName.get(key(c.materialName))||[];
    return list.find(x=>text(x.department)===text(parent.department))
      ||list.find(x=>text(x.department)==='مشترك')
      ||list.find(x=>text(x.department)==='')
      ||list[0]
      ||null;
  }
  const cache=new Map(),visiting=new Set();
  function costOf(row,path=[]){
    const id=text(row.material_id);
    if(cache.has(id))return cache.get(id);
    if(visiting.has(id))throw commandErrorV1('accounting-material-cost-cycle','توجد دائرة مغلقة في مكونات الخامات: '+[...path,text(row.material_name)].join(' > '));
    visiting.add(id);
    const comps=componentRowsV1(row.components_json);
    let total=num(row.unit_cost);
    if(comps.length){
      total=0;
      for(const c of comps){
        if(!(c.qty>0))throw commandErrorV1('accounting-material-component-invalid','كمية مكون الخامة يجب أن تكون أكبر من صفر: '+text(row.material_name));
        const child=resolveComponent(row,c);
        if(!child)throw commandErrorV1('accounting-material-component-missing','المكون غير مسجل ضمن الخامات: '+(c.materialName||c.materialId));
        total+=c.qty*costOf(child,[...path,text(row.material_name)])+c.extraCost;
      }
    }
    visiting.delete(id);
    const rounded=Number(total.toFixed(6));
    cache.set(id,rounded);
    return rounded;
  }
  for(const m of materials)if(Number(m.active||0)===1)costOf(m,[]);
  return {materials,byId,byName,costs:cache,resolveComponent};
}
async function recalcAccountingMaterialsCascadeV1(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'تحديث تكاليف الخامات والأصناف عند ضياء فقط.'};
  const ctx=await beginCommandV1(env,auth,'material-cost-cascade',b||{});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  const graph=await accountingCostGraphV1(env),statements=[],now=Date.now();
  let materialCount=0,templateCount=0,changedMaterials=0,changedTemplates=0;
  for(const m of graph.materials){
    if(Number(m.active||0)!==1)continue;
    const computed=graph.costs.get(text(m.material_id));
    if(computed===undefined)continue;
    materialCount++;
    if(Math.abs(num(m.computed_unit_cost)-computed)>0.0000005)changedMaterials++;
    if(materialIsCompositeV1(m)){
      statements.push(env.DB.prepare("UPDATE employee_accounting_materials_v1 SET computed_unit_cost=?,unit_cost=?,version=version+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE material_id=? AND version=?").bind(computed,computed,auth.user.username,m.material_id,Math.max(1,Math.trunc(num(m.version,1)))));
    }else{
      statements.push(env.DB.prepare("UPDATE employee_accounting_materials_v1 SET computed_unit_cost=?,version=version+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE material_id=? AND version=?").bind(computed,auth.user.username,m.material_id,Math.max(1,Math.trunc(num(m.version,1)))));
    }
  }
  const templates=await rows(env,"SELECT template_id,department,item_name,fixed_cost,computed_cost,components_json,active,version FROM employee_accounting_templates_v1 ORDER BY template_id");
  for(const t of templates){
    if(Number(t.active||0)!==1)continue;
    const comps=componentRowsV1(t.components_json);
    let computed=num(t.fixed_cost);
    if(comps.length){
      computed=0;
      for(const c of comps){
        if(!(c.qty>0))throw commandErrorV1('accounting-template-component-invalid','كمية مكون الصنف يجب أن تكون أكبر من صفر: '+text(t.item_name));
        const parent={department:t.department},child=graph.resolveComponent(parent,c);
        if(!child)throw commandErrorV1('accounting-template-component-missing','المكون غير مسجل ضمن الخامات: '+(c.materialName||c.materialId));
        const childCost=graph.costs.get(text(child.material_id));
        computed+=c.qty*num(childCost)+c.extraCost;
      }
    }
    computed=Number(computed.toFixed(6));templateCount++;
    if(Math.abs(num(t.computed_cost)-computed)>0.0000005)changedTemplates++;
    statements.push(env.DB.prepare("UPDATE employee_accounting_templates_v1 SET computed_cost=?,fixed_cost=?,version=version+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE template_id=? AND version=?").bind(computed,computed,auth.user.username,t.template_id,Math.max(1,Math.trunc(num(t.version,1)))));
  }
  if(statements.length)await env.DB.batch(statements);
  const response={success:true,materialCount,templateCount,changedMaterials,changedTemplates,calculatedAtMs:now,version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'material-cost-cascade','all','recalculate',auth.user.username,response);
  return response;
}

async function saveMaterial(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'إضافة وتعديل الخامات عند ضياء فقط.'};
  const name=text(b.materialName||b.name);if(!name)return {success:false,message:'اسم الخامة مطلوب.'};
  const department=text(b.department)||'طباعة',components=componentRowsV1(b.componentsJson||b.components);
  if((b.componentsJson||b.components)&&!Array.isArray(parseJson(b.componentsJson||b.components,null)))return {success:false,message:'صيغة مكونات الخامة غير صحيحة.'};
  for(const c of components)if(!(c.qty>0))return {success:false,message:'كل مكون خامة يجب أن تكون كميته أكبر من صفر.'};
  const existing=await env.DB.prepare("SELECT material_id,version FROM employee_accounting_materials_v1 WHERE department=? AND material_name=?").bind(department,name).first();
  const id=existing?text(existing.material_id):text(b.materialId||b.id)||uid('MAT');
  const ctx=await beginCommandV1(env,auth,'material-upsert',{...b,materialId:id,materialName:name,department});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  const version=existing?Math.max(1,Math.trunc(num(existing.version,1)))+1:1;
  const unitCost=num(b.unitCost||b.cost),computed=num(b.computedUnitCost||b.calculatedUnitCost||b.calculatedCost,unitCost);
  const active=['0','false','لا','موقوف','inactive'].includes(key(b.active))?0:1;
  const rawWidth=num(b.rawWidth||b.width),rawHeight=num(b.rawHeight||b.height);
  if(existing){
    const r=await env.DB.prepare("UPDATE employee_accounting_materials_v1 SET material_kind=?,material_class=?,unit=?,stock_qty=?,min_stock=?,unit_cost=?,computed_unit_cost=?,official_sale_price=?,components_json=?,formula=?,notes=?,active=?,raw_json=?,updated_by=?,raw_width=?,raw_height=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE material_id=? AND version=? RETURNING version").bind(text(b.materialKind),text(b.materialClass),text(b.unit),num(b.stockQty||b.stock),num(b.minStock),unitCost,computed,num(b.salePrice||b.officialSalePrice),JSON.stringify(components),text(b.formula),text(b.notes),active,JSON.stringify(b),auth.user.username,rawWidth,rawHeight,id,Math.max(1,Math.trunc(num(existing.version,1)))).first();
    if(!r)throw commandErrorV1('accounting-material-version-conflict','تم تعديل الخامة بالتزامن. حدّث البيانات ثم أعد المحاولة بمعرف طلب جديد.');
  }else{
    await env.DB.prepare("INSERT INTO employee_accounting_materials_v1(material_id,department,material_name,material_kind,material_class,unit,stock_qty,min_stock,unit_cost,computed_unit_cost,official_sale_price,components_json,formula,notes,active,raw_json,updated_by,version,raw_width,raw_height) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,department,name,text(b.materialKind),text(b.materialClass),text(b.unit),num(b.stockQty||b.stock),num(b.minStock),unitCost,computed,num(b.salePrice||b.officialSalePrice),JSON.stringify(components),text(b.formula),text(b.notes),active,JSON.stringify(b),auth.user.username,version,rawWidth,rawHeight).run();
  }
  const response={success:true,message:existing?'الخامة موجودة وتم تحديثها.':'تم حفظ الخامة.',updated:!!existing,id,materialId:id,version};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'material',id,existing?'update':'create',auth.user.username,{department,name,version,rawWidth,rawHeight,componentCount:components.length});
  return response;
}
async function materialCost(env,name){
  if(!text(name))return 0;
  const r=await env.DB.prepare("SELECT computed_unit_cost,unit_cost FROM employee_accounting_materials_v1 WHERE material_name=? AND active=1 ORDER BY updated_at DESC LIMIT 1").bind(text(name)).first();
  return r?num(r.computed_unit_cost||r.unit_cost):0;
}
async function saveTemplate(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'إضافة البنود الثابتة عند ضياء فقط.'};
  const name=text(b.itemName||b.templateName||b.productName||b.name);if(!name)return {success:false,message:'اسم البند الثابت مطلوب.'};
  const department=text(b.department)||'طباعة',components=componentRowsV1(b.componentsJson||b.components);
  if((b.componentsJson||b.components)&&!Array.isArray(parseJson(b.componentsJson||b.components,null)))return {success:false,message:'صيغة مكونات الصنف غير صحيحة.'};
  let calculated=0;
  if(components.length){
    const graph=await accountingCostGraphV1(env);
    for(const c of components){
      if(!(c.qty>0))return {success:false,message:'كل مكون يجب أن يحتوي على اسم خامة وكمية أكبر من صفر.'};
      const child=graph.resolveComponent({department},c);
      if(!child)return {success:false,message:'المكون غير مسجل ضمن الخامات الأساسية: '+(c.materialName||c.materialId)};
      calculated+=c.qty*num(graph.costs.get(text(child.material_id)))+c.extraCost;
    }
  }else calculated=num(b.calculatedUnitCost||b.computedUnitCost||b.fixedCost||b.cost||b.unitCost);
  calculated=Number(calculated.toFixed(6));
  const existing=await env.DB.prepare("SELECT template_id,version FROM employee_accounting_templates_v1 WHERE department=? AND item_name=?").bind(department,name).first();
  const id=existing?text(existing.template_id):text(b.templateId||b.id)||uid('TPL');
  const ctx=await beginCommandV1(env,auth,'template-upsert',{...b,templateId:id,itemName:name,department,components});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  const active=['0','false','لا','موقوف','inactive'].includes(key(b.active))?0:1,version=existing?Math.max(1,Math.trunc(num(existing.version,1)))+1:1;
  if(existing){
    const r=await env.DB.prepare("UPDATE employee_accounting_templates_v1 SET category=?,size=?,material_name=?,output_count=?,ink_cost=?,fixed_cost=?,computed_cost=?,suggested_sale_price=?,components_json=?,notes=?,active=?,raw_json=?,updated_by=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE template_id=? AND version=? RETURNING version").bind(text(b.category||b.itemType||'صنف بيع'),text(b.size),text(b.materialName),num(b.outputCount),num(b.inkCost),calculated,calculated,num(b.salePrice||b.price||b.systemSale),JSON.stringify(components),text(b.notes),active,JSON.stringify(b),auth.user.username,id,Math.max(1,Math.trunc(num(existing.version,1)))).first();
    if(!r)throw commandErrorV1('accounting-template-version-conflict','تم تعديل الصنف بالتزامن. حدّث البيانات ثم أعد المحاولة بمعرف طلب جديد.');
  }else{
    await env.DB.prepare("INSERT INTO employee_accounting_templates_v1(template_id,department,category,item_name,size,material_name,output_count,ink_cost,fixed_cost,computed_cost,suggested_sale_price,components_json,notes,active,raw_json,updated_by,version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,department,text(b.category||b.itemType||'صنف بيع'),name,text(b.size),text(b.materialName),num(b.outputCount),num(b.inkCost),calculated,calculated,num(b.salePrice||b.price||b.systemSale),JSON.stringify(components),text(b.notes),active,JSON.stringify(b),auth.user.username,version).run();
  }
  const response={success:true,message:existing?'الصنف موجود وتم تحديثه بدل إضافته مرة أخرى.':'تم حفظ الصنف.',updated:!!existing,id,templateId:id,calculatedCost:calculated,componentsJson:JSON.stringify(components),version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'template',id,existing?'update':'create',auth.user.username,{department,name,calculated,componentCount:components.length});
  return response;
}

async function archiveAccountingTemplateV1(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'إيقاف الأصناف عند ضياء فقط.'};
  const templateId=text(b.templateId||b.id),name=text(b.itemName||b.templateName||b.name),department=text(b.department);
  let row;
  if(templateId)row=await env.DB.prepare("SELECT template_id,item_name,department,version,active FROM employee_accounting_templates_v1 WHERE template_id=? LIMIT 1").bind(templateId).first();
  else if(name&&department)row=await env.DB.prepare("SELECT template_id,item_name,department,version,active FROM employee_accounting_templates_v1 WHERE item_name=? AND department=? LIMIT 1").bind(name,department).first();
  else if(name)row=await env.DB.prepare("SELECT template_id,item_name,department,version,active FROM employee_accounting_templates_v1 WHERE item_name=? ORDER BY updated_at DESC LIMIT 1").bind(name).first();
  if(!row)return {success:false,message:'الصنف غير موجود.'};
  if(Number(row.active||0)===0)return {success:true,duplicatePrevented:true,templateId:text(row.template_id),message:'الصنف موقوف بالفعل.',version:'A2_D1_ACCOUNTING_V1'};
  const ctx=await beginCommandV1(env,auth,'template-archive',{...b,templateId:text(row.template_id),itemName:text(row.item_name),department:text(row.department)});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  const r=await env.DB.prepare("UPDATE employee_accounting_templates_v1 SET active=0,version=version+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE template_id=? AND version=? AND active=1 RETURNING version").bind(auth.user.username,row.template_id,Math.max(1,Math.trunc(num(row.version,1)))).first();
  if(!r)throw commandErrorV1('accounting-template-version-conflict','تعذر إيقاف الصنف بسبب تعديل متزامن. حدّث البيانات وأعد المحاولة.');
  const response={success:true,templateId:text(row.template_id),message:'تم إيقاف الصنف.',version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'template',text(row.template_id),'archive',auth.user.username,{itemName:text(row.item_name),department:text(row.department)});
  return response;
}

async function saveAccountingWasteV1(env,auth,b){
  if(!['full','print','laser'].includes(auth.mode))return {success:false,message:'تسجيل هوالك الأقسام متاح لضياء ومسؤول القسم فقط.'};
  const orderId=text(b.orderId),reason=text(b.reason||b.wasteType),amount=num(b.amount||b.damageCost),recovered=num(b.paid||b.damageCovered);
  if(!orderId||!reason)return {success:false,message:'رقم الأوردر وسبب الهالك مطلوبان.'};
  if(!(amount>0)||recovered<0||recovered>amount)return {success:false,message:'قيمة التالف يجب أن تكون أكبر من صفر والتعويض بين صفر وقيمة التالف.'};
  let department=accountingDepartmentV1(b.department)||text(b.department)||auth.department||'عام';
  if(auth.mode==='print')department='طباعة';if(auth.mode==='laser')department='ليزر';
  const materialQty=num(b.materialQty||b.qtyWaste||b.wasteQty),hasMaterial=!!text(b.materialId||b.materialName||b.material);
  let material=null;
  if(materialQty>0||hasMaterial){
    material=await resolveMaterialV1(env,b,department==='كل الأقسام'?'':department);
    if(materialQty>0&&material.stock+0.000001<materialQty)return {success:false,message:'رصيد المخزون لا يكفي لتسجيل كمية الهالك المطلوبة.'};
  }
  const id=text(b.wasteId||b.id)||uid('WASTE'),workDate=workDateKeyV1(b.workDate||b.date),ctx=await beginCommandV1(env,auth,'waste-create',{...b,wasteId:id,department,workDate,materialId:material&&material.materialId||''});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  const now=Date.now(),statements=[],moveId=uid('STK');
  if(material&&materialQty>0){
    statements.push(env.DB.prepare("UPDATE employee_accounting_materials_v1 SET stock_qty=stock_qty-?,version=version+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE material_id=? AND version=? AND stock_qty>=?").bind(materialQty,auth.user.username,material.materialId,material.version,materialQty));
  }
  let wasteSql="INSERT INTO employee_accounting_waste_v1(waste_id,request_key,work_date,department,order_id,line_id,material_id,material_name,reason_code,amount,recovered_amount,evidence_ref,notes,actor,created_at_ms) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?";
  const wasteBind=[id,ctx.requestKey,workDate,department,orderId,text(b.lineId),material&&material.materialId||'',material&&material.materialName||text(b.materialName||b.material),reason,amount,recovered,text(b.evidenceRef||b.evidence),text(b.notes),auth.user.username,now];
  if(material&&materialQty>0){wasteSql+=" WHERE EXISTS(SELECT 1 FROM employee_accounting_materials_v1 WHERE material_id=? AND version=?)";wasteBind.push(material.materialId,material.version+1);}
  statements.push(env.DB.prepare(wasteSql).bind(...wasteBind));
  if(material&&materialQty>0){
    statements.push(env.DB.prepare("INSERT INTO employee_accounting_stock_moves_v1(stock_move_id,material_id,move_type,order_id,line_id,department,item_name,qty_in,qty_out,balance_before,balance_after,actor,notes,request_key,created_at_ms) SELECT ?,?,'هالك',?,?,?,?,0,?,?,?,?,?,?,? FROM employee_accounting_waste_v1 WHERE request_key=?").bind(moveId,material.materialId,orderId,text(b.lineId),department,text(b.itemName),materialQty,material.stock,material.stock-materialQty,auth.user.username,reason+' | '+text(b.notes),ctx.requestKey,now,ctx.requestKey));
  }
  await env.DB.batch(statements);
  const written=await env.DB.prepare("SELECT waste_id AS id,amount,recovered_amount AS recovered FROM employee_accounting_waste_v1 WHERE request_key=?").bind(ctx.requestKey).first();
  if(!written)throw commandErrorV1('accounting-waste-stock-guard','تعذر تثبيت الهالك والمخزون بشكل ذري. الطلب محفوظ PREPARED للمراجعة.');
  const response={success:true,id:text(written.id),department,amount:num(written.amount),paid:num(written.recovered),remaining:Math.max(0,num(written.amount)-num(written.recovered)),materialId:material&&material.materialId||'',stockBefore:material&&materialQty>0?material.stock:null,stockAfter:material&&materialQty>0?material.stock-materialQty:null,version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'waste',id,'create',auth.user.username,{orderId,department,reason,amount,recovered,materialId:response.materialId,materialQty});
  return response;
}

async function saveDeptLine(env,auth,b){
  if(!['full','print','laser'].includes(auth.mode))return {success:false,message:'إضافة بنود حسابات القسم غير مسموحة.'};
  const orderId=text(b.orderId),itemName=text(b.itemName||b.name),qty=Math.max(num(b.qty||b.quantity,1),0.000001);
  let department=text(b.department)||auth.department;if(auth.mode==='print')department='طباعة';if(auth.mode==='laser')department='ليزر';
  if(!orderId||!department)return {success:false,message:'رقم الأوردر والقسم مطلوبان.'};
  const id=text(b.id||b.accountingLineId)||uid('ACC'),materialName=text(b.materialName);
  const materialConsumption=num(b.materialConsumption||b.consumption),materialCost=num(b.materialCost)||materialConsumption*await materialCost(env,materialName);
  const operating=num(b.operatingCost),other=num(b.otherCost),total=num(b.totalCost,materialCost+operating+other),sale=num(b.salePrice||b.lineTotal||b.systemSalePrice),profit=sale-total;
  const existing=await env.DB.prepare("SELECT version FROM employee_accounting_dept_lines_v1 WHERE accounting_line_id=?").bind(id).first(),version=existing?Number(existing.version||1)+1:1;
  await env.DB.prepare(`
    INSERT INTO employee_accounting_dept_lines_v1(accounting_line_id,order_id,line_id,customer_name,department,item_type,item_name,qty,material_name,material_consumption,material_cost,operating_cost,other_cost,total_cost,system_cost,system_sale_price,sale_price,profit,billing_status,notes,raw_json,updated_by,version)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(accounting_line_id) DO UPDATE SET order_id=excluded.order_id,line_id=excluded.line_id,customer_name=excluded.customer_name,department=excluded.department,item_type=excluded.item_type,item_name=excluded.item_name,qty=excluded.qty,material_name=excluded.material_name,material_consumption=excluded.material_consumption,material_cost=excluded.material_cost,operating_cost=excluded.operating_cost,other_cost=excluded.other_cost,total_cost=excluded.total_cost,system_cost=excluded.system_cost,system_sale_price=excluded.system_sale_price,sale_price=excluded.sale_price,profit=excluded.profit,billing_status=excluded.billing_status,notes=excluded.notes,raw_json=excluded.raw_json,updated_by=excluded.updated_by,version=excluded.version,updated_at=CURRENT_TIMESTAMP
  `).bind(id,orderId,text(b.lineId),text(b.customerName),department,text(b.itemType),itemName,qty,materialName,materialConsumption,materialCost,operating,other,total,num(b.systemCost,total),num(b.systemSalePrice,sale),sale,profit,text(b.billingStatus),text(b.notes),JSON.stringify(b),auth.user.username,version).run();
  await event(env,'dept-line',id,existing?'update':'create',auth.user.username,{orderId,department,version});
  return {success:true,id,updated:!!existing,totalCost:total,salePrice:sale,profit,version:'ENTRY614_D1_ACCOUNTING_V1'};
}
async function draft(env,auth,b){
  const orderId=text(b.orderId);let department=text(b.department)||auth.department;if(auth.mode==='print')department='طباعة';if(auth.mode==='laser')department='ليزر';
  if(!orderId)return {success:false,message:'رقم الأوردر مطلوب.'};
  const bind=[orderId],where=["order_id=?","final_invoice_no=''"];if(department){where.push('department=?');bind.push(department);}
  const list=(await rows(env,'SELECT * FROM employee_accounting_dept_lines_v1 WHERE '+where.join(' AND ')+' ORDER BY updated_at',bind)).map(deptLineView);
  return {success:true,lines:list,total:list.reduce((a,x)=>a+num(x.salePrice),0),orderId,department,version:'ENTRY614_D1_ACCOUNTING_V1'};
}
async function stockRequirements(env,lineRows){
  const req=new Map();
  async function collect(name,qty,path=[]){
    name=text(name);qty=num(qty);if(!name||!(qty>0))return;
    if(path.length>12)throw new Error('توجد دائرة مغلقة في مكونات الخامات: '+path.join(' > '));
    const m=await env.DB.prepare("SELECT * FROM employee_accounting_materials_v1 WHERE material_name=? AND active=1 ORDER BY updated_at DESC LIMIT 1").bind(name).first();
    if(!m)throw new Error('الخامة غير مسجلة في المخزن: '+name);
    const comps=parseJson(m.components_json,[]);
    if(Array.isArray(comps)&&comps.length){
      for(const c of comps){const cn=text(c.materialName||c.name||c.material),cq=num(c.qty||c.quantity||c.consumption||c.unitConsumption,1);await collect(cn,qty*cq,[...path,name]);}
      return;
    }
    const old=req.get(m.material_id)||{material:m,qty:0};old.qty+=qty;req.set(m.material_id,old);
  }
  for(const l of lineRows){if(text(l.material_name)&&num(l.material_consumption)>0)await collect(l.material_name,num(l.material_consumption));}
  return req;
}
async function approveDept(env,auth,b){
  if(!['full','print','laser'].includes(auth.mode))return {success:false,message:'اعتماد فاتورة القسم متاح للقسم نفسه أو لضياء فقط.'};
  const orderId=text(b.orderId);let department=text(b.department)||auth.department;if(auth.mode==='print')department='طباعة';if(auth.mode==='laser')department='ليزر';
  if(!orderId||!department)return {success:false,message:'رقم الأوردر والقسم مطلوبين للاعتماد.'};
  if(auth.mode==='print'&&department!=='طباعة')return {success:false,message:'وائل يعتمد قسم الطباعة فقط.'};
  if(auth.mode==='laser'&&department!=='ليزر')return {success:false,message:'جابر يعتمد قسم الليزر فقط.'};
  const candidates=await rows(env,"SELECT * FROM employee_accounting_dept_lines_v1 WHERE order_id=? AND department=? AND final_invoice_no='' AND approval_status<> 'معتمد من القسم'",[orderId,department]);
  if(!candidates.length)return {success:false,message:'لا توجد بنود جديدة غير معتمدة لهذا الأوردر في هذا القسم.'};
  const req=await stockRequirements(env,candidates);
  for(const {material,qty} of req.values())if(num(material.stock_qty)+1e-6<qty)return {success:false,message:`لا يمكن الاعتماد؛ ناقص ${material.material_name}: مطلوب ${qty.toFixed(4)} والمتاح ${num(material.stock_qty).toFixed(4)}`};
  const batchId=uid('DAPP'),now=Date.now(),statements=[];
  for(const {material,qty} of req.values()){
    const before=num(material.stock_qty),after=before-qty,move=uid('STK');
    statements.push(env.DB.prepare("UPDATE employee_accounting_materials_v1 SET stock_qty=?,version=version+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE material_id=? AND stock_qty>=?").bind(after,auth.user.username,material.material_id,qty));
    statements.push(env.DB.prepare("INSERT INTO employee_accounting_stock_moves_v1(stock_move_id,material_id,move_type,order_id,department,qty_out,balance_before,balance_after,actor,notes,request_key,created_at_ms) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").bind(move,material.material_id,'صرف تلقائي من فاتورة قسم',orderId,department,qty,before,after,auth.user.username,text(b.notes),batchId,now));
  }
  statements.push(env.DB.prepare("UPDATE employee_accounting_dept_lines_v1 SET billing_status='معتمد من القسم',approval_status='معتمد من القسم',approved_by=?,approved_at_ms=?,approval_batch_id=?,approval_notes=?,stock_deducted=1,stock_deducted_at_ms=?,close_status='معتمد من القسم',version=version+1,updated_at=CURRENT_TIMESTAMP WHERE order_id=? AND department=? AND final_invoice_no='' AND approval_status<> 'معتمد من القسم'").bind(auth.user.username,now,batchId,text(b.notes),now,orderId,department));
  await env.DB.batch(statements);
  const total=candidates.reduce((a,l)=>a+num(l.sale_price),0);
  await event(env,'dept-approval',batchId,'approve',auth.user.username,{orderId,department,count:candidates.length,total});
  return {success:true,message:`تم اعتماد فاتورة قسم ${department} للأوردر ${orderId} وخصم المخزون مرة واحدة بعدد ${candidates.length} بند.`,count:candidates.length,total,batchId,stockDeducted:true,version:'ENTRY614_D1_ACCOUNTING_V1'};
}
function partyOperationLabel(op,type){const m={opening_debt:type==='supplier'?'إضافة مستحق للمورد':'إضافة مديونية للعميل',invoice:'باقي فاتورة عميل',purchase_invoice:'باقي فاتورة شراء',payment_received:'سداد من العميل',payment_paid:'دفعة للمورد',adjustment_increase:'تسوية بالزيادة',adjustment_decrease:'تسوية بالنقص',manual:'حركة يدوية'};return m[op]||op||'حركة';}
function effect(op){return ['payment_received','payment_paid','adjustment_decrease'].includes(op)?-1:1;}
async function resolvePartyV1(env,type,b){
  const partyId=text(b.partyId||b.customerId||b.supplierId),requested=text(b.partyName||b.customerName||b.supplierName||b.name);
  if(type==='customer'){
    let r;
    if(partyId)r=await env.DB.prepare("SELECT customer_id AS partyId,customer_name AS partyName FROM t12_customers WHERE customer_id=? AND active='نعم' LIMIT 1").bind(partyId).first();
    else if(requested)r=await env.DB.prepare("SELECT customer_id AS partyId,customer_name AS partyName FROM t12_customers WHERE lower(customer_name)=lower(?) AND active='نعم' ORDER BY updated_at DESC LIMIT 1").bind(requested).first();
    if(!r)throw commandErrorV1('accounting-customer-not-found','العميل غير موجود في سجل العملاء. اختر العميل من القائمة.');
    return {partyId:text(r.partyId),partyName:text(r.partyName)};
  }
  let r;
  if(partyId)r=await env.DB.prepare("SELECT party_id AS partyId,display_name AS partyName FROM employee_accounting_parties_v1 WHERE party_type='supplier' AND party_id=? AND active=1 LIMIT 1").bind(partyId).first();
  else if(requested)r=await env.DB.prepare("SELECT party_id AS partyId,display_name AS partyName FROM employee_accounting_parties_v1 WHERE party_type='supplier' AND normalized_name=? AND active=1 LIMIT 1").bind(key(requested)).first();
  if(!r)throw commandErrorV1('accounting-supplier-not-found','المورد غير موجود. اختر المورد من القائمة أو أضفه أولًا.');
  return {partyId:text(r.partyId),partyName:text(r.partyName)};
}
async function partyBalanceV1(env,type,partyId){
  const r=await env.DB.prepare("SELECT balance FROM employee_accounting_party_balances_v1 WHERE party_type=? AND party_id=?").bind(type,partyId).first();
  return r?num(r.balance):0;
}
async function partyLedger(env,auth,b){
  if(!['full','final'].includes(auth.mode))return {success:false,message:'حسابات العملاء والموردين عند ضياء / رحمه / ريفان فقط.'};
  let type=key(b.partyType||b.type||'customer');type=type.includes('supplier')||type.includes('مورد')?'supplier':'customer';
  const op=key(b.operation||'manual'),amount=num(b.amount);
  const allowed=type==='customer'
    ? new Set(['payment_received','opening_debt','invoice','adjustment_increase','adjustment_decrease','manual'])
    : new Set(['payment_paid','opening_debt','purchase_invoice','adjustment_increase','adjustment_decrease','manual']);
  if(!allowed.has(op))return {success:false,message:'نوع الحركة المالية غير مسموح لهذا الطرف.'};
  if(!(amount>0))return {success:false,message:'المبلغ يجب أن يكون أكبر من صفر.'};
  if(auth.mode!=='full'&&!['payment_received','payment_paid'].includes(op))return {success:false,message:'إضافة المديونية والتسويات عند ضياء فقط.'};

  const party=await resolvePartyV1(env,type,b);
  await env.DB.prepare(`
    INSERT OR IGNORE INTO employee_accounting_party_balances_v1
      (party_type,party_id,party_name,balance,version,last_request_key,updated_at_ms)
    VALUES(?,?,?,0,1,'',?)
  `).bind(type,party.partyId,party.partyName,Date.now()).run();

  const snapshot=await env.DB.prepare("SELECT balance,version FROM employee_accounting_party_balances_v1 WHERE party_type=? AND party_id=?").bind(type,party.partyId).first();
  const before=num(snapshot&&snapshot.balance),version=Math.max(1,Math.trunc(num(snapshot&&snapshot.version,1))),delta=effect(op)*amount;
  if(delta<0&&amount>before+0.000001)return {success:false,message:'المبلغ أكبر من الرصيد المستحق الحالي: '+before+' ج.'};

  const ctx=await beginCommandV1(env,auth,'party-ledger:'+type+':'+op,{...b,partyId:party.partyId,partyName:party.partyName,partyType:type});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};

  const tx=uid('LED'),cashId=uid('CSH'),now=Date.now(),workDate=workDateKeyV1(b.workDate||b.date);
  const statements=[
    env.DB.prepare(`
      UPDATE employee_accounting_party_balances_v1
      SET balance=balance+?,version=version+1,last_request_key=?,party_name=?,updated_at_ms=?,updated_at=CURRENT_TIMESTAMP
      WHERE party_type=? AND party_id=? AND version=? AND balance+?>=-0.000001
    `).bind(delta,ctx.requestKey,party.partyName,now,type,party.partyId,version,delta),
    env.DB.prepare(`
      INSERT INTO employee_accounting_party_ledger_v1
        (transaction_id,request_key,party_id,party_type,party_name,party_code,operation,operation_label,amount,effect,payment_method,ref_no,balance_before,balance_after,created_by,notes,source,created_at_ms)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      FROM employee_accounting_party_balances_v1
      WHERE party_type=? AND party_id=? AND last_request_key=? AND version=?
    `).bind(tx,ctx.requestKey,party.partyId,type,party.partyName,text(b.partyCode),op,partyOperationLabel(op,type),amount,effect(op),
      text(b.paymentMethod||b.method),text(b.refNo||b.reference),before,before+delta,auth.user.username,text(b.notes),sourceSystemV1(b),now,
      type,party.partyId,ctx.requestKey,version+1)
  ];

  if(op==='payment_received'||op==='payment_paid'){
    const movementType=op==='payment_received'?'CUSTOMER_RECEIPT':'SUPPLIER_PAYMENT';
    statements.push(env.DB.prepare(`
      INSERT OR IGNORE INTO employee_accounting_cashbox_v1
        (cashbox_tx_id,request_key,work_date,movement_type,party_id,party_name,department,amount,payment_method,ref_no,source,notes,actor,created_at_ms)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?
      FROM employee_accounting_party_ledger_v1
      WHERE request_key=?
    `).bind(cashId,ctx.requestKey+'-CASH',workDate,movementType,party.partyId,party.partyName,text(b.department),amount,
      text(b.paymentMethod||b.method),text(b.refNo||b.reference),sourceSystemV1(b),text(b.notes),auth.user.username,now,ctx.requestKey));
  }
  await env.DB.batch(statements);

  const written=await env.DB.prepare("SELECT balance_before AS balanceBefore,balance_after AS balanceAfter FROM employee_accounting_party_ledger_v1 WHERE request_key=?").bind(ctx.requestKey).first();
  if(!written)throw commandErrorV1('accounting-party-balance-guard-rejected','تعذر تسجيل الحركة بسبب تغير الرصيد بالتزامن. الطلب محفوظ PREPARED للمراجعة، وأعد المحاولة بمعرف طلب جديد بعد تحديث الحساب.');
  const response={success:true,id:tx,partyId:party.partyId,partyType:type,partyName:party.partyName,balanceBefore:num(written.balanceBefore),balance:num(written.balanceAfter),cashboxPosted:op==='payment_received'||op==='payment_paid',version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'party-ledger',tx,'post',auth.user.username,{type,partyId:party.partyId,partyName:party.partyName,op,amount,before:response.balanceBefore,after:response.balance,balanceVersionBefore:version,balanceVersionAfter:version+1});
  return response;
}
async function saveSupplierV1(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'إضافة الموردين عند ضياء فقط.'};
  const name=text(b.supplierName||b.supplier||b.name);
  if(!name)return {success:false,message:'اسم المورد مطلوب.'};
  const normalized=key(name);
  let existing=await env.DB.prepare("SELECT party_id AS partyId,display_name AS partyName FROM employee_accounting_parties_v1 WHERE party_type='supplier' AND normalized_name=? LIMIT 1").bind(normalized).first();
  const partyId=existing?text(existing.partyId):text(b.partyId||b.supplierId)||uid('SUP');
  const opening=Math.max(0,num(b.openingDebt||b.opening||b.debt));
  if(existing&&opening>0)return {success:false,message:'المورد موجود بالفعل. أضف المديونية من حركة حساب المورد بدل إعادة الرصيد الافتتاحي.'};
  const ctx=await beginCommandV1(env,auth,'supplier-master-upsert',{...b,partyId,supplierName:name});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  const now=Date.now(),active=/^(?:0|false|لا|موقوف|inactive)$/i.test(text(b.active))?0:1,ledgerId=uid('LED');
  const statements=[
    env.DB.prepare(`
      INSERT INTO employee_accounting_parties_v1
        (party_id,party_type,display_name,normalized_name,external_id,source_system,phone,address,notes,active,created_by,created_at_ms,updated_at_ms)
      VALUES(?,'supplier',?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(party_type,normalized_name) DO UPDATE SET
        display_name=excluded.display_name,phone=excluded.phone,address=excluded.address,notes=excluded.notes,
        active=excluded.active,updated_at_ms=excluded.updated_at_ms,updated_at=CURRENT_TIMESTAMP
    `).bind(partyId,name,normalized,text(b.externalId),sourceSystemV1(b),text(b.phone),text(b.address),text(b.notes),active,auth.user.username,now,now)
  ];
  if(opening>0){
    statements.push(env.DB.prepare(`
      INSERT INTO employee_accounting_party_balances_v1
        (party_type,party_id,party_name,balance,version,last_request_key,updated_at_ms)
      VALUES('supplier',?,?,?,1,?,?)
    `).bind(partyId,name,opening,ctx.requestKey,now));
    statements.push(env.DB.prepare(`
      INSERT INTO employee_accounting_party_ledger_v1
        (transaction_id,request_key,party_id,party_type,party_name,operation,operation_label,amount,effect,balance_before,balance_after,created_by,notes,source,created_at_ms)
      VALUES(?,?,?,'supplier',?,'opening_debt',?, ?,1,0,?,?,?,?,?)
    `).bind(ledgerId,ctx.requestKey+'-OPENING',partyId,name,partyOperationLabel('opening_debt','supplier'),opening,opening,auth.user.username,text(b.notes),sourceSystemV1(b),now));
  }else{
    statements.push(env.DB.prepare(`
      INSERT OR IGNORE INTO employee_accounting_party_balances_v1
        (party_type,party_id,party_name,balance,version,last_request_key,updated_at_ms)
      VALUES('supplier',?,?,0,1,'',?)
    `).bind(partyId,name,now));
  }
  await env.DB.batch(statements);
  const response={success:true,partyId,supplierId:partyId,name,supplierName:name,openingBalance:opening,active:!!active,version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'supplier',partyId,existing?'update':'create',auth.user.username,{name,opening,active});
  return response;
}


async function resolveMaterialV1(env,b,department=''){
  const materialId=text(b.materialId),materialName=text(b.materialName||b.material);
  let r;
  if(materialId)r=await env.DB.prepare("SELECT material_id AS materialId,material_name AS materialName,department,stock_qty AS stock,version FROM employee_accounting_materials_v1 WHERE material_id=? AND active=1 LIMIT 1").bind(materialId).first();
  else if(materialName)r=await env.DB.prepare("SELECT material_id AS materialId,material_name AS materialName,department,stock_qty AS stock,version FROM employee_accounting_materials_v1 WHERE material_name=? AND active=1 AND (?='' OR department IN (?,'مشترك','')) ORDER BY CASE WHEN department=? THEN 0 WHEN department='مشترك' THEN 1 ELSE 2 END,updated_at DESC LIMIT 1").bind(materialName,department,department,department).first();
  if(!r)throw commandErrorV1('accounting-material-not-found','الخامة غير مسجلة في المخزون للقسم المطلوب.');
  return {materialId:text(r.materialId),materialName:text(r.materialName),department:text(r.department),stock:num(r.stock),version:Math.max(1,Math.trunc(num(r.version,1)))};
}
function isDeferredPaymentV1(value){const k=key(value);return k.includes('اجل')||k.includes('آجل')||k.includes('credit')||k.includes('deferred');}


async function postPurchaseInvoiceV1(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'فواتير المشتريات عند ضياء فقط.'};
  const invoiceNo=text(b.invoiceNo||b.no),department=accountingDepartmentV1(b.department)||text(b.department)||'إدارة';
  const qty=num(b.qty),unitCost=num(b.unitCost||b.unitPrice||b.unit),total=num(b.total,qty*unitCost),paid=Math.max(0,num(b.paid));
  if(!invoiceNo||qty<=0||unitCost<0||total<0)return {success:false,message:'رقم الفاتورة والخامة والكمية والسعر الصحيح مطلوبة.'};
  if(paid>total+0.000001)return {success:false,message:'المدفوع لا يمكن أن يزيد عن إجمالي فاتورة الشراء.'};
  const remaining=Math.max(0,total-paid),supplier=await resolvePartyV1(env,'supplier',b),material=await resolveMaterialV1(env,b,department==='كل الأقسام'?'':department);
  const sourceDailyPurchaseId=text(b.sourceDailyPurchaseId),stockAlreadyApplied=!!sourceDailyPurchaseId||['1','true','yes','نعم'].includes(key(b.stockAlreadyAppliedV1919||b.stockAlreadyApplied));
  const dupe=await env.DB.prepare("SELECT purchase_id AS purchaseId FROM employee_accounting_purchase_invoices_v1 WHERE supplier_party_id=? AND supplier_invoice_no=? AND status='POSTED' LIMIT 1").bind(supplier.partyId,invoiceNo).first();
  if(dupe)return {success:false,duplicatePrevented:true,message:'فاتورة المورد مسجلة بالفعل: '+invoiceNo,purchaseId:text(dupe.purchaseId)};

  await env.DB.prepare("INSERT OR IGNORE INTO employee_accounting_party_balances_v1(party_type,party_id,party_name,balance,version,last_request_key,updated_at_ms) VALUES('supplier',?,?,0,1,'',?)").bind(supplier.partyId,supplier.partyName,Date.now()).run();
  const bal=await env.DB.prepare("SELECT balance,version FROM employee_accounting_party_balances_v1 WHERE party_type='supplier' AND party_id=?").bind(supplier.partyId).first();
  const balanceBefore=num(bal&&bal.balance),balanceVersion=Math.max(1,Math.trunc(num(bal&&bal.version,1)));
  const ctx=await beginCommandV1(env,auth,'purchase-invoice',{...b,supplierId:supplier.partyId,supplierName:supplier.partyName,materialId:material.materialId,materialName:material.materialName,invoiceNo});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};

  const purchaseId=text(b.purchaseId)||uid('PUR'),now=Date.now(),workDate=workDateKeyV1(b.workDate||b.date);
  const purchaseLedgerId=uid('LED'),paymentLedgerId=uid('LED'),stockMoveId=uid('STK'),cashId=uid('CSH'),custodyEventId=uid('CUS');
  const statements=[];
  if(!stockAlreadyApplied)statements.push(env.DB.prepare("UPDATE employee_accounting_materials_v1 SET stock_qty=stock_qty+?,version=version+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE material_id=? AND version=?").bind(qty,auth.user.username,material.materialId,material.version));
  statements.push(env.DB.prepare("UPDATE employee_accounting_party_balances_v1 SET balance=balance+?,version=version+1,last_request_key=?,party_name=?,updated_at_ms=?,updated_at=CURRENT_TIMESTAMP WHERE party_type='supplier' AND party_id=? AND version=?").bind(remaining,ctx.requestKey,supplier.partyName,now,supplier.partyId,balanceVersion));

  let purchaseSql="INSERT INTO employee_accounting_purchase_invoices_v1(purchase_id,request_key,supplier_party_id,supplier_name,supplier_invoice_no,department,material_id,material_name,qty,unit_cost,total,paid,remaining,payment_method,work_date,status,source_daily_purchase_id,notes,created_by,created_at_ms) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'POSTED',?,?,?,? WHERE EXISTS(SELECT 1 FROM employee_accounting_party_balances_v1 pb WHERE pb.party_type='supplier' AND pb.party_id=? AND pb.last_request_key=? AND pb.version=?)";
  const purchaseBind=[purchaseId,ctx.requestKey,supplier.partyId,supplier.partyName,invoiceNo,department,material.materialId,material.materialName,qty,unitCost,total,paid,remaining,text(b.paymentType||b.paymentMethod),workDate,sourceDailyPurchaseId,text(b.notes),auth.user.username,now,supplier.partyId,ctx.requestKey,balanceVersion+1];
  if(!stockAlreadyApplied){purchaseSql+=" AND EXISTS(SELECT 1 FROM employee_accounting_materials_v1 m WHERE m.material_id=? AND m.version=?)";purchaseBind.push(material.materialId,material.version+1);}
  statements.push(env.DB.prepare(purchaseSql).bind(...purchaseBind));

  if(!stockAlreadyApplied)statements.push(env.DB.prepare("INSERT INTO employee_accounting_stock_moves_v1(stock_move_id,material_id,move_type,department,item_name,qty_in,qty_out,balance_before,balance_after,actor,notes,request_key,created_at_ms) SELECT ?,?,'شراء',?,?,?,0,?,?,?,?,?,? FROM employee_accounting_materials_v1 WHERE material_id=? AND version=?").bind(stockMoveId,material.materialId,department,material.materialName,qty,material.stock,material.stock+qty,auth.user.username,text(b.notes),ctx.requestKey,now,material.materialId,material.version+1));

  statements.push(env.DB.prepare("INSERT INTO employee_accounting_party_ledger_v1(transaction_id,request_key,party_id,party_type,party_name,operation,operation_label,amount,effect,payment_method,ref_no,balance_before,balance_after,created_by,notes,source,created_at_ms) SELECT ?,?,?,'supplier',?,'purchase_invoice',?,?,1,?,?,?,?,?,?,?,? FROM employee_accounting_purchase_invoices_v1 WHERE request_key=?").bind(purchaseLedgerId,ctx.requestKey+'-LEDGER-INVOICE',supplier.partyId,supplier.partyName,partyOperationLabel('purchase_invoice','supplier'),total,text(b.paymentType||b.paymentMethod),invoiceNo,balanceBefore,balanceBefore+total,auth.user.username,text(b.notes),sourceSystemV1(b),now,ctx.requestKey));
  if(paid>0){
    statements.push(env.DB.prepare("INSERT INTO employee_accounting_party_ledger_v1(transaction_id,request_key,party_id,party_type,party_name,operation,operation_label,amount,effect,payment_method,ref_no,balance_before,balance_after,created_by,notes,source,created_at_ms) SELECT ?,?,?,'supplier',?,'payment_paid',?,-1,?,?,?,?,?,?,?,? FROM employee_accounting_purchase_invoices_v1 WHERE request_key=?").bind(paymentLedgerId,ctx.requestKey+'-LEDGER-PAYMENT',supplier.partyId,supplier.partyName,partyOperationLabel('payment_paid','supplier'),paid,text(b.paymentType||b.paymentMethod),invoiceNo,balanceBefore+total,balanceBefore+remaining,auth.user.username,text(b.notes),sourceSystemV1(b),now,ctx.requestKey));
    if(sourceDailyPurchaseId)statements.push(env.DB.prepare("INSERT OR IGNORE INTO employee_accounting_custody_events_v1(custody_event_id,request_key,work_date,employee_key,department,movement_type,amount,payment_method,ref_no,source_purchase_id,notes,actor,created_at_ms) SELECT ?,?,?,?,?, 'PURCHASE_SETTLEMENT',?,?,?,?,?,?,? FROM employee_accounting_purchase_invoices_v1 WHERE request_key=?").bind(custodyEventId,ctx.requestKey+'-CUSTODY',workDate,text(b.employee),department,paid,text(b.paymentType||b.paymentMethod),invoiceNo,purchaseId,material.materialName+' | '+supplier.partyName,auth.user.username,now,ctx.requestKey));
    else statements.push(env.DB.prepare("INSERT OR IGNORE INTO employee_accounting_cashbox_v1(cashbox_tx_id,request_key,work_date,movement_type,party_id,party_name,department,amount,payment_method,ref_no,source,notes,actor,created_at_ms) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,? FROM employee_accounting_purchase_invoices_v1 WHERE request_key=?").bind(cashId,ctx.requestKey+'-CASH',workDate,'SUPPLIER_PAYMENT',supplier.partyId,supplier.partyName,department,paid,text(b.paymentType||b.paymentMethod),invoiceNo,sourceSystemV1(b),text(b.notes),auth.user.username,now,ctx.requestKey));
  }
  await env.DB.batch(statements);
  const written=await env.DB.prepare("SELECT purchase_id AS purchaseId,supplier_invoice_no AS invoiceNo,total,paid,remaining FROM employee_accounting_purchase_invoices_v1 WHERE request_key=?").bind(ctx.requestKey).first();
  if(!written)throw commandErrorV1('accounting-purchase-guard-rejected','تعذر تثبيت فاتورة الشراء بسبب تغير متزامن في المخزون أو حساب المورد. الطلب محفوظ PREPARED للمراجعة.');
  const response={success:true,purchaseId:text(written.purchaseId),invoiceNo:text(written.invoiceNo),supplierId:supplier.partyId,materialId:material.materialId,total:num(written.total),paid:num(written.paid),remaining:num(written.remaining),stockUpdateSkipped:stockAlreadyApplied,version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'purchase',purchaseId,'post',auth.user.username,{invoiceNo,supplierId:supplier.partyId,materialId:material.materialId,qty,total,paid,remaining,stockAlreadyApplied,sourceDailyPurchaseId});
  return response;
}

async function approveDeptDailyPurchasesV1(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'اعتماد مشتريات جابر ووائل متاح لضياء فقط.'};
  const employee=text(b.employee),workDate=workDateKeyV1(b.workDate||b.date);
  if(!employee||!workDate)return {success:false,message:'الموظف وتاريخ المشتريات مطلوبان للاعتماد.'};
  const pending=await rows(env,"SELECT * FROM employee_accounting_daily_purchases_v1 WHERE employee_key=? AND work_date=? AND status='PENDING' ORDER BY created_at_ms",[employee,workDate]);
  if(!pending.length){
    const n=await env.DB.prepare("SELECT COUNT(*) AS n FROM employee_accounting_daily_purchases_v1 WHERE employee_key=? AND work_date=? AND status='APPROVED'").bind(employee,workDate).first();
    if(Number(n&&n.n||0)>0)return {success:true,duplicatePrevented:true,approvedCount:0,message:'مشتريات اليوم معتمدة بالفعل.',version:'A2_D1_ACCOUNTING_V1'};
    return {success:false,message:'لا توجد مشتريات معلقة لهذا الموظف في اليوم المحدد.'};
  }
  let approvedCount=0,approvedTotal=0;const failed=[];
  for(const row of pending){
    const invoiceNo='DPP-'+workDate.replace(/-/g,'')+'-'+text(row.daily_purchase_id).replace(/[^A-Za-z0-9]/g,'').slice(-8);
    try{
      const result=await postPurchaseInvoiceV1(env,{...auth,mode:'full'},{requestId:'DPP-APPROVE-'+text(row.daily_purchase_id),sourceSystem:'EasyStore',sourceDailyPurchaseId:text(row.daily_purchase_id),stockAlreadyApplied:'1',invoiceNo,department:text(row.department),employee:text(row.employee_key),supplierId:text(row.supplier_party_id),supplierName:text(row.supplier_name),materialId:text(row.material_id),materialName:text(row.material_name),qty:num(row.qty),unit:num(row.unit_cost),total:num(row.total),paid:num(row.paid),paymentType:text(row.payment_method),workDate,notes:text(row.notes)});
      if(!result||result.success===false){failed.push({id:row.daily_purchase_id,message:result&&result.message||'تعذر الاعتماد'});continue;}
      await env.DB.prepare("UPDATE employee_accounting_daily_purchases_v1 SET status='APPROVED',approved_at_ms=?,approved_by=?,official_purchase_id=?,stock_status='APPLIED',updated_at=CURRENT_TIMESTAMP WHERE daily_purchase_id=? AND status='PENDING'").bind(Date.now(),auth.user.username,result.purchaseId,row.daily_purchase_id).run();
      approvedCount++;approvedTotal+=num(row.total);
    }catch(err){failed.push({id:row.daily_purchase_id,message:text(err&&err.message)||String(err)});}
  }
  return {success:approvedCount>0||failed.length===0,partial:failed.length>0,approvedCount,approvedTotal,failed,message:failed.length?'تم اعتماد بعض البنود وبقيت بنود تحتاج مراجعة.':'تم اعتماد مشتريات اليوم ماليًا دون تكرار المخزون.',version:'A2_D1_ACCOUNTING_V1'};
}

async function saveDeptDailyPurchaseV1(env,auth,b){
  if(!['print','laser'].includes(auth.mode))return {success:false,message:'تسجيل مشتريات اليوم متاح لجابر ووائل فقط.'};
  const department=auth.department,qty=num(b.qty),unit=num(b.unit||b.unitPrice),total=qty*unit;
  if(qty<=0||unit<=0)return {success:false,message:'الكمية والسعر يجب أن يكونا أكبر من صفر.'};
  const supplier=await resolvePartyV1(env,'supplier',b),material=await resolveMaterialV1(env,b,department);
  const paymentType=text(b.paymentType||'نقدي')||'نقدي',paid=isDeferredPaymentV1(paymentType)?0:total,remaining=Math.max(0,total-paid);
  const ctx=await beginCommandV1(env,auth,'daily-purchase-create',{...b,supplierId:supplier.partyId,supplierName:supplier.partyName,materialId:material.materialId,materialName:material.materialName,department});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  const id=text(b.id)||uid('DPP'),now=Date.now(),workDate=workDateKeyV1(b.workDate||b.date),move=uid('STK');
  await env.DB.batch([
    env.DB.prepare("UPDATE employee_accounting_materials_v1 SET stock_qty=stock_qty+?,version=version+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE material_id=? AND version=?").bind(qty,auth.user.username,material.materialId,material.version),
    env.DB.prepare("INSERT INTO employee_accounting_daily_purchases_v1(daily_purchase_id,request_key,work_date,employee_key,department,supplier_party_id,supplier_name,supplier_invoice_no,material_id,material_name,qty,unit_cost,total,payment_method,paid,remaining,notes,status,stock_status,created_at_ms) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'PENDING','APPLIED',? FROM employee_accounting_materials_v1 WHERE material_id=? AND version=?").bind(id,ctx.requestKey,workDate,auth.user.username,department,supplier.partyId,supplier.partyName,text(b.receiptNo||b.invoiceNo),material.materialId,material.materialName,qty,unit,total,paymentType,paid,remaining,text(b.notes),now,material.materialId,material.version+1),
    env.DB.prepare("INSERT INTO employee_accounting_stock_moves_v1(stock_move_id,material_id,move_type,department,item_name,qty_in,qty_out,balance_before,balance_after,actor,notes,request_key,created_at_ms) SELECT ?,?,'شراء قسم فوري',?,?,?,0,?,?,?,?,?,? FROM employee_accounting_materials_v1 WHERE material_id=? AND version=?").bind(move,material.materialId,department,material.materialName,qty,material.stock,material.stock+qty,auth.user.username,text(b.notes),ctx.requestKey,now,material.materialId,material.version+1)
  ]);
  const written=await env.DB.prepare("SELECT daily_purchase_id AS id,work_date AS workDate,total,paid,remaining AS remain,status,stock_status AS stockStatus FROM employee_accounting_daily_purchases_v1 WHERE request_key=?").bind(ctx.requestKey).first();
  if(!written)throw commandErrorV1('accounting-daily-purchase-stock-guard-rejected','تعذر تسجيل مشتريات القسم بسبب تغير المخزون بالتزامن. الطلب محفوظ PREPARED للمراجعة.');
  const response={success:true,purchase:{...written,supplierPartyId:supplier.partyId,supplier:supplier.partyName,materialId:material.materialId,material:material.materialName,qty,unit,paymentType,department,employee:auth.user.username},stockBefore:material.stock,stockAfter:material.stock+qty,version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'daily-purchase',id,'create',auth.user.username,{department,supplierId:supplier.partyId,materialId:material.materialId,qty,total});
  return response;
}

async function rejectDeptDailyPurchaseV1(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'رفض مشتريات الأقسام متاح لضياء فقط.'};
  const id=text(b.id||b.purchaseId),reason=text(b.reason||'مرفوض بعد المراجعة');
  if(!id)return {success:false,message:'رقم بند المشتريات مطلوب.'};
  const row=await env.DB.prepare("SELECT * FROM employee_accounting_daily_purchases_v1 WHERE daily_purchase_id=?").bind(id).first();
  if(!row)return {success:false,message:'بند المشتريات غير موجود.'};
  if(text(row.status)==='APPROVED')return {success:false,message:'لا يمكن رفض بند تم اعتماده ماليًا.'};
  if(text(row.status)==='REJECTED')return {success:true,duplicatePrevented:true,message:'البند مرفوض بالفعل.',version:'A2_D1_ACCOUNTING_V1'};
  const material=await resolveMaterialV1(env,{materialId:row.material_id},text(row.department)),qty=num(row.qty);
  if(material.stock+0.000001<qty)return {success:false,message:'لا يمكن رفض البند لأن رصيد المخزون الحالي أقل من الكمية التي أضيفت.'};
  const ctx=await beginCommandV1(env,auth,'daily-purchase-reject',{...b,id,reason});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  const move=uid('STK'),now=Date.now();
  await env.DB.batch([
    env.DB.prepare("UPDATE employee_accounting_materials_v1 SET stock_qty=stock_qty-?,version=version+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE material_id=? AND version=? AND stock_qty>=?").bind(qty,auth.user.username,material.materialId,material.version,qty),
    env.DB.prepare("UPDATE employee_accounting_daily_purchases_v1 SET status='REJECTED',stock_status='REVERSED',notes=CASE WHEN notes='' THEN ? ELSE notes||' | '||? END,updated_at=CURRENT_TIMESTAMP WHERE daily_purchase_id=? AND status='PENDING' AND EXISTS(SELECT 1 FROM employee_accounting_materials_v1 WHERE material_id=? AND version=?)").bind('سبب الرفض: '+reason,'سبب الرفض: '+reason,id,material.materialId,material.version+1),
    env.DB.prepare("INSERT INTO employee_accounting_stock_moves_v1(stock_move_id,material_id,move_type,department,item_name,qty_in,qty_out,balance_before,balance_after,actor,notes,request_key,created_at_ms) SELECT ?,?,'عكس شراء قسم مرفوض',?,?,0,?,?,?,?,?,?,? FROM employee_accounting_materials_v1 WHERE material_id=? AND version=?").bind(move,material.materialId,text(row.department),text(row.material_name),qty,material.stock,material.stock-qty,auth.user.username,reason,ctx.requestKey,now,material.materialId,material.version+1)
  ]);
  const check=await env.DB.prepare("SELECT status FROM employee_accounting_daily_purchases_v1 WHERE daily_purchase_id=?").bind(id).first();
  if(!check||text(check.status)!=='REJECTED')throw commandErrorV1('accounting-daily-purchase-reject-guard','تعذر عكس المخزون وحفظ قرار الرفض بشكل ذري. الطلب محفوظ PREPARED للمراجعة.');
  const response={success:true,id,status:'REJECTED',stockBefore:material.stock,stockAfter:material.stock-qty,version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'daily-purchase',id,'reject',auth.user.username,{reason,materialId:material.materialId,qty});
  return response;
}

async function savePurchaseCustodyV1(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'تسليم عهد المشتريات متاح لضياء فقط.'};
  const employee=text(b.employee),department=accountingDepartmentV1(b.department),amount=num(b.amount),workDate=workDateKeyV1(b.workDate||b.date);
  if(!employee||!department||department==='كل الأقسام'||amount<=0)return {success:false,message:'الموظف والقسم ومبلغ عهدة أكبر من صفر مطلوبة.'};
  const ctx=await beginCommandV1(env,auth,'custody-handoff',{...b,employee,department,workDate});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  const id=uid('CUS'),cash=uid('CSH'),now=Date.now(),method=text(b.paymentMethod||'نقدي');
  await env.DB.batch([
    env.DB.prepare("INSERT INTO employee_accounting_custody_events_v1(custody_event_id,request_key,work_date,employee_key,department,movement_type,amount,payment_method,ref_no,notes,actor,created_at_ms) VALUES(?,?,?,?,?,'HANDOFF',?,?,?,?,?,?,?)").bind(id,ctx.requestKey,workDate,employee,department,amount,method,text(b.refNo),text(b.notes),auth.user.username,now),
    env.DB.prepare("INSERT INTO employee_accounting_cashbox_v1(cashbox_tx_id,request_key,work_date,movement_type,party_name,department,amount,payment_method,ref_no,source,notes,actor,created_at_ms) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(cash,ctx.requestKey+'-CASH',workDate,'CUSTODY_HANDOFF',employee,department,amount,method,id,sourceSystemV1(b),text(b.notes),auth.user.username,now)
  ]);
  const response={success:true,id,summary:(await custodySummariesV1(env,workDate)).find(x=>key(x.employee)===key(employee)&&x.department===department)||null,version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'custody',id,'handoff',auth.user.username,{employee,department,workDate,amount});
  return response;
}

async function closePurchaseCustodyV1(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'تقفيل العهدة متاح لضياء فقط.'};
  const employee=text(b.employee),department=accountingDepartmentV1(b.department),workDate=workDateKeyV1(b.workDate||b.date);
  if(!employee||!department||department==='كل الأقسام')return {success:false,message:'الموظف والقسم مطلوبان.'};
  const old=await env.DB.prepare("SELECT custody_close_id AS closeId FROM employee_accounting_custody_closes_v1 WHERE work_date=? AND employee_key=? AND department=?").bind(workDate,employee,department).first();
  if(old)return {success:true,duplicatePrevented:true,closeId:text(old.closeId),summary:(await custodySummariesV1(env,workDate)).find(x=>key(x.employee)===key(employee)&&x.department===department)||null,version:'A2_D1_ACCOUNTING_V1'};
  const current=(await custodySummariesV1(env,workDate)).find(x=>key(x.employee)===key(employee)&&x.department===department)||{balance:0};
  const balance=num(current.balance),amount=Math.abs(balance),movement=balance>0?'RETURN':balance<0?'EXTRA_PAYMENT':'';
  const ctx=await beginCommandV1(env,auth,'custody-close',{...b,employee,department,workDate,balance});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  const closeId=uid('CCL'),eventId=uid('CUS'),cashId=uid('CSH'),now=Date.now(),method=text(b.paymentMethod||'نقدي'),statements=[];
  if(amount>0){
    statements.push(env.DB.prepare("INSERT INTO employee_accounting_custody_events_v1(custody_event_id,request_key,work_date,employee_key,department,movement_type,amount,payment_method,ref_no,notes,actor,created_at_ms) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").bind(eventId,ctx.requestKey+'-SETTLE',workDate,employee,department,movement,amount,method,closeId,text(b.notes),auth.user.username,now));
    statements.push(env.DB.prepare("INSERT INTO employee_accounting_cashbox_v1(cashbox_tx_id,request_key,work_date,movement_type,party_name,department,amount,payment_method,ref_no,source,notes,actor,created_at_ms) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(cashId,ctx.requestKey+'-CASH',workDate,movement==='RETURN'?'CUSTODY_RETURN':'CUSTODY_EXTRA_PAYMENT',employee,department,amount,method,closeId,sourceSystemV1(b),text(b.notes),auth.user.username,now));
  }
  statements.push(env.DB.prepare("INSERT INTO employee_accounting_custody_closes_v1(custody_close_id,request_key,work_date,employee_key,department,balance_before,settlement_type,settlement_amount,balance_after,notes,actor,created_at_ms) VALUES(?,?,?,?,?,?,?,?,0,?,?,?)").bind(closeId,ctx.requestKey,workDate,employee,department,balance,movement||'NONE',amount,text(b.notes),auth.user.username,now));
  await env.DB.batch(statements);
  const response={success:true,closeId,balanceBefore:balance,settlementType:movement||'NONE',settlementAmount:amount,balanceAfter:0,version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'custody-close',closeId,'close',auth.user.username,{employee,department,workDate,balance,amount,movement});
  return response;
}


async function reverseApprovedPurchaseV1(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'عكس المشتريات المعتمدة متاح لضياء فقط.'};
  const purchaseId=text(b.id||b.purchaseId),invoiceNo=text(b.invoiceNo||b.no),reason=text(b.reason);
  if(!purchaseId&&!invoiceNo)return {success:false,message:'حدد فاتورة الشراء المطلوب عكسها.'};
  if(!reason)return {success:false,message:'اكتب سبب العكس للحفاظ على سجل المراجعة.'};
  const purchase=await env.DB.prepare("SELECT * FROM employee_accounting_purchase_invoices_v1 WHERE (purchase_id=? OR supplier_invoice_no=?) LIMIT 1").bind(purchaseId,invoiceNo).first();
  if(!purchase)return {success:false,message:'فاتورة الشراء المعتمدة غير موجودة.'};
  if(text(purchase.status)==='REVERSED')return {success:true,duplicatePrevented:true,purchaseId:text(purchase.purchase_id),message:'تم عكس هذه المشتريات بالفعل.',version:'A2_D1_ACCOUNTING_V1'};

  const qty=num(purchase.qty),total=num(purchase.total),paid=num(purchase.paid),remaining=num(purchase.remaining);
  const material=await resolveMaterialV1(env,{materialId:purchase.material_id},text(purchase.department));
  if(material.stock+0.000001<qty)return {success:false,message:'لا يمكن عكس المشتريات لأن المخزون الحالي أقل من الكمية المطلوب عكسها.'};
  const supplier=await resolvePartyV1(env,'supplier',{supplierId:purchase.supplier_party_id,supplierName:purchase.supplier_name});
  await env.DB.prepare("INSERT OR IGNORE INTO employee_accounting_party_balances_v1(party_type,party_id,party_name,balance,version,last_request_key,updated_at_ms) VALUES('supplier',?,?,0,1,'',?)").bind(supplier.partyId,supplier.partyName,Date.now()).run();
  const bal=await env.DB.prepare("SELECT balance,version FROM employee_accounting_party_balances_v1 WHERE party_type='supplier' AND party_id=?").bind(supplier.partyId).first();
  const balanceBefore=num(bal&&bal.balance),balanceVersion=Math.max(1,Math.trunc(num(bal&&bal.version,1)));
  if(balanceBefore+0.000001<remaining)return {success:false,message:'لا يمكن عكس الفاتورة لأن رصيد المورد الحالي أقل من المتبقي المرتبط بها. يلزم مراجعة حركات المورد أولًا.'};

  const ctx=await beginCommandV1(env,auth,'purchase-reversal',{...b,purchaseId:text(purchase.purchase_id),invoiceNo:text(purchase.supplier_invoice_no),supplierId:supplier.partyId,materialId:material.materialId});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  const now=Date.now(),stockMoveId=uid('STK'),cashId=uid('CSH'),custodyEventId=uid('CUS'),paymentReversalId=uid('LED'),invoiceReversalId=uid('LED');
  const reversalRef='REV-'+crypto.randomUUID().replace(/-/g,'').slice(0,8).toUpperCase(),statements=[];

  statements.push(env.DB.prepare("UPDATE employee_accounting_materials_v1 SET stock_qty=stock_qty-?,version=version+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE material_id=? AND version=? AND stock_qty>=?").bind(qty,auth.user.username,material.materialId,material.version,qty));
  statements.push(env.DB.prepare("UPDATE employee_accounting_party_balances_v1 SET balance=balance-?,version=version+1,last_request_key=?,party_name=?,updated_at_ms=?,updated_at=CURRENT_TIMESTAMP WHERE party_type='supplier' AND party_id=? AND version=? AND balance>=?").bind(remaining,ctx.requestKey,supplier.partyName,now,supplier.partyId,balanceVersion,remaining));
  statements.push(env.DB.prepare("UPDATE employee_accounting_purchase_invoices_v1 SET status='REVERSED',notes=CASE WHEN notes='' THEN ? ELSE notes||' | '||? END,updated_at=CURRENT_TIMESTAMP WHERE purchase_id=? AND status='POSTED' AND EXISTS(SELECT 1 FROM employee_accounting_materials_v1 WHERE material_id=? AND version=?) AND EXISTS(SELECT 1 FROM employee_accounting_party_balances_v1 WHERE party_type='supplier' AND party_id=? AND last_request_key=? AND version=?)").bind('عكس: '+reason+' | '+reversalRef,'عكس: '+reason+' | '+reversalRef,purchase.purchase_id,material.materialId,material.version+1,supplier.partyId,ctx.requestKey,balanceVersion+1));
  statements.push(env.DB.prepare("INSERT INTO employee_accounting_stock_moves_v1(stock_move_id,material_id,move_type,department,item_name,qty_in,qty_out,balance_before,balance_after,actor,notes,request_key,created_at_ms) SELECT ?,?,'عكس فاتورة شراء',?,?,0,?,?,?,?,?,?,? FROM employee_accounting_purchase_invoices_v1 WHERE purchase_id=? AND status='REVERSED'").bind(stockMoveId,material.materialId,text(purchase.department),text(purchase.material_name),qty,material.stock,material.stock-qty,auth.user.username,reason,ctx.requestKey,now,purchase.purchase_id));

  if(paid>0)statements.push(env.DB.prepare("INSERT INTO employee_accounting_party_ledger_v1(transaction_id,request_key,party_id,party_type,party_name,operation,operation_label,amount,effect,payment_method,ref_no,balance_before,balance_after,created_by,notes,source,created_at_ms) SELECT ?,?,?,'supplier',?,'adjustment_increase','عكس دفعة شراء',?,1,?,?,?,?,?,?,?,? FROM employee_accounting_purchase_invoices_v1 WHERE purchase_id=? AND status='REVERSED'").bind(paymentReversalId,ctx.requestKey+'-LEDGER-PAYMENT-REV',supplier.partyId,supplier.partyName,paid,text(purchase.payment_method),text(purchase.supplier_invoice_no),balanceBefore,balanceBefore+paid,auth.user.username,reason,sourceSystemV1(b),now,purchase.purchase_id));
  statements.push(env.DB.prepare("INSERT INTO employee_accounting_party_ledger_v1(transaction_id,request_key,party_id,party_type,party_name,operation,operation_label,amount,effect,payment_method,ref_no,balance_before,balance_after,created_by,notes,source,created_at_ms) SELECT ?,?,?,'supplier',?,'adjustment_decrease','عكس فاتورة شراء',?,-1,?,?,?,?,?,?,?,? FROM employee_accounting_purchase_invoices_v1 WHERE purchase_id=? AND status='REVERSED'").bind(invoiceReversalId,ctx.requestKey+'-LEDGER-INVOICE-REV',supplier.partyId,supplier.partyName,total,text(purchase.payment_method),text(purchase.supplier_invoice_no),balanceBefore+paid,balanceBefore-remaining,auth.user.username,reason,sourceSystemV1(b),now,purchase.purchase_id));

  const sourceDailyId=text(purchase.source_daily_purchase_id);
  if(sourceDailyId){
    statements.push(env.DB.prepare("UPDATE employee_accounting_daily_purchases_v1 SET status='REVERSED',stock_status='REVERSED',notes=CASE WHEN notes='' THEN ? ELSE notes||' | '||? END,updated_at=CURRENT_TIMESTAMP WHERE daily_purchase_id=? AND status='APPROVED' AND EXISTS(SELECT 1 FROM employee_accounting_purchase_invoices_v1 WHERE purchase_id=? AND status='REVERSED')").bind('عكس مالي: '+reason,'عكس مالي: '+reason,sourceDailyId,purchase.purchase_id));
    if(paid>0)statements.push(env.DB.prepare("INSERT OR IGNORE INTO employee_accounting_custody_events_v1(custody_event_id,request_key,work_date,employee_key,department,movement_type,amount,payment_method,ref_no,source_purchase_id,notes,actor,created_at_ms) SELECT ?,?,?,?,?, 'PURCHASE_REVERSAL',?,?,?,?,?,?,? FROM employee_accounting_daily_purchases_v1 WHERE daily_purchase_id=? AND status='REVERSED'").bind(custodyEventId,ctx.requestKey+'-CUSTODY-REV',text(purchase.work_date),text(b.employee||''),text(purchase.department),paid,text(purchase.payment_method),text(purchase.supplier_invoice_no),text(purchase.purchase_id),reason,auth.user.username,now,sourceDailyId));
  }else if(paid>0){
    statements.push(env.DB.prepare("INSERT OR IGNORE INTO employee_accounting_cashbox_v1(cashbox_tx_id,request_key,work_date,movement_type,party_id,party_name,department,amount,payment_method,ref_no,source,notes,actor,created_at_ms) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,? FROM employee_accounting_purchase_invoices_v1 WHERE purchase_id=? AND status='REVERSED'").bind(cashId,ctx.requestKey+'-CASH-REV',text(purchase.work_date),'PURCHASE_REVERSAL_RECEIPT',supplier.partyId,supplier.partyName,text(purchase.department),paid,text(purchase.payment_method),text(purchase.supplier_invoice_no),sourceSystemV1(b),reason,auth.user.username,now,purchase.purchase_id));
  }

  await env.DB.batch(statements);
  const check=await env.DB.prepare("SELECT status FROM employee_accounting_purchase_invoices_v1 WHERE purchase_id=?").bind(purchase.purchase_id).first();
  if(!check||text(check.status)!=='REVERSED')throw commandErrorV1('accounting-purchase-reversal-guard','تعذر عكس الفاتورة والمخزون وحساب المورد بشكل ذري. الطلب محفوظ PREPARED للمراجعة.');
  const response={success:true,purchaseId:text(purchase.purchase_id),invoiceNo:text(purchase.supplier_invoice_no),reversalRef,stockBefore:material.stock,stockAfter:material.stock-qty,supplierBalanceBefore:balanceBefore,supplierBalanceAfter:balanceBefore-remaining,version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'purchase',text(purchase.purchase_id),'reverse',auth.user.username,{reason,reversalRef,qty,total,paid,remaining,sourceDailyId});
  return response;
}

async function getParty(env,auth,b){
  if(!['full','final'].includes(auth.mode))return {success:false,message:'حسابات العملاء والموردين عند ضياء / رحمه / ريفان فقط.'};
  let type=key(b.partyType||b.type||'customer');type=type.includes('supplier')||type.includes('مورد')?'supplier':'customer';
  const party=await resolvePartyV1(env,type,b);
  const list=await rows(env,"SELECT transaction_id AS id,created_at_ms AS createdAtMs,party_id AS partyId,party_type AS partyType,party_name AS partyName,operation,operation_label AS operationLabel,amount,payment_method AS paymentMethod,ref_no AS refNo,balance_before AS balanceBefore,balance_after AS balanceAfter,created_by AS createdBy,notes,request_key AS requestId,source FROM employee_accounting_party_ledger_v1 WHERE party_type=? AND party_id=? ORDER BY created_at_ms",[type,party.partyId]);
  return {success:true,partyId:party.partyId,partyType:type,partyName:party.partyName,balance:await partyBalanceV1(env,type,party.partyId),transactions:list};
}
async function nextInvoiceNo(env){
  const r=await env.DB.prepare("UPDATE employee_accounting_control_v1 SET next_invoice_number=next_invoice_number+1,updated_at=CURRENT_TIMESTAMP WHERE singleton=1 AND marker='ENTRY614_ACCOUNTING_V1' RETURNING next_invoice_number-1 AS n").first();
  if(!r)throw new Error('تعذر حجز رقم فاتورة.');
  return 'INV-'+String(Math.trunc(num(r.n,1))).padStart(6,'0');
}
async function finalInvoice(env,auth,b){
  if(!['full','final'].includes(auth.mode))return {success:false,message:'تقفيل الفاتورة عند رحمه أو ريفان أو ضياء فقط.'};
  const orderId=text(b.orderId),requestKey=text(b.requestId||b.idempotencyKey||b.clientRequestId);
  if(!orderId)return {success:false,message:'رقم الأوردر مطلوب لتقفيل الفاتورة.'};
  if(!requestKey)return {success:false,message:'requestId مطلوب لتأمين تقفيل الفاتورة ضد التكرار.'};
  const old=await env.DB.prepare("SELECT response_json FROM employee_accounting_request_ledger_v1 WHERE request_key=? AND status='COMMITTED'").bind(requestKey).first();
  if(old)return {...parseJson(old.response_json,{}),success:true,duplicatePrevented:true,trustedByServer:true};
  let ids=parseJson(b.lineIds,[]);if(!Array.isArray(ids))ids=String(b.lineIds||'').split(/[,،]/).map(text).filter(Boolean);
  let lineRows;
  if(ids.length){
    const qs=ids.map(()=>'?').join(',');
    lineRows=await rows(env,`SELECT * FROM employee_accounting_dept_lines_v1 WHERE accounting_line_id IN (${qs}) AND order_id=? AND approval_status='معتمد من القسم' AND final_invoice_no=''`,[...ids,orderId]);
  }else lineRows=await rows(env,"SELECT * FROM employee_accounting_dept_lines_v1 WHERE order_id=? AND approval_status='معتمد من القسم' AND final_invoice_no='' ORDER BY updated_at",[orderId]);
  if(!lineRows.length)return {success:false,message:'لا توجد بنود أقسام معتمدة ومفتوحة للتقفيل النهائي.'};
  if(ids.length&&lineRows.length!==ids.length)return {success:false,message:'بعض البنود غير معتمدة أو تم تقفيلها بالفعل.'};
  const subtotal=lineRows.reduce((a,l)=>a+num(l.sale_price),0),manualAmount=Math.max(0,num(b.manualAmount||b.manualValue)),discount=Math.max(0,num(b.discount)),finalTotal=Math.max(0,subtotal+manualAmount-discount),paid=Math.max(0,num(b.paid)),remaining=Math.max(0,finalTotal-paid);
  const invoiceNo=await nextInvoiceNo(env),customerName=text(b.customerName||b.customer)||text(lineRows[0].customer_name),now=Date.now(),department=text(b.department)||'كل الأقسام';
  await env.DB.prepare("INSERT INTO employee_accounting_request_ledger_v1(request_key,operation,actor,canonical_json,entity_id,status) VALUES(?,?,?,?,?,'PREPARED')")
    .bind(requestKey,'final-invoice',auth.user.username,JSON.stringify({orderId,ids:lineRows.map(x=>x.accounting_line_id),manualAmount,discount,paid}),invoiceNo).run();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO employee_accounting_final_invoices_v1(invoice_no,request_key,order_id,customer_name,accounting_line_ids_json,manual_item,manual_amount,subtotal,discount,final_total,paid,remaining,payment_method,finance_department,status,closed_by,notes,created_at_ms) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(invoiceNo,requestKey,orderId,customerName,JSON.stringify(lineRows.map(x=>x.accounting_line_id)),text(b.manualItem),manualAmount,subtotal,discount,finalTotal,paid,remaining,text(b.paymentType||b.paymentMethod||'آجل'),department,'مغلق',auth.user.username,text(b.notes),now),
    env.DB.prepare("UPDATE employee_accounting_dept_lines_v1 SET billing_status='مسحوب للفاتورة النهائية',close_status='مغلق',final_invoice_no=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE order_id=? AND approval_status='معتمد من القسم' AND final_invoice_no=''"+(ids.length?` AND accounting_line_id IN (${ids.map(()=>'?').join(',')})`:'')).bind(invoiceNo,orderId,...(ids.length?ids:[]))
  ]);
  // Post customer invoice and receipt to the D1 party ledger with independent idempotency keys.
  const invoiceMove=await partyLedger(env,{...auth,mode:'full'},{partyType:'customer',partyName:customerName,operation:'invoice',amount:finalTotal,paymentMethod:text(b.paymentMethod),refNo:invoiceNo,notes:'فاتورة نهائية',requestId:requestKey+'-LEDGER-INVOICE',source:'Final Invoice D1'});
  let paymentMove={success:true,skipped:true};
  if(paid>0)paymentMove=await partyLedger(env,{...auth,mode:'full'},{partyType:'customer',partyName:customerName,operation:'payment_received',amount:paid,paymentMethod:text(b.paymentMethod),refNo:invoiceNo,notes:'مدفوع فاتورة نهائية',requestId:requestKey+'-LEDGER-PAYMENT',source:'Final Invoice D1'});
  const response={success:true,trustedByServer:true,invoiceNo,subtotal,finalTotal,paid,remaining,finance:{invoice:invoiceMove,payment:paymentMove},version:'ENTRY614_D1_ACCOUNTING_V1'};
  await env.DB.prepare("UPDATE employee_accounting_request_ledger_v1 SET status='COMMITTED',response_json=?,updated_at=CURRENT_TIMESTAMP WHERE request_key=?").bind(JSON.stringify(response),requestKey).run();
  await event(env,'final-invoice',invoiceNo,'close',auth.user.username,{orderId,subtotal,finalTotal,paid,remaining});
  return response;
}


function txGuardPairV1(env,requestKey,expected,actualSql,bind=[]){
  return [
    env.DB.prepare("INSERT INTO employee_accounting_tx_guard_v1(request_key,expected_count,actual_count) SELECT ?,?,("+actualSql+")").bind(requestKey,expected,...bind),
    env.DB.prepare("DELETE FROM employee_accounting_tx_guard_v1 WHERE request_key=?").bind(requestKey)
  ];
}

async function saveDeptLineA2V1(env,auth,b){
  if(!['full','print','laser'].includes(auth.mode))return {success:false,message:'إضافة بنود حسابات القسم غير مسموحة.'};
  const orderId=text(b.orderId),itemName=text(b.itemName||b.name),qty=Math.max(num(b.qty||b.quantity,1),0.000001);
  let department=text(b.department)||auth.department;if(auth.mode==='print')department='طباعة';if(auth.mode==='laser')department='ليزر';
  if(!orderId||!department||!itemName)return {success:false,message:'رقم الأوردر والقسم واسم البند مطلوبون.'};
  const id=text(b.accountingLineId||b.id||b.lineId)||text(b.requestId)||uid('ACC'),workDate=workDateKeyV1(b.workDate||b.date);
  const existing=await env.DB.prepare("SELECT version,approval_status AS approvalStatus,final_invoice_no AS invoiceNo FROM employee_accounting_dept_lines_v1 WHERE accounting_line_id=?").bind(id).first();
  if(existing&&(text(existing.invoiceNo)||text(existing.approvalStatus)==='معتمد من القسم'))return {success:false,message:'لا يمكن تعديل بند تم اعتماده أو سحبه لفاتورة نهائية.'};
  const materialName=text(b.materialName),materialConsumption=num(b.materialConsumption||b.consumption||b.consumedAreaTotal);
  const materialCost=num(b.materialCost)||materialConsumption*await materialCost(env,materialName);
  const operating=num(b.operatingCost),other=num(b.otherCost),total=num(b.totalCost,materialCost+operating+other),sale=num(b.salePrice||b.lineTotal||b.systemSalePrice),profit=sale-total;
  const ctx=await beginCommandV1(env,auth,'dept-line-upsert',{...b,accountingLineId:id,department,workDate});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  if(existing){
    const r=await env.DB.prepare("UPDATE employee_accounting_dept_lines_v1 SET order_id=?,line_id=?,customer_name=?,department=?,item_type=?,item_name=?,qty=?,material_name=?,material_consumption=?,material_cost=?,operating_cost=?,other_cost=?,total_cost=?,system_cost=?,system_sale_price=?,sale_price=?,profit=?,billing_status=?,notes=?,raw_json=?,updated_by=?,work_date=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE accounting_line_id=? AND version=? AND final_invoice_no='' AND approval_status<>'معتمد من القسم' RETURNING version")
      .bind(orderId,text(b.lineId),text(b.customerName),department,text(b.itemType),itemName,qty,materialName,materialConsumption,materialCost,operating,other,total,num(b.systemCost,total),num(b.systemSalePrice,sale),sale,profit,text(b.billingStatus||'مسجل - قيد مراجعة القسم'),text(b.notes),JSON.stringify(b),auth.user.username,workDate,id,Math.max(1,Math.trunc(num(existing.version,1)))).first();
    if(!r)throw commandErrorV1('accounting-dept-line-version-conflict','تم تعديل بند القسم بالتزامن. حدّث البيانات ثم أعد المحاولة.');
  }else{
    await env.DB.prepare("INSERT INTO employee_accounting_dept_lines_v1(accounting_line_id,order_id,line_id,customer_name,department,item_type,item_name,qty,material_name,material_consumption,material_cost,operating_cost,other_cost,total_cost,system_cost,system_sale_price,sale_price,profit,billing_status,notes,raw_json,updated_by,version,work_date) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)")
      .bind(id,orderId,text(b.lineId),text(b.customerName),department,text(b.itemType),itemName,qty,materialName,materialConsumption,materialCost,operating,other,total,num(b.systemCost,total),num(b.systemSalePrice,sale),sale,profit,text(b.billingStatus||'مسجل - قيد مراجعة القسم'),text(b.notes),JSON.stringify(b),auth.user.username,workDate).run();
  }
  const response={success:true,id,lineId:id,updated:!!existing,totalCost:total,salePrice:sale,profit,workDate,version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'dept-line',id,existing?'update':'create',auth.user.username,{orderId,department,workDate,totalCost:total,salePrice:sale});
  return response;
}

async function approveDeptA2V1(env,auth,b){
  if(!['full','print','laser'].includes(auth.mode))return {success:false,message:'اعتماد فاتورة القسم متاح للقسم نفسه أو لضياء فقط.'};
  const orderId=text(b.orderId);let department=text(b.department)||auth.department;if(auth.mode==='print')department='طباعة';if(auth.mode==='laser')department='ليزر';
  if(!orderId||!department)return {success:false,message:'رقم الأوردر والقسم مطلوبين للاعتماد.'};
  if(auth.mode==='print'&&department!=='طباعة')return {success:false,message:'وائل يعتمد قسم الطباعة فقط.'};
  if(auth.mode==='laser'&&department!=='ليزر')return {success:false,message:'جابر يعتمد قسم الليزر فقط.'};
  const candidates=await rows(env,"SELECT * FROM employee_accounting_dept_lines_v1 WHERE order_id=? AND department=? AND final_invoice_no='' AND approval_status<>'معتمد من القسم' ORDER BY updated_at",[orderId,department]);
  if(!candidates.length)return {success:false,message:'لا توجد بنود جديدة غير معتمدة لهذا الأوردر في هذا القسم.'};
  const req=await stockRequirements(env,candidates);
  for(const {material,qty} of req.values())if(num(material.stock_qty)+1e-6<qty)return {success:false,message:'لا يمكن الاعتماد؛ ناقص '+text(material.material_name)+': مطلوب '+qty.toFixed(4)+' والمتاح '+num(material.stock_qty).toFixed(4)};
  const ctx=await beginCommandV1(env,auth,'dept-approval',{...b,orderId,department,lineIds:candidates.map(x=>x.accounting_line_id)});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  const batchId=uid('DAPP'),now=Date.now(),statements=[];
  for(const {material,qty} of req.values()){
    const before=num(material.stock_qty),version=Math.max(1,Math.trunc(num(material.version,1))),after=before-qty,move=uid('STK');
    statements.push(env.DB.prepare("UPDATE employee_accounting_materials_v1 SET stock_qty=stock_qty-?,version=version+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE material_id=? AND version=? AND stock_qty>=?").bind(qty,auth.user.username,material.material_id,version,qty));
    statements.push(env.DB.prepare("INSERT INTO employee_accounting_stock_moves_v1(stock_move_id,material_id,move_type,order_id,department,qty_out,balance_before,balance_after,actor,notes,request_key,created_at_ms) SELECT ?,?,'صرف تلقائي من فاتورة قسم',?,?,?,?,?,?,?,?,? FROM employee_accounting_materials_v1 WHERE material_id=? AND version=?").bind(move,material.material_id,orderId,department,qty,before,after,auth.user.username,text(b.notes),ctx.requestKey,now,material.material_id,version+1));
  }
  const stockCount=req.size;
  for(const line of candidates){
    statements.push(env.DB.prepare("UPDATE employee_accounting_dept_lines_v1 SET billing_status='معتمد من القسم',approval_status='معتمد من القسم',approved_by=?,approved_at_ms=?,approval_batch_id=?,approval_notes=?,stock_deducted=1,stock_deducted_at_ms=?,close_status='معتمد من القسم',version=version+1,updated_at=CURRENT_TIMESTAMP WHERE accounting_line_id=? AND version=? AND final_invoice_no='' AND approval_status<>'معتمد من القسم' AND (SELECT COUNT(*) FROM employee_accounting_stock_moves_v1 WHERE request_key=?)=?")
      .bind(auth.user.username,now,batchId,text(b.notes),now,line.accounting_line_id,Math.max(1,Math.trunc(num(line.version,1))),ctx.requestKey,stockCount));
  }
  const guardSql="(SELECT COUNT(*) FROM employee_accounting_stock_moves_v1 WHERE request_key=?)+(SELECT COUNT(*) FROM employee_accounting_dept_lines_v1 WHERE approval_batch_id=?)";
  statements.push(...txGuardPairV1(env,ctx.requestKey+'-GUARD',stockCount+candidates.length,guardSql,[ctx.requestKey,batchId]));
  await env.DB.batch(statements);
  const total=candidates.reduce((a,l)=>a+num(l.sale_price),0);
  const response={success:true,message:'تم اعتماد فاتورة قسم '+department+' للأوردر '+orderId+' وخصم المخزون مرة واحدة بعدد '+candidates.length+' بند.',count:candidates.length,total,batchId,stockDeducted:true,version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'dept-approval',batchId,'approve',auth.user.username,{orderId,department,count:candidates.length,total,stockMaterialCount:stockCount});
  return response;
}


async function directSaleStockRequirementsV1(env,itemName,department,qty){
  const req=new Map(),name=text(itemName);
  if(!name||!(qty>0))return req;
  let template=await env.DB.prepare("SELECT template_id,department,item_name,material_name,components_json FROM employee_accounting_templates_v1 WHERE item_name=? AND active=1 AND (?='' OR department IN (?,'مشترك','')) ORDER BY CASE WHEN department=? THEN 0 WHEN department='مشترك' THEN 1 ELSE 2 END,updated_at DESC LIMIT 1").bind(name,department,department,department).first();
  if(template){
    const comps=componentRowsV1(template.components_json),lines=[];
    for(const c of comps){
      let materialName=c.materialName;
      if(!materialName&&c.materialId){
        const mr=await env.DB.prepare("SELECT material_name AS materialName FROM employee_accounting_materials_v1 WHERE material_id=? AND active=1").bind(c.materialId).first();
        materialName=text(mr&&mr.materialName);
      }
      if(materialName&&c.qty>0)lines.push({material_name:materialName,material_consumption:c.qty*qty});
    }
    if(lines.length)return await stockRequirements(env,lines);
    if(text(template.material_name))return await stockRequirements(env,[{material_name:text(template.material_name),material_consumption:qty}]);
    return req;
  }
  const material=await env.DB.prepare("SELECT material_name FROM employee_accounting_materials_v1 WHERE material_name=? AND active=1 AND (?='' OR department IN (?,'مشترك','')) ORDER BY CASE WHEN department=? THEN 0 WHEN department='مشترك' THEN 1 ELSE 2 END,updated_at DESC LIMIT 1").bind(name,department,department,department).first();
  if(material)return await stockRequirements(env,[{material_name:text(material.material_name),material_consumption:qty}]);
  return req;
}

async function saveEasyStoreSaleV2A2(env,auth,b){
  if(!['full','final'].includes(auth.mode))return {success:false,message:'حفظ فاتورة المبيعات الرسمية عند ضياء أو رحمه أو ريفان فقط.'};
  const qty=num(b.qty),unit=num(b.unit||b.unitPrice),discount=Math.max(0,num(b.discount)),computedTotal=Math.max(0,qty*unit-discount),total=num(b.total,computedTotal),paid=Math.max(0,num(b.paid));
  if(!(qty>0)||!(total>0))return {success:false,message:'الكمية والإجمالي يجب أن يكونا أكبر من صفر.'};
  if(paid>total+0.000001)return {success:false,message:'المدفوع لا يمكن أن يزيد عن إجمالي الفاتورة.'};
  const remaining=Math.max(0,total-paid),customer=await resolvePartyV1(env,'customer',{customerId:b.customerId,customerName:b.customer||b.customerName});
  const department=accountingDepartmentV1(b.department)||text(b.department)||'كل الأقسام',item=text(b.item||b.itemName)||'بند مطبعجي',workDate=workDateKeyV1(b.workDate||b.date);
  const invoiceNo=text(b.no||b.invoiceNo)||await nextInvoiceNo(env);
  const duplicate=await env.DB.prepare("SELECT invoice_no FROM employee_accounting_final_invoices_v1 WHERE invoice_no=? LIMIT 1").bind(invoiceNo).first();
  if(duplicate)return {success:false,duplicatePrevented:true,message:'رقم فاتورة المبيعات مستخدم بالفعل: '+invoiceNo};
  const req=await directSaleStockRequirementsV1(env,item,department==='كل الأقسام'?'':department,qty);
  let manualCost=0;
  for(const {material,qty:need} of req.values()){
    if(num(material.stock_qty)+0.000001<need)return {success:false,message:'لا يمكن حفظ البيع بسبب نقص المخزون: '+text(material.material_name)};
    manualCost+=need*num(material.computed_unit_cost||material.unit_cost);
  }
  manualCost=Number(manualCost.toFixed(6));
  await env.DB.prepare("INSERT OR IGNORE INTO employee_accounting_party_balances_v1(party_type,party_id,party_name,balance,version,last_request_key,updated_at_ms) VALUES('customer',?,?,0,1,'',?)").bind(customer.partyId,customer.partyName,Date.now()).run();
  const bal=await env.DB.prepare("SELECT balance,version FROM employee_accounting_party_balances_v1 WHERE party_type='customer' AND party_id=?").bind(customer.partyId).first();
  const balanceBefore=num(bal&&bal.balance),balanceVersion=Math.max(1,Math.trunc(num(bal&&bal.version,1)));
  const ctx=await beginCommandV1(env,auth,'direct-sale',{...b,invoiceNo,customerId:customer.partyId,customerName:customer.partyName,department,item,workDate,total,paid,remaining,manualCost});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  const now=Date.now(),statements=[],stockCount=req.size;
  for(const {material,qty:need} of req.values()){
    const before=num(material.stock_qty),version=Math.max(1,Math.trunc(num(material.version,1))),after=before-need,move=uid('STK');
    statements.push(env.DB.prepare("UPDATE employee_accounting_materials_v1 SET stock_qty=stock_qty-?,version=version+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE material_id=? AND version=? AND stock_qty>=?").bind(need,auth.user.username,material.material_id,version,need));
    statements.push(env.DB.prepare("INSERT INTO employee_accounting_stock_moves_v1(stock_move_id,material_id,move_type,department,item_name,qty_in,qty_out,balance_before,balance_after,actor,notes,request_key,created_at_ms) SELECT ?,?,'بيع مباشر',?,?,0,?,?,?,?,?,?,? FROM employee_accounting_materials_v1 WHERE material_id=? AND version=?").bind(move,material.material_id,department,item,need,before,after,auth.user.username,text(b.notes),ctx.requestKey,now,material.material_id,version+1));
  }
  statements.push(env.DB.prepare("INSERT INTO employee_accounting_final_invoices_v1(invoice_no,request_key,order_id,customer_name,customer_party_id,accounting_line_ids_json,manual_item,manual_amount,manual_cost,subtotal,discount,final_total,paid,remaining,payment_method,finance_department,status,closed_by,notes,created_at_ms,work_date,version) SELECT ?,?,? ,?,?, '[]',?,?,?,?,?,?,?,?,?,?, 'CLOSED',?,?,?,?,1 WHERE (SELECT COUNT(*) FROM employee_accounting_stock_moves_v1 WHERE request_key=?)=?")
    .bind(invoiceNo,ctx.requestKey,text(b.orderId),customer.partyName,customer.partyId,item,total,manualCost,total+discount,discount,total,paid,remaining,text(b.paymentType||b.paymentMethod||'نقدي'),department,auth.user.username,text(b.notes),now,workDate,ctx.requestKey,stockCount));
  statements.push(env.DB.prepare("UPDATE employee_accounting_party_balances_v1 SET balance=balance+?,version=version+1,last_request_key=?,party_name=?,updated_at_ms=?,updated_at=CURRENT_TIMESTAMP WHERE party_type='customer' AND party_id=? AND version=? AND EXISTS(SELECT 1 FROM employee_accounting_final_invoices_v1 WHERE invoice_no=? AND request_key=?)").bind(remaining,ctx.requestKey,customer.partyName,now,customer.partyId,balanceVersion,invoiceNo,ctx.requestKey));
  statements.push(env.DB.prepare("INSERT INTO employee_accounting_party_ledger_v1(transaction_id,request_key,party_id,party_type,party_name,operation,operation_label,amount,effect,payment_method,ref_no,balance_before,balance_after,created_by,notes,source,created_at_ms) SELECT ?,?,?,'customer',?,'invoice','باقي فاتورة عميل',?,1,?,?,?,?,?,?,?,? FROM employee_accounting_final_invoices_v1 WHERE invoice_no=? AND EXISTS(SELECT 1 FROM employee_accounting_party_balances_v1 WHERE party_type='customer' AND party_id=? AND last_request_key=? AND version=?)")
    .bind(uid('LED'),ctx.requestKey+'-LEDGER-INVOICE',customer.partyId,customer.partyName,total,text(b.paymentType||b.paymentMethod),invoiceNo,balanceBefore,balanceBefore+total,auth.user.username,text(b.notes),sourceSystemV1(b),now,invoiceNo,customer.partyId,ctx.requestKey,balanceVersion+1));
  if(paid>0){
    statements.push(env.DB.prepare("INSERT INTO employee_accounting_party_ledger_v1(transaction_id,request_key,party_id,party_type,party_name,operation,operation_label,amount,effect,payment_method,ref_no,balance_before,balance_after,created_by,notes,source,created_at_ms) SELECT ?,?,?,'customer',?,'payment_received','سداد من العميل',?,-1,?,?,?,?,?,?,?,? FROM employee_accounting_final_invoices_v1 WHERE invoice_no=? AND EXISTS(SELECT 1 FROM employee_accounting_party_balances_v1 WHERE party_type='customer' AND party_id=? AND last_request_key=? AND version=?)")
      .bind(uid('LED'),ctx.requestKey+'-LEDGER-PAYMENT',customer.partyId,customer.partyName,paid,text(b.paymentType||b.paymentMethod),invoiceNo,balanceBefore+total,balanceBefore+remaining,auth.user.username,text(b.notes),sourceSystemV1(b),now,invoiceNo,customer.partyId,ctx.requestKey,balanceVersion+1));
    statements.push(env.DB.prepare("INSERT INTO employee_accounting_cashbox_v1(cashbox_tx_id,request_key,work_date,movement_type,party_id,party_name,department,amount,payment_method,ref_no,source,notes,actor,created_at_ms) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,? FROM employee_accounting_final_invoices_v1 WHERE invoice_no=?").bind(uid('CSH'),ctx.requestKey+'-CASH',workDate,'CUSTOMER_RECEIPT',customer.partyId,customer.partyName,department,paid,text(b.paymentType||b.paymentMethod),invoiceNo,sourceSystemV1(b),text(b.notes),auth.user.username,now,invoiceNo));
  }
  const ledgerExpected=1+(paid>0?1:0),cashExpected=paid>0?1:0;
  let actualSql="(SELECT COUNT(*) FROM employee_accounting_stock_moves_v1 WHERE request_key=?)+(SELECT COUNT(*) FROM employee_accounting_final_invoices_v1 WHERE invoice_no=? AND request_key=?)+(SELECT COUNT(*) FROM employee_accounting_party_balances_v1 WHERE party_type='customer' AND party_id=? AND last_request_key=?)+(SELECT COUNT(*) FROM employee_accounting_party_ledger_v1 WHERE request_key IN (?,?))";
  const guardBind=[ctx.requestKey,invoiceNo,ctx.requestKey,customer.partyId,ctx.requestKey,ctx.requestKey+'-LEDGER-INVOICE',ctx.requestKey+'-LEDGER-PAYMENT'];
  if(cashExpected){actualSql+=" +(SELECT COUNT(*) FROM employee_accounting_cashbox_v1 WHERE request_key=?)";guardBind.push(ctx.requestKey+'-CASH');}
  statements.push(...txGuardPairV1(env,ctx.requestKey+'-GUARD',stockCount+1+1+ledgerExpected+cashExpected,actualSql,guardBind));
  await env.DB.batch(statements);
  const written=await env.DB.prepare("SELECT invoice_no AS invoiceNo,final_total AS finalTotal,paid,remaining,manual_cost AS manualCost FROM employee_accounting_final_invoices_v1 WHERE request_key=?").bind(ctx.requestKey).first();
  if(!written)throw commandErrorV1('accounting-direct-sale-guard','تعذر تثبيت فاتورة البيع والمخزون والحساب بشكل ذري. الطلب محفوظ PREPARED للمراجعة.');
  const response={success:true,invoiceNo:text(written.invoiceNo),department,finalTotal:num(written.finalTotal),paid:num(written.paid),remaining:num(written.remaining),manualCost:num(written.manualCost),stockMaterialCount:stockCount,version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'direct-sale',invoiceNo,'post',auth.user.username,{customerId:customer.partyId,department,item,qty,total,paid,remaining,manualCost,stockMaterialCount:stockCount});
  return response;
}

async function finalInvoiceA2V1(env,auth,b){
  if(!['full','final'].includes(auth.mode))return {success:false,message:'تقفيل الفاتورة عند رحمه أو ريفان أو ضياء فقط.'};
  const orderId=text(b.orderId);if(!orderId)return {success:false,message:'رقم الأوردر مطلوب لتقفيل الفاتورة.'};
  let ids=parseJson(b.lineIds,[]);if(!Array.isArray(ids))ids=String(b.lineIds||'').split(/[,،]/).map(text).filter(Boolean);
  let lineRows;
  if(ids.length){
    const qs=ids.map(()=>'?').join(',');
    lineRows=await rows(env,"SELECT * FROM employee_accounting_dept_lines_v1 WHERE accounting_line_id IN ("+qs+") AND order_id=? AND approval_status='معتمد من القسم' AND final_invoice_no='' ORDER BY accounting_line_id",[...ids,orderId]);
  }else lineRows=await rows(env,"SELECT * FROM employee_accounting_dept_lines_v1 WHERE order_id=? AND approval_status='معتمد من القسم' AND final_invoice_no='' ORDER BY accounting_line_id",[orderId]);
  if(!lineRows.length)return {success:false,message:'لا توجد بنود أقسام معتمدة ومفتوحة للتقفيل النهائي.'};
  if(ids.length&&lineRows.length!==ids.length)return {success:false,message:'بعض البنود غير معتمدة أو تم تقفيلها بالفعل.'};
  ids=lineRows.map(x=>text(x.accounting_line_id));
  const subtotal=lineRows.reduce((a,l)=>a+num(l.sale_price),0),manualAmount=Math.max(0,num(b.manualAmount||b.manualValue)),discount=Math.max(0,num(b.discount)),finalTotal=Math.max(0,subtotal+manualAmount-discount),paid=Math.max(0,num(b.paid));
  if(!(finalTotal>0))return {success:false,message:'إجمالي الفاتورة يجب أن يكون أكبر من صفر.'};
  if(paid>finalTotal+0.000001)return {success:false,message:'المدفوع لا يمكن أن يزيد عن إجمالي الفاتورة.'};
  const remaining=Math.max(0,finalTotal-paid),customer=await resolvePartyV1(env,'customer',{customerId:b.customerId,customerName:b.customerName||b.customer});
  const workDate=workDateKeyV1(b.workDate||b.date),department=accountingDepartmentV1(b.department)||text(b.department)||'كل الأقسام';
  const heldPayment=Math.max(0,num(b.heldPayment)),heldFrom=text(b.heldPaymentFromInvoiceNo||b.replacesInvoiceNo);
  if(heldPayment>paid+0.000001)return {success:false,message:'المدفوع المحفوظ لا يمكن أن يزيد عن المدفوع في الفاتورة الجديدة.'};
  let heldSource=null;
  if(heldPayment>0){
    if(!heldFrom)return {success:false,message:'حدد الفاتورة القديمة التي تحمل المدفوع المحفوظ.'};
    heldSource=await env.DB.prepare("SELECT invoice_no,customer_party_id,customer_name,held_paid,replacement_invoice_no,status,version FROM employee_accounting_final_invoices_v1 WHERE invoice_no=?").bind(heldFrom).first();
    if(!heldSource||text(heldSource.status)!=='UNDER_REVIEW'||text(heldSource.replacement_invoice_no)||Math.abs(num(heldSource.held_paid)-heldPayment)>0.000001)return {success:false,message:'المدفوع المحفوظ غير متاح أو استُخدم من قبل.'};
    if(text(heldSource.customer_party_id)&&text(heldSource.customer_party_id)!==customer.partyId)return {success:false,message:'المدفوع المحفوظ يخص عميلًا مختلفًا.'};
  }
  await env.DB.prepare("INSERT OR IGNORE INTO employee_accounting_party_balances_v1(party_type,party_id,party_name,balance,version,last_request_key,updated_at_ms) VALUES('customer',?,?,0,1,'',?)").bind(customer.partyId,customer.partyName,Date.now()).run();
  const balanceRow=await env.DB.prepare("SELECT balance,version FROM employee_accounting_party_balances_v1 WHERE party_type='customer' AND party_id=?").bind(customer.partyId).first();
  const balanceBefore=num(balanceRow&&balanceRow.balance),balanceVersion=Math.max(1,Math.trunc(num(balanceRow&&balanceRow.version,1)));
  const ctx=await beginCommandV1(env,auth,'final-invoice',{...b,orderId,lineIds:ids,customerId:customer.partyId,customerName:customer.partyName,workDate,finalTotal,paid,remaining,heldPayment,heldFrom});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true,trustedByServer:true};
  const invoiceNo=await nextInvoiceNo(env),now=Date.now(),newCash=Math.max(0,paid-heldPayment),statements=[];
  const qs=ids.map(()=>'?').join(',');
  let insertSql="INSERT INTO employee_accounting_final_invoices_v1(invoice_no,request_key,order_id,customer_name,customer_party_id,accounting_line_ids_json,manual_item,manual_amount,subtotal,discount,final_total,paid,remaining,payment_method,finance_department,status,closed_by,notes,created_at_ms,work_date,version) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'CLOSED',?,?,?,?,?,1 WHERE (SELECT COUNT(*) FROM employee_accounting_dept_lines_v1 WHERE accounting_line_id IN ("+qs+") AND order_id=? AND approval_status='معتمد من القسم' AND final_invoice_no='')=?";
  const insertBind=[invoiceNo,ctx.requestKey,orderId,customer.partyName,customer.partyId,JSON.stringify(ids),text(b.manualItem||b.manualDescription),manualAmount,subtotal,discount,finalTotal,paid,remaining,text(b.paymentType||b.paymentMethod||'آجل'),department,auth.user.username,text(b.notes),now,workDate,...ids,orderId,ids.length];
  if(heldPayment>0){insertSql+=" AND EXISTS(SELECT 1 FROM employee_accounting_final_invoices_v1 WHERE invoice_no=? AND status='UNDER_REVIEW' AND replacement_invoice_no='' AND held_paid=? AND (customer_party_id='' OR customer_party_id=?))";insertBind.push(heldFrom,heldPayment,customer.partyId);}
  statements.push(env.DB.prepare(insertSql).bind(...insertBind));
  statements.push(env.DB.prepare("UPDATE employee_accounting_party_balances_v1 SET balance=balance+?,version=version+1,last_request_key=?,party_name=?,updated_at_ms=?,updated_at=CURRENT_TIMESTAMP WHERE party_type='customer' AND party_id=? AND version=? AND EXISTS(SELECT 1 FROM employee_accounting_final_invoices_v1 WHERE invoice_no=? AND request_key=?)").bind(remaining,ctx.requestKey,customer.partyName,now,customer.partyId,balanceVersion,invoiceNo,ctx.requestKey));
  statements.push(env.DB.prepare("INSERT INTO employee_accounting_party_ledger_v1(transaction_id,request_key,party_id,party_type,party_name,operation,operation_label,amount,effect,payment_method,ref_no,balance_before,balance_after,created_by,notes,source,created_at_ms) SELECT ?,?,?,'customer',?,'invoice','باقي فاتورة عميل',?,1,?,?,?,?,?,?,?,? FROM employee_accounting_final_invoices_v1 WHERE invoice_no=? AND EXISTS(SELECT 1 FROM employee_accounting_party_balances_v1 WHERE party_type='customer' AND party_id=? AND last_request_key=? AND version=?)")
    .bind(uid('LED'),ctx.requestKey+'-LEDGER-INVOICE',customer.partyId,customer.partyName,finalTotal,text(b.paymentType||b.paymentMethod),invoiceNo,balanceBefore,balanceBefore+finalTotal,auth.user.username,text(b.notes),sourceSystemV1(b),now,invoiceNo,customer.partyId,ctx.requestKey,balanceVersion+1));
  if(paid>0)statements.push(env.DB.prepare("INSERT INTO employee_accounting_party_ledger_v1(transaction_id,request_key,party_id,party_type,party_name,operation,operation_label,amount,effect,payment_method,ref_no,balance_before,balance_after,created_by,notes,source,created_at_ms) SELECT ?,?,?,'customer',?,'payment_received','سداد من العميل',?,-1,?,?,?,?,?,?,?,? FROM employee_accounting_final_invoices_v1 WHERE invoice_no=? AND EXISTS(SELECT 1 FROM employee_accounting_party_balances_v1 WHERE party_type='customer' AND party_id=? AND last_request_key=? AND version=?)")
    .bind(uid('LED'),ctx.requestKey+'-LEDGER-PAYMENT',customer.partyId,customer.partyName,paid,text(b.paymentType||b.paymentMethod),invoiceNo,balanceBefore+finalTotal,balanceBefore+remaining,auth.user.username,text(b.notes),sourceSystemV1(b),now,invoiceNo,customer.partyId,ctx.requestKey,balanceVersion+1));
  if(newCash>0)statements.push(env.DB.prepare("INSERT INTO employee_accounting_cashbox_v1(cashbox_tx_id,request_key,work_date,movement_type,party_id,party_name,department,amount,payment_method,ref_no,source,notes,actor,created_at_ms) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,? FROM employee_accounting_final_invoices_v1 WHERE invoice_no=?").bind(uid('CSH'),ctx.requestKey+'-CASH',workDate,'CUSTOMER_RECEIPT',customer.partyId,customer.partyName,department,newCash,text(b.paymentType||b.paymentMethod),invoiceNo,sourceSystemV1(b),text(b.notes),auth.user.username,now,invoiceNo));
  if(heldPayment>0)statements.push(env.DB.prepare("UPDATE employee_accounting_final_invoices_v1 SET replacement_invoice_no=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE invoice_no=? AND status='UNDER_REVIEW' AND replacement_invoice_no='' AND held_paid=? AND version=? AND EXISTS(SELECT 1 FROM employee_accounting_final_invoices_v1 n WHERE n.invoice_no=?)").bind(invoiceNo,heldFrom,heldPayment,Math.max(1,Math.trunc(num(heldSource.version,1))),invoiceNo));
  for(const line of lineRows)statements.push(env.DB.prepare("UPDATE employee_accounting_dept_lines_v1 SET billing_status='مسحوب للفاتورة النهائية',close_status='مغلق',final_invoice_no=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE accounting_line_id=? AND version=? AND approval_status='معتمد من القسم' AND final_invoice_no='' AND EXISTS(SELECT 1 FROM employee_accounting_final_invoices_v1 WHERE invoice_no=?)").bind(invoiceNo,line.accounting_line_id,Math.max(1,Math.trunc(num(line.version,1))),invoiceNo));
  const ledgerExpected=1+(paid>0?1:0),cashExpected=newCash>0?1:0,heldExpected=heldPayment>0?1:0;
  let actualSql="(SELECT COUNT(*) FROM employee_accounting_final_invoices_v1 WHERE invoice_no=? AND request_key=?)+(SELECT COUNT(*) FROM employee_accounting_party_balances_v1 WHERE party_type='customer' AND party_id=? AND last_request_key=?)+(SELECT COUNT(*) FROM employee_accounting_party_ledger_v1 WHERE request_key IN (?,?))+(SELECT COUNT(*) FROM employee_accounting_dept_lines_v1 WHERE final_invoice_no=?)";
  const guardBind=[invoiceNo,ctx.requestKey,customer.partyId,ctx.requestKey,ctx.requestKey+'-LEDGER-INVOICE',ctx.requestKey+'-LEDGER-PAYMENT',invoiceNo];
  if(cashExpected){actualSql+=" +(SELECT COUNT(*) FROM employee_accounting_cashbox_v1 WHERE request_key=?)";guardBind.push(ctx.requestKey+'-CASH');}
  if(heldExpected){actualSql+=" +(SELECT COUNT(*) FROM employee_accounting_final_invoices_v1 WHERE invoice_no=? AND replacement_invoice_no=?)";guardBind.push(heldFrom,invoiceNo);}
  statements.push(...txGuardPairV1(env,ctx.requestKey+'-GUARD',1+1+ledgerExpected+ids.length+cashExpected+heldExpected,actualSql,guardBind));
  await env.DB.batch(statements);
  const written=await env.DB.prepare("SELECT invoice_no AS invoiceNo,subtotal,final_total AS finalTotal,paid,remaining FROM employee_accounting_final_invoices_v1 WHERE request_key=?").bind(ctx.requestKey).first();
  if(!written)throw commandErrorV1('accounting-final-invoice-guard','تعذر تقفيل الفاتورة بشكل ذري. الطلب محفوظ PREPARED للمراجعة.');
  const response={success:true,trustedByServer:true,invoiceNo:text(written.invoiceNo),subtotal:num(written.subtotal),finalTotal:num(written.finalTotal),paid:num(written.paid),remaining:num(written.remaining),lineCount:ids.length,heldPaymentUsed:heldPayment,newCashReceipt:newCash,version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'final-invoice',invoiceNo,'close',auth.user.username,{orderId,customerId:customer.partyId,subtotal,finalTotal,paid,remaining,heldPayment,newCash,lineCount:ids.length});
  return response;
}

async function reopenAccountingFinalInvoiceV1(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'إرجاع الفاتورة للمراجعة متاح لضياء فقط.'};
  const invoiceNo=text(b.invoiceNo||b.no),reason=text(b.reason);
  if(!invoiceNo)return {success:false,message:'رقم الفاتورة مطلوب لإرجاعها للمراجعة.'};
  if(!reason)return {success:false,message:'سبب إرجاع الفاتورة للمراجعة مطلوب.'};
  const inv=await env.DB.prepare("SELECT * FROM employee_accounting_final_invoices_v1 WHERE invoice_no=?").bind(invoiceNo).first();
  if(!inv)return {success:false,message:'لم يتم العثور على الفاتورة '+invoiceNo};
  if(text(inv.status)==='UNDER_REVIEW')return {success:true,duplicatePrevented:true,invoiceNo,heldPayment:num(inv.held_paid),message:'الفاتورة تحت المراجعة بالفعل.',version:'A2_D1_ACCOUNTING_V1'};
  if(text(inv.replacement_invoice_no))return {success:false,message:'لا يمكن إرجاع فاتورة مرتبطة بالفعل بفاتورة بديلة.'};
  const customer=await resolvePartyV1(env,'customer',{customerId:inv.customer_party_id,customerName:inv.customer_name});
  await env.DB.prepare("INSERT OR IGNORE INTO employee_accounting_party_balances_v1(party_type,party_id,party_name,balance,version,last_request_key,updated_at_ms) VALUES('customer',?,?,0,1,'',?)").bind(customer.partyId,customer.partyName,Date.now()).run();
  const bal=await env.DB.prepare("SELECT balance,version FROM employee_accounting_party_balances_v1 WHERE party_type='customer' AND party_id=?").bind(customer.partyId).first();
  const balanceBefore=num(bal&&bal.balance),balanceVersion=Math.max(1,Math.trunc(num(bal&&bal.version,1))),remaining=num(inv.remaining),paid=num(inv.paid),finalTotal=num(inv.final_total);
  if(balanceBefore+0.000001<remaining)return {success:false,message:'لا يمكن عكس الفاتورة لأن رصيد العميل الحالي أقل من المتبقي المرتبط بها. راجع الحركات اللاحقة أولًا.'};
  const lineRows=await rows(env,"SELECT accounting_line_id,version FROM employee_accounting_dept_lines_v1 WHERE final_invoice_no=? ORDER BY accounting_line_id",[invoiceNo]);
  const ctx=await beginCommandV1(env,auth,'final-invoice-reopen',{...b,invoiceNo,customerId:customer.partyId,remaining,paid,finalTotal,lineIds:lineRows.map(x=>x.accounting_line_id)});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  const now=Date.now(),reversalRef='REV-'+crypto.randomUUID().replace(/-/g,'').slice(0,8).toUpperCase(),statements=[];
  statements.push(env.DB.prepare("UPDATE employee_accounting_party_balances_v1 SET balance=balance-?,version=version+1,last_request_key=?,party_name=?,updated_at_ms=?,updated_at=CURRENT_TIMESTAMP WHERE party_type='customer' AND party_id=? AND version=? AND balance>=?").bind(remaining,ctx.requestKey,customer.partyName,now,customer.partyId,balanceVersion,remaining));
  statements.push(env.DB.prepare("UPDATE employee_accounting_final_invoices_v1 SET status='UNDER_REVIEW',held_paid=?,reversed_at_ms=?,reversed_by=?,reversal_reason=?,reversal_ref=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE invoice_no=? AND version=? AND replacement_invoice_no='' AND EXISTS(SELECT 1 FROM employee_accounting_party_balances_v1 WHERE party_type='customer' AND party_id=? AND last_request_key=? AND version=?)").bind(paid,now,auth.user.username,reason,reversalRef,invoiceNo,Math.max(1,Math.trunc(num(inv.version,1))),customer.partyId,ctx.requestKey,balanceVersion+1));
  for(const line of lineRows)statements.push(env.DB.prepare("UPDATE employee_accounting_dept_lines_v1 SET billing_status='معتمد من القسم',close_status='معتمد من القسم',final_invoice_no='',version=version+1,updated_at=CURRENT_TIMESTAMP WHERE accounting_line_id=? AND version=? AND final_invoice_no=? AND EXISTS(SELECT 1 FROM employee_accounting_final_invoices_v1 WHERE invoice_no=? AND status='UNDER_REVIEW')").bind(line.accounting_line_id,Math.max(1,Math.trunc(num(line.version,1))),invoiceNo,invoiceNo));
  if(paid>0)statements.push(env.DB.prepare("INSERT INTO employee_accounting_party_ledger_v1(transaction_id,request_key,party_id,party_type,party_name,operation,operation_label,amount,effect,payment_method,ref_no,balance_before,balance_after,created_by,notes,source,created_at_ms) SELECT ?,?,?,'customer',?,'adjustment_increase','عكس مدفوع للمراجعة',?,1,?,?,?,?,?,?,?,? FROM employee_accounting_final_invoices_v1 WHERE invoice_no=? AND status='UNDER_REVIEW'").bind(uid('LED'),ctx.requestKey+'-LEDGER-PAYMENT-REV',customer.partyId,customer.partyName,paid,text(inv.payment_method),invoiceNo,balanceBefore,balanceBefore+paid,auth.user.username,reason,sourceSystemV1(b),now,invoiceNo));
  statements.push(env.DB.prepare("INSERT INTO employee_accounting_party_ledger_v1(transaction_id,request_key,party_id,party_type,party_name,operation,operation_label,amount,effect,payment_method,ref_no,balance_before,balance_after,created_by,notes,source,created_at_ms) SELECT ?,?,?,'customer',?,'adjustment_decrease','عكس فاتورة للمراجعة',?,-1,?,?,?,?,?,?,?,? FROM employee_accounting_final_invoices_v1 WHERE invoice_no=? AND status='UNDER_REVIEW'").bind(uid('LED'),ctx.requestKey+'-LEDGER-INVOICE-REV',customer.partyId,customer.partyName,finalTotal,text(inv.payment_method),invoiceNo,balanceBefore+paid,balanceBefore-remaining,auth.user.username,reason,sourceSystemV1(b),now,invoiceNo));
  const ledgerExpected=1+(paid>0?1:0);
  const actualSql="(SELECT COUNT(*) FROM employee_accounting_party_balances_v1 WHERE party_type='customer' AND party_id=? AND last_request_key=?)+(SELECT COUNT(*) FROM employee_accounting_final_invoices_v1 WHERE invoice_no=? AND status='UNDER_REVIEW')+(SELECT COUNT(*) FROM employee_accounting_party_ledger_v1 WHERE request_key IN (?,?))+(SELECT COUNT(*) FROM employee_accounting_dept_lines_v1 WHERE final_invoice_no='' AND accounting_line_id IN (SELECT value FROM json_each(?)))";
  statements.push(...txGuardPairV1(env,ctx.requestKey+'-GUARD',1+1+ledgerExpected+lineRows.length,actualSql,[customer.partyId,ctx.requestKey,invoiceNo,ctx.requestKey+'-LEDGER-PAYMENT-REV',ctx.requestKey+'-LEDGER-INVOICE-REV',JSON.stringify(lineRows.map(x=>x.accounting_line_id))]));
  await env.DB.batch(statements);
  const response={success:true,invoiceNo,reopened:lineRows.length,heldPayment:paid,reversalRef,message:'تم إرجاع الفاتورة للمراجعة وفتح '+lineRows.length+' بند. المدفوع القديم محفوظ ولا يُقبض مرة ثانية.',version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'final-invoice',invoiceNo,'reopen',auth.user.username,{reason,reversalRef,remaining,paid,finalTotal,reopened:lineRows.length});
  return response;
}

async function dayCloseBlockersV1(env,workDate,department){
  const all=department==='كل الأقسام',bindDept=all?'':department,blockers=[];
  const pending=await rows(env,"SELECT daily_purchase_id AS id,department,employee_key AS employee FROM employee_accounting_daily_purchases_v1 WHERE work_date=? AND status='PENDING' AND (?='' OR department=?)",[workDate,bindDept,bindDept]);
  const openLines=await rows(env,"SELECT accounting_line_id AS id,department,order_id AS orderId FROM employee_accounting_dept_lines_v1 WHERE work_date=? AND final_invoice_no='' AND (?='' OR department=?)",[workDate,bindDept,bindDept]);
  const custody=(await custodySummariesV1(env,workDate)).filter(x=>!x.closed&&(all||x.department===department));
  const unclassifiedPurchases=await rows(env,"SELECT purchase_id AS id FROM employee_accounting_purchase_invoices_v1 WHERE work_date=? AND status='POSTED' AND trim(department)='' LIMIT 100",[workDate]);
  const unclassifiedInvoices=await rows(env,"SELECT invoice_no AS id FROM employee_accounting_final_invoices_v1 WHERE work_date=? AND status='CLOSED' AND trim(finance_department)='' LIMIT 100",[workDate]);
  const unclassified=[...unclassifiedPurchases,...unclassifiedInvoices];
  if(pending.length)blockers.push('اعتمد أو ارفض مشتريات القسم المعلقة أولًا ('+pending.length+')');
  if(openLines.length)blockers.push('أكمل اعتماد وتقفيل بنود القسم في الفواتير النهائية أولًا ('+openLines.length+')');
  if(custody.length)blockers.push('اقفل عهد المشتريات المفتوحة أولًا ('+custody.length+')');
  if(unclassified.length)blockers.push('صنف سجلات اليوم غير المصنفة أولًا ('+unclassified.length+')');
  return {blockers,pending,openLines,custody,unclassified};
}

async function closeDepartmentDayV1(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'تقفيل الأقسام متاح لضياء فقط.'};
  const workDate=workDateKeyV1(b.workDate||b.date),department=accountingDepartmentV1(b.department);
  if(!department)return {success:false,message:'اختر القسم المطلوب تقفيله.'};
  const old=await env.DB.prepare("SELECT day_close_id AS closeId,report_json AS reportJson FROM employee_accounting_day_closes_v1 WHERE work_date=? AND department=?").bind(workDate,department).first();
  if(old)return {success:true,duplicatePrevented:true,closeId:text(old.closeId),report:parseJson(old.reportJson,{}),message:'هذا التقفيل محفوظ بالفعل.',version:'A2_D1_ACCOUNTING_V1'};
  const checks=await dayCloseBlockersV1(env,workDate,department);
  if(checks.blockers.length)return {success:false,message:'لا يمكن حفظ التقفيل الآن: '+checks.blockers.join('؛ '),blockers:checks.blockers};
  if(department==='كل الأقسام'){
    const closed=await rows(env,"SELECT department FROM employee_accounting_day_closes_v1 WHERE work_date=? AND department IN ('ليزر','طباعة')",[workDate]);
    const set=new Set(closed.map(x=>text(x.department)));
    if(!set.has('ليزر')||!set.has('طباعة'))return {success:false,message:'اقفل الليزر والطباعة أولًا، ثم نفّذ التقفيل الإجمالي.'};
  }
  const reportReply=await dailyDepartmentReportV1(env,auth,{workDate,department});
  if(!reportReply||reportReply.success===false)return reportReply;
  const report=reportReply.report,reportJson=JSON.stringify(report),reportHash=await sha256HexV1(reportJson);
  const ctx=await beginCommandV1(env,auth,'day-close',{...b,workDate,department,reportHash});
  if(ctx.replay)return {...ctx.response,success:true,duplicatePrevented:true};
  const closeId=uid('DCL'),now=Date.now();
  await env.DB.prepare("INSERT INTO employee_accounting_day_closes_v1(day_close_id,request_key,work_date,department,report_json,integrity_status,notes,actor,created_at_ms,report_hash,blockers_json) VALUES(?,?,?,?,?,'PASS',?,?,?,?, '[]')")
    .bind(closeId,ctx.requestKey,workDate,department,reportJson,text(b.notes),auth.user.username,now,reportHash).run();
  const response={success:true,closeId,report,reportHash,message:'تم حفظ تقفيل '+department+' ليوم '+workDate+'.',version:'A2_D1_ACCOUNTING_V1'};
  await commitCommandV1(env,ctx,response);
  await auditEventV1(env,ctx,'day-close',closeId,'close',auth.user.username,{workDate,department,reportHash});
  return response;
}

async function runAccountingDayAutomationV1(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'التقفيل شبه التلقائي متاح لضياء فقط.'};
  if(text(b.confirm)!=='RUN_SAFE_DAY_CLOSE')return {success:false,message:'اعرض مراجعة اليوم ثم أكد التقفيل من الزر المخصص.'};
  const workDate=workDateKeyV1(b.workDate||b.date),before=await automationPreviewV1(env,auth,{workDate});
  if(!before||before.success===false)return before;
  if((before.preview.blockers||[]).length)return {success:false,message:'لم يبدأ التقفيل حفاظًا على الحسابات: '+before.preview.blockers.join('؛ '),preview:before.preview};
  const steps=[];
  for(const c of before.preview.openCustodies||[]){
    if(c.closed)continue;
    if(Math.abs(num(c.balance))>0.001)return {success:false,partial:steps.length>0,message:'توقف التقفيل: عهدة '+text(c.employee)+' تحتاج تسوية قبل الإغلاق.',steps,preview:before.preview};
    const res=await closePurchaseCustodyV1(env,auth,{employee:c.employee,department:c.department,workDate,paymentMethod:'نقدي',requestId:'AUTO-CUSTODY-'+workDate+'-'+key(c.employee).replace(/[^a-z0-9\u0600-\u06ff_-]/g,'').slice(0,50),sourceSystem:'EasyStore-Automation'});
    steps.push({step:'custody',employee:c.employee,department:c.department,success:!!(res&&res.success),message:res&&res.message});
    if(!res||res.success===false)return {success:false,partial:true,message:'توقف التقفيل عند عهدة '+text(c.employee)+': '+text(res&&res.message),steps};
  }
  const afterCustody=await automationPreviewV1(env,auth,{workDate});
  if((afterCustody.preview.blockers||[]).length)return {success:false,partial:steps.length>0,message:'توقف التقفيل بعد فحص العهد: '+afterCustody.preview.blockers.join('؛ '),steps,preview:afterCustody.preview};
  for(const department of ['ليزر','طباعة','كل الأقسام']){
    const res=await closeDepartmentDayV1(env,auth,{workDate,department,requestId:'AUTO-DAY-'+workDate+'-'+(department==='ليزر'?'LASER':department==='طباعة'?'PRINT':'ALL'),notes:'تقفيل شبه تلقائي آمن A2',sourceSystem:'EasyStore-Automation'});
    steps.push({step:'dayClose',department,success:!!(res&&res.success),duplicatePrevented:!!(res&&res.duplicatePrevented),message:res&&res.message});
    if(!res||res.success===false)return {success:false,partial:true,message:'توقف التقفيل عند '+department+': '+text(res&&res.message),steps};
  }
  const after=await automationPreviewV1(env,auth,{workDate});
  return {success:true,message:'تم تقفيل العهد والليزر والطباعة والإجمالي بنجاح بموافقة واحدة.',steps,preview:after.preview,version:'A2_D1_ACCOUNTING_V1'};
}

export function isEmployeeAccountingNativePath(path){const p=String(path||'').replace(/\/+$/,'')||'/';return p===ROOT||p===HEALTH;}
export async function handleEmployeeAccountingNativeRequest(request,env){
  const h=cors(request,env);if(request.method==='OPTIONS')return new Response(null,{status:204,headers:h});
  if(!originAllowed(request,env))return json({success:false,code:'origin-not-allowed'},403,h);
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(path===HEALTH){
    if(request.method!=='GET')return json({success:false,code:'method-not-allowed'},405,h);
    const c=await control(env),tables=await env.DB.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('employee_accounting_materials_v1','employee_accounting_templates_v1','employee_accounting_dept_lines_v1','employee_accounting_final_invoices_v1','employee_accounting_party_ledger_v1','employee_accounting_stock_moves_v1')").first();
    const canary=await writeCanaryPolicyV1(env);
    return json({success:true,schemaReady:Number(tables&&tables.n||0)===6,mode:text(c.mode)||'OFF',policyEpoch:Number(c.policyEpoch||0),authoritativeWrites:text(c.mode)==='GENERAL',googleBusinessCalls:0,appsScriptBusinessAuthority:false,writeCanaryReady:canary.exists,writeCanaryEnabled:canary.enabled,writeCanaryPolicyEpoch:Number(canary.policyEpoch||0),writeCanaryAllowedUserCount:canary.allowedUsers.length,writeCanaryAllowedActionCount:canary.allowedActions.length,writeCanaryExpiresAtMs:Number(canary.expiresAtMs||0),writeCanaryMaxAmount:Number(canary.maxAmount||0)},200,h);
  }
  if(path!==ROOT)return json({success:false,code:'not-found'},404,h);
  if(request.method!=='POST')return json({success:false,code:'method-not-allowed'},405,h);
  const parsed=await parseBody(request);if(!parsed.ok)return parsed.response;
  const b=parsed.body||{},action=text(b.action),c=await control(env);
  if(c.mode==='OFF')return json({success:false,code:'employee-accounting-off'},503,h);
  if(c.mode==='READONLY'&&!READ_ACTIONS.has(action))return json({success:false,code:'employee-accounting-readonly'},503,h);
  const auth=await authenticate(request,b,env);if(!auth.ok)return json({success:false,code:'employee-session-rejected',message:auth.message},auth.status||401,h);
  try{
    if(c.mode==='GENERAL'&&!READ_ACTIONS.has(action))await enforceWriteCanaryV1(env,auth,action,b);
    let out;
    if(action==='getAccounting')out=await getAccounting(env,auth);
    else if(action==='getEasyStoreCustomers')out=await getEasyStoreCustomersV1(env,b);
    else if(action==='searchCustomers')out=await searchCustomersV1(env,b);
    else if(action==='getEasyStoreSuppliers')out=await getEasyStoreSuppliersV1(env,b);
    else if(action==='getCustomerAccountV1915')out=await getCustomerAccountV1915V1(env,auth,b);
    else if(action==='easyStoreSystemHealth')out=await easyStoreSystemHealthV1(env,auth);
    else if(action==='calculateAccountingLaserQuoteV1913')out=await calculateAccountingLaserQuoteV1913V1(env,auth,b);
    else if(action==='getDailyDepartmentReportV1920')out=await dailyDepartmentReportV1(env,auth,b);
    else if(action==='previewAccountingAutomationV1921')out=await automationPreviewV1(env,auth,b);
    else if(action==='getDeptInvoiceDraftV1887')out=await draft(env,auth,b);
    else if(action==='approveAccountingDeptInvoice')out=await approveDeptA2V1(env,auth,b);
    else if(action==='saveAccountingDeptLine')out=await saveDeptLineA2V1(env,auth,b);
    else if(action==='saveAccountingFinalInvoice')out=await finalInvoiceA2V1(env,auth,b);
    else if(action==='reopenAccountingFinalInvoice')out=await reopenAccountingFinalInvoiceV1(env,auth,b);
    else if(action==='closeDepartmentDayV1920')out=await closeDepartmentDayV1(env,auth,b);
    else if(action==='runAccountingDayAutomationV1921')out=await runAccountingDayAutomationV1(env,auth,b);
    else if(action==='saveAccountingMaterial')out=await saveMaterial(env,auth,b);
    else if(action==='saveAccountingTemplate')out=await saveTemplate(env,auth,b);
    else if(action==='archiveAccountingTemplate')out=await archiveAccountingTemplateV1(env,auth,b);
    else if(action==='recalcAccountingMaterialsCascade'||action==='recalculateAccountingMaterials'||action==='recalculateAccountingMaterialsCascade')out=await recalcAccountingMaterialsCascadeV1(env,auth,b);
    else if(action==='saveAccountingWaste')out=await saveAccountingWasteV1(env,auth,b);
    else if(action==='saveEasyStoreSupplier')out=await saveSupplierV1(env,auth,b);
    else if(action==='saveEasyStorePurchaseV2')out=await postPurchaseInvoiceV1(env,auth,b);
    else if(action==='saveEasyStoreSaleV2')out=await saveEasyStoreSaleV2A2(env,auth,b);
    else if(action==='saveDeptDailyPurchaseV1917')out=await saveDeptDailyPurchaseV1(env,auth,b);
    else if(action==='approveDeptDailyPurchasesV1917')out=await approveDeptDailyPurchasesV1(env,auth,b);
    else if(action==='rejectDeptDailyPurchaseV1917')out=await rejectDeptDailyPurchaseV1(env,auth,b);
    else if(action==='savePurchaseCustodyV1920')out=await savePurchaseCustodyV1(env,auth,b);
    else if(action==='closePurchaseCustodyV1920')out=await closePurchaseCustodyV1(env,auth,b);
    else if(action==='reverseApprovedPurchaseV1920')out=await reverseApprovedPurchaseV1(env,auth,b);
    else if(action==='getPartyAccountV1858')out=await getParty(env,auth,b);
    else if(action==='saveCustomerAccountMovementV1915')out=await partyLedger(env,auth,{...b,partyType:'customer'});
    else if(action==='savePartyLedgerTransaction')out=await partyLedger(env,auth,b);
    else out={success:false,code:'employee-accounting-action-unknown',message:'Accounting action is not supported.'};
    return json({...out,authority:'d1-employee-accounting-v1',authSource:auth.authSource},out&&out.success===false?400:200,h);
  }catch(err){
    return json({success:false,code:text(err&&err.code)||'employee-accounting-failed',message:text(err&&err.message)||'Employee accounting failed',authority:'d1-employee-accounting-v1'},500,h);
  }
}
