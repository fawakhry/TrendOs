import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const adapter=require(path.resolve(here,'..','gaber-easystore-ledger-adapter-v1.js'));
const ledger=require(path.resolve(here,'..','gaber-material-movement-ledger-v1.js'));
const report=require(path.resolve(here,'..','gaber-ledger-daily-report-v1.js'));

const catalog=[{materialId:'MAT-WALLET',materialName:'محفظة',aliases:['محافظ'],department:'ليزر',unit:'قطعة'}];

function purchase(overrides={}){
  return {
    id:'DPP-1',requestId:'REQ-1',workDate:'2026-09-10',createdAt:'2026-09-10T09:00:00+03:00',
    employee:'جابر',department:'ليزر',supplier:'المورد أ',receiptNo:'SUP-100',material:'محفظة',qty:40,unit:'قطعة',total:4000,
    status:'بانتظار مراجعة ضياء',stockStatus:'مضاف فورًا',stockAppliedAt:'2026-09-10T09:01:00+03:00',stockAppliedQty:40,stockAfter:40,
    ...overrides
  };
}

function taskClose(overrides={}){
  return {
    taskId:'OT2-T1',orderId:'3910',lineId:'3910-01',operator:'جابر',department:'ليزر',
    workDate:'2026-09-10',startedAt:'2026-09-10T10:00:00+03:00',completedAt:'2026-09-10T10:20:00+03:00',
    materials:[{materialId:'MAT-WALLET',name:'محفظة',unit:'قطعة',issuedQty:40,consumedQty:39,returnedQty:1,offcutQty:0,wasteQty:0,unitCost:100}],
    wastes:[],...overrides
  };
}

test('EasyStore applied department purchase becomes deterministic PURCHASE_RECEIPT',()=>{
  const r=adapter.purchaseToEvents(purchase(),catalog);
  assert.equal(r.canAppend,true);
  assert.equal(r.events.length,1);
  assert.deepEqual(r.events[0],{
    department:'ليزر',employee:'جابر',eventId:'GABER:PURCHASE:DPP-1',invoiceNo:'SUP-100',materialId:'MAT-WALLET',materialName:'محفظة',notes:'',occurredAt:'2026-09-10T09:01:00+03:00',purchaseId:'DPP-1',qty:40,sourceRef:'EASYSTORE:DPP:DPP-1',supplier:'المورد أ',totalValue:4000,type:'PURCHASE_RECEIPT',unit:'قطعة',unitCost:100,workDate:'2026-09-10'
  });
  const v=ledger.validateEvent(r.events[0]);
  assert.equal(v.valid,true);
});

test('rejected/reversed EasyStore purchase preserves receipt history and adds explicit reversal',()=>{
  const r=adapter.purchaseToEvents(purchase({status:'مرفوض',stockStatus:'تم عكس المخزون',stockReversedAt:'2026-09-10T12:00:00+03:00',stockReversalReason:'رفض ضياء'}),catalog);
  assert.equal(r.canAppend,true);
  assert.equal(r.events.length,2);
  assert.equal(r.events[0].type,'PURCHASE_RECEIPT');
  assert.equal(r.events[1].type,'ADJUSTMENT_OUT');
  assert.equal(r.events[1].reversalOf,'GABER:PURCHASE:DPP-1');
  assert.equal(r.events[1].qty,40);
  assert.equal(ledger.validateEvent(r.events[1]).valid,true);
});

test('material name cannot silently become durable Material ID',()=>{
  const r=adapter.purchaseToEvents(purchase(),[]);
  assert.equal(r.canAppend,false);
  assert.equal(r.events.length,0);
  assert.ok(r.blockers.some(x=>x.code==='MATERIAL_ID_MAPPING_REQUIRED'));
});

test('balanced Task close maps to issue, good Order Out and return movements',()=>{
  const r=adapter.taskCloseToEvents(taskClose(),catalog);
  assert.equal(r.canAppend,true);
  assert.deepEqual(r.events.map(x=>x.type),['TASK_ISSUE','PRODUCTION_CONSUMED','RETURNED_TO_STOCK']);
  assert.equal(r.events.find(x=>x.type==='PRODUCTION_CONSUMED').qty,39);
  for(const e of r.events)assert.equal(ledger.validateEvent(e).valid,true);
});

test('waste requires exact detail and becomes separate WASTE_SCRAP event',()=>{
  const t=taskClose({
    materials:[{materialId:'MAT-WALLET',name:'محفظة',unit:'قطعة',issuedQty:40,consumedQty:39,returnedQty:0,offcutQty:0,wasteQty:1,unitCost:100}],
    wastes:[{wasteId:'W-1',materialId:'MAT-WALLET',qty:1,reasonCode:'OPERATOR_ERROR'}]
  });
  const r=adapter.taskCloseToEvents(t,catalog);
  assert.equal(r.canAppend,true);
  const w=r.events.find(x=>x.type==='WASTE_SCRAP');
  assert.equal(w.qty,1);
  assert.equal(w.totalValue,100);
  assert.equal(w.reasonCode,'OPERATOR_ERROR');
  assert.equal(ledger.validateEvent(w).valid,true);
});

test('missing waste detail blocks the whole Task movement batch',()=>{
  const t=taskClose({materials:[{materialId:'MAT-WALLET',name:'محفظة',unit:'قطعة',issuedQty:40,consumedQty:39,returnedQty:0,offcutQty:0,wasteQty:1,unitCost:100}],wastes:[]});
  const r=adapter.taskCloseToEvents(t,catalog);
  assert.equal(r.canAppend,false);
  assert.equal(r.events.length,0);
  assert.ok(r.blockers.some(x=>x.code==='WASTE_DETAIL_MISMATCH'));
});

test('owner 40 purchases / 39 Order Out / 1 closing is ledger-backed end to end',()=>{
  const p=adapter.purchaseToEvents(purchase(),catalog);
  const t=adapter.taskCloseToEvents(taskClose(),catalog);
  const plan=ledger.buildAppendPlan([], [...p.events,...t.events]);
  assert.equal(plan.canCommit,true);
  const facts=ledger.deriveDailyMaterialFacts(plan.acceptedEvents,{workDate:'2026-09-10',department:'ليزر'});
  assert.equal(facts.valid,true);
  assert.equal(facts.rows[0].purchasedQty,40);
  assert.equal(facts.rows[0].orderOutQty,39);
  assert.equal(facts.rows[0].purchaseMinusOrderOutAndWaste,1);
  assert.equal(facts.rows[0].orderOutRefs[0].orderId,'3910');
  assert.equal(facts.rows[0].orderOutRefs[0].lineId,'3910-01');

  const daily=report.build({workDate:'2026-09-10',department:'ليزر',ledgerFacts:facts,openingBalances:[{materialId:'MAT-WALLET',unit:'قطعة',qty:0}],actualClosingBalances:[{materialId:'MAT-WALLET',unit:'قطعة',qty:1}]});
  assert.equal(daily.canCloseDay,true);
  assert.equal(daily.rows[0].purchasedQty,40);
  assert.equal(daily.rows[0].orderOutQty,39);
  assert.equal(daily.rows[0].expectedClosingQty,1);
  assert.equal(daily.rows[0].actualClosingQty,1);
  assert.equal(daily.rows[0].reconciliationStatus,'RECONCILED');
});

test('physical closing mismatch blocks day close instead of fabricating waste',()=>{
  const p=adapter.purchaseToEvents(purchase(),catalog);
  const t=adapter.taskCloseToEvents(taskClose(),catalog);
  const facts=ledger.deriveDailyMaterialFacts([...p.events,...t.events],{workDate:'2026-09-10',department:'ليزر'});
  const daily=report.build({ledgerFacts:facts,openingBalances:[{materialId:'MAT-WALLET',unit:'قطعة',qty:0}],actualClosingBalances:[{materialId:'MAT-WALLET',unit:'قطعة',qty:0}]});
  assert.equal(daily.canCloseDay,false);
  assert.ok(daily.blockers.some(x=>x.code==='DAILY_MATERIAL_STOCK_VARIANCE'&&x.varianceQty===-1));
});

test('adapter output is deterministic so retry is replay-safe in ledger',()=>{
  const a=adapter.buildCandidateBatch({purchases:[purchase()],taskCloses:[taskClose()],materialCatalog:catalog});
  const b=adapter.buildCandidateBatch({purchases:[purchase()],taskCloses:[taskClose()],materialCatalog:catalog});
  assert.equal(adapter.stableStringify(a),adapter.stableStringify(b));
  const first=ledger.buildAppendPlan([],a.events);
  assert.equal(first.canCommit,true);
  const retry=ledger.buildAppendPlan(first.acceptedEvents,b.events);
  assert.equal(retry.canCommit,true);
  assert.equal(retry.acceptedEvents.length,0);
  assert.equal(retry.replayedEventIds.length,a.events.length);
});
