export const T12_CUSTOMER_MASTER_VERSION='T12_CUSTOMER_MASTER_A53_20260929_V1';

const CONTROL_MARKER='T12_CUSTOMER_MASTER_V1';
const ALLOWED_TYPES=new Set(['جملة','جملة VIP','خارجي','نوع العميل']);
const REQUEST_RE=/^cust1_\d{13}_[A-Za-z0-9_-]{16,80}$/;

export function text(v){return String(v==null?'':v).trim();}

export function cleanPhone(v){
  let d=String(v||'').replace(/[^0-9]/g,'');
  if(d.startsWith('0020'))d=d.slice(2);
  if(d.startsWith('20')&&d.length===12)d='0'+d.slice(2);
  if(/^1[0125]\d{8}$/.test(d))d='0'+d;
  return d;
}

export function normalizeArabic(v){
  return text(v).toLowerCase()
    .replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و')
    .replace(/ئ/g,'ي').replace(/[ةه]/g,'ه').replace(/\s+/g,' ').trim();
}

export function customerSearchKey(v){
  return normalizeArabic(v).replace(/[^0-9a-z\u0600-\u06ff ]/g,' ').replace(/\s+/g,' ').trim();
}

export function safeCustomerType(v){
  const raw=text(v);
  if(!raw)return 'خارجي';
  if(ALLOWED_TYPES.has(raw))return raw;
  const lower=raw.toLowerCase();
  if(lower.includes('vip'))return 'جملة VIP';
  if(raw.includes('جمل')||lower.includes('wholesale'))return 'جملة';
  return 'خارجي';
}

export function safeDebt(v){
  const map={'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
  let raw=String(v==null?'':v).trim().replace(/[٠-٩]/g,d=>map[d]||d);
  if(!raw||/^#/.test(raw))return 0;
  raw=raw.replace(/,/g,'.').replace(/[^0-9.\-]/g,'');
  const n=Number(raw);
  return Number.isFinite(n)&&n>=0&&n<=500000?n:0;
}

function fail(reason,extra={}){
  return {success:false,cloudNative:true,retryAutomatically:false,version:T12_CUSTOMER_MASTER_VERSION,reason,...extra};
}

function row(db,sql,...params){return db.prepare(sql).bind(...params).first();}
function stmt(db,sql,...params){return db.prepare(sql).bind(...params);}
function safeActive(v){return text(v)==='لا'?'لا':'نعم';}

function safeFields(input={}){
  const customerName=text(input.customerName||input.name);
  const manager=text(input.manager).slice(0,160);
  const phone=cleanPhone(input.phone||input.customerPhone);
  const extraPhone=cleanPhone(input.extraPhone||input.customerExtraPhone);
  const customerType=safeCustomerType(input.customerType||input.type);
  const active=safeActive(input.active);
  const debtAmount=safeDebt(input.debtAmount||input.debt||0);
  const notes=text(input.notes).slice(0,2500);
  const branchCode=text(input.franchiseBranchCode||input.branchCode).slice(0,120);
  const branchName=text(input.franchiseBranchName||input.branchName).slice(0,220);
  return {
    customerName,customerNameKey:customerSearchKey(customerName),manager,phone,extraPhone,
    customerType,active,debtAmount,notes,branchCode,branchName
  };
}

function validateFields(fields){
  const errors=[];
  if(!fields.customerName)errors.push('customer-name-required');
  if(fields.customerName.length>220)errors.push('customer-name-too-long');
  if(!fields.customerNameKey)errors.push('customer-name-invalid');
  if(fields.phone&&fields.phone.length<10)errors.push('primary-phone-invalid');
  if(fields.extraPhone&&fields.extraPhone.length<10)errors.push('extra-phone-invalid');
  if(fields.phone&&fields.extraPhone&&fields.phone===fields.extraPhone)errors.push('duplicate-phone-fields');
  return errors;
}

async function control(db){
  try{
    return await row(db,`
      SELECT marker,mode,canary_remaining AS canaryRemaining,
             next_customer_number AS nextCustomerNumber,
             policy_epoch AS policyEpoch,updated_at AS updatedAt
        FROM t12_customer_control
       WHERE singleton=1
       LIMIT 1
    `);
  }catch{return null;}
}

export async function readT12Customer(db,customerId){
  const id=text(customerId);
  if(!id)return null;
  return row(db,`
    SELECT customer_id AS customerId,legacy_row_number AS legacyRowNumber,
           customer_name AS name,manager,phone,extra_phone AS extraPhone,
           customer_type AS type,active,debt_amount AS debtAmount,notes,
           branch_code AS branchCode,branch_name AS branchName,
           legacy_chat_code AS chatCode,legacy_customer_code AS customerCode,
           source,version,created_by AS createdBy,
           created_at AS createdAt,updated_at AS updatedAt
      FROM t12_customers
     WHERE customer_id=?
     LIMIT 1
  `,id);
}

export async function searchT12Customers(db,q,limit=12){
  const raw=text(q),key=customerSearchKey(raw);
  if(!raw||!key)return [];
  const like='%'+key+'%';
  const clean=cleanPhone(raw);
  const phoneLike='%'+clean+'%';
  const typeLike='%'+raw+'%';
  const n=Math.max(1,Math.min(12,Number(limit)||12));
  const res=await db.prepare(`
    SELECT customer_id AS customerId,customer_name AS name,manager,phone,
           extra_phone AS extraPhone,customer_type AS type,active,
           debt_amount AS debtAmount,branch_code AS branchCode,
           branch_name AS branchName,source,version
      FROM t12_customers
     WHERE active='نعم'
       AND (
         customer_name_key LIKE ?
         OR manager LIKE ?
         OR (?<>'' AND (phone LIKE ? OR extra_phone LIKE ?))
         OR customer_type LIKE ?
       )
     ORDER BY
       CASE WHEN customer_name_key=? THEN 0 ELSE 1 END,
       updated_at DESC,
       customer_id ASC
     LIMIT ?
  `).bind(like,'%'+raw+'%',clean,phoneLike,phoneLike,typeLike,key,n).all();
  return ((res&&res.results)||[]).map(x=>({
    ...x,
    debt:Number(x.debtAmount||0),
    currentBalance:Number(x.debtAmount||0),
    remainingBalance:Number(x.debtAmount||0),
    cloudNative:true
  }));
}

async function exactMatches(db,fields){
  const res=await db.prepare(`
    SELECT customer_id AS customerId,customer_name AS name,phone,extra_phone AS extraPhone,version
      FROM t12_customers
     WHERE customer_name_key=?
        OR (?<>'' AND (phone=? OR extra_phone=?))
        OR (?<>'' AND (phone=? OR extra_phone=?))
     ORDER BY customer_id
     LIMIT 4
  `).bind(
    fields.customerNameKey,
    fields.phone,fields.phone,fields.phone,
    fields.extraPhone,fields.extraPhone,fields.extraPhone
  ).all();
  const rows=(res&&res.results)||[];
  const seen=new Set();
  return rows.filter(r=>{
    const id=text(r.customerId);
    if(!id||seen.has(id))return false;
    seen.add(id);return true;
  });
}

function canonicalJson({actor,epoch,requestKey,customerId,operation,fields}){
  return JSON.stringify({
    actor,policyEpoch:epoch,requestKey,customerId,operation,
    customer:{
      customerName:fields.customerName,manager:fields.manager,phone:fields.phone,
      extraPhone:fields.extraPhone,customerType:fields.customerType,active:fields.active,
      debtAmount:fields.debtAmount,notes:fields.notes,branchCode:fields.branchCode,branchName:fields.branchName
    }
  });
}

async function replayByRequestKey(db,requestKey,actor,epoch,fields){
  const l=await row(db,`
    SELECT actor,policy_epoch AS policyEpoch,canonical_json AS canonicalJson,
           customer_id AS customerId,operation,status,response_json AS responseJson
      FROM t12_customer_request_ledger
     WHERE request_key=?
     LIMIT 1
  `,requestKey);
  if(!l)return {kind:'MISSING'};
  const expected=canonicalJson({
    actor,epoch,requestKey,customerId:text(l.customerId),operation:text(l.operation),fields
  });
  if(text(l.actor)!==actor||text(l.policyEpoch)!==epoch||text(l.canonicalJson)!==expected)return {kind:'CONFLICT'};
  if(text(l.status)!=='COMMITTED')return {kind:'INDETERMINATE'};
  const customer=await readT12Customer(db,l.customerId);
  if(!customer)return {kind:'INDETERMINATE'};
  return {
    kind:'VERIFIED',
    response:{
      success:true,cloudNative:true,customerId:text(l.customerId),
      operation:text(l.operation),updated:text(l.operation)==='UPDATE',
      customer,version:T12_CUSTOMER_MASTER_VERSION
    }
  };
}

export async function upsertT12Customer(db,input={},actor='',options={}){
  if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')return fail('d1-adapter-required');
  const safeActor=text(actor);
  if(!safeActor||safeActor.length>140||/\s/.test(safeActor))return fail('authenticated-actor-subject-required');

  const requestKey=text(input.clientRequestId);
  if(!REQUEST_RE.test(requestKey))return fail('customer-cloud-request-key-required');

  const fields=safeFields(input);
  const validationErrors=validateFields(fields);
  if(validationErrors.length)return fail('customer-intent-invalid',{errors:validationErrors});

  const ctl=await control(db);
  if(!ctl||text(ctl.marker)!==CONTROL_MARKER)return fail('customer-control-invalid');
  const mode=text(ctl.mode),epoch=text(ctl.policyEpoch);
  const canary=options.canary===true;

  let existing;
  try{existing=await replayByRequestKey(db,requestKey,safeActor,epoch,fields);}
  catch{return fail('customer-ledger-read-unavailable-no-retry');}
  if(existing.kind==='VERIFIED')return {...existing.response,stored:false,idempotent:true};
  if(existing.kind==='CONFLICT')return fail('same-customer-request-key-conflict');
  if(existing.kind==='INDETERMINATE')return fail('existing-customer-transaction-incomplete-no-retry');

  if(canary){
    if(mode!=='CANARY'||Number(ctl.canaryRemaining)!==1)return fail('customer-canary-not-armed');
  }else if(mode!=='GENERAL'){
    return fail('customer-write-not-enabled',{mode});
  }

  let target=null;
  const requestedId=text(input.customerId);
  if(requestedId){
    target=await readT12Customer(db,requestedId);
    if(!target)return fail('customer-id-not-found',{customerId:requestedId});
  }else{
    const matches=await exactMatches(db,fields);
    if(matches.length>1)return fail('ambiguous-customer-match',{customerIds:matches.map(x=>text(x.customerId))});
    if(matches.length===1)target=await readT12Customer(db,matches[0].customerId);
  }

  const operation=target?'UPDATE':'CREATE';
  const nextNo=Number(ctl.nextCustomerNumber||0);
  const customerId=target?text(target.customerId):('CUS-C'+String(nextNo).padStart(6,'0'));
  const canonical=canonicalJson({actor:safeActor,epoch,requestKey,customerId,operation,fields});
  const resultVersion=operation==='CREATE'?1:(Number(target.version||0)+1);

  const statements=[];
  if(operation==='CREATE'){
    if(!Number.isSafeInteger(nextNo)||nextNo<1)return fail('next-customer-number-invalid');
    statements.push(stmt(db,`
      UPDATE t12_customer_control
         SET next_customer_number=next_customer_number+1,updated_at=CURRENT_TIMESTAMP
       WHERE singleton=1 AND marker=? AND next_customer_number=?
    `,CONTROL_MARKER,nextNo));
    statements.push(stmt(db,`
      INSERT INTO t12_customers
      (customer_id,legacy_row_number,customer_name,customer_name_key,manager,phone,extra_phone,
       customer_type,active,debt_amount,notes,branch_code,branch_name,legacy_chat_code,
       legacy_customer_code,source,created_by,version,created_at,updated_at)
      SELECT ?,NULL,?,?,?,?,?,?,?,?,?,?,?,'','','cloud-native',?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
       WHERE EXISTS(
         SELECT 1 FROM t12_customer_control
          WHERE singleton=1 AND marker=? AND next_customer_number=?
       )
    `,
      customerId,fields.customerName,fields.customerNameKey,fields.manager,fields.phone,fields.extraPhone,
      fields.customerType,fields.active,fields.debtAmount,fields.notes,fields.branchCode,fields.branchName,
      safeActor,CONTROL_MARKER,nextNo+1
    ));
  }else{
    const expectedVersion=Number(target.version||0);
    statements.push(stmt(db,`
      UPDATE t12_customers
         SET customer_name=?,customer_name_key=?,manager=?,phone=?,extra_phone=?,
             customer_type=?,active=?,debt_amount=?,notes=?,branch_code=?,branch_name=?,
             source='cloud-native',created_by=CASE WHEN created_by='' THEN ? ELSE created_by END,
             version=version+1,updated_at=CURRENT_TIMESTAMP
       WHERE customer_id=? AND version=?
    `,
      fields.customerName,fields.customerNameKey,fields.manager,fields.phone,fields.extraPhone,
      fields.customerType,fields.active,fields.debtAmount,fields.notes,fields.branchCode,fields.branchName,
      safeActor,customerId,expectedVersion
    ));
  }

  statements.push(stmt(db,`
    INSERT INTO t12_customer_request_ledger
    (request_key,actor,policy_epoch,canonical_json,customer_id,operation,status,response_json)
    SELECT ?,?,?,?,?,?,'COMMITTED','{}'
      FROM t12_customers
     WHERE customer_id=? AND version=?
  `,requestKey,safeActor,epoch,canonical,customerId,operation,customerId,resultVersion));

  statements.push(stmt(db,`
    INSERT INTO t12_customer_events
    (customer_id,request_key,event_type,actor,payload_json)
    SELECT customer_id,request_key,?,?,?
      FROM t12_customer_request_ledger
     WHERE request_key=? AND status='COMMITTED'
  `,operation==='CREATE'?'customer-create':'customer-update',safeActor,
    JSON.stringify({name:fields.customerName,phonePresent:!!fields.phone,extraPhonePresent:!!fields.extraPhone,debtAmount:fields.debtAmount,active:fields.active}),
    requestKey
  ));

  if(canary){
    statements.push(stmt(db,`
      UPDATE t12_customer_control
         SET canary_remaining=0,updated_at=CURRENT_TIMESTAMP
       WHERE singleton=1 AND marker=? AND mode='CANARY' AND canary_remaining=1
         AND EXISTS(
           SELECT 1 FROM t12_customer_request_ledger
            WHERE request_key=? AND status='COMMITTED'
         )
    `,CONTROL_MARKER,requestKey));
  }

  try{await db.batch(statements);}
  catch{
    let recovered;
    try{recovered=await replayByRequestKey(db,requestKey,safeActor,epoch,fields);}
    catch{return fail('customer-transaction-outcome-unknown-no-retry');}
    if(recovered.kind==='VERIFIED')return {...recovered.response,stored:false,idempotent:true,ambiguousAckRecovered:true};
    if(recovered.kind==='CONFLICT')return fail('same-customer-request-key-conflict');
    return fail('customer-transaction-outcome-unknown-no-retry');
  }

  const customer=await readT12Customer(db,customerId);
  if(!customer)return fail('customer-commit-not-verified-no-retry',{customerId});
  return {
    success:true,cloudNative:true,stored:true,idempotent:false,
    customerId,operation,updated:operation==='UPDATE',customer,
    canary,version:T12_CUSTOMER_MASTER_VERSION
  };
}

export async function customerControlState(db){
  const ctl=await control(db);
  if(!ctl)return null;
  let count=0;
  try{
    const r=await row(db,'SELECT COUNT(*) AS n FROM t12_customers');
    count=Number(r&&r.n||0);
  }catch{}
  return {
    marker:text(ctl.marker),mode:text(ctl.mode),
    canaryRemaining:Number(ctl.canaryRemaining||0),
    nextCustomerNumber:Number(ctl.nextCustomerNumber||0),
    policyEpoch:text(ctl.policyEpoch),updatedAt:text(ctl.updatedAt),
    customerCount:count
  };
}
