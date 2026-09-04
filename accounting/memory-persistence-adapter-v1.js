/* TrendOS Accounting reference persistence adapter v1
 * In-memory executable reference only. No external writes.
 */
(function (root, factory) {
  var tx = null;
  if (typeof module !== 'undefined' && module.exports) {
    tx = require('./transaction-contract-v1');
    module.exports = factory(tx);
    return;
  }
  tx = root && root.TrendOSAccountingTransactionV1;
  if (!tx) throw new Error('TrendOSAccountingTransactionV1 is required');
  root.TrendOSAccountingMemoryPersistenceV1 = factory(tx);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (tx) {
  'use strict';

  function AdapterError(code, message, details) {
    var err = new Error(message);
    err.name = 'TrendOSAccountingPersistenceError';
    err.code = code;
    err.details = details || null;
    return err;
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function ownCopy(source) {
    var out = Object.create(null);
    Object.keys(source).forEach(function (key) { out[key] = source[key]; });
    return out;
  }

  function createMemoryPersistence() {
    var decisions = Object.create(null);
    var operations = Object.create(null);
    var transactionOperations = Object.create(null);

    function getDecision(idempotencyKey) {
      return decisions[idempotencyKey] ? clone(decisions[idempotencyKey]) : null;
    }

    function snapshot() {
      return clone({
        decisions: decisions,
        operations: operations,
        transactionOperations: transactionOperations
      });
    }

    function commit(plan, options) {
      options = options || {};
      var existing = getDecision(plan && plan.idempotencyKey);
      var replay = tx.classifyReplay(existing, plan);
      if (replay.status === 'REPLAY') {
        return Object.freeze({
          status: 'REPLAY',
          idempotencyKey: replay.idempotencyKey,
          decision: replay.decision,
          transactionId: replay.transactionId,
          result: clone(replay.result)
        });
      }

      var intent = tx.persistenceIntent(plan);
      if (!intent.atomic || !intent.appendOnly) {
        throw AdapterError('UNSAFE_PERSISTENCE_INTENT', 'Reference adapter requires atomic append-only persistence intent');
      }

      var stagedDecisions = ownCopy(decisions);
      var stagedOperations = ownCopy(operations);
      var stagedTransactionOperations = ownCopy(transactionOperations);
      var operationIds = [];
      var seenInIntent = Object.create(null);

      intent.operations.forEach(function (operation) {
        if (!operation || !operation.operationId) {
          throw AdapterError('INVALID_OPERATION', 'Every persisted operation requires a stable operationId');
        }
        if (seenInIntent[operation.operationId]) {
          throw AdapterError('DUPLICATE_OPERATION_ID', 'Duplicate operation ID inside one transaction', {
            operationId: operation.operationId
          });
        }
        if (stagedOperations[operation.operationId]) {
          throw AdapterError('OPERATION_ID_COLLISION', 'Operation ID already belongs to a persisted transaction', {
            operationId: operation.operationId
          });
        }
        seenInIntent[operation.operationId] = true;
        operationIds.push(operation.operationId);
        stagedOperations[operation.operationId] = clone({
          transactionId: intent.transactionId,
          idempotencyKey: intent.idempotencyKey,
          operation: operation
        });
      });

      if (stagedDecisions[intent.idempotencyKey]) {
        throw AdapterError('IDEMPOTENCY_DECISION_COLLISION', 'Final decision already exists for idempotency key', {
          idempotencyKey: intent.idempotencyKey
        });
      }

      stagedDecisions[intent.idempotencyKey] = clone(intent.decisionRecord);
      stagedTransactionOperations[intent.transactionId] = operationIds.slice();

      // Deterministic fault injection for atomicity regression testing.
      // Failure occurs after all validation/staging but before the state swap.
      if (options.failBeforeCommit === true) {
        throw AdapterError('SIMULATED_ATOMIC_ABORT', 'Simulated failure before atomic in-memory commit');
      }

      decisions = stagedDecisions;
      operations = stagedOperations;
      transactionOperations = stagedTransactionOperations;

      return Object.freeze({
        status: 'COMMITTED',
        idempotencyKey: intent.idempotencyKey,
        decision: intent.finalDecision,
        transactionId: intent.transactionId,
        operationCount: operationIds.length,
        result: clone(intent.decisionRecord.result)
      });
    }

    return Object.freeze({
      getDecision: getDecision,
      commit: commit,
      snapshot: snapshot
    });
  }

  return Object.freeze({
    AdapterError: AdapterError,
    createMemoryPersistence: createMemoryPersistence
  });
});
