import {
  T12_CUSTOMER_MASTER_VERSION,
  cleanPhone,
  customerSearchKey,
  readT12Customer,
  safeCustomerType,
  safeDebt,
  text
} from './t12-customer-master.mjs';

export const T12_CUSTOMER_LEGACY_PROJECTION_VERSION='T12_CUSTOMER_LEGACY_PROJECTION_A55_20260929_V1';
const CONTROL_MARKER='T12_CUSTOMER_MASTER_V1';
const REQUEST_RE=/^custp_\d{13}_[A-Za-z0-9_-]{16,80}$/;

function fail(reason,extra={}){
  return {
    success:false,
    cloudProjection:true,
    retryAutomatically:false,
    version:T12_CUSTOMER_LEGACY_PROJECTION_VERSION,
    reason,
    ...extra
  };
}

function stmt(db,sql,...params){return db.prepare(sql).bind(...params);}
async function row(db,sql,...params){return db.prepare(sql).bind(...params).first();}

function activeValue(v){return text(v)==='لا'?'لا':'نعم';}

function fieldsFrom(input={}){
  const name=text(input.customerName||input.name);
  return {
    customerName:name,
    customerNameKey:customerSearchKey(name),
    manager:text(input.manager).slice(0,160),
    phone:cleanPhone(input.phone||input.customerPhone),
    extraPhone:cleanPhone(input.extraPhone||input.customerExtraPhone),
    customerType:safeCustomerType(input.customerType||input.type),
    active:activeValue(input.active),
    debtAmount:safeDebt(input.debtAmount||input.debt||0),
    notes:text(input.notes).slice(0,2500),
    branchCode:text(input.franchiseBranchCode||input.branchCode).slice(0,120),
    branchName:text(input.franchiseBranchName||input.branchName).slice(0,220)
  };
}

function validate(fields){
  const errors=[];
  if(!fields.customerName)errors.push('customer-name-required');
  if(!fields.customerNameKey)errors.push('customer-name-invalid');
  if(fields.customerName.length>220)errors.push('customer-name-too-long');
  if(fields.phone&&fields.phone.length<10)errors.push('primary-phone-invalid');
  if(fields.extraPhone&&fields.extraPhone.length<10)errors.push('extra-phone-invalid');
  return errors;
}

async function control(db){
  try{
    return await row(db,`
      SELECT marker,mode,next_customer_number AS nextCustomerNumber,
             policy_epoch AS policyEpoch
        FROM t12_customer_control
       WHERE singleton=1
       LIMIT 1
    `);
  }catch{return null;}
}

function canonical({actor,epoch,requestKey,customerId,operation,fields}){
  return JSON.stringify({
    actor,policyEpoch:epoch,requestKey,customerId,operation,authority:'apps-script-projection',
    customer:{
      customerName:fields.customerName,
      manager:fields.manager,
      phone:fields.phone,
      extraPhone:fields.extraPhone,
      customerType:fields.customerType,
      active:fields.active,
      debtAmount:fields.debtAmount,
      notes:fields.notes,
      branchCode:fields.branchCode,
      branchName:fields.branchName
    }
  });
}

async function replay(db,requestKey,actor,epoch,fields){
  const l=await row(db,`
    SELECT actor,policy_epoch AS policyEpoch,canonical_json AS canonicalJson,
           customer_id AS customerId,operation,status
      FROM t12_customer_request_ledger
     WHERE request_key=?
     LIMIT 1
  `,requestKey);
  if(!l)return {kind:'MISSING'};
  const expected=canonical({
    actor,epoch,requestKey,customerId:text(l.customerId),operation:text(l.operation),fields
  });
  if(text(l.actor)!==actor||text(l.policyEpoch)!==epoch||text(l.canonicalJson)!==expected)return {kind:'CONFLICT'};
  if(text(l.status)!=='COMMITTED')return {kind:'INDETERMINATE'};
  const customer=await readT12Customer(db,l.customerId);
  if(!customer)return {kind:'INDETERMINATE'};
  return {
    kind:'VERIFIED',
    response:{
      success:true,
      cloudProjection:true,
      customerId:text(l.customerId),
      operation:text(l.operation),
      updated:text(l.operation)==='UPDATE',
      customer,
      version:T12_CUSTOMER_LEGACY_PROJECTION_VERSION
    }
  };
}

async function rowsByPhone(db,phone,extraPhone){
  const values=[phone,extraPhone].filter(Boolean);
  if(!values.length)return [];
  const seen=new Map();
  for(const value of values){
    const res=await db.prepare(`
      SELECT customer_id AS customerId,customer_name AS name,phone,
             extra_phone AS extraPhone,source,version
        FROM t12_customers
       WHERE phone=? OR extra_phone=?
       ORDER BY customer_id
       LIMIT 4
    `).bind(value,value).all();
    for(const r of (res&&res.results)||[])seen.set(text(r.customerId),r);
  }
  return [...seen.values()];
}

async function rowsByName(db,nameKey){
  if(!nameKey)return [];
  const res=await db.prepare(`
    SELECT customer_id AS customerId,customer_name AS name,phone,
           extra_phone AS extraPhone,source,version
      FROM t12_customers
     WHERE customer_name_key=?
     ORDER BY customer_id
     LIMIT 4
  `).bind(nameKey).all();
  return (res&&res.results)||[];
}

async function resolveTarget(db,fields){
  const phoneMatches=await rowsByPhone(db,fields.phone,fields.extraPhone);
  if(phoneMatches.length>1)return {kind:'AMBIGUOUS',by:'phone',rows:phoneMatches};
  if(phoneMatches.length===1)return {kind:'MATCH',by:'phone',row:phoneMatches[0]};
  const nameMatches=await rowsByName(db,fields.customerNameKey);
  if(nameMatches.length>1)return {kind:'AMBIGUOUS',by:'name',rows:nameMatches};
  if(nameMatches.length===1)return {kind:'MATCH',by:'name',row:nameMatches[0]};
  return {kind:'MISSING'};
}

export async function projectLegacyCustomer(db,input={},actor=''){
  if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')return fail('d1-adapter-required');
  const safeActor=text(actor);
  if(!safeActor||safeActor.length>140||/\s/.test(safeActor))return fail('authenticated-actor-subject-required');

  const requestKey=text(input.clientRequestId);
  if(!REQUEST_RE.test(requestKey))return fail('projection-request-key-required');

  const fields=fieldsFrom(input);
  const errors=validate(fields);
  if(errors.length)return fail('projection-intent-invalid',{errors});

  const ctl=await control(db);
  if(!ctl||text(ctl.marker)!==CONTROL_MARKER)return fail('customer-control-invalid');
  if(text(ctl.mode)!=='OFF')return fail('projection-requires-customer-write-off',{mode:text(ctl.mode)});
  const epoch=text(ctl.policyEpoch);

  let existing;
  try{existing=await replay(db,requestKey,safeActor,epoch,fields);}
  catch{return fail('projection-ledger-read-unavailable-no-retry');}
  if(existing.kind==='VERIFIED')return {...existing.response,stored:false,idempotent:true};
  if(existing.kind==='CONFLICT')return fail('same-projection-request-key-conflict');
  if(existing.kind==='INDETERMINATE')return fail('existing-projection-incomplete-no-retry');

  let resolved;
  try{resolved=await resolveTarget(db,fields);}
  catch{return fail('projection-target-read-unavailable-no-retry');}
  if(resolved.kind==='AMBIGUOUS'){
    return fail('ambiguous-legacy-customer-projection',{
      matchBy:resolved.by,
      customerIds:resolved.rows.map(x=>text(x.customerId))
    });
  }

  const operation=resolved.kind==='MATCH'?'UPDATE':'CREATE';
  const nextNo=Number(ctl.nextCustomerNumber||0);
  const customerId=operation==='UPDATE'
    ? text(resolved.row.customerId)
    : ('CUS-C'+String(nextNo).padStart(6,'0'));
  const expectedVersion=operation==='UPDATE'?(Number(resolved.row.version||0)+1):1;
  const canonicalJson=canonical({actor:safeActor,epoch,requestKey,customerId,operation,fields});
  const statements=[];

  if(operation==='CREATE'){
    if(!Number.isSafeInteger(nextNo)||nextNo<1)return fail('next-customer-number-invalid');
    statements.push(stmt(db,`
      UPDATE t12_customer_control
         SET next_customer_number=next_customer_number+1,updated_at=CURRENT_TIMESTAMP
       WHERE singleton=1 AND marker=? AND mode='OFF' AND next_customer_number=?
    `,CONTROL_MARKER,nextNo));
    statements.push(stmt(db,`
      INSERT INTO t12_customers
      (customer_id,legacy_row_number,customer_name,customer_name_key,manager,phone,extra_phone,
       customer_type,active,debt_amount,notes,branch_code,branch_name,legacy_chat_code,
       legacy_customer_code,source,created_by,version,created_at,updated_at)
      SELECT ?,NULL,?,?,?,?,?,?,?,?,?,?,?,'','','legacy-mirror',?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
       WHERE EXISTS(
         SELECT 1 FROM t12_customer_control
          WHERE singleton=1 AND marker=? AND mode='OFF' AND next_customer_number=?
       )
    `,
      customerId,fields.customerName,fields.customerNameKey,fields.manager,fields.phone,fields.extraPhone,
      fields.customerType,fields.active,fields.debtAmount,fields.notes,fields.branchCode,fields.branchName,
      safeActor,CONTROL_MARKER,nextNo+1
    ));
  }else{
    statements.push(stmt(db,`
      UPDATE t12_customers
         SET customer_name=?,customer_name_key=?,manager=?,phone=?,extra_phone=?,
             customer_type=?,active=?,debt_amount=?,notes=?,branch_code=?,branch_name=?,
             source='legacy-mirror',
             version=version+1,updated_at=CURRENT_TIMESTAMP
       WHERE customer_id=? AND version=? AND source='legacy-mirror'
    `,
      fields.customerName,fields.customerNameKey,fields.manager,fields.phone,fields.extraPhone,
      fields.customerType,fields.active,fields.debtAmount,fields.notes,fields.branchCode,fields.branchName,
      customerId,Number(resolved.row.version||0)
    ));
  }

  statements.push(stmt(db,`
    INSERT INTO t12_customer_request_ledger
    (request_key,actor,policy_epoch,canonical_json,customer_id,operation,status,response_json)
    SELECT ?,?,?,?,?,?,'COMMITTED','{}'
      FROM t12_customers
     WHERE customer_id=? AND version=?
  `,requestKey,safeActor,epoch,canonicalJson,customerId,operation,customerId,expectedVersion));

  statements.push(stmt(db,`
    INSERT INTO t12_customer_events
    (customer_id,request_key,event_type,actor,payload_json)
    SELECT customer_id,request_key,?,?,?
      FROM t12_customer_request_ledger
     WHERE request_key=? AND status='COMMITTED'
  `,operation==='CREATE'?'customer-create':'customer-update',safeActor,
    JSON.stringify({
      authority:'apps-script',
      matchBy:resolved.by||'none',
      name:fields.customerName,
      phonePresent:!!fields.phone,
      extraPhonePresent:!!fields.extraPhone,
      debtAmount:fields.debtAmount,
      active:fields.active
    }),
    requestKey
  ));

  try{await db.batch(statements);}
  catch{
    let recovered;
    try{recovered=await replay(db,requestKey,safeActor,epoch,fields);}
    catch{return fail('projection-outcome-unknown-no-retry');}
    if(recovered.kind==='VERIFIED')return {...recovered.response,stored:false,idempotent:true,ambiguousAckRecovered:true};
    if(recovered.kind==='CONFLICT')return fail('same-projection-request-key-conflict');
    return fail('projection-outcome-unknown-no-retry');
  }

  let confirmed;
  try{confirmed=await replay(db,requestKey,safeActor,epoch,fields);}
  catch{return fail('projection-commit-not-verified-no-retry',{customerId});}
  if(confirmed.kind!=='VERIFIED')return fail('projection-commit-not-verified-no-retry',{customerId});
  return {
    ...confirmed.response,
    stored:true,
    idempotent:false,
    version:T12_CUSTOMER_LEGACY_PROJECTION_VERSION
  };
}
