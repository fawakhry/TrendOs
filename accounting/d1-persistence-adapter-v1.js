/* TrendOS Accounting D1 persistence adapter v1
 * PREPARED/isolated adapter. The database handle is injected by the caller.
 * This module does not create bindings, run migrations, or select production.
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
  root.TrendOSAccountingD1PersistenceV1 = factory(tx);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (tx) {
  'use strict';

  function AdapterError(code, message, details) {
    var err = new Error(message);
    err.name = 'TrendOSAccountingD1PersistenceError';
    err.code = code;
    err.details = details || null;
    return err;
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function required(value, label) {
    var out = String(value == null ? '' : value).trim();
    if (!out) throw AdapterError('INVALID_PERSISTENCE_FIELD', (label || 'value') + ' is required');
    return out;
  }

  function nonNegativeNumber(value, label) {
    var n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      throw AdapterError('INVALID_PERSISTENCE_NUMBER', (label || 'value') + ' must be a finite non-negative number', { value: value });
    }
    return n;
  }

  // Domain costs are expressed in EGP. D1 stores canonical integer piastres.
  function toMinorUnits(value, label) {
    return Math.round(nonNegativeNumber(value, label) * 100);
  }

  function normalizeMovement(operation, intent) {
    if (!operation || operation.operationType !== 'STOCK_MOVEMENT_APPEND') {
      throw AdapterError('UNSUPPORTED_OPERATION', 'D1 adapter v1 accepts STOCK_MOVEMENT_APPEND only', {
        operationType: operation && operation.operationType
      });
    }
    var p = operation.payload || {};
    var quantityIn = nonNegativeNumber(p.quantityIn, 'quantityIn');
    var quantityOut = nonNegativeNumber(p.quantityOut, 'quantityOut');
    if (!((quantityIn > 0 && quantityOut === 0) || (quantityOut > 0 && quantityIn === 0))) {
      throw AdapterError('INVALID_STOCK_MOVEMENT', 'Exactly one of quantityIn/quantityOut must be positive');
    }
    return Object.freeze({
      operationId: required(operation.operationId, 'operationId'),
      stockMovementId: required(p.stockMovementId, 'stockMovementId'),
      transactionId: required(intent.transactionId, 'transactionId'),
      transactionIdempotencyKey: required(intent.idempotencyKey, 'idempotencyKey'),
      movementIdempotencyKey: required(p.idempotencyKey, 'movement idempotencyKey'),
      movementType: required(p.movementType, 'movementType'),
      itemId: required(p.itemId, 'itemId'),
      quantityIn: quantityIn,
      quantityOut: quantityOut,
      unit: required(p.unit, 'unit'),
      unitCostMinor: toMinorUnits(p.unitCost, 'unitCost'),
      recognizedCostMinor: toMinorUnits(p.recognizedCost, 'recognizedCost'),
      orderId: required(p.orderId, 'orderId'),
      lineId: required(p.lineId, 'lineId'),
      sourceTransactionId: required(p.sourceTransactionId, 'sourceTransactionId')
    });
  }

  function validateDb(db) {
    if (!db || typeof db.prepare !== 'function' || typeof db.batch !== 'function') {
      throw AdapterError('INVALID_D1_HANDLE', 'Injected D1 handle must expose prepare() and batch()');
    }
    return db;
  }

  function createD1Persistence(db) {
    db = validateDb(db);

    async function getDecision(idempotencyKey) {
      var key = required(idempotencyKey, 'idempotencyKey');
      var row = await db.prepare(
        'SELECT idempotency_key, transaction_id, command_fingerprint, status, result_json ' +
        'FROM accounting_operation_idempotency WHERE idempotency_key = ?1 LIMIT 1'
      ).bind(key).first();
      if (!row) return null;
      var result = null;
      try { result = JSON.parse(row.result_json || 'null'); } catch (err) {
        throw AdapterError('INVALID_STORED_RESULT_JSON', 'Stored operational idempotency result is not valid JSON', { idempotencyKey: key });
      }
      return {
        idempotencyKey: row.idempotency_key,
        payloadFingerprint: row.command_fingerprint,
        decision: row.status,
        transactionId: row.transaction_id,
        result: result
      };
    }

    function buildBatch(plan) {
      var intent = tx.persistenceIntent(plan);
      if (!intent.atomic || !intent.appendOnly) {
        throw AdapterError('UNSAFE_PERSISTENCE_INTENT', 'D1 adapter requires atomic append-only persistence intent');
      }

      var movements = intent.operations.map(function (operation) {
        return normalizeMovement(operation, intent);
      });
      var decision = intent.decisionRecord;
      var statements = [];

      statements.push(db.prepare(
        'INSERT INTO accounting_operation_idempotency ' +
        '(idempotency_key, transaction_id, command_fingerprint, status, order_id, line_id, source_transaction_id, result_json) ' +
        'VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)'
      ).bind(
        intent.idempotencyKey,
        intent.transactionId,
        intent.payloadFingerprint,
        intent.finalDecision,
        required(decision.orderId, 'orderId'),
        required(decision.lineId, 'lineId'),
        required(decision.sourceTransactionId, 'sourceTransactionId'),
        JSON.stringify(decision.result == null ? null : decision.result)
      ));

      movements.forEach(function (m) {
        statements.push(db.prepare(
          'INSERT INTO accounting_stock_movements ' +
          '(operation_id, stock_movement_id, transaction_id, transaction_idempotency_key, movement_idempotency_key, movement_type, item_id, quantity_in, quantity_out, unit, unit_cost_minor, recognized_cost_minor, order_id, line_id, source_transaction_id) ' +
          'VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)'
        ).bind(
          m.operationId, m.stockMovementId, m.transactionId, m.transactionIdempotencyKey,
          m.movementIdempotencyKey, m.movementType, m.itemId, m.quantityIn, m.quantityOut,
          m.unit, m.unitCostMinor, m.recognizedCostMinor, m.orderId, m.lineId, m.sourceTransactionId
        ));
      });

      return Object.freeze({ intent: intent, movements: movements, statements: statements });
    }

    async function commit(plan) {
      var existing = await getDecision(plan && plan.idempotencyKey);
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

      var batch = buildBatch(plan);
      try {
        await db.batch(batch.statements);
      } catch (err) {
        // A concurrent identical request may win the unique-key race. Re-read and
        // classify it deterministically; conflicting reuse still throws.
        var raced = await getDecision(plan.idempotencyKey);
        if (raced) {
          var racedReplay = tx.classifyReplay(raced, plan);
          if (racedReplay.status === 'REPLAY') {
            return Object.freeze({
              status: 'REPLAY',
              idempotencyKey: racedReplay.idempotencyKey,
              decision: racedReplay.decision,
              transactionId: racedReplay.transactionId,
              result: clone(racedReplay.result)
            });
          }
        }
        throw err;
      }

      return Object.freeze({
        status: 'COMMITTED',
        idempotencyKey: batch.intent.idempotencyKey,
        decision: batch.intent.finalDecision,
        transactionId: batch.intent.transactionId,
        operationCount: batch.movements.length,
        result: clone(batch.intent.decisionRecord.result)
      });
    }

    return Object.freeze({
      getDecision: getDecision,
      buildBatch: buildBatch,
      commit: commit
    });
  }

  return Object.freeze({
    AdapterError: AdapterError,
    toMinorUnits: toMinorUnits,
    createD1Persistence: createD1Persistence
  });
});
