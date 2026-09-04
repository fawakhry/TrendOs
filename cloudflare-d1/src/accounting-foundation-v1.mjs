export const TRENDOS_ACCOUNTING_FOUNDATION_VERSION = 'TRENDOS_ACCOUNTING_F1_V1_1_20260905';

export const ACCOUNTING_PERMISSIONS = Object.freeze([
  'accounting.read',
  'accounting.sales.read',
  'accounting.sales.write',
  'accounting.purchases.read',
  'accounting.purchases.write',
  'accounting.treasury.read',
  'accounting.treasury.write',
  'accounting.parties.read',
  'accounting.parties.write',
  'accounting.inventory.read',
  'accounting.inventory.write',
  'accounting.cost.read',
  'accounting.reports.read',
  'accounting.close.execute',
  'accounting.audit.read',
  'accounting.admin'
]);

export const ACCOUNTING_ROLE_PERMISSIONS = Object.freeze({
  accounting_admin: ACCOUNTING_PERMISSIONS,
  accounting_manager: [
    'accounting.read','accounting.sales.read','accounting.sales.write',
    'accounting.purchases.read','accounting.purchases.write',
    'accounting.treasury.read','accounting.treasury.write',
    'accounting.parties.read','accounting.parties.write',
    'accounting.inventory.read','accounting.inventory.write',
    'accounting.cost.read','accounting.reports.read','accounting.close.execute','accounting.audit.read'
  ],
  cashier: ['accounting.read','accounting.sales.read','accounting.treasury.read','accounting.treasury.write','accounting.parties.read'],
  purchasing: ['accounting.read','accounting.purchases.read','accounting.purchases.write','accounting.parties.read','accounting.inventory.read'],
  accounting_finalizer: ['accounting.read','accounting.sales.read','accounting.sales.write','accounting.parties.read','accounting.cost.read'],
  department_accounting: ['accounting.read','accounting.purchases.read','accounting.inventory.read'],
  accounting_viewer: ['accounting.read','accounting.sales.read','accounting.purchases.read','accounting.treasury.read','accounting.parties.read','accounting.inventory.read','accounting.reports.read']
});

export const PARTY_TYPES = Object.freeze(['customer','supplier','employee','other']);
export const PARTY_LEDGER_OPERATIONS = Object.freeze([
  'sales_invoice','purchase_invoice','customer_payment','supplier_payment',
  'debit_adjustment','credit_adjustment','opening_balance','reversal'
]);

export const ACCOUNTING_ENTITY_OWNERS = Object.freeze({
  orderId: 'TrendOS Operations',
  lineId: 'TrendOS Operations',
  itemId: 'TrendOS shared catalog',
  customerId: 'TrendOS customer registry',
  supplierId: 'TrendOS Accounting/shared party registry',
  partyId: 'TrendOS shared party registry',
  departmentId: 'TrendOS shared organization model',
  profitCenterId: 'TrendOS shared organization model',
  invoiceId: 'TrendOS Accounting',
  purchaseId: 'TrendOS Accounting',
  paymentId: 'TrendOS Accounting',
  stockMovementId: 'TrendOS Accounting',
  cashTransactionId: 'TrendOS Accounting',
  auditEventId: 'TrendOS Accounting',
  eventId: 'event producer'
});

const ID_MAX = 120;
const SAFE_ID = /^[0-9A-Za-z_:.\-/\u0600-\u06ff]+$/u;
const COMMAND_TYPES = Object.freeze([
  'party-ledger.post','treasury.post','purchase.create','purchase.pay',
  'sales-invoice.create','customer.collect','stock.move','bom.form',
  'expense.create','day-close.execute','reversal.create'
]);

function text(value) {
  return String(value == null ? '' : value).trim();
}

function finiteMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function positiveAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function normalizeStableId(value) {
  return text(value).replace(/\s+/g, '-');
}

export function validateStableId(value, field = 'id', options = {}) {
  const id = normalizeStableId(value);
  const errors = [];
  if (!id) errors.push(`${field} is required`);
  if (id.length > (options.maxLength || ID_MAX)) errors.push(`${field} is too long`);
  if (id && !SAFE_ID.test(id)) errors.push(`${field} contains unsupported characters`);
  return { ok: errors.length === 0, value: id, errors };
}

export function validateOrderLineIdentity(input = {}) {
  const order = validateStableId(input.orderId, 'orderId');
  const line = validateStableId(input.lineId, 'lineId');
  const warnings = [];
  if (order.ok && line.ok && !line.value.includes(order.value)) {
    warnings.push('lineId does not lexically contain orderId; relationship must be verified from TrendOS source data');
  }
  return {
    ok: order.ok && line.ok,
    orderId: order.value,
    lineId: line.value,
    errors: [...order.errors, ...line.errors],
    warnings
  };
}

export function permissionsForAccountingPrincipal(principal = {}) {
  const explicit = Array.isArray(principal.permissions)
    ? principal.permissions.map(text).filter((p) => ACCOUNTING_PERMISSIONS.includes(p))
    : [];
  const role = text(principal.accountingRole || principal.role).toLowerCase();
  const mapped = ACCOUNTING_ROLE_PERMISSIONS[role] || [];
  // Temporary compatibility bridge: existing TrendOS role=admin can inspect
  // Accounting/read audit data only. It is NOT promoted to accounting.admin and
  // therefore receives no financial mutation permission implicitly.
  const legacyAdminBridge = role === 'admin'
    ? ['accounting.read','accounting.audit.read']
    : [];
  return [...new Set([...explicit, ...mapped, ...legacyAdminBridge])];
}

export function authorizeAccountingPermission(principal, permission) {
  const requested = text(permission);
  const permissions = permissionsForAccountingPrincipal(principal);
  const ok = permissions.includes('accounting.admin') || permissions.includes(requested);
  return {
    ok,
    permission: requested,
    permissions,
    subject: text(principal && (principal.sub || principal.username)),
    reason: ok ? '' : 'accounting-permission-denied'
  };
}

export function validateIdempotencyEnvelope(input = {}) {
  const errors = [];
  const idempotencyKey = validateStableId(input.idempotencyKey || input.eventId || input.requestId, 'idempotencyKey');
  errors.push(...idempotencyKey.errors);
  const commandType = text(input.commandType);
  if (!COMMAND_TYPES.includes(commandType)) errors.push('unsupported commandType');
  const actorId = validateStableId(input.actorId, 'actorId');
  errors.push(...actorId.errors);
  const source = text(input.source);
  if (!source) errors.push('source is required');
  const occurredAt = text(input.occurredAt || input.timestamp);
  if (occurredAt && !Number.isFinite(Date.parse(occurredAt))) errors.push('occurredAt must be an ISO-compatible date');
  return {
    ok: errors.length === 0,
    errors,
    normalized: {
      idempotencyKey: idempotencyKey.value,
      commandType,
      actorId: actorId.value,
      source,
      occurredAt: occurredAt || null
    },
    replayRule: 'same idempotencyKey + same command fingerprint => return original result; different fingerprint => conflict'
  };
}

export function validatePartyLedgerTransaction(input = {}) {
  const errors = [];
  const partyId = validateStableId(input.partyId, 'partyId');
  errors.push(...partyId.errors);
  const partyType = text(input.partyType).toLowerCase();
  if (!PARTY_TYPES.includes(partyType)) errors.push('unsupported partyType');
  const operation = text(input.operation).toLowerCase();
  if (!PARTY_LEDGER_OPERATIONS.includes(operation)) errors.push('unsupported operation');
  const amount = positiveAmount(input.amount);
  if (amount === null) errors.push('amount must be greater than zero');
  const sourceDocumentId = validateStableId(input.sourceDocumentId || input.refNo, 'sourceDocumentId');
  errors.push(...sourceDocumentId.errors);
  const idempotency = validateIdempotencyEnvelope({
    idempotencyKey: input.idempotencyKey || input.requestId,
    commandType: 'party-ledger.post',
    actorId: input.actorId,
    source: input.source || 'trendos-accounting',
    occurredAt: input.occurredAt
  });
  errors.push(...idempotency.errors);
  const currency = text(input.currency || 'EGP').toUpperCase();
  if (currency !== 'EGP') errors.push('V1 accounting currency must be EGP');
  return {
    ok: errors.length === 0,
    errors: [...new Set(errors)],
    normalized: {
      partyId: partyId.value,
      partyType,
      operation,
      amount,
      currency,
      sourceDocumentId: sourceDocumentId.value,
      orderId: normalizeStableId(input.orderId),
      lineId: normalizeStableId(input.lineId),
      departmentId: normalizeStableId(input.departmentId),
      profitCenterId: normalizeStableId(input.profitCenterId),
      idempotencyKey: idempotency.normalized.idempotencyKey,
      actorId: idempotency.normalized.actorId,
      occurredAt: idempotency.normalized.occurredAt
    }
  };
}

export function validateLineEconomics(input = {}) {
  const identity = validateOrderLineIdentity(input);
  const errors = [...identity.errors];
  const quantity = Number(input.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) errors.push('quantity must be greater than zero');
  const revenue = finiteMoney(input.revenue);
  const recognizedCost = finiteMoney(input.recognizedCost);
  if (revenue === null) errors.push('revenue must be non-negative');
  if (recognizedCost === null) errors.push('recognizedCost must be non-negative');
  const profitCenter = validateStableId(input.profitCenterId, 'profitCenterId');
  errors.push(...profitCenter.errors);
  return {
    ok: errors.length === 0,
    errors,
    warnings: identity.warnings,
    normalized: {
      orderId: identity.orderId,
      lineId: identity.lineId,
      quantity: Number.isFinite(quantity) ? quantity : null,
      revenue,
      recognizedCost,
      factualProfit: revenue !== null && recognizedCost !== null ? revenue - recognizedCost : null,
      profitCenterId: profitCenter.value
    }
  };
}

export function buildAuditEvent(input = {}) {
  const entity = validateStableId(input.entityId, 'entityId');
  const actor = validateStableId(input.actorId, 'actorId');
  const request = validateStableId(input.idempotencyKey || input.requestId, 'idempotencyKey');
  const event = validateStableId(input.auditEventId || input.eventId, 'auditEventId');
  const errors = [...entity.errors, ...actor.errors, ...request.errors, ...event.errors];
  const action = text(input.action);
  if (!action) errors.push('action is required');
  const occurredAt = text(input.occurredAt || new Date().toISOString());
  if (!Number.isFinite(Date.parse(occurredAt))) errors.push('occurredAt must be valid');
  return {
    ok: errors.length === 0,
    errors,
    event: {
      auditEventId: event.value,
      occurredAt,
      actorId: actor.value,
      action,
      entityType: text(input.entityType),
      entityId: entity.value,
      idempotencyKey: request.value,
      source: text(input.source || 'trendos-accounting'),
      before: input.before === undefined ? null : input.before,
      after: input.after === undefined ? null : input.after,
      metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {}
    },
    immutable: true
  };
}

export function accountingFoundationContract() {
  return {
    success: true,
    version: TRENDOS_ACCOUNTING_FOUNDATION_VERSION,
    authoritativeWrites: false,
    entityOwners: ACCOUNTING_ENTITY_OWNERS,
    partyTypes: PARTY_TYPES,
    partyLedgerOperations: PARTY_LEDGER_OPERATIONS,
    commandTypes: COMMAND_TYPES,
    permissions: ACCOUNTING_PERMISSIONS,
    rolePermissions: ACCOUNTING_ROLE_PERMISSIONS,
    legacyRoleBridge: {
      admin: ['accounting.read','accounting.audit.read'],
      mutationPermission: false
    },
    invariants: [
      'No employee-name-based authorization.',
      'Legacy TrendOS admin grants Accounting read/audit only until explicit Accounting RBAC is issued.',
      'Order ID and Line ID are owned by TrendOS Operations.',
      'Every financial mutation must carry a stable idempotency key.',
      'Audit events are append-only/immutable.',
      'Party names are display fields; Party ID is the ledger identity.',
      'Line economics retain Profit Center ID.',
      'No financial write authority is granted by this foundation contract.'
    ]
  };
}
