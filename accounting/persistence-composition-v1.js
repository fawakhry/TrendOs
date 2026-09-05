/* TrendOS Accounting persistence composition v1
 * Safe-by-default composition. D1 writes are impossible unless the caller
 * explicitly selects preview/test, enables the exact capability, opts in to
 * writes, and injects a D1-like handle. No environment/binding discovery.
 */
'use strict';

var d1 = require('./d1-persistence-adapter-v1');

function CompositionError(code, message, details) {
  var err = new Error(message);
  err.name = 'TrendOSAccountingPersistenceCompositionError';
  err.code = code;
  err.details = details || null;
  return err;
}

var WRITE_CAPABILITY = 'ACCOUNTING_D1_WRITE_PREVIEW';
var ALLOWED_STAGES = Object.freeze(['preview', 'test']);

function normalizeStage(value) {
  return String(value == null ? 'disabled' : value).trim().toLowerCase();
}

function hasCapability(capabilities, name) {
  if (!Array.isArray(capabilities)) return false;
  return capabilities.indexOf(name) !== -1;
}

function evaluateGate(options) {
  options = options || {};
  var stage = normalizeStage(options.stage);
  var allowedStage = ALLOWED_STAGES.indexOf(stage) !== -1;
  var capabilityGranted = hasCapability(options.capabilities, WRITE_CAPABILITY);
  var explicitWriteOptIn = options.allowWrite === true;
  var dbInjected = !!(options.db && typeof options.db.prepare === 'function' && typeof options.db.batch === 'function');
  var enabled = allowedStage && capabilityGranted && explicitWriteOptIn && dbInjected;

  return Object.freeze({
    enabled: enabled,
    stage: stage,
    allowedStage: allowedStage,
    capabilityGranted: capabilityGranted,
    explicitWriteOptIn: explicitWriteOptIn,
    dbInjected: dbInjected,
    capability: WRITE_CAPABILITY
  });
}

function createPersistence(options) {
  options = options || {};
  var gate = evaluateGate(options);

  if (!gate.enabled) {
    return Object.freeze({
      mode: 'ZERO_WRITE',
      gate: gate,
      async getDecision() { return null; },
      buildBatch() {
        throw CompositionError('ACCOUNTING_PERSISTENCE_ZERO_WRITE', 'Persistence is zero-write until the preview/test D1 capability gate is explicitly satisfied', gate);
      },
      async commit() {
        throw CompositionError('ACCOUNTING_PERSISTENCE_ZERO_WRITE', 'Persistence is zero-write until the preview/test D1 capability gate is explicitly satisfied', gate);
      }
    });
  }

  var adapter = d1.createD1Persistence(options.db);
  return Object.freeze({
    mode: 'D1_PREVIEW_WRITE',
    gate: gate,
    getDecision: adapter.getDecision,
    buildBatch: adapter.buildBatch,
    commit: adapter.commit
  });
}

module.exports = Object.freeze({
  WRITE_CAPABILITY: WRITE_CAPABILITY,
  ALLOWED_STAGES: ALLOWED_STAGES,
  CompositionError: CompositionError,
  evaluateGate: evaluateGate,
  createPersistence: createPersistence
});
