import assert from 'node:assert/strict';
import {
  repairSerializedLineId02CX,
  repairEdgeOrderRows02CX,
  repairEdgeOrdersResponse02CX
} from '../cloudflare-d1/src/edge-orders-line-id-repair-02cx.mjs';

assert.equal(repairSerializedLineId02CX('3876', '721721'), '3876-01');
assert.equal(repairSerializedLineId02CX('3961', '752767'), '3961-01');
assert.equal(repairSerializedLineId02CX('3961', '752798'), '3961-02');
assert.equal(repairSerializedLineId02CX('1001', '1001-1'), '1001-1');
assert.equal(repairSerializedLineId02CX('TM2606140061', '123456'), '123456');
assert.equal(repairSerializedLineId02CX('3961', '752768'), '752768', 'only first-day date coercions are eligible');

const mapped = repairEdgeOrderRows02CX([
  { rowNumber: 307, orderId: '3876', lineId: '721721', status: 'تحت التنفيذ' },
  { rowNumber: 397, orderId: '3961', lineId: '752767', status: 'طلب جديد' },
  { rowNumber: 398, orderId: '3961', lineId: '752798', status: 'تم التسليم' },
  { rowNumber: 77, orderId: '1001', lineId: '1001-1', status: 'طلب جديد' }
]);
assert.equal(mapped.repaired, 3);
assert.deepEqual(mapped.rows.map((row) => row.lineId), ['3876-01','3961-01','3961-02','1001-1']);
assert.equal(mapped.rows[0].status, 'تحت التنفيذ');
assert.equal(mapped.rows[0].rowNumber, 307);

const response = new Response(JSON.stringify({
  success: true,
  version: 'D1_ORDERS_READ_02CR_OPERATIONAL_CANARY',
  rows: [{ orderId:'3876', lineId:'721721', status:'تحت التنفيذ' }]
}), { status: 200, headers: { 'content-type':'application/json' } });
const repairedResponse = await repairEdgeOrdersResponse02CX(response);
const repairedBody = await repairedResponse.json();
assert.equal(repairedResponse.status, 200);
assert.equal(repairedBody.rows[0].lineId, '3876-01');
assert.deepEqual(repairedBody.lineIdentityRepair, { version:'02CX', repaired:1 });

const denied = new Response(JSON.stringify({ success:false, code:'unauthorized' }), { status:401 });
assert.equal(await repairEdgeOrdersResponse02CX(denied), denied, 'non-success responses must stay untouched');

console.log('PERF_CF_02CX_D1_LINE_IDENTITY_REPAIR_PASS');
