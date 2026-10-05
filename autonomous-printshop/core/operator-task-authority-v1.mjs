/* Autonomous Printshop - Operator Task D1 Authority V1
 * Repository-only foundation.
 * Default control mode is OFF. SHADOW never mutates.
 *
 * Product contract preserved from Operator Task V2:
 * - ordinary backlog is system-selected;
 * - one active ordinary task per operator;
 * - one active ordinary task per line;
 * - claim=start;
 * - deterministic Urgent -> Due -> Order -> Line selection;
 * - idempotent claim and complete;
 * - append-only task events.
 */

import { buildOperationalRealityV1 } from './operational-reality-v1.mjs';

function text(v){ return String(v == null ? '' : v).trim(); }
function upper(v){ return text(v).toUpperCase(); }
function jsonText(v){ return v == null ? null : JSON.stringify(v); }

function dbRequired(db){
  if(!db || typeof db.prepare!=='function' || typeof db.batch!=='function'){
    throw new Error('OPERATOR_TASK_DB_REQUIRED');
  }
}
function idFactory(options,prefix){
  if(options && typeof options.idFactory==='function') return text(options.idFactory(prefix));
  if(globalThis.crypto && typeof globalThis.crypto.randomUUID==='function'){
    return prefix+'-'+globalThis.crypto.randomUUID();
  }
  return prefix+'-'+Date.now()+'-'+Math.random().toString(16).slice(2);
}
function rowToTask(row){
  if(!row) return null;
  return {
    taskId:text(row.taskId ?? row.task_id),
    taskType:text(row.taskType ?? row.task_type),
    orderId:text(row.orderId ?? row.order_id),
    lineId:text(row.lineId ?? row.line_id),
    department:text(row.department),
    operatorId:text(row.operatorId ?? row.operator_id),
    status:text(row.status),
    prioritySnapshot:text(row.prioritySnapshot ?? row.priority_snapshot),
    dueAtSnapshot:text(row.dueAtSnapshot ?? row.due_at_snapshot),
    sourceDataVersion:text(row.sourceDataVersion ?? row.source_data_version),
    sourceInputHash:text(row.sourceInputHash ?? row.source_input_hash),
    claimIdempotencyKey:text(row.claimIdempotencyKey ?? row.claim_idempotency_key),
    completionIdempotencyKey:text(row.completionIdempotencyKey ?? row.completion_idempotency_key),
    startedAt:text(row.startedAt ?? row.started_at),
    completedAt:text(row.completedAt ?? row.completed_at),
    completionResultJson:text(row.completionResultJson ?? row.completion_result_json)
  };
}

export async function readOperatorTaskControlV1(db){
  if(!db || typeof db.prepare!=='function') throw new Error('OPERATOR_TASK_DB_REQUIRED');
  const row=await db.prepare(`
    SELECT mode,
           canary_operator_id AS canaryOperatorId,
           epoch,
           updated_by AS updatedBy,
           change_reason AS changeReason,
           updated_at AS updatedAt
      FROM operator_task_control
     WHERE singleton_id = 1
     LIMIT 1
  `).first();
  if(!row){
    return {
      mode:'OFF',
      canaryOperatorId:'',
      epoch:0,
      updatedBy:'',
      changeReason:'',
      configured:false
    };
  }
  return {
    mode:upper(row.mode||'OFF'),
    canaryOperatorId:text(row.canaryOperatorId),
    epoch:Number(row.epoch||0),
    updatedBy:text(row.updatedBy),
    changeReason:text(row.changeReason),
    updatedAt:text(row.updatedAt),
    configured:true
  };
}

export function operatorTaskMutationGateV1(control={},operatorId=''){
  const mode=upper(control.mode||'OFF');
  const operator=text(operatorId);
  if(mode==='OFF') return {allowed:false,shadow:false,reason:'OPERATOR_TASK_CONTROL_OFF'};
  if(mode==='SHADOW') return {allowed:false,shadow:true,reason:'OPERATOR_TASK_SHADOW_NO_MUTATION'};
  if(mode==='CANARY'){
    if(!operator || text(control.canaryOperatorId)!==operator){
      return {allowed:false,shadow:true,reason:'OPERATOR_TASK_CANARY_OPERATOR_MISMATCH'};
    }
    return {allowed:true,shadow:false,reason:'OPERATOR_TASK_CANARY_ALLOWED'};
  }
  if(mode==='GENERAL') return {allowed:true,shadow:false,reason:'OPERATOR_TASK_GENERAL_ALLOWED'};
  return {allowed:false,shadow:false,reason:'OPERATOR_TASK_CONTROL_INVALID'};
}

export async function readActiveOperatorTaskV1(db,operatorId){
  if(!db || typeof db.prepare!=='function') throw new Error('OPERATOR_TASK_DB_REQUIRED');
  const row=await db.prepare(`
    SELECT task_id AS taskId,
           task_type AS taskType,
           order_id AS orderId,
           line_id AS lineId,
           department,
           operator_id AS operatorId,
           status,
           priority_snapshot AS prioritySnapshot,
           due_at_snapshot AS dueAtSnapshot,
           source_data_version AS sourceDataVersion,
           source_input_hash AS sourceInputHash,
           claim_idempotency_key AS claimIdempotencyKey,
           completion_idempotency_key AS completionIdempotencyKey,
           started_at AS startedAt,
           completed_at AS completedAt,
           completion_result_json AS completionResultJson
      FROM operator_tasks
     WHERE operator_id = ?
       AND task_type = 'ORDINARY'
       AND status = 'ACTIVE'
     ORDER BY started_at DESC
     LIMIT 1
  `).bind(text(operatorId)).first();
  return rowToTask(row);
}

async function readTaskByClaimKey(db,key){
  const row=await db.prepare(`
    SELECT task_id AS taskId,
           task_type AS taskType,
           order_id AS orderId,
           line_id AS lineId,
           department,
           operator_id AS operatorId,
           status,
           priority_snapshot AS prioritySnapshot,
           due_at_snapshot AS dueAtSnapshot,
           source_data_version AS sourceDataVersion,
           source_input_hash AS sourceInputHash,
           claim_idempotency_key AS claimIdempotencyKey,
           completion_idempotency_key AS completionIdempotencyKey,
           started_at AS startedAt,
           completed_at AS completedAt,
           completion_result_json AS completionResultJson
      FROM operator_tasks
     WHERE claim_idempotency_key = ?
     LIMIT 1
  `).bind(text(key)).first();
  return rowToTask(row);
}

async function readTaskById(db,taskId){
  const row=await db.prepare(`
    SELECT task_id AS taskId,
           task_type AS taskType,
           order_id AS orderId,
           line_id AS lineId,
           department,
           operator_id AS operatorId,
           status,
           priority_snapshot AS prioritySnapshot,
           due_at_snapshot AS dueAtSnapshot,
           source_data_version AS sourceDataVersion,
           source_input_hash AS sourceInputHash,
           claim_idempotency_key AS claimIdempotencyKey,
           completion_idempotency_key AS completionIdempotencyKey,
           started_at AS startedAt,
           completed_at AS completedAt,
           completion_result_json AS completionResultJson
      FROM operator_tasks
     WHERE task_id = ?
     LIMIT 1
  `).bind(text(taskId)).first();
  return rowToTask(row);
}

export async function claimNextOperatorTaskV1(db,input={},options={}){
  dbRequired(db);
  const operatorId=text(input.operatorId);
  const department=text(input.department);
  const claimKey=text(input.claimIdempotencyKey);
  if(!operatorId) throw new Error('OPERATOR_TASK_OPERATOR_REQUIRED');

  if(claimKey){
    const prior=await readTaskByClaimKey(db,claimKey);
    if(prior){
      if(prior.operatorId!==operatorId) throw new Error('OPERATOR_TASK_CLAIM_KEY_OWNER_MISMATCH');
      return {
        success:true,
        idempotent:true,
        mutated:false,
        task:prior,
        reason:'OPERATOR_TASK_CLAIM_ALREADY_RECORDED'
      };
    }
  }

  const active=await readActiveOperatorTaskV1(db,operatorId);
  if(active){
    return {
      success:true,
      idempotent:true,
      mutated:false,
      task:active,
      reason:'OPERATOR_TASK_ACTIVE_EXISTS'
    };
  }

  const reality=buildOperationalRealityV1(Array.isArray(input.rows)?input.rows:[],{
    department,
    requiredReadiness:Array.isArray(input.requiredReadiness)?input.requiredReadiness:[]
  });
  const recommended=reality.ordinary[0]||null;
  const control=await readOperatorTaskControlV1(db);
  const gate=operatorTaskMutationGateV1(control,operatorId);

  if(!recommended){
    return {
      success:true,
      mutated:false,
      task:null,
      recommendedTask:null,
      mode:control.mode,
      reason:'OPERATOR_TASK_NO_ELIGIBLE_TASK',
      reality
    };
  }

  if(!gate.allowed){
    return {
      success:true,
      mutated:false,
      task:null,
      recommendedTask:recommended,
      mode:control.mode,
      shadow:gate.shadow,
      reason:gate.reason,
      reality
    };
  }

  if(!claimKey) throw new Error('OPERATOR_TASK_CLAIM_IDEMPOTENCY_KEY_REQUIRED');

  const sourceDataVersion=text(input.sourceDataVersion);
  const sourceInputHash=text(input.sourceInputHash);
  const maxCandidates=Math.max(1,Math.min(20,Number(options.maxCandidates)||10));

  for(const candidate of reality.ordinary.slice(0,maxCandidates)){
    const taskId=idFactory(options,'operator-task');
    const eventId=idFactory(options,'operator-task-event');
    const insertTask=db.prepare(`
      INSERT OR IGNORE INTO operator_tasks (
        task_id, task_type, order_id, line_id, department, operator_id, status,
        priority_snapshot, due_at_snapshot, source_data_version, source_input_hash,
        claim_idempotency_key
      ) VALUES (?, 'ORDINARY', ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?)
    `).bind(
      taskId,
      candidate.orderId,
      candidate.lineId,
      candidate.department||department,
      operatorId,
      candidate.priority,
      candidate.dueIso||candidate.dueRaw||null,
      sourceDataVersion,
      sourceInputHash,
      claimKey
    );

    const insertEvent=db.prepare(`
      INSERT OR IGNORE INTO operator_task_events (
        event_id, task_id, event_type, actor_id, idempotency_key, event_json
      )
      SELECT ?, ?, 'CLAIMED', ?, ?, ?
       WHERE EXISTS (
         SELECT 1
           FROM operator_tasks
          WHERE task_id = ?
            AND status = 'ACTIVE'
       )
    `).bind(
      eventId,
      taskId,
      operatorId,
      'claim:'+claimKey,
      jsonText({
        orderId:candidate.orderId,
        lineId:candidate.lineId,
        priority:candidate.priority,
        dueAt:candidate.dueIso||candidate.dueRaw||'',
        sourceDataVersion,
        sourceInputHash
      }),
      taskId
    );

    const result=await db.batch([insertTask,insertEvent]);
    const inserted=Number(result&&result[0]&&result[0].meta&&result[0].meta.changes||0)>0;
    if(inserted){
      const task=await readTaskById(db,taskId);
      return {
        success:true,
        idempotent:false,
        mutated:true,
        task:task||{
          taskId,taskType:'ORDINARY',orderId:candidate.orderId,lineId:candidate.lineId,
          department:candidate.department||department,operatorId,status:'ACTIVE',
          prioritySnapshot:candidate.priority,dueAtSnapshot:candidate.dueIso||candidate.dueRaw||'',
          sourceDataVersion,sourceInputHash,claimIdempotencyKey:claimKey
        },
        reason:'OPERATOR_TASK_CLAIMED',
        mode:control.mode
      };
    }

    const maybeClaimed=await readTaskByClaimKey(db,claimKey);
    if(maybeClaimed){
      if(maybeClaimed.operatorId!==operatorId) throw new Error('OPERATOR_TASK_CLAIM_KEY_OWNER_MISMATCH');
      return {
        success:true,
        idempotent:true,
        mutated:false,
        task:maybeClaimed,
        reason:'OPERATOR_TASK_CLAIM_ALREADY_RECORDED',
        mode:control.mode
      };
    }

    const activeAfterConflict=await readActiveOperatorTaskV1(db,operatorId);
    if(activeAfterConflict){
      return {
        success:true,
        idempotent:true,
        mutated:false,
        task:activeAfterConflict,
        reason:'OPERATOR_TASK_ACTIVE_EXISTS_AFTER_RACE',
        mode:control.mode
      };
    }
  }

  return {
    success:false,
    mutated:false,
    task:null,
    reason:'OPERATOR_TASK_CLAIM_CONFLICT_RETRY_REQUIRED',
    mode:control.mode
  };
}

export async function completeOperatorTaskV1(db,input={},options={}){
  dbRequired(db);
  const taskId=text(input.taskId);
  const operatorId=text(input.operatorId);
  const completionKey=text(input.completionIdempotencyKey);
  if(!taskId) throw new Error('OPERATOR_TASK_ID_REQUIRED');
  if(!operatorId) throw new Error('OPERATOR_TASK_OPERATOR_REQUIRED');
  if(!completionKey) throw new Error('OPERATOR_TASK_COMPLETION_IDEMPOTENCY_KEY_REQUIRED');

  const current=await readTaskById(db,taskId);
  if(!current) throw new Error('OPERATOR_TASK_NOT_FOUND');
  if(current.operatorId!==operatorId) throw new Error('OPERATOR_TASK_OWNER_MISMATCH');

  if(current.status==='COMPLETED'){
    if(current.completionIdempotencyKey===completionKey){
      return {
        success:true,
        idempotent:true,
        mutated:false,
        task:current,
        reason:'OPERATOR_TASK_COMPLETION_ALREADY_RECORDED'
      };
    }
    throw new Error('OPERATOR_TASK_ALREADY_COMPLETED_DIFFERENT_KEY');
  }
  if(current.status!=='ACTIVE') throw new Error('OPERATOR_TASK_NOT_ACTIVE');

  const eventId=idFactory(options,'operator-task-event');
  const resultPayload=input.result==null?{}:input.result;

  const updateTask=db.prepare(`
    UPDATE operator_tasks
       SET status = 'COMPLETED',
           completion_idempotency_key = ?,
           completed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
           completion_result_json = ?,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
     WHERE task_id = ?
       AND operator_id = ?
       AND status = 'ACTIVE'
       AND completion_idempotency_key IS NULL
  `).bind(
    completionKey,
    jsonText(resultPayload),
    taskId,
    operatorId
  );

  const insertEvent=db.prepare(`
    INSERT OR IGNORE INTO operator_task_events (
      event_id, task_id, event_type, actor_id, idempotency_key, event_json
    )
    SELECT ?, ?, 'COMPLETED', ?, ?, ?
     WHERE EXISTS (
       SELECT 1
         FROM operator_tasks
        WHERE task_id = ?
          AND operator_id = ?
          AND status = 'COMPLETED'
          AND completion_idempotency_key = ?
     )
  `).bind(
    eventId,
    taskId,
    operatorId,
    'complete:'+completionKey,
    jsonText(resultPayload),
    taskId,
    operatorId,
    completionKey
  );

  const batch=await db.batch([updateTask,insertEvent]);
  const changed=Number(batch&&batch[0]&&batch[0].meta&&batch[0].meta.changes||0)>0;
  const after=await readTaskById(db,taskId);

  if(changed){
    return {
      success:true,
      idempotent:false,
      mutated:true,
      task:after,
      reason:'OPERATOR_TASK_COMPLETED'
    };
  }
  if(after && after.status==='COMPLETED' && after.completionIdempotencyKey===completionKey){
    return {
      success:true,
      idempotent:true,
      mutated:false,
      task:after,
      reason:'OPERATOR_TASK_COMPLETION_ALREADY_RECORDED'
    };
  }
  throw new Error('OPERATOR_TASK_COMPLETION_CONFLICT');
}
