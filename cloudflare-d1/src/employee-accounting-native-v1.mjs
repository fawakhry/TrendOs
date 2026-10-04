import { verifyEmployeeSessionCloudFirst } from './cloud-session-bridge-v3.mjs';

const ROOT='/v1/employee/accounting';
const HEALTH='/v1/employee/accounting/health';
const DEFAULT_ORIGINS=[
  'https://fawakhry.github.io',
  'https://trendos-ui.trendmall-contact.workers.dev',
  'http://localhost:8000','http://127.0.0.1:8000','http://localhost:5500','http://127.0.0.1:5500'
];
const READ_ACTIONS=new Set(['getAccounting','getDeptInvoiceDraftV1887','getPartyAccountV1858','getCustomerAccountV1915','getEasyStoreCustomers','searchCustomers','easyStoreSystemHealth']);

function text(v){return String(v==null?'':v).trim();}
function key(v){return text(v).toLowerCase();}
function num(v,f=0){const n=Number(String(v==null?'':v).replace(/[^0-9.\-]/g,''));return Number.isFinite(n)?n:Number(f||0);}
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});}
function origins(env){const a=String(env&&env.CORS_ORIGINS||'').split(',').map(text).filter(Boolean);return a.length?a:DEFAULT_ORIGINS;}
function cors(request,env){const o=text(request.headers.get('Origin')),a=origins(env);return {'access-control-allow-origin':o&&a.includes(o)?o:a[0],'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization','access-control-max-age':'86400',vary:'Origin'};}
function originAllowed(request,env){const o=text(request.headers.get('Origin'));return !o||origins(env).includes(o);}
function uid(prefix){return prefix+'-'+crypto.randomUUID().replace(/-/g,'').slice(0,12).toUpperCase();}
function parseJson(v,f=[]){try{const x=typeof v==='string'?JSON.parse(v):v;return x==null?f:x;}catch{return f;}}
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
  const r=await env.DB.prepare("SELECT balance_after FROM employee_accounting_party_ledger_v1 WHERE party_type='customer' AND party_name=? ORDER BY created_at_ms DESC LIMIT 1").bind(text(name)).first();
  return r?num(r.balance_after):0;
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
      COALESCE((SELECT l.balance_after FROM employee_accounting_party_ledger_v1 l
        WHERE l.party_type='customer' AND l.party_name=c.customer_name
        ORDER BY l.created_at_ms DESC LIMIT 1),0) AS current_balance
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
      COALESCE((SELECT l.balance_after FROM employee_accounting_party_ledger_v1 l
        WHERE l.party_type='customer' AND l.party_name=c.customer_name
        ORDER BY l.created_at_ms DESC LIMIT 1),0) AS current_balance
    FROM t12_customers c
    WHERE c.active='نعم'
      AND lower(c.customer_name || ' ' || c.manager || ' ' || c.phone || ' ' || c.extra_phone || ' ' || c.customer_type) LIKE ?
    ORDER BY c.updated_at DESC,c.customer_name
    LIMIT 12
  `,[like]);
  return {success:true,customers:list.map(customerViewV1),version:'A1_D1_READ_MODEL_V1'};
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
    WHERE party_type='customer' AND party_name=?
    ORDER BY created_at_ms DESC
    LIMIT 200
  `,[customer.customer_name]);
  const balance=tx.length?num(tx[0].balanceAfter):await customerBalanceByName(env,customer.customer_name);
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

async function saveMaterial(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'إضافة وتعديل الخامات عند ضياء فقط.'};
  const name=text(b.materialName||b.name);if(!name)return {success:false,message:'اسم الخامة مطلوب.'};
  const department=text(b.department)||'طباعة',components=parseJson(b.componentsJson||b.components,[]);
  const existing=await env.DB.prepare("SELECT material_id,version FROM employee_accounting_materials_v1 WHERE department=? AND material_name=?").bind(department,name).first();
  const id=existing?existing.material_id:uid('MAT'),version=existing?Number(existing.version||1)+1:1;
  const unitCost=num(b.unitCost||b.cost),computed=num(b.computedUnitCost||b.calculatedCost,unitCost);
  await env.DB.prepare(`
    INSERT INTO employee_accounting_materials_v1(material_id,department,material_name,material_kind,material_class,unit,stock_qty,min_stock,unit_cost,computed_unit_cost,official_sale_price,components_json,formula,notes,active,raw_json,updated_by,version)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(department,material_name) DO UPDATE SET material_kind=excluded.material_kind,material_class=excluded.material_class,unit=excluded.unit,stock_qty=excluded.stock_qty,min_stock=excluded.min_stock,unit_cost=excluded.unit_cost,computed_unit_cost=excluded.computed_unit_cost,official_sale_price=excluded.official_sale_price,components_json=excluded.components_json,formula=excluded.formula,notes=excluded.notes,active=excluded.active,raw_json=excluded.raw_json,updated_by=excluded.updated_by,version=excluded.version,updated_at=CURRENT_TIMESTAMP
  `).bind(id,department,name,text(b.materialKind),text(b.materialClass),text(b.unit),num(b.stockQty||b.stock),num(b.minStock),unitCost,computed,num(b.salePrice||b.officialSalePrice),JSON.stringify(Array.isArray(components)?components:[]),text(b.formula),text(b.notes),text(b.active)==='لا'?0:1,JSON.stringify(b),auth.user.username,version).run();
  await event(env,'material',id,existing?'update':'create',auth.user.username,{department,name,version});
  return {success:true,message:existing?'الخامة موجودة وتم تحديثها.':'تم حفظ الخامة.',updated:!!existing,id,version};
}
async function materialCost(env,name){
  if(!text(name))return 0;
  const r=await env.DB.prepare("SELECT computed_unit_cost,unit_cost FROM employee_accounting_materials_v1 WHERE material_name=? AND active=1 ORDER BY updated_at DESC LIMIT 1").bind(text(name)).first();
  return r?num(r.computed_unit_cost||r.unit_cost):0;
}
async function saveTemplate(env,auth,b){
  if(auth.mode!=='full')return {success:false,message:'إضافة البنود الثابتة عند ضياء فقط.'};
  const name=text(b.itemName||b.templateName||b.productName||b.name);if(!name)return {success:false,message:'اسم البند الثابت مطلوب.'};
  const department=text(b.department)||'طباعة',components=parseJson(b.componentsJson||b.components,[]);
  if((b.componentsJson||b.components)&&!Array.isArray(components))return {success:false,message:'صيغة مكونات الصنف غير صحيحة.'};
  let calculated=0;
  if(Array.isArray(components)&&components.length){
    for(const c of components){
      const n=text(c.materialName||c.material||c.name),q=num(c.qty||c.quantity||c.consumption||c.unitConsumption);
      if(!n||!(q>0))return {success:false,message:'كل مكون يجب أن يحتوي على اسم خامة وكمية أكبر من صفر.'};
      const cost=await materialCost(env,n);if(!(cost>=0))return {success:false,message:'المكون غير مسجل ضمن الخامات الأساسية: '+n};
      calculated+=cost*q;
    }
  } else calculated=num(b.calculatedUnitCost||b.computedUnitCost||b.fixedCost||b.cost||b.unitCost);
  const existing=await env.DB.prepare("SELECT template_id,version FROM employee_accounting_templates_v1 WHERE department=? AND item_name=?").bind(department,name).first();
  const id=existing?existing.template_id:uid('TPL'),version=existing?Number(existing.version||1)+1:1;
  await env.DB.prepare(`
    INSERT INTO employee_accounting_templates_v1(template_id,department,category,item_name,size,material_name,output_count,ink_cost,fixed_cost,computed_cost,suggested_sale_price,components_json,notes,active,raw_json,updated_by,version)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(department,item_name) DO UPDATE SET category=excluded.category,size=excluded.size,material_name=excluded.material_name,output_count=excluded.output_count,ink_cost=excluded.ink_cost,fixed_cost=excluded.fixed_cost,computed_cost=excluded.computed_cost,suggested_sale_price=excluded.suggested_sale_price,components_json=excluded.components_json,notes=excluded.notes,active=excluded.active,raw_json=excluded.raw_json,updated_by=excluded.updated_by,version=excluded.version,updated_at=CURRENT_TIMESTAMP
  `).bind(id,department,text(b.category||b.itemType||'صنف بيع'),name,text(b.size),text(b.materialName),num(b.outputCount),num(b.inkCost),calculated,calculated,num(b.salePrice||b.price||b.systemSale),JSON.stringify(Array.isArray(components)?components:[]),text(b.notes),text(b.active)==='لا'?0:1,JSON.stringify(b),auth.user.username,version).run();
  await event(env,'template',id,existing?'update':'create',auth.user.username,{department,name,version});
  return {success:true,message:existing?'الصنف موجود وتم تحديثه بدل إضافته مرة أخرى.':'تم حفظ الصنف.',updated:!!existing,calculatedCost:calculated,componentsJson:JSON.stringify(Array.isArray(components)?components:[]),version:'ENTRY614_D1_ACCOUNTING_V1'};
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
async function partyBalance(env,type,name,code){
  const r=await env.DB.prepare("SELECT balance_after FROM employee_accounting_party_ledger_v1 WHERE party_type=? AND party_name=? AND (?='' OR party_code=?) ORDER BY created_at_ms DESC LIMIT 1").bind(type,name,code,code).first();
  return r?num(r.balance_after):0;
}
async function partyLedger(env,auth,b){
  if(!['full','final'].includes(auth.mode))return {success:false,message:'حسابات العملاء والموردين عند ضياء / رحمه / ريفان فقط.'};
  let type=key(b.partyType||b.type||'customer');type=type.includes('supplier')||type.includes('مورد')?'supplier':'customer';
  const name=text(b.partyName||b.customerName||b.supplierName||b.name),code=text(b.partyCode),op=key(b.operation||'manual'),amount=num(b.amount);
  if(!name||!(amount>0))return {success:false,message:'اسم الطرف والمبلغ مطلوبان.'};
  if(auth.mode!=='full'&&!['payment_received','payment_paid'].includes(op))return {success:false,message:'إضافة المديونية والتسويات عند ضياء فقط.'};
  const requestKey=text(b.requestId||b.idempotencyKey||b.clientRequestId);
  if(requestKey){
    const old=await env.DB.prepare("SELECT response_json FROM employee_accounting_request_ledger_v1 WHERE request_key=? AND status='COMMITTED'").bind(requestKey).first();
    if(old)return {...parseJson(old.response_json,{}),success:true,duplicatePrevented:true};
  }
  const before=await partyBalance(env,type,name,code),after=Math.max(0,before+effect(op)*amount),tx=uid('LED'),now=Date.now();
  if(requestKey)await env.DB.prepare("INSERT OR IGNORE INTO employee_accounting_request_ledger_v1(request_key,operation,actor,canonical_json,entity_id,status) VALUES(?,?,?,?,?,'PREPARED')").bind(requestKey,'party-ledger',auth.user.username,JSON.stringify({type,name,code,op,amount}),tx).run();
  await env.DB.prepare("INSERT INTO employee_accounting_party_ledger_v1(transaction_id,request_key,party_type,party_name,party_code,operation,operation_label,amount,effect,payment_method,ref_no,balance_before,balance_after,created_by,notes,source,created_at_ms) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .bind(tx,requestKey||null,type,name,code,op,partyOperationLabel(op,type),amount,effect(op),text(b.paymentMethod||b.method),text(b.refNo),before,after,auth.user.username,text(b.notes),text(b.source)||'TrendOS D1',now).run();
  const response={success:true,id:tx,partyType:type,partyName:name,balanceBefore:before,balance:after};
  if(requestKey)await env.DB.prepare("UPDATE employee_accounting_request_ledger_v1 SET status='COMMITTED',response_json=?,updated_at=CURRENT_TIMESTAMP WHERE request_key=?").bind(JSON.stringify(response),requestKey).run();
  await event(env,'party-ledger',tx,'post',auth.user.username,{type,name,op,amount,before,after});
  return response;
}
async function getParty(env,auth,b){
  if(!['full','final'].includes(auth.mode))return {success:false,message:'حسابات العملاء والموردين عند ضياء / رحمه / ريفان فقط.'};
  let type=key(b.partyType||b.type||'customer');type=type.includes('supplier')||type.includes('مورد')?'supplier':'customer';
  const name=text(b.partyName||b.customerName||b.supplierName||b.name),code=text(b.partyCode);
  const list=await rows(env,"SELECT transaction_id AS id,created_at_ms AS createdAtMs,party_type AS partyType,party_name AS partyName,operation,operation_label AS operationLabel,amount,payment_method AS paymentMethod,ref_no AS refNo,balance_before AS balanceBefore,balance_after AS balanceAfter,created_by AS createdBy,notes,request_key AS requestId,source FROM employee_accounting_party_ledger_v1 WHERE party_type=? AND party_name=? AND (?='' OR party_code=?) ORDER BY created_at_ms",[type,name,code,code]);
  return {success:true,partyType:type,partyName:name,balance:list.length?num(list[list.length-1].balanceAfter):0,transactions:list};
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

export function isEmployeeAccountingNativePath(path){const p=String(path||'').replace(/\/+$/,'')||'/';return p===ROOT||p===HEALTH;}
export async function handleEmployeeAccountingNativeRequest(request,env){
  const h=cors(request,env);if(request.method==='OPTIONS')return new Response(null,{status:204,headers:h});
  if(!originAllowed(request,env))return json({success:false,code:'origin-not-allowed'},403,h);
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(path===HEALTH){
    if(request.method!=='GET')return json({success:false,code:'method-not-allowed'},405,h);
    const c=await control(env),tables=await env.DB.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('employee_accounting_materials_v1','employee_accounting_templates_v1','employee_accounting_dept_lines_v1','employee_accounting_final_invoices_v1','employee_accounting_party_ledger_v1','employee_accounting_stock_moves_v1')").first();
    return json({success:true,schemaReady:Number(tables&&tables.n||0)===6,mode:text(c.mode)||'OFF',policyEpoch:Number(c.policyEpoch||0),authoritativeWrites:text(c.mode)==='GENERAL',googleBusinessCalls:0,appsScriptBusinessAuthority:false},200,h);
  }
  if(path!==ROOT)return json({success:false,code:'not-found'},404,h);
  if(request.method!=='POST')return json({success:false,code:'method-not-allowed'},405,h);
  const parsed=await parseBody(request);if(!parsed.ok)return parsed.response;
  const b=parsed.body||{},action=text(b.action),c=await control(env);
  if(c.mode==='OFF')return json({success:false,code:'employee-accounting-off'},503,h);
  if(c.mode==='READONLY'&&!READ_ACTIONS.has(action))return json({success:false,code:'employee-accounting-readonly'},503,h);
  const auth=await authenticate(request,b,env);if(!auth.ok)return json({success:false,code:'employee-session-rejected',message:auth.message},auth.status||401,h);
  try{
    let out;
    if(action==='getAccounting')out=await getAccounting(env,auth);
    else if(action==='getEasyStoreCustomers')out=await getEasyStoreCustomersV1(env,b);
    else if(action==='searchCustomers')out=await searchCustomersV1(env,b);
    else if(action==='getCustomerAccountV1915')out=await getCustomerAccountV1915V1(env,auth,b);
    else if(action==='easyStoreSystemHealth')out=await easyStoreSystemHealthV1(env,auth);
    else if(action==='getDeptInvoiceDraftV1887')out=await draft(env,auth,b);
    else if(action==='approveAccountingDeptInvoice')out=await approveDept(env,auth,b);
    else if(action==='saveAccountingDeptLine')out=await saveDeptLine(env,auth,b);
    else if(action==='saveAccountingFinalInvoice')out=await finalInvoice(env,auth,b);
    else if(action==='saveAccountingMaterial')out=await saveMaterial(env,auth,b);
    else if(action==='saveAccountingTemplate')out=await saveTemplate(env,auth,b);
    else if(action==='getPartyAccountV1858')out=await getParty(env,auth,b);
    else if(action==='savePartyLedgerTransaction')out=await partyLedger(env,auth,b);
    else out={success:false,code:'employee-accounting-action-unknown',message:'Accounting action is not supported.'};
    return json({...out,authority:'d1-employee-accounting-v1',authSource:auth.authSource},out&&out.success===false?400:200,h);
  }catch(err){
    return json({success:false,code:text(err&&err.code)||'employee-accounting-failed',message:text(err&&err.message)||'Employee accounting failed',authority:'d1-employee-accounting-v1'},500,h);
  }
}
