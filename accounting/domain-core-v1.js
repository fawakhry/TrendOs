/* TrendOS Accounting domain core v1
 * Pure deterministic business logic. No external writes.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.TrendOSAccountingDomainV1 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ITEM_TYPES = Object.freeze({
    RAW_MATERIAL: 'RAW_MATERIAL',
    SEMI_FINISHED: 'SEMI_FINISHED',
    FINISHED_PRODUCT: 'FINISHED_PRODUCT',
    SERVICE: 'SERVICE'
  });

  function DomainError(code, message, details) {
    var err = new Error(message);
    err.name = 'TrendOSAccountingDomainError';
    err.code = code;
    err.details = details || null;
    return err;
  }

  function normalizeId(value, label) {
    var v = String(value == null ? '' : value).trim().toUpperCase();
    if (!v) throw DomainError('INVALID_ID', (label || 'ID') + ' is required');
    if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(v)) {
      throw DomainError('INVALID_ID', (label || 'ID') + ' contains unsupported characters', { value: value });
    }
    return v;
  }

  function normalizeOrderId(value) {
    var v = normalizeId(value, 'Order ID');
    if (!/^TM[A-Z0-9_-]*\d[A-Z0-9_-]*$/.test(v)) {
      throw DomainError('INVALID_ORDER_ID', 'Order ID must be a stable TrendOS order identifier', { value: value });
    }
    return v;
  }

  function normalizeLineId(value, orderId) {
    var v = normalizeId(value, 'Line ID');
    var order = orderId ? normalizeOrderId(orderId) : null;
    if (order && v.indexOf(order + '-') !== 0) {
      throw DomainError('LINE_ORDER_MISMATCH', 'Line ID must belong to the supplied Order ID', {
        lineId: v,
        orderId: order
      });
    }
    return v;
  }

  function normalizeItemId(value) { return normalizeId(value, 'Item ID'); }
  function normalizeInvoiceId(value) { return normalizeId(value, 'Invoice ID'); }
  function normalizePurchaseId(value) { return normalizeId(value, 'Purchase ID'); }
  function normalizeStockMovementId(value) { return normalizeId(value, 'Stock Movement ID'); }
  function normalizePaymentId(value) { return normalizeId(value, 'Payment ID'); }

  function finiteNonNegative(value, label) {
    var n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      throw DomainError('INVALID_NUMBER', (label || 'value') + ' must be a finite non-negative number', { value: value });
    }
    return n;
  }

  function positive(value, label) {
    var n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      throw DomainError('INVALID_QUANTITY', (label || 'quantity') + ' must be greater than zero', { value: value });
    }
    return n;
  }

  function createItem(input) {
    input = input || {};
    var itemType = String(input.itemType || '').toUpperCase();
    if (!ITEM_TYPES[itemType]) {
      throw DomainError('INVALID_ITEM_TYPE', 'Unsupported item type', { itemType: input.itemType });
    }
    return Object.freeze({
      itemId: normalizeItemId(input.itemId),
      name: String(input.name || '').trim(),
      itemType: itemType,
      baseUnit: String(input.baseUnit || 'piece').trim(),
      productionPolicy: String(input.productionPolicy || 'MANUAL').toUpperCase(),
      recognizedUnitCost: finiteNonNegative(input.recognizedUnitCost || 0, 'recognizedUnitCost')
    });
  }

  function createBomLine(input) {
    input = input || {};
    return Object.freeze({
      componentItemId: normalizeItemId(input.componentItemId),
      quantity: positive(input.quantity, 'BOM quantity'),
      wasteRate: finiteNonNegative(input.wasteRate || 0, 'wasteRate')
    });
  }

  function buildCatalog(items) {
    var out = Object.create(null);
    (items || []).forEach(function (item) {
      var normalized = item && item.itemId ? createItem(item) : createItem(item || {});
      if (out[normalized.itemId]) {
        throw DomainError('DUPLICATE_ITEM_ID', 'Duplicate Item ID', { itemId: normalized.itemId });
      }
      out[normalized.itemId] = normalized;
    });
    return out;
  }

  function buildBomMap(boms) {
    var out = Object.create(null);
    Object.keys(boms || {}).forEach(function (parentId) {
      var p = normalizeItemId(parentId);
      out[p] = (boms[parentId] || []).map(createBomLine);
    });
    return out;
  }

  function expandBomRequirements(args) {
    args = args || {};
    var targetItemId = normalizeItemId(args.itemId);
    var targetQty = positive(args.quantity, 'quantity');
    var catalog = buildCatalog(args.items || []);
    var bomMap = buildBomMap(args.boms || {});
    var stock = args.stock || {};
    var consumeAvailableIntermediates = args.consumeAvailableIntermediates !== false;
    var requirements = Object.create(null);
    var trace = [];

    if (!catalog[targetItemId]) {
      throw DomainError('UNKNOWN_ITEM', 'Target item does not exist in catalog', { itemId: targetItemId });
    }

    function stockQty(itemId) {
      var raw = stock[itemId] == null ? stock[String(itemId)] : stock[itemId];
      return finiteNonNegative(raw || 0, 'stock quantity');
    }

    function addRequirement(itemId, qty, reason) {
      requirements[itemId] = (requirements[itemId] || 0) + qty;
      trace.push({ type: 'REQUIRE', itemId: itemId, quantity: qty, reason: reason });
    }

    function resolve(itemId, qtyNeeded, stack, isRoot) {
      var item = catalog[itemId];
      if (!item) throw DomainError('UNKNOWN_ITEM', 'BOM references an unknown item', { itemId: itemId });
      if (stack.indexOf(itemId) !== -1) {
        throw DomainError('BOM_CYCLE', 'BOM cycle detected', { path: stack.concat([itemId]) });
      }

      var bomLines = bomMap[itemId] || [];
      var available = isRoot ? 0 : stockQty(itemId);
      var useFromStock = consumeAvailableIntermediates ? Math.min(available, qtyNeeded) : 0;
      if (useFromStock > 0) addRequirement(itemId, useFromStock, 'AVAILABLE_STOCK');

      var remaining = qtyNeeded - useFromStock;
      if (remaining <= 0) return;

      if (!bomLines.length || item.itemType === ITEM_TYPES.RAW_MATERIAL || item.itemType === ITEM_TYPES.SERVICE) {
        addRequirement(itemId, remaining, 'LEAF_COMPONENT');
        return;
      }

      var nextStack = stack.concat([itemId]);
      trace.push({ type: 'EXPAND', itemId: itemId, quantity: remaining });
      bomLines.forEach(function (line) {
        var gross = remaining * line.quantity * (1 + line.wasteRate);
        resolve(line.componentItemId, gross, nextStack, false);
      });
    }

    resolve(targetItemId, targetQty, [], true);

    return {
      itemId: targetItemId,
      quantity: targetQty,
      requirements: requirements,
      trace: trace
    };
  }

  function evaluateStockSufficiency(requirements, stock) {
    var shortages = [];
    var allocations = [];
    Object.keys(requirements || {}).sort().forEach(function (itemId) {
      var required = finiteNonNegative(requirements[itemId], 'required quantity');
      var available = finiteNonNegative((stock || {})[itemId] || 0, 'stock quantity');
      var allocated = Math.min(required, available);
      allocations.push({ itemId: itemId, required: required, available: available, allocated: allocated });
      if (available + 1e-9 < required) {
        shortages.push({ itemId: itemId, required: required, available: available, shortage: required - available });
      }
    });
    return { ok: shortages.length === 0, shortages: shortages, allocations: allocations };
  }

  function calculateRecognizedCost(requirements, items) {
    var catalog = buildCatalog(items || []);
    var lines = [];
    var total = 0;
    Object.keys(requirements || {}).sort().forEach(function (itemId) {
      var item = catalog[normalizeItemId(itemId)];
      if (!item) throw DomainError('UNKNOWN_ITEM', 'Cost calculation references unknown item', { itemId: itemId });
      var qty = finiteNonNegative(requirements[itemId], 'required quantity');
      var lineCost = qty * item.recognizedUnitCost;
      total += lineCost;
      lines.push({ itemId: item.itemId, quantity: qty, unitCost: item.recognizedUnitCost, recognizedCost: lineCost });
    });
    return { recognizedCost: total, lines: lines };
  }

  function planFormation(args) {
    var expansion = expandBomRequirements(args);
    var stockResult = evaluateStockSufficiency(expansion.requirements, args.stock || {});
    var cost = calculateRecognizedCost(expansion.requirements, args.items || []);
    return {
      ok: stockResult.ok,
      itemId: expansion.itemId,
      quantity: expansion.quantity,
      requirements: expansion.requirements,
      shortages: stockResult.shortages,
      allocations: stockResult.allocations,
      recognizedCost: cost.recognizedCost,
      costLines: cost.lines,
      trace: expansion.trace,
      mutation: null
    };
  }

  return Object.freeze({
    ITEM_TYPES: ITEM_TYPES,
    DomainError: DomainError,
    normalizeOrderId: normalizeOrderId,
    normalizeLineId: normalizeLineId,
    normalizeItemId: normalizeItemId,
    normalizeInvoiceId: normalizeInvoiceId,
    normalizePurchaseId: normalizePurchaseId,
    normalizeStockMovementId: normalizeStockMovementId,
    normalizePaymentId: normalizePaymentId,
    createItem: createItem,
    createBomLine: createBomLine,
    expandBomRequirements: expandBomRequirements,
    evaluateStockSufficiency: evaluateStockSufficiency,
    calculateRecognizedCost: calculateRecognizedCost,
    planFormation: planFormation
  });
});
