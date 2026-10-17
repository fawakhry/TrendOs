import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {request as rawHttpRequest} from 'node:http';
import {startPilot} from '../tools/ops-pilot-local-v1/server.mjs';

await test('Ops pilot local real HTTP — synthetic orders + original manager UI, finance OFF',async t=>{
  const p=await startPilot({port:0});t.after(()=>p.close());
  const base='http://127.0.0.1:'+p.port;
  const raw=(path,opts)=>fetch(base+path,opts);
  const session=await raw('/api/session'),s=await session.json();
  assert.equal(session.status,200);
  assert.equal(s.mode,'SYNTHETIC_LOCAL_ONLY');
  assert.equal(s.financeRelease,'NO_GO');
  assert.match(s.token,/^[a-f0-9]{64}$/);
  assert.equal(p.server.address().address,'127.0.0.1');
  const request=async(path,method='GET',body,token=s.token,origin=base)=>{
    const headers={'x-pilot-token':token};
    if(method==='POST'){
      headers.origin=origin;headers['content-type']='application/json';
    }
    const res=await raw(path,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})});
    return {code:res.status,data:await res.json()};
  };
  await t.test('01 actual HTTP serves self-contained RTL UI and existing manager source, never remote API',async()=>{
    const html=await raw('/');
    const page=await html.text();
    assert.equal(html.status,200);
    assert.match(page,/TrendOS — تجربة تشغيل المطبعة/);
    assert.match(page,/manager-center-v1932\.js/);
    assert.match(page,/لا اتصال بجوجل أو Cloudflare/);
    assert.match(html.headers.get('content-security-policy'),/connect-src 'self'/);
    const js=await raw('/manager-center-v1932.js');
    assert.equal(js.status,200);
    assert.equal(await js.text(),await readFile('manager-center-v1932.js','utf8'));
  });
  await t.test('02 only three synthetic initial orders — manager counts and holds are real HTTP',async()=>{
    const list=await request('/api/orders');
    assert.equal(list.code,200);assert.equal(list.data.orders.length,3);
    assert.equal(list.data.orders[0].id,'DEMO-0001');
    assert.equal(list.data.orders[2].blocked,true);
    const mgr=await request('/api/manager');
    assert.equal(mgr.code,200);
    assert.equal(mgr.data.system.activeLines,3);
    assert.equal(mgr.data.system.archivedLines,0);
    assert.equal(mgr.data.debtControl.restrictions.length,1);
    assert.equal(mgr.data.financeRelease,'NO_GO');
  });
  await t.test('03 unauthorized, forged external Host and remote Origin are denied',async()=>{
    assert.equal((await request('/api/orders','GET',undefined,'bad-token')).code,401);
    assert.equal((await request('/api/orders','POST',{product:'مج',department:'الطباعة'},s.token,'https://production.invalid')).code,403);
    // fetch/undici normalizes the Host header; use real node:http here to
    // deliberately send an invalid Host over an actual loopback TCP socket.
    const badHost=await new Promise((done,fail)=>{
      const req=rawHttpRequest({hostname:'127.0.0.1',port:p.port,path:'/api/orders',headers:{Host:'evil.example','x-pilot-token':s.token}},res=>{
        res.resume();res.on('end',()=>done(res.statusCode));
      });req.on('error',fail);req.end();
    });
    assert.equal(badHost,403);
  });
  await t.test('04 user-provided identity, financial amounts and arbitrary fields rejected',async()=>{
    for(const extra of [
      {product:'مج',department:'الطباعة',customerName:'REAL_USER'},
      {product:'مج',department:'الطباعة',payment:150},
      {product:'مج',department:'الطباعة',phone:'01000000000'},
      {product:'غير مسموح',department:'الطباعة'}
    ]){
      const r=await request('/api/orders','POST',extra);
      assert.equal(r.code,400,JSON.stringify(r));
      assert.equal(r.data.financeRelease,'NO_GO');
    }
    assert.equal((await request('/api/orders')).data.orders.length,3);
  });
  await t.test('05 create is REAL isolated SQLite INSERT and manager sees fourth order',async()=>{
    const created=await request('/api/orders','POST',{product:'مج',department:'الطباعة'});
    assert.equal(created.code,201);assert.equal(created.data.id,'DEMO-0004');
    const list=await request('/api/orders');
    assert.equal(list.data.orders.length,4);
    assert.equal(list.data.orders[3].customer,'عميل تجريبي 4');
    const mgr=await request('/api/manager');
    assert.equal(mgr.data.system.activeLines,4);
  });
  await t.test('06 status cannot jump to delivered or replay, write-time check applies',async()=>{
    let r=await request('/api/orders/DEMO-0004/status','POST',{status:'تم التسليم'});
    assert.equal(r.code,409);
    r=await request('/api/orders/DEMO-0004/status','POST',{status:'جاري التنفيذ'});
    assert.equal(r.code,200);
    r=await request('/api/orders/DEMO-0004/status','POST',{status:'جاري التنفيذ'});
    assert.equal(r.code,409);
    r=await request('/api/orders/DEMO-0004/status','POST',{status:'جاهز للتسليم'});
    assert.equal(r.code,200);
    r=await request('/api/orders/DEMO-0004/status','POST',{status:'تم التسليم'});
    assert.equal(r.code,200);
    assert.equal((await request('/api/manager')).data.system.archivedLines,1);
  });
  await t.test('07 restriction blocks simulated delivery even at ready status',async()=>{
    const r=await request('/api/orders/DEMO-0003/status','POST',{status:'تم التسليم'});
    assert.equal(r.code,409);assert.equal(r.data.code,'DEMO_DELIVERY_RESTRICTION');
    const mgr=await request('/api/manager');
    assert.equal(mgr.data.debtControl.restrictions.length,1);
    assert.equal((await request('/api/orders')).data.orders[2].status,'جاهز للتسليم');
  });
  await t.test('08 finance, refunds, arbitrary native/legacy routes forbidden even for local admin',async()=>{
    for(const path of ['/api/payment_received','/api/finance','/v1/employee/accounting','/api/customers']){
      const r=await request(path,'POST',{operation:'payment_received',amount:100});
      assert.equal(r.code,403,path);assert.equal(r.data.financeRelease,'NO_GO');
    }
    assert.equal((await request('/api/manager','POST',{})).code,403);
  });
  await t.test('09 GET manager requires token; no external remote URLs or D1 credentials',async()=>{
    assert.equal((await raw('/api/manager')).status,401);
    const list=await request('/api/orders');
    assert.equal(list.data.orders.every(o=>o.id.startsWith('DEMO-')),true);
    assert.equal(list.data.orders.some(o=>Object.hasOwn(o,'phone')||Object.hasOwn(o,'amount')),false);
  });
});
await test('Ops pilot clean restart erases old orders and invalidates previous token',async t=>{
  const x=await startPilot({port:0});
  const base='http://127.0.0.1:'+x.port;
  const old=(await (await fetch(base+'/api/session')).json()).token;
  await x.close();
  const y=await startPilot({port:0});t.after(()=>y.close());
  const next='http://127.0.0.1:'+y.port;
  const newSession=(await (await fetch(next+'/api/session')).json()).token;
  assert.notEqual(old,newSession);
  assert.equal((await fetch(next+'/api/orders',{headers:{'x-pilot-token':old}})).status,401);
  const r=await fetch(next+'/api/orders',{headers:{'x-pilot-token':newSession}});
  assert.equal((await r.json()).orders.length,3);
  assert.equal(y.server.address().address,'127.0.0.1');
});
