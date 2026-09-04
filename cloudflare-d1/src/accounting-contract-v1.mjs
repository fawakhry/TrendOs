export const TRENDOS_ACCOUNTING_CONTRACT_VERSION = 'TRENDOS_ACCOUNTING_CONTRACT_V1_20260905';

const ENTITY_TYPES = [
  'SalesInvoice','SalesInvoiceLine','Payment','Purchase','PurchaseLine','Expense',
  'Item','BOM','BOMLine','StockMovement','CashTransaction'
];

const ITEM_TYPES = ['raw_material','semi_finished','finished_product','service'];
const PAYMENT_DIRECTIONS = ['receipt','payment'];
const STOCK_DIRECTIONS = ['in','out','adjustment_in','adjustment_out'];
const CASH_DIRECTIONS = ['in','out'];

const ENTITY_FIELDS = Object.freeze({
  SalesInvoice: {
    required: ['invoiceId','orderId','customerId','currency','total'],
    monetary: ['subtotal','discount','tax','total','paid','remaining'],
    ids: ['invoiceId','orderId','customerId']
  },
  SalesInvoiceLine: {
    required: ['invoiceLineId','invoiceId','orderId','lineId','itemId','quantity','unitPrice'],
    monetary: ['unitPrice','recognizedUnitCost','lineTotal','recognizedCost','lineProfit'],
    positive: ['quantity'],
    ids: ['invoiceLineId','invoiceId','orderId','lineId','itemId','profitCenterId','sourceOrderId']
  },
  Payment: {
    required: ['paymentId','partyId','direction','amount','currency'],
    monetary: ['amount'],
    ids: ['paymentId','partyId','invoiceId','purchaseId','cashboxId']
  },
  Purchase: {
    required: ['purchaseId','supplierId','currency','total'],
    monetary: ['subtotal','discount','tax','total','paid','remaining'],
    ids: ['purchaseId','supplierId','departmentId']
  },
  PurchaseLine: {
    required: ['purchaseLineId','purchaseId','itemId','quantity','unitCost'],
    monetary: ['unitCost','lineTotal'],
    positive: ['quantity'],
    ids: ['purchaseLineId','purchaseId','itemId','departmentId','profitCenterId']
  },
  Expense: {
    required: ['expenseId','expenseType','amount','currency'],
    monetary: ['amount'],
    ids: ['expenseId','orderId','lineId','departmentId','profitCenterId','partyId']
  },
  Item: {
    required: ['itemId','itemType','name','unit'],
    monetary: ['standardCost','salePrice'],
    ids: ['itemId']
  },
  BOM: {
    required: ['bomId','parentItemId','version'],
    ids: ['bomId','parentItemId']
  },
  BOMLine: {
    required: ['bomLineId','bomId','componentItemId','quantity'],
    positive: ['quantity'],
    ids: ['bomLineId','bomId','componentItemId']
  },
  StockMovement: {
    required: ['stockMovementId','itemId','direction','quantity','reason'],
    positive: ['quantity'],
    ids: ['stockMovementId','itemId','orderId','lineId','purchaseId','departmentId','profitCenterId']
  },
  CashTransaction: {
    required: ['cashTransactionId','cashboxId','direction','amount','currency'],
    monetary: ['amount'],
    ids: ['cashTransactionId','cashboxId','partyId','paymentId','orderId','purchaseId']
  }
});

function text(value) { return String(value == null ? '' : value).trim(); }
function finiteNumber(value) {
  if (value === '' || value == null || typeof value === 'boolean') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function hasOwn(obj, key) { return Object.prototype.hasOwnProperty.call(obj || {}, key); }

function scanForbiddenPercentageFields(value, path = 'payload', errors = []) {
  if (!value || typeof value !== 'object') return errors;
  if (Array.isArray(value)) {
    value.forEach((v, i) => scanForbiddenPercentageFields(v, `${path}[${i}]`, errors));
    return errors;
  }
  for (const [key, nested] of Object.entries(value)) {
    const normalized = key.toLowerCase().replace(/[_\-\s]/g, '');
    if (
      normalized.includes('profitshare') || normalized.includes('partnershare') ||
      normalized.includes('investorshare') || normalized.includes('profitpercentage') ||
      normalized.includes('partnerpercentage') || normalized.includes('investorpercentage') ||
      normalized === 'sharepercentage'
    ) {
      errors.push({ field: `${path}.${key}`, code: 'profit-sharing-field-forbidden', message: 'Profit/partner/investor distribution percentages belong outside Accounting.' });
    }
    scanForbiddenPercentageFields(nested, `${path}.${key}`, errors);
  }
  return errors;
}

function validateIds(payload, spec, errors, normalized) {
  for (const field of spec.ids || []) {
    if (!hasOwn(payload, field) || payload[field] == null || payload[field] === '') continue;
    const value = text(payload[field]);
    if (!value) errors.push({ field, code: 'invalid-id', message: `${field} must be a non-empty stable identifier.` });
    else normalized[field] = value;
  }
}

function validateRequired(payload, spec, errors) {
  for (const field of spec.required || []) {
    const value = payload[field];
    if (value == null || (typeof value === 'string' && !text(value))) {
      errors.push({ field, code: 'required', message: `${field} is required.` });
    }
  }
}

function validateNumbers(payload, spec, errors, normalized) {
  for (const field of spec.monetary || []) {
    if (!hasOwn(payload, field) || payload[field] === '' || payload[field] == null) continue;
    const value = finiteNumber(payload[field]);
    if (value == null || value < 0) errors.push({ field, code: 'invalid-money', message: `${field} must be a finite non-negative amount.` });
    else normalized[field] = value;
  }
  for (const field of spec.positive || []) {
    if (!hasOwn(payload, field) || payload[field] === '' || payload[field] == null) continue;
    const value = finiteNumber(payload[field]);
    if (value == null || value <= 0) errors.push({ field, code: 'invalid-quantity', message: `${field} must be a finite positive number.` });
    else normalized[field] = value;
  }
}

function validateEnums(entityType, payload, errors, normalized) {
  if (entityType === 'Item' && hasOwn(payload, 'itemType')) {
    const value = text(payload.itemType).toLowerCase();
    if (!ITEM_TYPES.includes(value)) errors.push({ field: 'itemType', code: 'invalid-enum', message: `itemType must be one of: ${ITEM_TYPES.join(', ')}.` });
    else normalized.itemType = value;
  }
  if (entityType === 'Payment' && hasOwn(payload, 'direction')) {
    const value = text(payload.direction).toLowerCase();
    if (!PAYMENT_DIRECTIONS.includes(value)) errors.push({ field: 'direction', code: 'invalid-enum', message: `Payment direction must be one of: ${PAYMENT_DIRECTIONS.join(', ')}.` });
    else normalized.direction = value;
  }
  if (entityType === 'StockMovement' && hasOwn(payload, 'direction')) {
    const value = text(payload.direction).toLowerCase();
    if (!STOCK_DIRECTIONS.includes(value)) errors.push({ field: 'direction', code: 'invalid-enum', message: `StockMovement direction must be one of: ${STOCK_DIRECTIONS.join(', ')}.` });
    else normalized.direction = value;
  }
  if (entityType === 'CashTransaction' && hasOwn(payload, 'direction')) {
    const value = text(payload.direction).toLowerCase();
    if (!CASH_DIRECTIONS.includes(value)) errors.push({ field: 'direction', code: 'invalid-enum', message: `CashTransaction direction must be one of: ${CASH_DIRECTIONS.join(', ')}.` });
    else normalized.direction = value;
  }
}

function validateLineOrderConsistency(payload, errors) {
  const orderId = text(payload.orderId);
  const sourceOrderId = text(payload.sourceOrderId);
  if (orderId && sourceOrderId && orderId !== sourceOrderId) {
    errors.push({ field: 'sourceOrderId', code: 'line-order-mismatch', message: 'Line sourceOrderId must match Order ID.' });
  }
}

function validateDerivedTotals(entityType, payload, errors) {
  if (!['SalesInvoice','Purchase'].includes(entityType)) return;
  const total = finiteNumber(payload.total);
  const paid = finiteNumber(payload.paid);
  const remaining = finiteNumber(payload.remaining);
  if (total != null && paid != null && paid > total) {
    errors.push({ field: 'paid', code: 'paid-exceeds-total', message: 'paid cannot exceed total in the canonical Accounting contract.' });
  }
  if (total != null && remaining != null && remaining > total) {
    errors.push({ field: 'remaining', code: 'remaining-exceeds-total', message: 'remaining cannot exceed total.' });
  }
}

export function accountingContractMetadata() {
  return {
    success: true,
    version: TRENDOS_ACCOUNTING_CONTRACT_VERSION,
    mode: 'validation-only',
    authoritativeWrites: false,
    persistence: 'none',
    entityTypes: [...ENTITY_TYPES],
    enums: {
      itemType: [...ITEM_TYPES],
      paymentDirection: [...PAYMENT_DIRECTIONS],
      stockDirection: [...STOCK_DIRECTIONS],
      cashDirection: [...CASH_DIRECTIONS]
    },
    entities: clone(ENTITY_FIELDS),
    envelope: {
      required: ['entityType','operation','idempotencyKey','payload'],
      operation: 'future-write-command-name; validation does not execute it'
    },
    invariants: [
      'Order ID is the stable order integration key.',
      'Line ID is mandatory for order-line economics.',
      'When sourceOrderId is supplied for a Line, it must equal orderId.',
      'Names are display values and never primary integration keys.',
      'Monetary values are finite and non-negative.',
      'Movement and line quantities are finite and positive.',
      'Every future write command requires an idempotencyKey.',
      'Profit/partner/investor distribution percentage fields are rejected.',
      'Validation never persists to D1, Apps Script, Google Sheets or external services.'
    ]
  };
}

export function validateAccountingCommand(envelope) {
  const errors = [];
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    return { success: false, valid: false, version: TRENDOS_ACCOUNTING_CONTRACT_VERSION, authoritativeWrites: false, persistence: 'none', errors: [{ field: 'envelope', code: 'invalid-envelope', message: 'A JSON object envelope is required.' }] };
  }

  const entityType = text(envelope.entityType);
  const operation = text(envelope.operation);
  const idempotencyKey = text(envelope.idempotencyKey);
  const payload = envelope.payload && typeof envelope.payload === 'object' && !Array.isArray(envelope.payload) ? envelope.payload : {};

  if (!ENTITY_TYPES.includes(entityType)) errors.push({ field: 'entityType', code: 'unsupported-entity', message: `Unsupported entityType. Use one of: ${ENTITY_TYPES.join(', ')}.` });
  if (!operation) errors.push({ field: 'operation', code: 'required', message: 'operation is required.' });
  if (!idempotencyKey || idempotencyKey.length < 8) errors.push({ field: 'idempotencyKey', code: 'invalid-idempotency-key', message: 'A stable idempotencyKey of at least 8 characters is required.' });
  if (!envelope.payload || typeof envelope.payload !== 'object' || Array.isArray(envelope.payload)) errors.push({ field: 'payload', code: 'invalid-payload', message: 'payload must be a JSON object.' });

  const normalizedPayload = clone(payload);
  scanForbiddenPercentageFields(payload, 'payload', errors);

  const spec = ENTITY_FIELDS[entityType];
  if (spec) {
    validateRequired(payload, spec, errors);
    validateIds(payload, spec, errors, normalizedPayload);
    validateNumbers(payload, spec, errors, normalizedPayload);
    validateEnums(entityType, payload, errors, normalizedPayload);
    if (entityType === 'SalesInvoiceLine') validateLineOrderConsistency(payload, errors);
    validateDerivedTotals(entityType, payload, errors);
  }

  return {
    success: errors.length === 0,
    valid: errors.length === 0,
    version: TRENDOS_ACCOUNTING_CONTRACT_VERSION,
    mode: 'validation-only',
    authoritativeWrites: false,
    persistence: 'none',
    normalized: {
      entityType,
      operation,
      idempotencyKey,
      payload: normalizedPayload
    },
    errors
  };
}
