import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const ledger=require(path.resolve(here,'..','gaber-material-movement-ledger-v1.js'));

function consumed(id,qty,order='3910',line='3910-01'){
  return {eventId:id,type:'PRODUCTION_CONSUMED',workDate:'2026-09-10',department:'ليزر',employee:'جابر',taskId:'T-'+order,orderId:order,lineId:line,materialId:'WALLET',materialName:'محفظة',unit:'قطعة',qty,unitCost:100};
}

test('Task material movements require exact Task + Order + Line identity',()=>{
  const v=ledger.validateEvent({eventId:'E1',type:'PRODUCTION_CONSUMED',workDate:'2026-09-10',materialId:'WALLET',qty:1,unitCost:100});
  assert.equal(v.valid,false);
  const codes=v.blockers.map(x=>x.code);
  assert.ok(codes.includes('TASK_ID_REQUIRED'));
  assert.ok(codes.includes('ORDER_ID_REQUIRED'));
  assert.ok(codes.includes('LINE_ID_REQUIRED'));
});

test('negative/zero quantities fail closed',()=>{
  for(const qty of [0,-1,'bad']){
    const v=ledger.validateEvent({...consumed('E-'+String(qty),1),qty});
    assert.equal(v.valid,false);
    assert.ok(v.blockers.some(x=>x.code==='MOVEMENT_POSITIVE_QUANTITY_REQUIRED'));
  }
});

test('purchase receipt requires immutable purchase reference and invoice number',()=>{
  const v=ledger.validateEvent({eventId:'P-E1',type:'PURCHASE_RECEIPT',workDate:'2026-09-10',materialId:'WALLET',unit:'قطعة',qty:40,totalValue:4000});
  assert.equal(v.valid,false);
  assert.ok(v.blockers.some(x=>x.code==='PURCHASE_ID_REQUIRED'));
  assert.ok(v.blockers.some(x=>x.code==='PURCHASE_INVOICE_NUMBER_REQUIRED'));
});

test('waste event requires Waste ID, reason and Accounting unit cost',()=>{
  const v=ledger.validateEvent({eventId:'W-E1',type:'WASTE_SCRAP',workDate:'2026-09-10',taskId:'T1',orderId:'3910',lineId:'3910-01',materialId:'WALLET',qty:1});
  assert.equal(v.valid,false);
  const codes=v.blockers.map(x=>x.code);
  assert.ok(codes.includes('WASTE_ID_REQUIRED'));
  assert.ok(codes.includes('WASTE_REASON_REQUIRED'));
  assert.ok(codes.includes('ACCOUNTING_COST_UNAVAILABLE'));
});

test('identical event replay is zero-addition/idempotent',()=>{
  const e=consumed('E1',10);
  const p=ledger.buildAppendPlan([e],[JSON.parse(JSON.stringify(e))]);
  assert.equal(p.canCommit,true);
  assert.equal(p.acceptedEvents.length,0);
  assert.deepEqual(Array.from(p.replayedEventIds),['E1']);
});

test('same event ID with conflicting payload is rejected atomically',()=>{
  const p=ledger.buildAppendPlan([consumed('E1',10)],[consumed('E1',11),consumed('E2',5)]);
  assert.equal(p.canCommit,false);
  assert.equal(p.acceptedEvents.length,0);
  assert.ok(p.blockers.some(x=>x.code==='MOVEMENT_EVENT_ID_CONFLICT'&&x.eventId==='E1'));
});

test('daily Order Out is derived from exact PRODUCTION_CONSUMED events, not a manual total',()=>{
  const events=[
    {eventId:'P1',type:'PURCHASE_RECEIPT',workDate:'2026-09-10',department:'ليزر',employee:'جابر',materialId:'WALLET',materialName:'محفظة',unit:'قطعة',qty:40,totalValue:4000,purchaseId:'PUR-1',invoiceNo:'INV-1'},
    consumed('C1',20,'3910','3910-01'),
    consumed('C2',19,'3911','3911-02')
  ];
  const d=ledger.deriveDailyMaterialFacts(events,{workDate:'2026-09-10',department:'ليزر'});
  assert.equal(d.valid,true);
  const r=d.rows[0];
  assert.equal(r.purchasedQty,40);
  assert.equal(r.orderOutQty,39);
  assert.equal(r.purchaseMinusOrderOutAndWaste,1);
  assert.equal(r.orderOutRefs.length,2);
  assert.equal(r.orderOutRefs.reduce((s,x)=>s+x.qty,0),39);
  assert.deepEqual(r.orderOutRefs.map(x=>x.orderId),['3910','3911']);
  assert.deepEqual(r.orderOutRefs.map(x=>x.lineId),['3910-01','3911-02']);
});

test('waste is separate from good Order Out and explains remaining stock',()=>{
  const events=[
    {eventId:'P1',type:'PURCHASE_RECEIPT',workDate:'2026-09-10',department:'ليزر',materialId:'WALLET',unit:'قطعة',qty:40,totalValue:4000,purchaseId:'PUR-1',invoiceNo:'INV-1'},
    consumed('C1',39),
    {eventId:'W1',type:'WASTE_SCRAP',workDate:'2026-09-10',department:'ليزر',employee:'جابر',taskId:'T-3910',orderId:'3910',lineId:'3910-01',materialId:'WALLET',unit:'قطعة',qty:1,unitCost:100,wasteId:'WASTE-1',reasonCode:'OPERATOR_ERROR'}
  ];
  const r=ledger.deriveDailyMaterialFacts(events,{workDate:'2026-09-10'}).rows[0];
  assert.equal(r.orderOutQty,39);
  assert.equal(r.wasteQty,1);
  assert.equal(r.purchaseMinusOrderOutAndWaste,0);
  assert.equal(r.dailyNetMovement,0);
});

test('Task issue and returns/offcuts are auditable but do not inflate net Order Out',()=>{
  const events=[
    {eventId:'I1',type:'TASK_ISSUE',workDate:'2026-09-10',department:'ليزر',taskId:'T1',orderId:'3910',lineId:'3910-01',materialId:'ACR',unit:'لوح',qty:10},
    {eventId:'C1',type:'PRODUCTION_CONSUMED',workDate:'2026-09-10',department:'ليزر',taskId:'T1',orderId:'3910',lineId:'3910-01',materialId:'ACR',unit:'لوح',qty:6,unitCost:100},
    {eventId:'R1',type:'RETURNED_TO_STOCK',workDate:'2026-09-10',department:'ليزر',taskId:'T1',orderId:'3910',lineId:'3910-01',materialId:'ACR',unit:'لوح',qty:2},
    {eventId:'O1',type:'REUSABLE_OFFCUT_RETURN',workDate:'2026-09-10',department:'ليزر',taskId:'T1',orderId:'3910',lineId:'3910-01',materialId:'ACR',unit:'لوح',qty:1},
    {eventId:'W1',type:'WASTE_SCRAP',workDate:'2026-09-10',department:'ليزر',taskId:'T1',orderId:'3910',lineId:'3910-01',materialId:'ACR',unit:'لوح',qty:1,unitCost:100,wasteId:'W1',reasonCode:'NORMAL_CUT_LOSS'}
  ];
  const r=ledger.deriveDailyMaterialFacts(events,{workDate:'2026-09-10'}).rows[0];
  assert.equal(r.issuedQty,10);
  assert.equal(r.orderOutQty,6);
  assert.equal(r.returnedQty,2);
  assert.equal(r.offcutQty,1);
  assert.equal(r.wasteQty,1);
  assert.equal(r.recognizedMaterialCost,700);
});

test('explicit adjustments require an auditable reason/source and are never synthesized from variance',()=>{
  const bad=ledger.validateEvent({eventId:'A1',type:'ADJUSTMENT_OUT',workDate:'2026-09-10',materialId:'WALLET',qty:1});
  assert.equal(bad.valid,false);
  assert.ok(bad.blockers.some(x=>x.code==='ADJUSTMENT_REASON_REQUIRED'));
  assert.equal(ledger.TYPES.includes('UNEXPLAINED_WASTE'),false);
});

test('append plan fingerprint is deterministic for identical replay input',()=>{
  const a=ledger.buildAppendPlan([], [consumed('E1',10),consumed('E2',5)]);
  const b=ledger.buildAppendPlan([], [consumed('E1',10),consumed('E2',5)]);
  assert.equal(a.planFingerprint,b.planFingerprint);
  assert.equal(ledger.stableStringify(a),ledger.stableStringify(b));
});
