/** SERVER-33 offline contract: no external HTTP, no real D1, no secrets. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import worker from '../cloudflare-d1/src/index_v2.js';
import productionEntrypoint from '../cloudflare-d1/production-shadow/index.js';
import { handleTrendosShopServiceOrdersRequest } from '../cloudflare-d1/src/trendosshop-service-orders-read-v1.mjs';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
const ORIGIN='https://server33-offline.invalid';
const PATH='/v1/printshop/service/orders/page';
const SECRET='FAKE_READER_abcdefghijklmnopqrstuvwxyz0123456789';
const headers=['رقم الأوردر','كود الأوردر','اسم العميل','unused','القسم','رقم البند',
               'اسم البند','الكمية','المسؤول','الأولوية','الحالة','unused',
               'آخر تحديث','ملاحظات'];
function mirrorRow(num,orderId,lineId,department){
  const display=[orderId,'','FAKE_CUSTOMER_PII_DO_NOT_EXPOSE','',department,lineId,'fake item',
                 '2','','عادي','بدأ التنفيذ','','','PRIVATE_CUSTOMER_NOTES'];
  return {rowNumber:num,valuesJson:JSON.stringify(display),displayJson:JSON.stringify(display)};
}
const native=[
  {orderId:'ORD-SHARED',lineId:'LASER-NATIVE',department:'ليزر',status:'جديد',qty:1,customerName:'PRIVATE_CUSTOMER'},
  {orderId:'ORD-SHARED',lineId:'PRINT-NATIVE',department:'طباعة',status:'جديد',qty:3,customerPhone:'010_FAKE_PRIVATE'},
];
function fakeDb({brokenCatalog=false,badLine=false}={}){
  const seen=[];
  return {
    seen,
    prepare(sql){
      seen.push(sql);
      assert.match(sql.trim(),/^SELECT\b/i,'no mutating SQL can run');
      const execute=(kind,args=[])=>{
        if(sql.includes('FROM sheet_catalog')){
          return {headersJson:JSON.stringify(headers),sourceLastRow:3,rowCount:3,
            status:brokenCatalog?'stale':'ready',note:'TrendOS orders live sync V2 quota-aware'};
        }
        if(sql.includes('FROM t12_prod_create_control'))return {marker:'T12_PROD_CREATE_CANARY_V1'};
        if(sql.includes('FROM sheet_rows'))return {results:[
          mirrorRow(2,'ORD-SHARED','PRINT-MIRROR','طباعة'),
          mirrorRow(3,'ORD-SHARED','LASER-MIRROR','ليزر'),
        ]};
        if(sql.includes('FROM t12_prod_lines')){
          return {results:native.filter(row=>row.department===args[0]).map(row=>
            badLine?{...row,lineId:''}:row)};
        }
        throw new Error('UNEXPECTED_SOURCE');
      };
      return {
        first:async()=>execute('first'),
        bind(...args){return {first:async()=>execute('first',args),all:async()=>execute('all',args)};}
      };
    }
  };
}
async function env(db,enabled='true'){
  const digest=await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(SECRET));
  return {
    DB:db, TRENDOSSHOP_SERVICE_READ_ENABLED:enabled,
    TRENDOSSHOP_READER_PRINCIPAL:'trendosshop_order_reader',
    TRENDOSSHOP_READER_TOKEN_SHA256_HEX:Buffer.from(digest).toString('hex'),
  };
}
function req(query='screen=print&page=1&pageSize=20',token=SECRET,method='GET',extra={}){
  return new Request(ORIGIN+PATH+'?'+query,{
    method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...extra}
  });
}
test('default OFF: no D1 reads, even with a token',async()=>{
  const db=fakeDb(),e=await env(db,'false');
  assert.equal((await productionEntrypoint.fetch(req(),e,{})).status,404);
  assert.equal(db.seen.length,0);
});
test('unprovisioned principal and digest deny before D1',async()=>{
  const db=fakeDb(),e=await env(db);
  delete e.TRENDOSSHOP_READER_PRINCIPAL;
  assert.equal((await worker.fetch(req(),e,{})).status,503);
  e.TRENDOSSHOP_READER_PRINCIPAL='trendosshop_order_reader';
  delete e.TRENDOSSHOP_READER_TOKEN_SHA256_HEX;
  assert.equal((await worker.fetch(req(),e,{})).status,503);
  assert.equal(db.seen.length,0);
});
test('absent, wrong and employee-looking Bearer cannot access D1',async()=>{
  const db=fakeDb(),e=await env(db);
  for(const token of ['', 'WRONG_'+SECRET, 'EMPLOYEE_ADMIN_FAKE_TOKEN_0123456789ABCDEF']){
    const res=await productionEntrypoint.fetch(req(undefined,token),e,{});
    assert.equal(res.status,401);
  }
  assert.equal(db.seen.length,0);
});
test('scope, pagination, HEAD and browser Origin deny before D1',async()=>{
  const db=fakeDb(),e=await env(db);
  const queries=['screen=service','screen=press','screen=','screen=print&screen=laser',
                 'screen=print&page=2','screen=print&pageSize=21',
                 'screen=print&customerPhone=123','screen=print&page=1&pageSize=0'];
  for(const q of queries)assert.equal((await worker.fetch(req(q),e,{})).status,403,q);
  assert.equal((await worker.fetch(req('screen=print',SECRET,'HEAD'),e,{})).status,405);
  assert.equal((await worker.fetch(req('screen=laser',SECRET,'GET',{Origin:'https://bad.example'}),e,{})).status,403);
  assert.equal(db.seen.length,0);
});
test('print and laser receive distinct lines of shared order, no third department',async()=>{
  const db=fakeDb(),e=await env(db),data={};
  for(const screen of ['print','laser']){
    const res=await productionEntrypoint.fetch(req('screen='+screen),e,{});
    assert.equal(res.status,200);
    data[screen]=await res.json();
    assert.equal(data[screen].rows.length,2);
    assert.ok(data[screen].rows.every(row=>row.screen===screen));
    assert.ok(data[screen].rows.every(row=>row.orderId==='ORD-SHARED'));
    assert.ok(data[screen].rows.every(row=>Object.keys(row).sort().join(',')===
      ['orderId','lineId','screen','serviceCode','status','quantity'].sort().join(',')));
  }
  assert.deepEqual(new Set(data.print.rows.map(row=>row.lineId)),new Set(['PRINT-NATIVE','PRINT-MIRROR']));
  assert.deepEqual(new Set(data.laser.rows.map(row=>row.lineId)),new Set(['LASER-NATIVE','LASER-MIRROR']));
  const body=JSON.stringify(data);
  assert.ok(!body.includes('PRIVATE_CUSTOMER')&&!body.includes('FAKE_CUSTOMER_PII'));
  assert.ok(db.seen.every(sql=>!sql.includes('FROM customers')&&!sql.includes('UPDATE ')&&!sql.includes('INSERT ')));
});
test('mirror not ready and malformed native line fail closed without data',async()=>{
  for(const opts of [{brokenCatalog:true},{badLine:true}]){
    const db=fakeDb(opts),e=await env(db);
    const res=await worker.fetch(req(),e,{});
    assert.equal(res.status,503);
    const body=await res.text();
    assert.ok(!body.includes('PRIVATE')&&!body.includes('ORD-SHARED'));
  }
});
test('response is restricted to one page, at most 20 records',async()=>{
  const db=fakeDb(),e=await env(db);
  const res=await worker.fetch(req('screen=print&page=1&pageSize=1'),e,{});
  assert.equal(res.status,200);
  const body=await res.json();
  assert.equal(body.rows.length,1);
  assert.equal(body.pagination.hasMore,true);
  assert.equal(body.pagination.page,1);
});
test('one exact route only, no production or external requests performed',async()=>{
  const db=fakeDb(),e=await env(db);
  assert.equal((await handleTrendosShopServiceOrdersRequest(new Request(ORIGIN+'/unrelated'),e)),null);
  assert.equal(new URL(ORIGIN).hostname.endsWith('.invalid'),true);
  assert.equal(db.seen.length,0);
});
