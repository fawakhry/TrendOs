import { decideAutonomyV1 } from './autonomy-policy-v1.mjs';

function text(v){ return String(v == null ? '' : v).trim(); }

function toHex(bytes){
  return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function canonicalizeValue(value){
  if(value === null) return null;
  if(value instanceof Date) return value.toISOString();

  const type=typeof value;
  if(type==='string'||type==='boolean') return value;
  if(type==='number') return Number.isFinite(value)?value:null;
  if(type==='bigint') return value.toString();
  if(type==='undefined'||type==='function'||type==='symbol') return undefined;

  if(Array.isArray(value)){
    return value.map(item=>{
      const next=canonicalizeValue(item);
      return next===undefined?null:next;
    });
  }

  if(type==='object'){
    const out={};
    Object.keys(value).sort().forEach(key=>{
      const next=canonicalizeValue(value[key]);
      if(next!==undefined) out[key]=next;
    });
    return out;
  }

  return text(value);
}

export function stableCanonicalJsonV1(input){
  const normalized=canonicalizeValue(input==null?{}:input);
  return JSON.stringify(normalized===undefined?null:normalized);
}

export async function autonomyInputHashV1(input){
  const canonical = stableCanonicalJsonV1(input || {});
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return toHex(new Uint8Array(digest));
}

export async function recordAutonomyShadowEventV1(db, input = {}, options = {}){
  if(!db || typeof db.prepare !== 'function') throw new Error('AUTONOMY_DB_REQUIRED');

  const policyVersion = text(options.policyVersion || 'v1');
  const taskKey = text(input.taskKey);
  const family = text(input.family).toUpperCase();
  const minConfidence = options.minConfidence == null ? 0.92 : options.minConfidence;
  if(!taskKey) throw new Error('AUTONOMY_TASK_KEY_REQUIRED');
  if(!family) throw new Error('AUTONOMY_TASK_FAMILY_REQUIRED');

  const actualDecision = decideAutonomyV1(input, {
    autopilotEnabled: false,
    minConfidence
  });

  const recommendedDecision = decideAutonomyV1(input, {
    autopilotEnabled: true,
    minConfidence
  });

  const inputHash = await autonomyInputHashV1(input);
  const eventId = text(options.eventId || ('autonomy-' + inputHash.slice(0,24)));

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO autonomy_events (
      event_id, task_family, task_key, order_id, line_id, actor_kind,
      decision, reason, target_queue,
      recommended_decision, recommended_reason, recommended_target_queue,
      confidence, policy_version, input_hash, execution_status
    ) VALUES (?, ?, ?, ?, ?, 'AI', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SHADOW_ONLY')
  `);

  const result = await stmt.bind(
    eventId,
    family,
    taskKey,
    text(input.orderId) || null,
    text(input.lineId) || null,
    actualDecision.decision,
    actualDecision.reason,
    actualDecision.queue,
    recommendedDecision.decision,
    recommendedDecision.reason,
    recommendedDecision.queue,
    Number(input.confidence) || 0,
    policyVersion,
    inputHash
  ).run();

  return {
    success: true,
    eventId,
    inputHash,
    decision:actualDecision,
    recommendedDecision,
    inserted: Number(result && result.meta && result.meta.changes || 0) > 0
  };
}

export async function recordAutonomyObservationV1(db, observation = {}, options = {}){
  if(!db || typeof db.prepare !== 'function') throw new Error('AUTONOMY_DB_REQUIRED');

  const eventId=text(observation.eventId);
  const observedAction=text(observation.observedAction);
  if(!eventId) throw new Error('AUTONOMY_EVENT_ID_REQUIRED');
  if(!observedAction) throw new Error('AUTONOMY_OBSERVED_ACTION_REQUIRED');

  const observerKind=text(observation.observerKind||'HUMAN').toUpperCase();
  const observerId=text(observation.observerId)||null;
  const outcome=text(observation.outcome)||null;
  const observedAt=text(observation.observedAt)||null;
  const evidence=observation.evidence==null?null:stableCanonicalJsonV1(observation.evidence);
  const matched=observation.matchedRecommendation==null?null:(observation.matchedRecommendation?1:0);

  const seed=await autonomyInputHashV1({
    eventId,
    observerKind,
    observerId,
    observedAction,
    matched,
    outcome,
    observedAt,
    evidence
  });
  const observationId=text(options.observationId||('autonomy-observation-'+seed.slice(0,24)));

  const stmt=db.prepare(`
    INSERT OR IGNORE INTO autonomy_observations (
      observation_id, event_id, observer_kind, observer_id,
      observed_action, matched_recommendation, outcome, evidence_json, observed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, strftime('%Y-%m-%dT%H:%M:%fZ','now')))
  `);

  const result=await stmt.bind(
    observationId,
    eventId,
    observerKind,
    observerId,
    observedAction,
    matched,
    outcome,
    evidence,
    observedAt
  ).run();

  return {
    success:true,
    observationId,
    inserted:Number(result && result.meta && result.meta.changes || 0)>0
  };
}

export async function readAutonomyControlV1(db){
  if(!db || typeof db.prepare !== 'function') throw new Error('AUTONOMY_DB_REQUIRED');
  const row = await db.prepare(`
    SELECT mode, policy_version AS policyVersion,
           min_confidence AS minConfidence, epoch,
           updated_by AS updatedBy, change_reason AS changeReason,
           updated_at AS updatedAt
    FROM autonomy_control
    WHERE singleton_id = 1
    LIMIT 1
  `).first();

  if(!row){
    return {
      mode:'OFF',
      policyVersion:'v1',
      minConfidence:0.92,
      epoch:0,
      updatedBy:'',
      changeReason:'',
      configured:false
    };
  }

  return {
    mode:text(row.mode || 'OFF').toUpperCase(),
    policyVersion:text(row.policyVersion || 'v1'),
    minConfidence:Number(row.minConfidence || 0.92),
    epoch:Number(row.epoch || 0),
    updatedBy:text(row.updatedBy),
    changeReason:text(row.changeReason),
    updatedAt:text(row.updatedAt),
    configured:true
  };
}
