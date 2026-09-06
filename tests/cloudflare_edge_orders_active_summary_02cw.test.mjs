import assert from 'node:assert/strict';
import { buildOrdersSummary } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';

const rows = [
  { orderId:'1', priority:'عاجل', status:'طلب جديد', overdue:'لا', debtAmount:0, heatPress:'نعم', flyPrint:'نعم' },
  { orderId:'2', priority:'عادي', status:'تحت التنفيذ', overdue:'نعم', debtAmount:50, heatPress:'نعم', flyPrint:'لا' },
  { orderId:'3', priority:'مؤجل', status:'طلب جديد', overdue:'لا', debtAmount:0, heatPress:'لا', flyPrint:'نعم' },
  { orderId:'4', priority:'VIP', status:'متوقف', overdue:'لا', debtAmount:0, heatPress:'نعم', flyPrint:'' },
  { orderId:'5', priority:'عادي', status:'تحت التنفيذ', overdue:'لا', debtAmount:0, heatPress:'لا', flyPrint:'' },
  { orderId:'6', priority:'عادي', status:'تحت التنفيذ', overdue:'لا', debtAmount:0, heatPress:'نعم', flyPrint:'' }
];
const summary = buildOrdersSummary(rows);
assert.equal(summary.total, 6, 'six active rows must remain six even when UI pageSize is five');
assert.equal(summary.orderCount, 6);
assert.equal(summary.urgent, 2);
assert.equal(summary.normal, 3);
assert.equal(summary.delayedPriority, 1);
assert.equal(summary.overdue, 1);
assert.equal(summary.debts, 1);
assert.equal(summary.heatPress, 4);
assert.equal(summary.heatPressOrders, 4);
assert.equal(summary.flyPrint, 2);
assert.equal(summary.problems, 1);

const duplicateOrder = buildOrdersSummary([
  { orderId:'10', priority:'عادي', status:'تحت التنفيذ', heatPress:'نعم' },
  { orderId:'10', priority:'عادي', status:'تحت التنفيذ', heatPress:'نعم' },
  { orderId:'11', priority:'عادي', status:'تحت التنفيذ', heatPress:'نعم' }
]);
assert.equal(duplicateOrder.heatPress, 3);
assert.equal(duplicateOrder.heatPressOrders, 2, 'press monitor must count unique orders, not returned line items');
console.log('PERF_CF_02CW_GLOBAL_ACTIVE_SUMMARY_PASS');
