import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const report=require(path.resolve(here,'..','gaber-ledger-daily-report-v1.js'));

const facts={valid:true,workDate:'2026-09-11',department:'ليزر',rows:[{
  materialId:'MAT-1',materialName:'محفظة',unit:'قطعة',purchasedQty:40,orderOutQty:39,wasteQty:0,returnedQty:1,offcutQty:0,otherInQty:0,otherOutQty:0,purchaseValue:4000,goodConsumptionCost:3900,wasteCost:0,recognizedMaterialCost:3900,orderOutRefs:[{eventId:'E1',taskId:'T1',orderId:'3910',lineId:'3910-01',qty:39}],purchaseRefs:[],wasteRefs:[],adjustmentRefs:[]
}]};

test('missing opening balance fails closed instead of assuming zero',()=>{
  const r=report.build({workDate:'2026-09-11',department:'ليزر',ledgerFacts:facts,openingBalances:[],actualClosingBalances:[{materialId:'MAT-1',unit:'قطعة',qty:1}]});
  assert.equal(r.canCloseDay,false);assert.equal(r.rows[0].openingQty,null);assert.equal(r.rows[0].expectedClosingQty,null);assert.equal(r.rows[0].reconciliationStatus,'NO_OPENING_BALANCE');assert.ok(r.blockers.some(x=>x.code==='DAILY_MATERIAL_OPENING_BALANCE_MISSING'));
});

test('missing actual closing balance fails closed explicitly',()=>{
  const r=report.build({workDate:'2026-09-11',department:'ليزر',ledgerFacts:facts,openingBalances:[{materialId:'MAT-1',unit:'قطعة',qty:0}],actualClosingBalances:[]});
  assert.equal(r.canCloseDay,false);assert.equal(r.rows[0].expectedClosingQty,1);assert.equal(r.rows[0].actualClosingQty,null);assert.equal(r.rows[0].reconciliationStatus,'NO_ACTUAL_CLOSING');assert.ok(r.blockers.some(x=>x.code==='DAILY_MATERIAL_ACTUAL_CLOSING_MISSING'));
});

test('complete opening and physical closing reconcile 40/39/1',()=>{
  const r=report.build({workDate:'2026-09-11',department:'ليزر',ledgerFacts:facts,openingBalances:[{materialId:'MAT-1',unit:'قطعة',qty:0}],actualClosingBalances:[{materialId:'MAT-1',unit:'قطعة',qty:1}]});
  assert.equal(r.canCloseDay,true);assert.equal(r.rows[0].expectedClosingQty,1);assert.equal(r.rows[0].actualClosingQty,1);assert.equal(r.rows[0].varianceQty,0);assert.equal(r.rows[0].reconciliationStatus,'RECONCILED');assert.equal(r.rows[0].orderOutRefs[0].orderId,'3910');
});
