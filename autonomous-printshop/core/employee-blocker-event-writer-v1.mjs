import {
  buildEmployeeBlockerEventV1,
  blockerWriteAllowedV1
} from './employee-blocker-events-v1.mjs';

function text(v){return String(v==null?'':v).trim();}

async function existingByIdempotencyKeyV1(db,idempotencyKey){
  return db.prepare(`
    SELECT event_id AS eventId,
           blocker_id AS blockerId,
           event_type AS eventType,
           reason_code AS reasonCode,
           operator_id AS operatorId,
           department,
           order_id AS orderId,
           line_id AS lineId,
           detail_text AS detailText,
           source_kind AS sourceKind,
           actor_id AS actorId,
           idempotency_key AS idempotencyKey,
           occurred_at_ms AS occurredAtMs
      FROM autonomous_employee_blocker_events
     WHERE idempotency_key=?
     LIMIT 1
  `).bind(idempotencyKey).first();
}

function sameIdempotentPayloadV1(existing,event){
  const pairs=[
    ['eventType','eventType'],
    ['reasonCode','reasonCode'],
    ['operatorId','operatorId'],
    ['department','department'],
    ['orderId','orderId'],
    ['lineId','lineId'],
    ['detailText','detailText'],
    ['sourceKind','sourceKind'],
    ['actorId','actorId']
  ];
  return pairs.every(([a,b])=>text(existing&&existing[a])===text(event&&event[b]));
}

export async function readEmployeeSupervisorControlV1(db){
  const row=await db.prepare(
    "SELECT mode,epoch FROM autonomous_employee_supervisor_control WHERE singleton_id=1 LIMIT 1"
  ).first();
  return {
    mode:text(row&&row.mode)||'OFF',
    epoch:Number(row&&row.epoch||0)
  };
}

export async function recordEmployeeBlockerEventV1(db,input={}){
  const control=await readEmployeeSupervisorControlV1(db);
  const built=buildEmployeeBlockerEventV1(input);
  if(!built.ok){
    const err=new Error(built.code);
    err.code=built.code;
    throw err;
  }
  const e=built.event;

  const existing=await existingByIdempotencyKeyV1(db,e.idempotencyKey);
  if(existing){
    if(!sameIdempotentPayloadV1(existing,e)){
      const err=new Error('IDEMPOTENCY_PAYLOAD_MISMATCH');
      err.code='IDEMPOTENCY_PAYLOAD_MISMATCH';
      throw err;
    }
    return {
      success:true,
      inserted:false,
      idempotentReplay:true,
      eventId:text(existing.eventId),
      blockerId:text(existing.blockerId),
      eventType:text(existing.eventType),
      reasonCode:text(existing.reasonCode),
      control
    };
  }

  if(!blockerWriteAllowedV1(control.mode)){
    const err=new Error('EMPLOYEE_SUPERVISOR_CONTROL_OFF');
    err.code='EMPLOYEE_SUPERVISOR_CONTROL_OFF';
    err.control=control;
    throw err;
  }

  if(e.lineId && !e.orderId){
    const err=new Error('ORDER_ID_REQUIRED_WITH_LINE_ID');
    err.code='ORDER_ID_REQUIRED_WITH_LINE_ID';
    throw err;
  }

  if(e.orderId){
    const row=e.lineId
      ? await db.prepare(`
          SELECT
            (SELECT COUNT(*) FROM employee_core_lines_v1 WHERE order_id=? AND line_id=?) AS imported,
            (SELECT COUNT(*) FROM t12_prod_lines WHERE order_id=? AND line_id=?) AS native
        `).bind(e.orderId,e.lineId,e.orderId,e.lineId).first()
      : await db.prepare(`
          SELECT
            (SELECT COUNT(DISTINCT order_id) FROM employee_core_lines_v1 WHERE order_id=?) AS imported,
            (SELECT COUNT(*) FROM t12_prod_orders WHERE order_id=?) AS native
        `).bind(e.orderId,e.orderId).first();

    const exists=Number(row&&row.imported||0)+Number(row&&row.native||0);
    if(exists===0){
      const err=new Error(e.lineId?'BLOCKER_LINE_NOT_FOUND':'BLOCKER_ORDER_NOT_FOUND');
      err.code=e.lineId?'BLOCKER_LINE_NOT_FOUND':'BLOCKER_ORDER_NOT_FOUND';
      throw err;
    }
  }

  const result=await db.prepare(`
    INSERT OR IGNORE INTO autonomous_employee_blocker_events(
      event_id,blocker_id,event_type,reason_code,
      operator_id,department,order_id,line_id,detail_text,
      source_kind,actor_id,idempotency_key,occurred_at_ms
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    e.eventId,e.blockerId,e.eventType,e.reasonCode,
    e.operatorId,e.department,e.orderId,e.lineId,e.detailText,
    e.sourceKind,e.actorId,e.idempotencyKey,e.occurredAtMs
  ).run();

  return {
    success:true,
    inserted:Number(result&&result.meta&&result.meta.changes||0)>0,
    idempotentReplay:false,
    eventId:e.eventId,
    blockerId:e.blockerId,
    eventType:e.eventType,
    reasonCode:e.reasonCode,
    control
  };
}
