import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeOrderWatchSnapshot, ORDER_WATCH_AGENT_MODE } from '../cloudflare-d1/src/order-watch-agent-v0.mjs';

const SOURCE = 'd1-edge-orders-02cr+legacy-runtime+t12-native';
const VERSION = 'D1_ORDERS_READ_02CR_T12_LEGACY_RUNTIME_V1';
const base = {
  customer: 'PRIVATE CUSTOMER', customerPhone: '01000000000',
  notes: 'PRIVATE NOTES', orderId: 'TM0001', lineId: 'TM0001-01',
  status: 'طلب جديد', assignedTo: 'emp', itemName: 'مجات',
  expectedDeliveryAt: '2026-10-15', priority: 'عادي'
};
function pages(rows, size = 100) {
  const totalPages = Math.max(1, Math.ceil(rows.length / size));
  return Array.from({ length: totalPages }, (_, i) => ({
    success: true, serverPaged: true, version: VERSION, dataSource: SOURCE,
    dataVersion: '2026-10-14T00:00:00Z',
    pagination: { page: i + 1, pageSize: size, totalRows: rows.length, totalPages },
    rows: rows.slice(i * size, (i + 1) * size)
  }));
}
function run(rows, asOf = '2026-10-14T14:00:00+03:00', size = 100) {
  return analyzeOrderWatchSnapshot({ pages: pages(rows, size), asOf });
}
function rejects(input, code) {
  assert.throws(() => analyzeOrderWatchSnapshot(input), (err) => err.code === code);
}

test('complete multi-page snapshot: flags overdue/unassigned and excludes closed rows', () => {
  const rows = [
    { ...base, assignedTo: '', expectedDeliveryAt: '2026-10-13', priority: 'VIP' },
    { ...base, orderId: 'TM0002', lineId: 'TM0002-01', status: 'تم التسليم', assignedTo: '' },
    { ...base, orderId: 'TM0003', lineId: 'TM0003-01', expectedDeliveryAt: '' }
  ];
  const r = run(rows, '2026-10-14T12:00:00+03:00', 2);
  assert.equal(r.mode, ORDER_WATCH_AGENT_MODE);
  assert.equal(r.readOnly, true);
  assert.equal(r.productionReady, false);
  assert.equal(r.summary.sourceLines, 3);
  assert.equal(r.summary.activeLines, 2);
  assert.equal(r.summary.overdue, 1);
  assert.equal(r.summary.unassigned, 1);
  assert.equal(r.summary.missingDeliveryDate, 1);
  assert.equal(r.alerts.length, 2);
  assert.equal(r.alerts[0].severity, 'HIGH');
  assert.deepEqual(r.alerts[0].codes, ['UNASSIGNED', 'OVERDUE']);
});

test('never emits customer names, phone, item names, notes or raw order input', () => {
  const r = run([{ ...base, assignedTo: '' }]);
  const s = JSON.stringify(r);
  for (const privateValue of ['PRIVATE CUSTOMER', '01000000000', 'PRIVATE NOTES', 'مجات', 'emp']) {
    assert.ok(!s.includes(privateValue), privateValue);
  }
});

test('due today in Cairo is not overdue even just after midnight', () => {
  const r = run([{ ...base, expectedDeliveryAt: '2026-10-14' }], '2026-10-14T00:01:00+03:00');
  assert.equal(r.summary.overdue, 0);
  assert.equal(r.alerts.length, 0);
});

test('invalid due dates flagged instead of guessed', () => {
  const r = run([{ ...base, expectedDeliveryAt: '32/13/2026' }]);
  assert.equal(r.summary.invalidDeliveryDate, 1);
  assert.equal(r.summary.overdue, 0);
  assert.deepEqual(r.alerts[0].codes, ['DELIVERY_DATE_INVALID']);
});

test('unknown status and missing item are review alerts, not production actions', () => {
  const r = run([{ ...base, status: '', itemName: '' }]);
  assert.equal(r.summary.unknownStatus, 1);
  assert.equal(r.summary.missingItem, 1);
  assert.equal(r.alerts[0].severity, 'MEDIUM');
});

test('rejects missing page, changing counts, changing version, duplicate identity', () => {
  const rows = [
    { ...base }, { ...base, lineId: 'TM0002-01', orderId: 'TM0002' }
  ];
  const two = pages(rows, 1);
  rejects({ pages: two.slice(0, 1), asOf: '2026-10-14T14:00:00+03:00' }, 'INCOMPLETE_SNAPSHOT');
  const drift = pages(rows, 1); drift[1].dataVersion = 'changed';
  rejects({ pages: drift, asOf: '2026-10-14T14:00:00+03:00' }, 'PAGES_DRIFTED');
  rejects({ pages: pages([base, base]), asOf: '2026-10-14T14:00:00+03:00' }, 'DUPLICATE_LINE_ID');
});

test('rejects unauthorized/unqualified and invalid snapshots without API access', () => {
  const invalid = pages([base]); invalid[0].success = false;
  rejects({ pages: invalid, asOf: '2026-10-14T14:00:00+03:00' }, 'SOURCE_NOT_QUALIFIED');
  const badVersion = pages([base]); badVersion[0].version = 'unknown';
  rejects({ pages: badVersion, asOf: '2026-10-14T14:00:00+03:00' }, 'SOURCE_NOT_QUALIFIED');
  rejects({ pages: pages([base]), asOf: '2026-10-14T12:00:00' }, 'AS_OF_REQUIRES_OFFSET');
  rejects({ pages: pages([{ ...base, lineId: 'customer@example.com' }]), asOf: '2026-10-14T14:00:00+03:00' }, 'STABLE_ID_REQUIRED');
});

test('empty qualified complete snapshot gives zero alerts', () => {
  const r = run([]);
  assert.equal(r.summary.sourceLines, 0);
  assert.deepEqual(r.alerts, []);
});


test('supports unambiguous day/month/year and ignores cancelled aliases', () => {
  const rows = [
    { ...base, expectedDeliveryAt: '13/10/2026' },
    { ...base, orderId: 'TM0002', lineId: 'TM0002-01', status: 'ملغي', expectedDeliveryAt: '2026-10-10' }
  ];
  const report = run(rows, '2026-10-14T15:00:00+03:00', 1);
  assert.equal(report.summary.overdue, 1);
  assert.equal(report.summary.activeLines, 1);
  assert.equal(report.alerts.length, 1);
});

test('fails closed when reported page shape is altered', () => {
  const list = pages([base]);
  list[0].pagination.totalRows = 2;
  rejects({ pages: list, asOf: '2026-10-14T14:00:00+03:00' }, 'INCOMPLETE_SNAPSHOT');
});


test('stopped and waiting-customer order lines carry explicit codes without private notes', () => {
  const rows = [
    { ...base, orderId: 'STOP1', lineId: 'STOP1-01', status: 'متوقف', notes: 'PRIVATE STOP NOTE' },
    { ...base, orderId: 'STOP2', lineId: 'STOP2-01', status: 'مشكلة/متوقف' },
    { ...base, orderId: 'WAIT1', lineId: 'WAIT1-01', status: 'في انتظار موافقة العميل' }
  ];
  const r = run(rows);
  assert.equal(r.summary.stopped, 2);
  assert.equal(r.summary.waitingCustomer, 1);
  assert.equal(r.summary.flaggedLines, 3);
  assert.equal(r.alerts[0].severity, 'HIGH');
  assert.equal(r.alerts[1].severity, 'HIGH');
  assert.equal(r.alerts[2].severity, 'MEDIUM');
  assert.ok(r.alerts[0].codes.includes('STOPPED'));
  assert.ok(r.alerts[1].codes.includes('STOPPED'));
  assert.ok(r.alerts[2].codes.includes('WAITING_CUSTOMER'));
  assert.equal(r.snapshotAtomicityVerified, false);
  assert.ok(!JSON.stringify(r).includes('PRIVATE STOP NOTE'));
});

test('rejects shifted page boundaries even when aggregate row count and dataVersion match', () => {
  const rows = Array.from({ length: 5 }, (_, i) => ({
    ...base, orderId: 'ORDER' + i, lineId: 'LINE' + i
  }));
  const list = pages(rows, 2);
  // Keep all five unique rows, stable version, valid metadata and page count:
  // old implementation accepted an underfilled first page and overfilled last.
  list[0].rows = [rows[0]];
  list[1].rows = [rows[1], rows[2]];
  list[2].rows = [rows[3], rows[4]];
  rejects({ pages: list, asOf: '2026-10-14T14:00:00+03:00' }, 'INCOMPLETE_SNAPSHOT');
});

test('offset timestamps use Cairo calendar day, not UTC date; malformed tails are invalid', () => {
  const dueAtCairoMidnight = run([
    { ...base, expectedDeliveryAt: '2026-10-13T22:30:00Z' }
  ]);
  assert.equal(dueAtCairoMidnight.cairoDay, '2026-10-14');
  assert.equal(dueAtCairoMidnight.summary.overdue, 0);
  assert.equal(dueAtCairoMidnight.alerts.length, 0);
  const unambiguousPast = run([
    { ...base, expectedDeliveryAt: '2026-10-13 12:30:00' }
  ]);
  assert.equal(unambiguousPast.summary.overdue, 1);
  for (const bad of ['2026-10-13Tjunk', '2026-10-13 extra notes', '2026-10-13T12:30:00', '2026-10-13 77:99:99']) {
    const result = run([{ ...base, expectedDeliveryAt: bad }]);
    assert.equal(result.summary.invalidDeliveryDate, 1, bad);
    assert.equal(result.summary.overdue, 0, bad);
  }
});

test('rejects malformed timestamp date, impossible calendar day and retains no raw input', () => {
  for (const bad of ['2026-02-30T09:00:00Z', '2026/13/01', '31/02/2026']) {
    const result = run([{ ...base, expectedDeliveryAt: bad }]);
    assert.equal(result.summary.invalidDeliveryDate, 1, bad);
    assert.equal(result.summary.overdue, 0);
    assert.ok(!JSON.stringify(result).includes(bad));
  }
});
