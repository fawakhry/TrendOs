import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildDashboardFromRows,
  filterRows,
  mapMirrorRows
} from '../cloudflare-d1/src/edge-orders-read-v1.mjs';

function dayOffset(days) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const fixedNow = new Date();
fixedNow.setHours(12, 0, 0, 0);
const yesterday = dayOffset(-1);
const tomorrow = dayOffset(1);
const overdueDate = dayOffset(-3);
const oldReceived = dayOffset(-7);
const today = dayOffset(0);

const rows = [
  {
    rowNumber: 2,
    orderId: 'TM-TEST-001',
    lineId: 'TM-TEST-001-01',
    customer: 'عميل عاجل',
    customerPhone: '01000000001',
    department: 'طباعة',
    itemName: 'بانر',
    qty: 2,
    priority: 'عاجل',
    status: 'طلب جديد',
    heatPress: 'لا',
    debtAmount: 0,
    receivedAt: yesterday,
    expectedDeliveryAt: tomorrow,
    updatedAt: today
  },
  {
    rowNumber: 3,
    orderId: 'TM-TEST-002',
    lineId: 'TM-TEST-002-01',
    customer: 'عميل جاهز',
    customerPhone: '01000000002',
    department: 'ليزر',
    itemName: 'حفر',
    qty: 1,
    priority: 'عادي',
    status: 'جاهز للاستلام',
    heatPress: 'لا',
    debtAmount: 0,
    receivedAt: yesterday,
    expectedDeliveryAt: tomorrow,
    updatedAt: today
  },
  {
    rowNumber: 4,
    orderId: 'TM-TEST-003',
    lineId: 'TM-TEST-003-01',
    customer: 'عميل متأخر',
    customerPhone: '01000000003',
    department: 'طباعة',
    itemName: 'طباعة',
    qty: 3,
    priority: 'مؤجل',
    status: 'تحت التنفيذ',
    heatPress: 'نعم',
    debtAmount: 120,
    receivedAt: oldReceived,
    expectedDeliveryAt: overdueDate,
    updatedAt: today
  },
  {
    rowNumber: 5,
    orderId: 'TM-TEST-004',
    lineId: 'TM-TEST-004-01',
    customer: 'عميل مسلم',
    customerPhone: '01000000004',
    department: 'طباعة',
    itemName: 'ستيكر',
    qty: 1,
    priority: 'عادي',
    status: 'تم التسليم',
    heatPress: 'لا',
    debtAmount: 0,
    receivedAt: yesterday,
    expectedDeliveryAt: tomorrow,
    updatedAt: today
  }
];

const dashboard = buildDashboardFromRows(rows, 'service', fixedNow);
assert.equal(dashboard.dataSource, 'd1-edge-orders');
assert.equal(dashboard.activeLines, 2, 'hidden ready/delivered rows must not count as active lines');
assert.equal(dashboard.activeOrders, 2);
assert.equal(dashboard.urgent, 1);
assert.equal(dashboard.normal, 2);
assert.equal(dashboard.delayedPriority, 1);
assert.equal(dashboard.readyForPickup, 1);
assert.equal(dashboard.readyOrders, 1);
assert.equal(dashboard.delivered, 1);
assert.equal(dashboard.deliveredToday, 1);
assert.equal(dashboard.deliveredTodayOrders, 1);
assert.equal(dashboard.overdue, 1);
assert.equal(dashboard.overdueOrders, 1);
assert.equal(dashboard.heatPress, 1);
assert.equal(dashboard.debtOrders, 1);
assert.equal(dashboard.todayWorkLines, 1);
assert.equal(dashboard.todayWorkSheets, 2);
assert.equal(dashboard.todayWorkOrders, 1);

const activeRows = filterRows(rows, { statusFilter: '__ACTIVE__' });
assert.deepEqual(activeRows.map((row) => row.orderId), ['TM-TEST-001', 'TM-TEST-003']);

const debtRows = filterRows(rows, { statusFilter: '__DEBT__' });
assert.equal(debtRows.length, 0, '__DEBT__ must remain unsupported on Edge and fall back to Apps Script');

const headers = ['رقم الأوردر','كود الأوردر','اسم الشات / المكتب','اسم المسؤول','القسم','رقم البند','اسم البند / نوع الشغل','الكمية','مسؤول القسم','الأولوية','الحالة','جاهز؟','آخر تحديث','ملاحظات','مركز الربح','الكيان','رقم العميل','مكبس حراري'];
const mirrorRows = [
  { rowNumber: 1, display: headers },
  { rowNumber: 2, display: ['O1','O1','عميل','وائل','طباعة','O1-01','بانر','1','وائل','عاجل','طلب جديد','لا',today,'','','','0101','لا'] },
  { rowNumber: 3, display: ['O2','O2','عميل 2','جابر','ليزر','O2-01','حفر','1','جابر','عادي','طلب جديد','لا',today,'','','','0102','لا'] }
];
const printRows = mapMirrorRows(headers, mirrorRows, 'print');
assert.equal(printRows.length, 1, 'print screen should only receive print rows');
assert.equal(printRows[0].orderId, 'O1');

const config = readFileSync('config.js', 'utf8');
assert.match(config, /window\.MATBAGY_EDGE_ORDERS_READ_V1_ENABLED\s*=\s*true;/, 'qualified frontend D1 orders read cutover must remain ON');
assert.match(config, /trendos-edge-orders-read-v1\.js\?v=20260908a/, '02CX edge wrapper cache key must be active');

const wrapper = readFileSync('trendos-edge-orders-read-v1.js', 'utf8');
assert.match(wrapper, /action !== 'getRowsPageV1931'/, 'wrapper must only intercept getRowsPageV1931');
assert.match(wrapper, /statusFilter\) === '__DEBT__'\) return false/, 'debt filter must stay on Apps Script fallback');
assert.match(wrapper, /EDGE_ORDERS_READ_02CX_LINE_ID_GUARD_20260908/, '02CX identity guard must be loaded');
assert.match(wrapper, /using Apps Script fallback/, 'wrapper must fail open to Apps Script');
assert.match(wrapper, /trendos_edge_orders_post_write_barrier_v1/, 'read-your-write barrier must survive browser refresh');

const source = readFileSync('cloudflare-d1/src/edge-orders-read-v1.mjs', 'utf8');
assert.match(source, /dashboard = buildDashboardFromRows\(allRows, screen\)/, 'Edge page response must include D1 dashboard');
assert.doesNotMatch(source, /env\.DB\.prepare\(`\s*INSERT|env\.DB\.prepare\(`\s*UPDATE|env\.DB\.prepare\(`\s*DELETE/, 'orders read endpoint must not contain D1 write SQL');

console.log('PERF_CF_02CN_EDGE_ORDERS_DASHBOARD_TEST_PASS');
