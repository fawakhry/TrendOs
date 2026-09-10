import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const flow=require(path.resolve(here,'..','gaber-daily-material-flow-v1.js'));

function report(overrides={}){
  return flow.buildDailyMaterialFlow({
    workDate:'2026-09-10',department:'ليزر',
    openingBalances:[{materialId:'WALLET',name:'محفظة',unit:'قطعة',qty:0}],
    purchases:[{purchaseId:'PUR-1',materialId:'WALLET',name:'محفظة',unit:'قطعة',qty:40,total:4000,supplier:'مورد',invoiceNo:'INV-1'}],
    taskCloses:[
      {taskId:'T1',orderId:'3910',lineId:'3910-01',materials:[{materialId:'WALLET',name:'محفظة',unit:'قطعة',consumedQty:20,wasteQty:0,returnedQty:0,offcutQty:0,unitCost:100}]},
      {taskId:'T2',orderId:'3911',lineId:'3911-01',materials:[{materialId:'WALLET',name:'محفظة',unit:'قطعة',consumedQty:19,wasteQty:0,returnedQty:1,offcutQty:0,unitCost:100}]}
    ],
    actualClosingBalances:[{materialId:'WALLET',name:'محفظة',unit:'قطعة',qty:1}],
    ...overrides
  });
}

test('owner example: purchased 40, order out 39, remaining/closing 1',()=>{
  const r=report();
  assert.equal(r.rows.length,1);
  const x=r.rows[0];
  assert.equal(x.purchasedQty,40);
  assert.equal(x.orderOutQty,39);
  assert.equal(x.wasteQty,0);
  assert.equal(x.dailyPurchaseMinusOut,1);
  assert.equal(x.dailyNetMovement,1);
  assert.equal(x.expectedClosingQty,1);
  assert.equal(x.actualClosingQty,1);
  assert.equal(x.reconciliationStatus,'RECONCILED');
  assert.equal(r.canCloseDay,true);
});

test('one damaged unit is waste, not unexplained remaining stock',()=>{
  const r=report({
    taskCloses:[{taskId:'T1',orderId:'3910',lineId:'3910-01',materials:[{materialId:'WALLET',name:'محفظة',unit:'قطعة',consumedQty:39,wasteQty:1,returnedQty:0,offcutQty:0,unitCost:100}]}],
    actualClosingBalances:[{materialId:'WALLET',name:'محفظة',unit:'قطعة',qty:0}]
  });
  const x=r.rows[0];
  assert.equal(x.orderOutQty,39);
  assert.equal(x.wasteQty,1);
  assert.equal(x.dailyPurchaseMinusOut,0);
  assert.equal(x.expectedClosingQty,0);
  assert.equal(x.recognizedMaterialCost,4000);
  assert.equal(r.canCloseDay,true);
});

test('opening stock is kept separate from today net movement',()=>{
  const r=report({openingBalances:[{materialId:'WALLET',name:'محفظة',unit:'قطعة',qty:10}],actualClosingBalances:[{materialId:'WALLET',name:'محفظة',unit:'قطعة',qty:11}]});
  const x=r.rows[0];
  assert.equal(x.dailyNetMovement,1);
  assert.equal(x.expectedClosingQty,11);
  assert.equal(x.actualClosingQty,11);
});

test('order-out drilldown exactly explains the daily outgoing total',()=>{
  const x=report().rows[0];
  assert.equal(x.orderOutRefs.length,2);
  assert.equal(x.orderOutRefs.reduce((s,v)=>s+v.qty,0),39);
  assert.deepEqual(x.orderOutRefs.map(v=>v.orderId),['3910','3911']);
  assert.deepEqual(x.orderOutRefs.map(v=>v.lineId),['3910-01','3911-01']);
});

test('purchase drilldown exactly explains purchased total and value',()=>{
  const x=report().rows[0];
  assert.equal(x.purchaseRefs.length,1);
  assert.equal(x.purchaseRefs.reduce((s,v)=>s+v.qty,0),40);
  assert.equal(x.purchaseRefs.reduce((s,v)=>s+v.value,0),4000);
  assert.equal(x.purchaseValue,4000);
});

test('returned/offcut are visible but not double-counted in net-stock equation',()=>{
  const r=flow.buildDailyMaterialFlow({
    workDate:'2026-09-10',department:'ليزر',
    openingBalances:[{materialId:'ACR',name:'اكريليك',unit:'لوح',qty:0}],
    purchases:[{purchaseId:'P',materialId:'ACR',unit:'لوح',qty:10,total:1000}],
    taskCloses:[{taskId:'T',orderId:'1',lineId:'1-01',materials:[{materialId:'ACR',unit:'لوح',consumedQty:6,wasteQty:1,returnedQty:2,offcutQty:1,unitCost:100}]}],
    actualClosingBalances:[{materialId:'ACR',unit:'لوح',qty:3}]
  });
  const x=r.rows[0];
  assert.equal(x.returnedQty,2);
  assert.equal(x.offcutQty,1);
  assert.equal(x.expectedClosingQty,3); // 10 - 6 good - 1 waste
  assert.equal(x.reconciliationStatus,'RECONCILED');
});

test('physical closing variance blocks department day close',()=>{
  const r=report({actualClosingBalances:[{materialId:'WALLET',name:'محفظة',unit:'قطعة',qty:0}]});
  const x=r.rows[0];
  assert.equal(x.expectedClosingQty,1);
  assert.equal(x.actualClosingQty,0);
  assert.equal(x.closingVarianceQty,-1);
  assert.equal(x.reconciliationStatus,'VARIANCE');
  assert.equal(r.canCloseDay,false);
  assert.ok(r.blockers.some(b=>b.code==='DAILY_MATERIAL_STOCK_VARIANCE'&&b.materialId==='WALLET'));
});

test('missing actual closing balance reports NO_ACTUAL_CLOSING without inventing a variance',()=>{
  const r=report({actualClosingBalances:[]});
  const x=r.rows[0];
  assert.equal(x.reconciliationStatus,'NO_ACTUAL_CLOSING');
  assert.equal(x.closingVarianceQty,null);
  assert.equal(r.blockers.some(b=>b.code==='DAILY_MATERIAL_STOCK_VARIANCE'),false);
});

test('multiple materials stay separately traceable by Material ID and unit',()=>{
  const r=flow.buildDailyMaterialFlow({
    workDate:'2026-09-10',
    openingBalances:[{materialId:'WALLET',name:'محفظة',unit:'قطعة',qty:1},{materialId:'CHAIN',name:'سلسلة',unit:'قطعة',qty:5}],
    purchases:[{purchaseId:'P1',materialId:'WALLET',unit:'قطعة',qty:40,total:4000},{purchaseId:'P2',materialId:'CHAIN',unit:'قطعة',qty:20,total:200}],
    taskCloses:[{taskId:'T',orderId:'10',lineId:'10-01',materials:[{materialId:'WALLET',unit:'قطعة',consumedQty:39,wasteQty:0,unitCost:100},{materialId:'CHAIN',unit:'قطعة',consumedQty:18,wasteQty:1,unitCost:10}]}],
    actualClosingBalances:[{materialId:'WALLET',unit:'قطعة',qty:2},{materialId:'CHAIN',unit:'قطعة',qty:6}]
  });
  assert.equal(r.rows.length,2);
  const wallet=r.rows.find(x=>x.materialId==='WALLET');
  const chain=r.rows.find(x=>x.materialId==='CHAIN');
  assert.equal(wallet.expectedClosingQty,2);
  assert.equal(chain.expectedClosingQty,6);
  assert.equal(r.canCloseDay,true);
});
