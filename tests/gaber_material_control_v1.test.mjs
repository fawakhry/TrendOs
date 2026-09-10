import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const gm=require(path.resolve(here,'..','gaber-material-control-v1.js'));

function base(overrides={}){
  return {
    taskId:'OT2-task-1',orderId:'3910',lineId:'3910-02',operator:'جابر',department:'ليزر',
    purchaseDeclaration:'NO_PURCHASE',lineRevenue:1000,directOperatingCost:100,otherDirectCost:0,
    materials:[{materialId:'ACR-3MM',unit:'sqm',issuedQty:1,consumedQty:0.7,returnedQty:0.1,offcutQty:0.1,wasteQty:0.1,unitCost:200,expectedQty:0.75}],
    wastes:[{wasteId:'W-1',taskId:'OT2-task-1',orderId:'3910',lineId:'3910-02',materialId:'ACR-3MM',qty:0.1,reasonCode:'NORMAL_CUT_LOSS'}],
    purchases:[],
    policy:{abnormalRequiresApproval:true,evidenceValueThreshold:100,approvalValueThreshold:150,approvalPctThreshold:30},
    ...overrides
  };
}

function codes(decision){return decision.blockers.map(x=>x.code);}

test('purchase declaration is mandatory before Gaber Task can close',()=>{
  const d=gm.buildDecision(base({purchaseDeclaration:''}));
  assert.equal(d.canClose,false);
  assert.ok(codes(d).includes('PURCHASE_DECLARATION_REQUIRED'));
});

test('declared purchase requires a purchase record with invoice number and evidence',()=>{
  let d=gm.buildDecision(base({purchaseDeclaration:'PURCHASE_RECORDED',purchases:[]}));
  assert.equal(d.canClose,false);
  assert.ok(codes(d).includes('PURCHASE_RECORD_REQUIRED'));

  d=gm.buildDecision(base({purchaseDeclaration:'PURCHASE_RECORDED',purchases:[{
    purchaseId:'PUR-1',taskId:'OT2-task-1',orderId:'3910',lineId:'3910-02',supplier:'Supplier A',materialId:'ACR-3MM',qty:2,unitPrice:100
  }]}));
  assert.equal(d.canClose,false);
  assert.ok(codes(d).includes('PURCHASE_INVOICE_NUMBER_REQUIRED'));
  assert.ok(codes(d).includes('PURCHASE_EVIDENCE_REQUIRED'));
});

test('fully evidenced purchase is accepted but purchase spend stays separate from recognized Task cost',()=>{
  const d=gm.buildDecision(base({purchaseDeclaration:'PURCHASE_RECORDED',purchases:[{
    purchaseId:'PUR-1',taskId:'OT2-task-1',orderId:'3910',lineId:'3910-02',supplier:'Supplier A',invoiceNo:'INV-77',evidenceRef:'file://invoice-77',materialId:'ACR-3MM',qty:10,unit:'sqm',unitPrice:200,total:2000,paymentMethod:'نقدي'
  }]}));
  assert.equal(d.canClose,true);
  assert.equal(d.purchaseSpend,2000);
  assert.equal(d.costs.recognizedMaterialCost,160); // 0.7 consumed + 0.1 waste at 200
  assert.equal(d.costs.taskContribution,740); // 1000 - 160 - 100
});

test('issued material must reconcile to consumed + returned + offcut + waste',()=>{
  const d=gm.buildDecision(base({materials:[{materialId:'ACR-3MM',issuedQty:1,consumedQty:0.7,returnedQty:0.1,offcutQty:0.05,wasteQty:0.1,unitCost:200}]}));
  assert.equal(d.canClose,false);
  const b=d.blockers.find(x=>x.code==='MATERIAL_BALANCE_NOT_ZERO');
  assert.ok(b);
  assert.equal(b.varianceQty,0.05);
});

test('waste detail quantity must equal the waste quantity in material reconciliation',()=>{
  const d=gm.buildDecision(base({wastes:[{wasteId:'W-1',taskId:'OT2-task-1',orderId:'3910',lineId:'3910-02',materialId:'ACR-3MM',qty:0.05,reasonCode:'NORMAL_CUT_LOSS'}]}));
  assert.equal(d.canClose,false);
  assert.ok(codes(d).includes('WASTE_DETAIL_MISMATCH'));
});

test('abnormal waste requires supervisor approval and self-approval is rejected',()=>{
  const abnormal={wasteId:'W-2',taskId:'OT2-task-1',orderId:'3910',lineId:'3910-02',materialId:'ACR-3MM',qty:0.1,reasonCode:'SETUP_ERROR',evidenceRef:'file://waste-photo'};
  let d=gm.buildDecision(base({wastes:[abnormal]}));
  assert.equal(d.canClose,false);
  assert.ok(codes(d).includes('WASTE_APPROVAL_REQUIRED'));

  d=gm.buildDecision(base({wastes:[{...abnormal,approval:{approved:true,approver:'جابر',reason:'أنا وافقت'}}]}));
  assert.equal(d.canClose,false);
  assert.ok(d.blockers.some(x=>x.code==='WASTE_APPROVAL_REQUIRED'&&x.selfApprovalForbidden===true));

  d=gm.buildDecision(base({wastes:[{...abnormal,approval:{approved:true,approver:'ضياء',reason:'تمت المراجعة'}}]}));
  assert.equal(d.canClose,true);
  assert.equal(d.costs.abnormalWasteCost,20);
});

test('configured high-waste threshold requires evidence even for normal cut loss',()=>{
  const d=gm.buildDecision(base({
    materials:[{materialId:'ACR-3MM',issuedQty:1,consumedQty:0.4,returnedQty:0.1,offcutQty:0,wasteQty:0.5,unitCost:300}],
    wastes:[{wasteId:'W-HIGH',taskId:'OT2-task-1',orderId:'3910',lineId:'3910-02',materialId:'ACR-3MM',qty:0.5,reasonCode:'NORMAL_CUT_LOSS'}],
    policy:{abnormalRequiresApproval:true,evidenceValueThreshold:100,approvalValueThreshold:1000,approvalPctThreshold:90}
  }));
  assert.equal(d.canClose,false);
  assert.ok(codes(d).includes('WASTE_EVIDENCE_REQUIRED'));
});

test('returned stock and reusable offcut are not charged as recognized Task material cost',()=>{
  const d=gm.buildDecision(base());
  assert.equal(d.canClose,true);
  const m=d.materials[0];
  assert.equal(m.consumedCost,140);
  assert.equal(m.wasteCost,20);
  assert.equal(m.recognizedMaterialCost,160);
  assert.equal(d.costs.recognizedMaterialCost,160);
  assert.equal(d.costs.taskContribution,740);
});

test('missing factual accounting unit cost blocks close when material was consumed or wasted',()=>{
  const d=gm.buildDecision(base({materials:[{materialId:'ACR-3MM',issuedQty:1,consumedQty:0.9,returnedQty:0,offcutQty:0,wasteQty:0.1}]}));
  assert.equal(d.canClose,false);
  assert.ok(codes(d).includes('ACCOUNTING_COST_UNAVAILABLE'));
});

test('Task, Order and Line mismatches in linked records fail closed',()=>{
  const d=gm.buildDecision(base({purchaseDeclaration:'PURCHASE_RECORDED',purchases:[{
    purchaseId:'PUR-X',taskId:'OTHER',orderId:'9999',lineId:'9999-01',supplier:'S',invoiceNo:'I',evidenceRef:'F',materialId:'ACR-3MM',qty:1,unitPrice:10
  }]}));
  assert.equal(d.canClose,false);
  assert.ok(codes(d).includes('TASK_ID_MISMATCH'));
  assert.ok(codes(d).includes('ORDER_ID_MISMATCH'));
  assert.ok(codes(d).includes('LINE_ID_MISMATCH'));
});

test('identical replay input produces the same deterministic close fingerprint',()=>{
  const a=gm.buildDecision(base());
  const b=gm.buildDecision(JSON.parse(JSON.stringify(base())));
  assert.equal(a.decisionFingerprint,b.decisionFingerprint);
  assert.equal(gm.stableStringify(a),gm.stableStringify(b));
});

test('equivalent object key order does not change fingerprint',()=>{
  const x={b:2,a:{d:4,c:3}};
  const y={a:{c:3,d:4},b:2};
  assert.equal(gm.fingerprint(x),gm.fingerprint(y));
});
