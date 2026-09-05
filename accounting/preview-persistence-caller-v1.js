/* TrendOS Accounting preview persistence caller v1
 * Orchestrates an already-built transaction plan through the safe persistence
 * composition gate. No binding discovery, migration, deployment or production path.
 */
'use strict';

var composition = require('./persistence-composition-v1');

function CallerError(code, message, details) {
  var err = new Error(message);
  err.name = 'TrendOSAccountingPreviewPersistenceCallerError';
  err.code = code;
  err.details = details || null;
  return err;
}

function validatePlan(plan) {
  if (!plan || typeof plan !== 'object') {
    throw CallerError('ACCOUNTING_PLAN_REQUIRED', 'A transaction plan is required');
  }
  if (!plan.idempotencyKey || !plan.payloadFingerprint || !plan.decision) {
    throw CallerError('ACCOUNTING_PLAN_INCOMPLETE', 'Transaction plan is missing idempotency/fingerprint/decision fields');
  }
  return plan;
}

function createPreviewPersistenceCaller(options) {
  options = options || {};
  var persistence = composition.createPersistence(options);

  async function execute(plan) {
    validatePlan(plan);
    if (persistence.mode !== 'D1_PREVIEW_WRITE') {
      return Object.freeze({
        status: 'ZERO_WRITE',
        mode: persistence.mode,
        gate: persistence.gate,
        idempotencyKey: plan.idempotencyKey
      });
    }
    return persistence.commit(plan);
  }

  return Object.freeze({
    mode: persistence.mode,
    gate: persistence.gate,
    execute: execute
  });
}

module.exports = Object.freeze({
  CallerError: CallerError,
  createPreviewPersistenceCaller: createPreviewPersistenceCaller
});
