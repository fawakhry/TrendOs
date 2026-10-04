import assert from 'node:assert/strict';
import {
  collectTrendOsRealityRowsV1,
  buildTrendOsOperationalRealityV1,
  recommendNextTrendOsTaskV1
} from '../core/trendos-operational-reality-read-adapter-v1.mjs';

function pageEnvelope(page,totalPages,rows,overrides={}){
  return {
    success:true,
    rows,
    pagination:{page,pageSize:2,totalRows:4,totalPages,hasOlder:page<totalPages},
    dataVersion:'2026-10-05T01:00:00Z',
    version:'D1_ORDERS_READ_V1',
    dataSource:'d1-edge-orders',
    edgeSession:'wael',
    mirror:{syncedAt:'2026-10-05T01:00:00Z'},
    ...overrides
  };
}

const calls=[];
const readPage=async params=>{
  calls.push(params);
  if(params.page===1)return pageEnvelope(1,2,[
    {orderId:'200',lineId:'200-1',department:'طباعة',priority:'عادي',status:'طلب جديد',expectedDeliveryAt:'2026-10-05'},
    {orderId:'300',lineId:'300-1',department:'طباعة',priority:'عاجل',status:'طلب جديد',expectedDeliveryAt:'2026-10-07'}
  ]);
  return pageEnvelope(2,2,[
    {orderId:'100',lineId:'100-1',department:'طباعة',priority:'عاجل',status:'طلب جديد',expectedDeliveryAt:'2026-10-06'},
    {orderId:'400',lineId:'400-1',department:'طباعة',priority:'عادي',status:'طلب جديد',expectedDeliveryAt:'',flyPrint:'نعم'}
  ]);
};

const collected=await collectTrendOsRealityRowsV1(readPage,{screen:'print',pageSize:2});
assert.equal(collected.rows.length,4);
assert.equal(collected.source.dataSource,'d1-edge-orders');
assert.equal(collected.source.totalPages,2);
assert.equal(calls.length,2);
assert.equal(calls[0].statusFilter,'__ACTIVE__');

const snapshot=await buildTrendOsOperationalRealityV1(readPage,{screen:'print',department:'طباعة'});
assert.equal(snapshot.reality.ordinary.length,3);
assert.equal(snapshot.reality.flyPrint.length,1);
assert.deepEqual(snapshot.reality.ordinary.map(x=>x.orderId),['100','300','200']);

const recommendation=await recommendNextTrendOsTaskV1(readPage,{screen:'print',department:'طباعة'});
assert.equal(recommendation.recommended.orderId,'100');
assert.equal(recommendation.source.dataVersion,'2026-10-05T01:00:00Z');

await assert.rejects(
  ()=>collectTrendOsRealityRowsV1(async params=>{
    if(params.page===1)return pageEnvelope(1,2,[{orderId:'1'}]);
    return pageEnvelope(2,2,[{orderId:'2'}],{dataVersion:'CHANGED'});
  },{maxPages:2}),
  err=>err && err.code==='REALITY_SOURCE_VERSION_CHANGED'
);

await assert.rejects(
  ()=>collectTrendOsRealityRowsV1(async ()=>pageEnvelope(1,30,[]),{maxPages:25}),
  err=>err && err.code==='REALITY_SOURCE_INCOMPLETE'
);

await assert.rejects(
  ()=>collectTrendOsRealityRowsV1(async ()=>({success:false,code:'mirror-not-ready'})),
  err=>err && err.code==='REALITY_SOURCE_READ_FAILED'
);

await assert.rejects(
  ()=>collectTrendOsRealityRowsV1(async ()=>pageEnvelope(1,1,[],{version:'WRONG'})),
  err=>err && err.code==='REALITY_SOURCE_VERSION_UNQUALIFIED'
);

console.log('AUTONOMOUS_PRINTSHOP_TRENDOS_REALITY_READ_ADAPTER_V1=PASS');
console.log('SOURCE=D1_EDGE_ORDERS');
console.log('READ_MODE=READ_ONLY_INJECTED');
console.log('SNAPSHOT_PARTIAL_READ=FAIL_CLOSED');
console.log('SOURCE_VERSION_DRIFT=FAIL_CLOSED');
