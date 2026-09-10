import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const ui=require(path.resolve(here,'..','gaber-material-ui-v1.js'));

function state(){
  return {
    taskId:'T-1',orderId:'3910',lineId:'3910-01',workDate:'2026-09-11',purchaseDeclaration:'NO_PURCHASE',purchaseIds:[],
    materials:[{materialId:'MAT-1',issuedQty:10,consumedQty:9,returnedQty:1,offcutQty:0,wasteQty:0,wasteId:'',reasonCode:'NORMAL_CUT_LOSS',evidenceRef:''}]
  };
}

test('balanced material state serializes exact Task/Order/Line facts and preserves explicit zero offcut',()=>{
  const p=ui.serializeState(state());
  assert.equal(p.taskId,'T-1');assert.equal(p.orderId,'3910');assert.equal(p.lineId,'3910-01');
  assert.equal(p.materials[0].offcutQty,0);assert.equal(p.materials[0].consumedQty,9);assert.deepEqual(p.wastes,[]);
});

test('UI payload never serializes client unit cost as accounting authority',()=>{
  const s=state();s.materials[0].unitCost=1;
  const p=ui.serializeState(s);
  assert.equal(Object.hasOwn(p.materials[0],'unitCost'),false);
});

test('purchase declaration requires an actual selected EasyStore purchase reference',()=>{
  const s=state();s.purchaseDeclaration='PURCHASE_RECORDED';
  const v=ui.validateState(s);assert.equal(v.valid,false);assert.ok(v.errors.some(x=>x.includes('EasyStore')));
  s.purchaseIds=['DPP-1'];const p=ui.serializeState(s);assert.deepEqual(p.purchases,[{purchaseId:'DPP-1'}]);
});

test('material balance fails closed before Task completion payload can be produced',()=>{
  const s=state();s.materials[0].returnedQty=0;
  assert.throws(()=>ui.serializeState(s),/المستلم لازم يساوي/);
});

test('abnormal waste requires evidence and creates exact manager approval request envelope',()=>{
  const s=state();s.materials=[{materialId:'MAT-1',issuedQty:10,consumedQty:9,returnedQty:0,offcutQty:0,wasteQty:1,wasteId:'W-1',reasonCode:'OPERATOR_ERROR',evidenceRef:''}];
  assert.equal(ui.validateState(s).valid,false);
  s.materials[0].evidenceRef='photo-1';
  const p=ui.serializeState(s);assert.equal(p.wastes.length,1);assert.equal(p.wastes[0].reasonCode,'OPERATOR_ERROR');
  const q=ui.wasteRequests(s);assert.deepEqual(q,[{taskId:'T-1',orderId:'3910',lineId:'3910-01',materialId:'MAT-1',wasteId:'W-1',qty:1,reasonCode:'OPERATOR_ERROR',evidenceRef:'photo-1'}]);
});

test('normal cut loss does not create a manager approval request',()=>{
  const s=state();s.materials=[{materialId:'MAT-1',issuedQty:10,consumedQty:9,returnedQty:0,offcutQty:0,wasteQty:1,wasteId:'W-1',reasonCode:'NORMAL_CUT_LOSS',evidenceRef:''}];
  assert.equal(ui.validateState(s).valid,true);assert.deepEqual(ui.wasteRequests(s),[]);
});
