/* TrendOS Cloud Write Reconciliation Core V1
 *
 * Isolated state machine only. This module is intentionally NOT routed by the
 * production Worker. It advances cloud_write_outbox rows toward a future
 * Sheets reconciliation transport while keeping retries idempotent.
 */

function text(value) {
  return String(value == null ? '' : value).trim();
}

function changes(result) {
  if (!result) return 0;
  if (Number.isFinite(Number(result.changes))) return Number(result.changes);
  if (result.meta && Number.isFinite(Number(result.meta.changes))) return Number(result.meta.changes);
  return 0;
}

function iso(ms) {
  return new Date(ms).toISOString();
}

export function reconciliationBackoffSeconds(attempts) {
  const n = Math.max(1, Math.trunc(Number(attempts) || 1));
  return Math.min(3600, 15 * (2 ** Math.min(7, n - 1)));
}

async function selectCandidate(DB, nowIso) {
  return DB.prepare(`
    SELECT id,
           event_key AS eventKey,
           entity_type AS entityType,
           entity_id AS entityId,
           operation,
           status,
           attempts,
           next_attempt_at AS nextAttemptAt,
           payload_json AS payloadJson,
           last_error AS lastError
      FROM cloud_write_outbox
     WHERE status IN ('pending','retry','processing')
       AND next_attempt_at <= ?
     ORDER BY id ASC
     LIMIT 1
  `).bind(nowIso).first();
}

async function claimCandidate(DB, candidate, nowMs, leaseSeconds) {
  if (!candidate) return null;
  const leaseUntil = iso(nowMs + Math.max(30, Number(leaseSeconds) || 120) * 1000);
  const result = await DB.prepare(`
    UPDATE cloud_write_outbox
       SET status = 'processing',
           attempts = attempts + 1,
           next_attempt_at = ?,
           last_error = '',
           updated_at = CURRENT_TIMESTAMP
     WHERE id = ?
       AND status = ?
       AND attempts = ?
       AND next_attempt_at <= ?
  `).bind(
    leaseUntil,
    candidate.id,
    candidate.status,
    Number(candidate.attempts || 0),
    iso(nowMs)
  ).run();

  if (changes(result) !== 1) return null;

  return DB.prepare(`
    SELECT id,
           event_key AS eventKey,
           entity_type AS entityType,
           entity_id AS entityId,
           operation,
           status,
           attempts,
           next_attempt_at AS nextAttemptAt,
           payload_json AS payloadJson,
           last_error AS lastError
      FROM cloud_write_outbox
     WHERE id = ?
     LIMIT 1
  `).bind(candidate.id).first();
}

async function markSynced(DB, item, transportResult) {
  const note = text(transportResult && (transportResult.note || transportResult.message)) || 'Sheets reconciliation synced';
  await DB.batch([
    DB.prepare(`
      UPDATE cloud_write_outbox
         SET status = 'synced',
             last_error = '',
             updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'processing'
    `).bind(item.id),
    DB.prepare(`
      UPDATE cloud_write_events
         SET status = 'reconciled',
             sheets_status = 'synced',
             updated_at = CURRENT_TIMESTAMP,
             note = ?
       WHERE idempotency_key = ?
    `).bind(note.slice(0, 500), item.eventKey)
  ]);
}

async function markRetry(DB, item, errorMessage, nowMs) {
  const delaySeconds = reconciliationBackoffSeconds(item.attempts);
  const nextAttemptAt = iso(nowMs + delaySeconds * 1000);
  await DB.batch([
    DB.prepare(`
      UPDATE cloud_write_outbox
         SET status = 'retry',
             next_attempt_at = ?,
             last_error = ?,
             updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'processing'
    `).bind(nextAttemptAt, text(errorMessage).slice(0, 1000), item.id),
    DB.prepare(`
      UPDATE cloud_write_events
         SET sheets_status = 'retrying',
             updated_at = CURRENT_TIMESTAMP,
             note = ?
       WHERE idempotency_key = ?
    `).bind(('Sheets reconciliation retry: ' + text(errorMessage)).slice(0, 500), item.eventKey)
  ]);
  return nextAttemptAt;
}

async function markFailed(DB, item, errorMessage) {
  await DB.batch([
    DB.prepare(`
      UPDATE cloud_write_outbox
         SET status = 'failed',
             last_error = ?,
             updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'processing'
    `).bind(text(errorMessage).slice(0, 1000), item.id),
    DB.prepare(`
      UPDATE cloud_write_events
         SET status = 'reconciliation_failed',
             sheets_status = 'failed',
             updated_at = CURRENT_TIMESTAMP,
             note = ?
       WHERE idempotency_key = ?
    `).bind(('Sheets reconciliation failed: ' + text(errorMessage)).slice(0, 500), item.eventKey)
  ]);
}

function parsePayload(item) {
  try {
    return JSON.parse(item.payloadJson || '{}');
  } catch (err) {
    throw new Error('Invalid outbox payload JSON');
  }
}

export async function reconcileNextOutboxItem(env, transport, options = {}) {
  if (!env || !env.DB) throw new Error('D1 DB binding is required');
  if (typeof transport !== 'function') throw new Error('Reconciliation transport function is required');

  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
  const maxAttempts = Math.max(1, Math.min(20, Math.trunc(Number(options.maxAttempts) || 5)));
  const leaseSeconds = Math.max(30, Math.min(900, Math.trunc(Number(options.leaseSeconds) || 120)));
  const nowIso = iso(nowMs);

  const candidate = await selectCandidate(env.DB, nowIso);
  if (!candidate) return { success: true, state: 'idle', processed: false };

  const item = await claimCandidate(env.DB, candidate, nowMs, leaseSeconds);
  if (!item) return { success: true, state: 'contended', processed: false };

  let payload;
  try {
    payload = parsePayload(item);
  } catch (err) {
    await markFailed(env.DB, item, err.message);
    return {
      success: false,
      state: 'failed',
      processed: true,
      eventKey: item.eventKey,
      entityId: item.entityId,
      attempts: Number(item.attempts || 0),
      error: err.message
    };
  }

  try {
    const result = await transport({
      eventKey: item.eventKey,
      entityType: item.entityType,
      entityId: item.entityId,
      operation: item.operation,
      attempts: Number(item.attempts || 0),
      payload
    });

    if (!result || result.success !== true) {
      throw new Error(text(result && (result.message || result.error)) || 'Sheets reconciliation transport did not confirm success');
    }
    if (text(result.entityId || result.orderId) && text(result.entityId || result.orderId) !== text(item.entityId)) {
      throw new Error('Sheets reconciliation entity mismatch');
    }

    await markSynced(env.DB, item, result);
    return {
      success: true,
      state: 'synced',
      processed: true,
      eventKey: item.eventKey,
      entityId: item.entityId,
      attempts: Number(item.attempts || 0)
    };
  } catch (err) {
    const message = text(err && err.message) || 'Unknown reconciliation failure';
    const attempts = Number(item.attempts || 0);
    if (attempts >= maxAttempts) {
      await markFailed(env.DB, item, message);
      return {
        success: false,
        state: 'failed',
        processed: true,
        eventKey: item.eventKey,
        entityId: item.entityId,
        attempts,
        error: message
      };
    }

    const nextAttemptAt = await markRetry(env.DB, item, message, nowMs);
    return {
      success: false,
      state: 'retry',
      processed: true,
      eventKey: item.eventKey,
      entityId: item.entityId,
      attempts,
      nextAttemptAt,
      error: message
    };
  }
}
