/* TrendOS Cloud Write Reconciliation Core V1
 *
 * Shared state machine for Cloud Write outbox reconciliation. Production does
 * not route this module. Staging may use the explicit `staging-verified` mode,
 * which must never claim that Google Sheets was written.
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

function completionConfig(options = {}) {
  if (text(options.completionMode) === 'staging-verified') {
    return {
      successState: 'staging_verified',
      outboxSuccessStatus: 'staging_verified',
      eventSuccessStatus: 'staging_verified',
      sheetsSuccessStatus: 'not_written_staging',
      retrySheetsStatus: 'not_written_staging',
      failureEventStatus: 'staging_verification_failed',
      failureSheetsStatus: 'not_written_staging',
      label: 'Staging verification',
      defaultNote: 'STAGING_VERIFY_ONLY: payload verified; NO_SHEETS_WRITE',
      sheetsWritten: false
    };
  }
  return {
    successState: 'synced',
    outboxSuccessStatus: 'synced',
    eventSuccessStatus: 'reconciled',
    sheetsSuccessStatus: 'synced',
    retrySheetsStatus: 'retrying',
    failureEventStatus: 'reconciliation_failed',
    failureSheetsStatus: 'failed',
    label: 'Sheets reconciliation',
    defaultNote: 'Sheets reconciliation synced',
    sheetsWritten: true
  };
}

export function reconciliationBackoffSeconds(attempts) {
  const n = Math.max(1, Math.trunc(Number(attempts) || 1));
  return Math.min(3600, 15 * (2 ** Math.min(7, n - 1)));
}

async function selectCandidate(DB, nowIso, options = {}) {
  const clauses = [
    "status IN ('pending','retry','processing')",
    'next_attempt_at <= ?'
  ];
  const binds = [nowIso];

  const targetEntityType = text(options.targetEntityType);
  const targetEntityId = text(options.targetEntityId);
  const targetOperation = text(options.targetOperation);

  if (targetEntityType) {
    clauses.push('entity_type = ?');
    binds.push(targetEntityType);
  }
  if (targetEntityId) {
    clauses.push('entity_id = ?');
    binds.push(targetEntityId);
  }
  if (targetOperation) {
    clauses.push('operation = ?');
    binds.push(targetOperation);
  }

  const statement = DB.prepare(`
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
     WHERE ${clauses.join('\n       AND ')}
     ORDER BY id ASC
     LIMIT 1
  `).bind(...binds);

  return statement.first();
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

async function markCompleted(DB, item, transportResult, completion) {
  const note = text(transportResult && (transportResult.note || transportResult.message)) || completion.defaultNote;
  await DB.batch([
    DB.prepare(`
      UPDATE cloud_write_outbox
         SET status = ?,
             last_error = '',
             updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'processing'
    `).bind(completion.outboxSuccessStatus, item.id),
    DB.prepare(`
      UPDATE cloud_write_events
         SET status = ?,
             sheets_status = ?,
             updated_at = CURRENT_TIMESTAMP,
             note = ?
       WHERE idempotency_key = ?
    `).bind(
      completion.eventSuccessStatus,
      completion.sheetsSuccessStatus,
      note.slice(0, 500),
      item.eventKey
    )
  ]);
}

async function markRetry(DB, item, errorMessage, nowMs, completion) {
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
         SET sheets_status = ?,
             updated_at = CURRENT_TIMESTAMP,
             note = ?
       WHERE idempotency_key = ?
    `).bind(
      completion.retrySheetsStatus,
      (`${completion.label} retry: ` + text(errorMessage)).slice(0, 500),
      item.eventKey
    )
  ]);
  return nextAttemptAt;
}

async function markFailed(DB, item, errorMessage, completion) {
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
         SET status = ?,
             sheets_status = ?,
             updated_at = CURRENT_TIMESTAMP,
             note = ?
       WHERE idempotency_key = ?
    `).bind(
      completion.failureEventStatus,
      completion.failureSheetsStatus,
      (`${completion.label} failed: ` + text(errorMessage)).slice(0, 500),
      item.eventKey
    )
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
  const completion = completionConfig(options);

  const candidate = await selectCandidate(env.DB, nowIso, options);
  if (!candidate) return { success: true, state: 'idle', processed: false, sheetsWritten: false };

  const item = await claimCandidate(env.DB, candidate, nowMs, leaseSeconds);
  if (!item) return { success: true, state: 'contended', processed: false, sheetsWritten: false };

  let payload;
  try {
    payload = parsePayload(item);
  } catch (err) {
    await markFailed(env.DB, item, err.message, completion);
    return {
      success: false,
      state: 'failed',
      processed: true,
      eventKey: item.eventKey,
      entityId: item.entityId,
      attempts: Number(item.attempts || 0),
      sheetsWritten: false,
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
      throw new Error(text(result && (result.message || result.error)) || 'Reconciliation transport did not confirm success');
    }
    if (text(result.entityId || result.orderId) && text(result.entityId || result.orderId) !== text(item.entityId)) {
      throw new Error('Reconciliation entity mismatch');
    }

    await markCompleted(env.DB, item, result, completion);
    return {
      success: true,
      state: completion.successState,
      processed: true,
      eventKey: item.eventKey,
      entityId: item.entityId,
      attempts: Number(item.attempts || 0),
      sheetsWritten: completion.sheetsWritten
    };
  } catch (err) {
    const message = text(err && err.message) || 'Unknown reconciliation failure';
    const attempts = Number(item.attempts || 0);
    if (attempts >= maxAttempts) {
      await markFailed(env.DB, item, message, completion);
      return {
        success: false,
        state: 'failed',
        processed: true,
        eventKey: item.eventKey,
        entityId: item.entityId,
        attempts,
        sheetsWritten: false,
        error: message
      };
    }

    const nextAttemptAt = await markRetry(env.DB, item, message, nowMs, completion);
    return {
      success: false,
      state: 'retry',
      processed: true,
      eventKey: item.eventKey,
      entityId: item.entityId,
      attempts,
      nextAttemptAt,
      sheetsWritten: false,
      error: message
    };
  }
}
