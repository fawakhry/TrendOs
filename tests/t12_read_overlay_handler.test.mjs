import assert from 'node:assert/strict';
import { issueOrdersEdgeToken } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import { handleT12ReadOverlayRequest } from '../cloudflare-d1/src/t12-read-overlay-handler.mjs';

const SECRET='test-edge-secret-123456789';
const cloudSource=[{
  lineId:'4322-01', orderId:'4322', ordinal:1, department:'طباعة', assignedTo:'',
  itemName:'T12 CANARY ITEM', qty:1, priority:'عادي', status:'طلب جديد',
  heatPress:0, flyPrint:0, lineCreatedAt:'2026-09-27 19:45:00',
  lineUpdatedAt:'2026-09-27 19:45:00', customerMode:'خارجي / عابر',
  customerName:'T12 CANARY CUSTOMER', customerPhone:'01000000000',
  externalCustomerId:'999001', source:'T12 Production Canary', notes:'',
  orderCreatedAt:'2026-09-27 19:45:00', orderUpdatedAt:'2026-09-27 19:45:00'
}];

class FakeStmt {
  constructor(sql){ this.sql=sql; }
  bind(){ return this; }
  async first(){
    if (!this.sql.includes('t12_prod_create_control')) throw new Error('unexpected first');
    return { marker:'T12_PROD_CREATE_CANARY_V1', nextOrderNumber:4323, canaryRemaining:0, policyEpoch:'owner_fresh_start_20260926', updatedAt:'2026-09-27 19:50:02' };
  }
  async all(){
    if (!this.sql.includes('FROM t12_prod_lines l')) throw new Error('unexpected all');
    return { results:cloudSource };
  }
}
const env={DB:{prepare(sql){return new FakeStmt(sql);}},EDGE_SESSION_SECRET:SECRET,CORS_ORIGINS:'https://fawakhry.github.io'};
const token=await issueOrdersEdgeToken({sub:'admin-test',role:'admin',department:'',screens:['service','print','laser','press','']},SECRET,Math.floor(Date.now()/1000),600);

{
  const req=new Request('https://example.test/v1/t12/orders/read-overlay?screen=print&q=4322',{headers:{authorization:'Bearer '+token,origin:'https://fawakhry.github.io'}});
  const res=await handleT12ReadOverlayRequest(req,env);
  assert.equal(res.status,200);
  const body=await res.json();
  assert.equal(body.success,true);
  assert.equal(body.readOnly,true);
  assert.equal(body.rows.length,1);
  assert.equal(body.rows[0].orderId,'4322');
  assert.equal(body.rows[0].lineId,'4322-01');
  assert.equal(body.rows[0].cloudNative,true);
  assert.equal(body.control.nextOrderNumber,4323);
  assert.equal(body.control.canaryRemaining,0);
}

{
  const req=new Request('https://example.test/v1/t12/orders/read-overlay?screen=laser',{headers:{authorization:'Bearer '+token}});
  const res=await handleT12ReadOverlayRequest(req,env);
  assert.equal(res.status,200);
  const body=await res.json();
  assert.equal(body.rows.length,0);
}

{
  const req=new Request('https://example.test/v1/t12/orders/read-overlay?screen=print',{headers:{authorization:'Bearer invalid'}});
  const res=await handleT12ReadOverlayRequest(req,env);
  assert.equal(res.status,401);
}

console.log('T12 read overlay handler isolated PASS');
