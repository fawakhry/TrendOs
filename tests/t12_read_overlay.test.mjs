import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  mapT12CloudNativeRows,
  mergeT12ReadOverlayRows,
  readT12CloudNativeOverlay
} from '../cloudflare-d1/src/t12-read-overlay.mjs';

const cloudSource = [{
  lineId:'4322-01',
  orderId:'4322',
  ordinal:1,
  department:'طباعة',
  assignedTo:'',
  itemName:'T12 CANARY ITEM',
  qty:1,
  priority:'عادي',
  status:'طلب جديد',
  heatPress:0,
  flyPrint:0,
  lineCreatedAt:'2026-09-27 19:45:00',
  lineUpdatedAt:'2026-09-27 19:45:00',
  customerMode:'خارجي / عابر',
  customerName:'T12 CANARY CUSTOMER',
  customerPhone:'01000000000',
  externalCustomerId:'999001',
  source:'T12 Production Canary',
  notes:'',
  orderCreatedAt:'2026-09-27 19:45:00',
  orderUpdatedAt:'2026-09-27 19:45:00'
}];

{
  const print = mapT12CloudNativeRows(cloudSource, 'print');
  assert.equal(print.length, 1);
  assert.equal(print[0].orderId, '4322');
  assert.equal(print[0].lineId, '4322-01');
  assert.equal(print[0].cloudNative, true);
  assert.equal(print[0].readOnly, true);
  assert.equal(print[0].writeAuthority, 'cloudflare-t12');
  assert.equal(print[0].rowNumber, 0);
  assert.equal(print[0].customer, 'T12 CANARY CUSTOMER');
  assert.equal(print[0].source, 'T12 Production Canary');
  assert.equal(mapT12CloudNativeRows(cloudSource, 'laser').length, 0);
  assert.equal(mapT12CloudNativeRows(cloudSource, 'service').length, 1);
  assert.equal(mapT12CloudNativeRows(cloudSource, 'press').length, 0);
}

{
  const mirror = [
    { orderId:'4319', lineId:'4319-01', customer:'Old mirror' },
    { orderId:'4322', lineId:'4322-01', customer:'Wrong duplicate mirror' }
  ];
  const cloud = mapT12CloudNativeRows(cloudSource, 'print');
  const merged = mergeT12ReadOverlayRows(mirror, cloud);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].lineId, '4322-01');
  assert.equal(merged[0].cloudNative, true);
  assert.equal(merged[1].lineId, '4319-01');
}

class FakeStmt {
  constructor(sql){ this.sql=sql; }
  bind(){ return this; }
  async first(){
    if (!this.sql.includes('t12_prod_create_control')) throw new Error('unexpected first');
    return {
      marker:'T12_PROD_CREATE_CANARY_V1',
      nextOrderNumber:4323,
      canaryRemaining:0,
      policyEpoch:'owner_fresh_start_20260926',
      updatedAt:'2026-09-27 19:50:02'
    };
  }
  async all(){
    if (!this.sql.includes('FROM t12_prod_lines l')) throw new Error('unexpected all');
    return { results:cloudSource };
  }
}
class FakeDB {
  prepare(sql){ return new FakeStmt(sql); }
}
{
  const overlay = await readT12CloudNativeOverlay({DB:new FakeDB()}, 'print');
  assert.equal(overlay.rows.length, 1);
  assert.equal(overlay.rows[0].orderId, '4322');
  assert.equal(overlay.control.nextOrderNumber, 4323);
  assert.equal(overlay.control.canaryRemaining, 0);
}

const overlaySource=fs.readFileSync(new URL('../cloudflare-d1/src/t12-read-overlay.mjs',import.meta.url),'utf8');
assert.equal(/\b(?:INSERT\s+INTO|UPDATE\s+[A-Za-z_]|DELETE\s+FROM|DROP\s+TABLE|ALTER\s+TABLE|CREATE\s+TABLE)\b/i.test(overlaySource), false);

const handlerSource=fs.readFileSync(new URL('../cloudflare-d1/src/edge-orders-read-02cr-canary.mjs',import.meta.url),'utf8');
assert.match(handlerSource,/readT12CloudNativeOverlay/);
assert.match(handlerSource,/mergeT12ReadOverlayRows/);
assert.match(handlerSource,/D1_ORDERS_READ_02CR_T12_OVERLAY_V1/);
assert.match(handlerSource,/cloudNativeRows:overlay\.rows\.length/);

console.log('T12 read overlay isolated PASS');
