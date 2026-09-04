/* TrendOS Accounting transaction/idempotency contract v1
 * Pure deterministic coordination logic. No external writes.
 */
(function (root, factory) {
  var domain = null;
  if (typeof module !== 'undefined' && module.exports) {
    domain = require('./domain-core-v1');
    module.exports = factory(domain);
    return;
  }
  domain = root && root.TrendOSAccountingDomainV1;
  if (!domain) throw new Error('TrendOSAccountingDomainV1 is required');
  root.TrendOSAccountingTransactionV1 = factory(domain);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (domain) {
  'use strict';

  var DECISIONS = Object.freeze({
    COMPLETED: 'completed',
    FAILED: 'failed',
    AMBIGUOUS: 'ambiguous'
  });

  function ContractError(code, message, details) {
    var err = new Error(message);
    err.name = 'TrendOSAccountingTransactionError';
    err.code = code;
    err.details = details || null;
    return err;
  }

  function nonEmpty(value, label, fallback) {
    var raw = value == null ? fallback : value;
    var out = String(raw == null ? '' : raw).trim();
    if (!out) throw ContractError('INVALID_EVENT_FIELD', (label || 'value') + ' is required');
    return out;
  }

  function positive(value, label) {
    var n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      throw ContractError('INVALID_EVENT_QUANTITY', (label || 'quantity') + ' must be greater than zero', { value: value });
    }
    return n;
  }

  function canonicalize(value) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw ContractError('NON_CANONICAL_VALUE', 'Canonical payload cannot contain non-finite numbers');
      return value;
    }
    if (Array.isArray(value)) return value.map(canonicalize);
    if (typeof value === 'object') {
      var out = {};
      Object.keys(value).sort().forEach(function (key) {
        if (typeof value[key] === 'undefined') return;
        if (typeof value[key] === 'function' || typeof value[key] === 'symbol') {
          throw ContractError('NON_CANONICAL_VALUE', 'Canonical payload cannot contain functions or symbols', { key: key });
        }
        out[key] = canonicalize(value[key]);
      });
      return out;
    }
    throw ContractError('NON_CANONICAL_VALUE', 'Unsupported canonical payload value', { type: typeof value });
  }

  function canonicalJson(value) {
    return JSON.stringify(canonicalize(value));
  }

  // Deterministic conflict-detection fingerprint. It is not a security hash.
  function fingerprint(value) {
    var text = typeof value === 'string' ? value : canonicalJson(value);
    var hash = 0x811c9dc5;
    for (var i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return 'FNV1A32-' + hash.toString(16).toUpperCase().padStart(8, '0');
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  function normalizeEventIdentity(args) {
    args = args || {};
    var eventId = domain.normalizeEventId(args.eventId);
    var orderId = domain.normalizeOrderId(args.orderId);
    var lineId = domain.normalizeLineId(args.lineId, orderId);
    var sourceTransactionId = String(args.sourceTransactionId || eventId).trim().toUpperCase();
    if (!sourceTransactionId) throw ContractError('INVALID_SOURCE_TRANSACTION_ID', 'Source Transaction ID is required');

    return deepFreeze({
      eventId: eventId,
      idempotencyKey: eventId,
      orderId: orderId,
      lineId: lineId,
      sourceTransactionId: sourceTransactionId,
      eventType: nonEmpty(args.eventType, 'eventType', 'FORMATION_REQUESTED').toUpperCase(),
      sourceVersion: nonEmpty(args.sourceVersion, 'sourceVersion', 'v1')
    });
  }

  function buildFormationEventPayload(args, identity) {
    return deepFreeze({
      eventId: identity.eventId,
      eventType: identity.eventType,
      sourceVersion: identity.sourceVersion,
      sourceTransactionId: identity.sourceTransactionId,
      orderId: identity.orderId,
      lineId: identity.lineId,
      itemId: domain.normalizeItemId(args.itemId),
      quantity: positive(args.quantity, 'quantity')
    });
  }

  function buildBasePlan(identity, payload, decision, operations, result) {
    var payloadJson = canonicalJson(payload);
    var payloadFingerprint = fingerprint(payloadJson);
    var transactionId = identity.eventId + '-TXN';
    var decisionId = identity.eventId + '-DECISION';
    var normalizedOperations = (operations || []).map(function (operation, index) {
      return deepFreeze({
        operationId: transactionId + '-OP-' + String(index + 1).padStart(3, '0'),
        operationType: operation.operationType,
        payload: operation.payload
      });
    });

    return deepFreeze({
      contractVersion: 'TRENDOS-ACCOUNTING-TX-V1',
      transactionId: transactionId,
      decisionId: decisionId,
      eventId: identity.eventId,
      idempotencyKey: identity.idempotencyKey,
      orderId: identity.orderId,
      lineId: identity.lineId,
      sourceTransactionId: identity.sourceTransactionId,
      eventType: identity.eventType,
      sourceVersion: identity.sourceVersion,
      payload: payload,
      payloadFingerprint: payloadFingerprint,
      decision: decision,
      operations: normalizedOperations,
      result: result
    });
  }

  function planFormationTransaction(args) {
    args = args || {};
    var identity = normalizeEventIdentity(args);
    var payload = buildFormationEventPayload(args, identity);
    var formation = domain.planFormationMovements(args);

    if (!formation.ok) {
      return buildBasePlan(identity, payload, DECISIONS.FAILED, [], deepFreeze({
        code: 'INSUFFICIENT_STOCK',
        recognizedCost: formation.recognizedCost,
        shortages: formation.shortages
      }));
    }

    var operations = formation.movements.map(function (movement) {
      return {
        operationType: 'STOCK_MOVEMENT_APPEND',
        payload: movement
      };
    });

    return buildBasePlan(identity, payload, DECISIONS.COMPLETED, operations, deepFreeze({
      code: 'FORMATION_PLANNED',
      recognizedCost: formation.recognizedCost,
      movementCount: formation.movements.length
    }));
  }

  function normalizeStoredDecision(existing) {
    if (!existing) return null;
    var key = domain.normalizeEventId(existing.idempotencyKey || existing.eventId);
    var decision = String(existing.decision || '').trim().toLowerCase();
    if (!DECISIONS[decision.toUpperCase()]) {
      throw ContractError('INVALID_STORED_DECISION', 'Stored idempotency decision is invalid', { decision: existing.decision });
    }
    var payloadFingerprint = nonEmpty(existing.payloadFingerprint, 'payloadFingerprint');
    return {
      idempotencyKey: key,
      payloadFingerprint: payloadFingerprint,
      decision: decision,
      transactionId: existing.transactionId || null,
      result: existing.result || null
    };
  }

  function classifyReplay(existing, incomingPlan) {
    if (!incomingPlan || !incomingPlan.idempotencyKey || !incomingPlan.payloadFingerprint) {
      throw ContractError('INVALID_INCOMING_PLAN', 'Incoming transaction plan is incomplete');
    }
    var stored = normalizeStoredDecision(existing);
    if (!stored) {
      return deepFreeze({ status: 'NEW', idempotencyKey: incomingPlan.idempotencyKey });
    }

    if (stored.idempotencyKey !== incomingPlan.idempotencyKey) {
      throw ContractError('IDEMPOTENCY_KEY_MISMATCH', 'Stored decision key does not match incoming plan', {
        stored: stored.idempotencyKey,
        incoming: incomingPlan.idempotencyKey
      });
    }

    if (stored.payloadFingerprint !== incomingPlan.payloadFingerprint) {
      throw ContractError('IDEMPOTENCY_KEY_REUSE_CONFLICT', 'Same Event ID was reused with a different canonical payload', {
        idempotencyKey: incomingPlan.idempotencyKey,
        storedFingerprint: stored.payloadFingerprint,
        incomingFingerprint: incomingPlan.payloadFingerprint
      });
    }

    return deepFreeze({
      status: 'REPLAY',
      idempotencyKey: stored.idempotencyKey,
      decision: stored.decision,
      transactionId: stored.transactionId,
      result: stored.result
    });
  }

  function persistenceIntent(plan) {
    if (!plan || !plan.idempotencyKey || !plan.payloadFingerprint) {
      throw ContractError('INVALID_INCOMING_PLAN', 'Transaction plan is required');
    }
    return deepFreeze({
      atomic: true,
      appendOnly: true,
      idempotencyKey: plan.idempotencyKey,
      payloadFingerprint: plan.payloadFingerprint,
      finalDecision: plan.decision,
      transactionId: plan.transactionId,
      operations: plan.operations,
      decisionRecord: {
        decisionId: plan.decisionId,
        idempotencyKey: plan.idempotencyKey,
        payloadFingerprint: plan.payloadFingerprint,
        decision: plan.decision,
        transactionId: plan.transactionId,
        orderId: plan.orderId,
        lineId: plan.lineId,
        sourceTransactionId: plan.sourceTransactionId,
        result: plan.result
      }
    });
  }

  return Object.freeze({
    DECISIONS: DECISIONS,
    ContractError: ContractError,
    canonicalize: canonicalize,
    canonicalJson: canonicalJson,
    fingerprint: fingerprint,
    normalizeEventIdentity: normalizeEventIdentity,
    planFormationTransaction: planFormationTransaction,
    classifyReplay: classifyReplay,
    persistenceIntent: persistenceIntent
  });
});
