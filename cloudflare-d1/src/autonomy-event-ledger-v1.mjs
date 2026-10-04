import { decideAutonomyV1 } from './autonomy-policy-v1.mjs';

function text(v){ return String(v == null ? '' : v).trim(); }

function toHex(bytes){
  return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
}

export async function autonomyInputHashV1(input){
  const canonical = JSON.stringify(input || {});
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return toHex(new Uint8Array(digest));
}

export async function recordAutonomyShadowEventV1(db, input = {}, options = {}){
  if(!db || typeof db.prepare !== 'function') throw new Error('AUTONOMY_DB_REQUIRED');

  const policyVersion = text(options.policyVersion || 'v1');
  const taskKey = text(input.taskKey);
  const family = text(input.family).toUpperCase();
  if(!taskKey) throw new Error('AUTONOMY_TASK_KEY_REQUIRED');
  if(!family) throw new Error('AUTONOMY_TASK_FAMILY_REQUIRED');

  const decision = decideAutonomyV1(input, {
    autopilotEnabled: false,
    minConfidence: options.minConfidence == null ? 0.92 : options.minConfidence
  });

  const inputHash = await autonomyInputHashV1(input);
  const eventId = text(options.eventId || ('autonomy-' + inputHash.slice(0,24)));

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO autonomy_events (
      event_id, task_family, task_key, order_id, line_id, actor_kind,
      decision, reason, target_queue, confidence, policy_version,
      input_hash, execution_status
    ) VALUES (?, ?, ?, ?, ?, 'AI', ?, ?, ?, ?, ?, ?, 'SHADOW_ONLY')
  `);

  const result = await stmt.bind(
    eventId,
    family,
    taskKey,
    text(input.orderId) || null,
    text(input.lineId) || null,
    decision.decision,
    decision.reason,
    decision.queue,
    Number(input.confidence) || 0,
    policyVersion,
    inputHash
  ).run();

  return {
    success: true,
    eventId,
    inputHash,
    decision,
    inserted: Number(result && result.meta && result.meta.changes || 0) > 0
  };
}

export async function readAutonomyControlV1(db){
  if(!db || typeof db.prepare !== 'function') throw new Error('AUTONOMY_DB_REQUIRED');
  const row = await db.prepare(`
    SELECT mode, policy_version AS policyVersion,
           min_confidence AS minConfidence, epoch, updated_at AS updatedAt
    FROM autonomy_control
    WHERE singleton_id = 1
    LIMIT 1
  `).first();

  if(!row){
    return { mode:'OFF', policyVersion:'v1', minConfidence:0.92, epoch:0, configured:false };
  }

  return {
    mode:text(row.mode || 'OFF').toUpperCase(),
    policyVersion:text(row.policyVersion || 'v1'),
    minConfidence:Number(row.minConfidence || 0.92),
    epoch:Number(row.epoch || 0),
    updatedAt:text(row.updatedAt),
    configured:true
  };
}
