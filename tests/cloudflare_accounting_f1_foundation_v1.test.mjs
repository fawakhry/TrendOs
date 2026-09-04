import assert from 'node:assert/strict';
import {
  accountingFoundationContract,
  authorizeAccountingPermission,
  buildAuditEvent,
  permissionsForAccountingPrincipal,
  validateIdempotencyEnvelope,
  validateLineEconomics,
  validateOrderLineIdentity,
  validatePartyLedgerTransaction,
  validateStableId
} from '../cloudflare-d1/src/accounting-foundation-v1.mjs';
import {
  inspectAccountingOperationsMirror,
  readAccountingOrderLineFacts
} from '../cloudflare-d1/src/accounting-operations-read-v1.mjs';
import {
  handleAccountingFoundationApiRequest,
  isAccountingFoundationApiPath
} from '../cloudflare-d1/src/accounting-foundation-api-v1.mjs';

const NOW = Date.parse('2026-09-05T00:00:00.000Z');

class Statement {
  constructor(db, sql) { this.db = db; this.sql = sql; this.args = []; }
  bind(...args) { this.args = args; return this; }
  async first() {
    if (!this.sql.includes('FROM sheet_catalog')) return null;
    return this.db.catalogs[this.args[0]] || null;
  }
  async all() {
    if (!this.sql.includes('FROM sheet_rows')) return { results: [] };
    return { results: this.db.rows[this.args[0]] || [] };
  }
  async run() { this.db.writeOps += 1; return { success: true }; }
}

class MockDB {
  constructor(syncedAt = '2026-09-04T23:59:00.000Z') {
    this.writeOps = 0;
    const orderHeaders = ['رقم الأوردر','Customer ID','اسم العميل','الحالة','الإجمالي','المدفوع','المتبقي','آخر تحديث'];
    const lineHeaders = ['رقم الأوردر','رقم البند','Item ID','اسم البند','Customer ID','اسم العميل','Department ID','القسم','Profit Center ID','الكمية','الحالة','سعر البيع المعتمد','إجمالي البند','آخر تحديث'];
    const common = { sourceLastRow: 1, sourceLastCol: 14, rowCount: 1, status: 'ready', syncedAt, note: 'TrendOS orders live sync V1' };
    this.catalogs = {
      'الأوردرات': { ...common, sourceLastCol: orderHeaders.length, headersJson: JSON.stringify(orderHeaders) },
      'بنود الأوردرات': { ...common, sourceLastCol: lineHeaders.length, headersJson: JSON.stringify(lineHeaders) }
    };
    this.rows = {
      'الأوردرات': [{ rowNumber: 2, valuesJson: JSON.stringify(['3569','CUST-1','عميل تجريبي','قيد التنفيذ',100,20,80,'2026-09-04T23:58:00Z']), displayJson: '[]' }],
      'بنود الأوردرات': [{ rowNumber: 2, valuesJson: JSON.stringify(['3569','3569-1','ITEM-MUG','مج','CUST-1','عميل تجريبي','DEPT-PRINT','طباعة','PC-PRINT',2,'قيد التنفيذ',50,100,'2026-09-04T23:58:00Z']), displayJson: '[]' }]
    };
  }
  prepare(sql) { return new Statement(this, sql); }
  async batch() { this.writeOps += 1; return []; }
}

function env(db = new MockDB()) {
  return { DB: db, EDGE_SESSION_SECRET: 'unit-test-signing-key', EDGE_ORDERS_MIRROR_MAX_AGE_SECONDS: '600', CORS_ORIGINS: 'https://fawakhry.github.io' };
}

assert.equal(validateStableId('3569-1').ok, true);
assert.equal(validateStableId('PC PRINT').value, 'PC-PRINT');
assert.equal(validateStableId('bad id ?').ok, false);
assert.equal(validateOrderLineIdentity({ orderId: '3569', lineId: '3569-1' }).ok, true);
assert.equal(validateOrderLineIdentity({ orderId: '3569', lineId: 'LEGACY-ROW-21' }).warnings.length, 1);

const legacyAdminPermissions = permissionsForAccountingPrincipal({ role: 'admin' });
assert.ok(legacyAdminPermissions.includes('accounting.read'));
assert.ok(!legacyAdminPermissions.includes('accounting.admin'));
assert.equal(authorizeAccountingPermission({ role: 'admin' }, 'accounting.sales.write').ok, false);
assert.equal(authorizeAccountingPermission({ accountingRole: 'accounting_admin' }, 'accounting.sales.write').ok, true);
assert.equal(authorizeAccountingPermission({ role: 'service', username: 'named-employee' }, 'accounting.read').ok, false);

assert.equal(validateIdempotencyEnvelope({ idempotencyKey: 'REQ-ACCOUNTING-0001', commandType: 'purchase.create', actorId: 'USER-1', source: 'trendos', occurredAt: '2026-09-05T00:00:00Z' }).ok, true);

const party = validatePartyLedgerTransaction({
  partyId: 'CUST-1', partyType: 'customer', operation: 'customer_payment', amount: 250,
  sourceDocumentId: 'INV-1', idempotencyKey: 'REQ-PAY-0001', actorId: 'USER-1', source: 'trendos-accounting', occurredAt: '2026-09-05T00:00:00Z'
});
assert.equal(party.ok, true);
assert.equal(party.normalized.currency, 'EGP');

const economics = validateLineEconomics({ orderId: '3569', lineId: '3569-1', quantity: 2, revenue: 100, recognizedCost: 65, profitCenterId: 'PC-PRINT' });
assert.equal(economics.ok, true);
assert.equal(economics.normalized.factualProfit, 35);

const audit = buildAuditEvent({ auditEventId: 'AUD-1', actorId: 'USER-1', action: 'party-ledger.post', entityType: 'Payment', entityId: 'PAY-1', idempotencyKey: 'REQ-PAY-0001', occurredAt: '2026-09-05T00:00:00Z' });
assert.equal(audit.ok, true);
assert.equal(audit.immutable, true);

const foundation = accountingFoundationContract();
assert.equal(foundation.authoritativeWrites, false);
assert.equal(foundation.legacyRoleBridge.mutationPermission, false);

const db = new MockDB();
assert.equal((await inspectAccountingOperationsMirror(env(db), NOW)).ready, true);
const facts = await readAccountingOrderLineFacts(env(db), { orderId: '3569', lineId: '3569-1' }, NOW);
assert.equal(facts.success, true);
assert.equal(facts.line.itemId, 'ITEM-MUG');
assert.equal(facts.line.customerId, 'CUST-1');
assert.equal(facts.line.departmentId, 'DEPT-PRINT');
assert.equal(facts.line.profitCenterId, 'PC-PRINT');
assert.equal(facts.line.approvedLineAmount, 100);
assert.deepEqual(facts.missingForAccounting, []);
assert.equal(facts.canCreateFinancialWrite, false);
assert.equal(db.writeOps, 0);

const staleDb = new MockDB('2026-09-04T20:00:00.000Z');
const stale = await readAccountingOrderLineFacts(env(staleDb), { orderId: '3569', lineId: '3569-1' }, NOW);
assert.equal(stale.success, false);
assert.equal(stale.code, 'mirror-not-ready');
assert.equal(stale.fallback, 'apps-script');
assert.equal(staleDb.writeOps, 0);

assert.equal(isAccountingFoundationApiPath('/v1/accounting/foundation'), true);
assert.equal(isAccountingFoundationApiPath('/v1/accounting/foundation/validate'), true);
assert.equal(isAccountingFoundationApiPath('/v1/accounting/operations/line'), true);

const foundationResponse = await handleAccountingFoundationApiRequest(new Request('https://preview.test/v1/accounting/foundation'), env());
assert.equal(foundationResponse.status, 200);
assert.equal((await foundationResponse.json()).authoritativeWrites, false);

const validationResponse = await handleAccountingFoundationApiRequest(new Request('https://preview.test/v1/accounting/foundation/validate', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ kind: 'line-economics', payload: { orderId: '3569', lineId: '3569-1', quantity: 2, revenue: 100, recognizedCost: 65, profitCenterId: 'PC-PRINT' } })
}), env());
assert.equal(validationResponse.status, 200);
const validationBody = await validationResponse.json();
assert.equal(validationBody.validationOnly, true);
assert.equal(validationBody.persisted, false);
assert.equal(validationBody.result.normalized.factualProfit, 35);

const unauthorized = await handleAccountingFoundationApiRequest(new Request('https://preview.test/v1/accounting/operations/line?orderId=3569&lineId=3569-1'), env());
assert.equal(unauthorized.status, 401);
assert.equal((await unauthorized.json()).authoritativeWrites, false);

console.log('TrendOS Accounting F1 Foundation V1 tests: PASS');
