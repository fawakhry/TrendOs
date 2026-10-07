import assert from 'node:assert/strict';
import { buildDeadlineRiskProjectionV1 } from '../core/deadline-risk-projection-v1.mjs';

const now=Date.parse('2026-10-07T12:00:00.000Z');
const rows=[
  {orderId:'ORD-SECRET-1',lineId:'L-1',customer:'عميل سري',department:'ليزر',status:'طلب جديد',priority:'عاجل',expectedDeliveryAt:'2026-10-07T10:00:00.000Z'},
  {orderId:'ORD-SECRET-1',lineId:'L-2',customer:'عميل سري',department:'ليزر',status:'بدأ التنفيذ',priority:'عادي',expectedDeliveryAt:'2026-10-07T20:00:00.000Z'},
  {orderId:'ORD-SECRET-2',lineId:'L-3',customer:'عميل آخر',department:'طباعة',status:'طلب جديد',priority:'عادي',expectedDeliveryAt:'2026-10-08T11:00:00.000Z'},
  {orderId:'ORD-SECRET-3',lineId:'L-4',customer:'عميل ثالث',department:'طباعة',status:'متوقف',priority:'عاجل',expectedDeliveryAt:'2026-10-09T00:00:00.000Z'},
  {orderId:'ORD-SECRET-4',lineId:'L-5',customer:'عميل رابع',department:'طباعة',status:'تم التسليم',priority:'عاجل',expectedDeliveryAt:'2026-10-06T00:00:00.000Z'},
  {orderId:'ORD-SECRET-5',lineId:'L-6',customer:'عميل خامس',department:'ليزر',status:'طلب جديد',priority:'عادي',expectedDeliveryAt:''}
];

const out=buildDeadlineRiskProjectionV1(rows,{nowMs:now,atRiskHours:24,watchHours:48});
assert.equal(out.mode,'READ_ONLY_AGGREGATE');
assert.equal(out.activeLines,5);
assert.equal(out.activeOrders,4);
assert.equal(out.overdueLines,1);
assert.equal(out.overdueOrders,1);
assert.equal(out.atRisk24hLines,2);
assert.equal(out.atRisk24hOrders,2);
assert.equal(out.watch48hLines,1);
assert.equal(out.watch48hOrders,1);
assert.equal(out.urgentImmediateRiskLines,1);
assert.equal(out.missingDueLines,1);
assert.equal(out.invalidDueLines,0);
assert.equal(out.laneBreakdown.overdue.waiting,1);
assert.equal(out.laneBreakdown.atRisk24h.inProgress,1);
assert.equal(out.laneBreakdown.atRisk24h.waiting,1);
assert.equal(out.laneBreakdown.watch48h.blocked,1);
assert.equal(out.rawOrderIdsExposed,false);
assert.equal(out.rawLineIdsExposed,false);
assert.equal(out.customerPiiExposed,false);
assert.ok(out.departments.some(x=>x.department==='ليزر'&&x.overdueLines===1&&x.atRisk24hLines===1));
assert.ok(out.departments.some(x=>x.department==='طباعة'&&x.atRisk24hLines===1&&x.watch48hLines===1));

const serialized=JSON.stringify(out);
assert.doesNotMatch(serialized,/ORD-SECRET/);
assert.doesNotMatch(serialized,/L-[1-6]/);
assert.doesNotMatch(serialized,/عميل سري|عميل آخر|عميل ثالث|عميل رابع|عميل خامس/);

const empty=buildDeadlineRiskProjectionV1([], {nowMs:now});
assert.equal(empty.activeLines,0);
assert.equal(empty.overdueOrders,0);
assert.equal(empty.nearestFutureDueHours,null);

console.log('DEADLINE_RISK_PROJECTION_V1=PASS');
console.log('RAW_ORDER_IDS_EXPOSED=NO');
console.log('RAW_LINE_IDS_EXPOSED=NO');
console.log('CUSTOMER_PII_EXPOSED=NO');
