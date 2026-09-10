import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');

class FakeSheet{
  constructor(rows){this.rows=(rows||[]).map(r=>r.slice());this.frozen=0;}
  getLastRow(){return this.rows.length;}
  getLastColumn(){return this.rows[0]?.length||0;}
  getDataRange(){return {getValues:()=>this.rows.map(r=>r.slice())};}
  getRange(row,col,numRows=1,numCols=1){
    return {
      getValues:()=>Array.from({length:numRows},(_,ri)=>Array.from({length:numCols},(_,ci)=>this.rows[row-1+ri]?.[col-1+ci]??'')),
      setValues:(values)=>{
        for(let ri=0;ri<numRows;ri++){
          const rr=row-1+ri;
          while(this.rows.length<=rr)this.rows.push([]);
          for(let ci=0;ci<numCols;ci++)this.rows[rr][col-1+ci]=values[ri][ci];
        }
        return this;
      }
    };
  }
  setFrozenRows(n){this.frozen=n;}
}
class FakeSS{
  constructor(map){this.map=map||{};}
  getSheetByName(name){return this.map[name]||null;}
  insertSheet(name){const sh=new FakeSheet([]);this.map[name]=sh;return sh;}
}

function loadScript(ctx,name){vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});}
function makeEnv({approvalRows=[],purchaseRows=[],withLedger=true,withApproval=true}={}){
  const ctx=vm.createContext({console,JSON,Date,Math,Number,String,Array,Object,Map,Set,Error});
  ctx.__nowIso='2026-09-10T20:50:00+03:00';ctx.__workDate='2026-09-10';
  ctx.Utilities={formatDate:(_d,_tz,pattern)=>pattern==='yyyy-MM-dd'?ctx.__workDate:ctx.__nowIso,getUuid:()=>`uuid-${Math.random()}`};
  ctx.otGaberMaterialControlEnabledV2_=()=>true;
  ctx.otRoleV2_=(auth)=>auth?.user?.role==='admin'?'MANAGER':'GABER';
  loadScript(ctx,'gaber-material-control-v1.js');
  loadScript(ctx,'gaber-easystore-ledger-adapter-v1.js');
  loadScript(ctx,'gaber-material-movement-ledger-v1.js');
  loadScript(ctx,'gaber-material-persistence-v1.js');
  loadScript(ctx,'gaber-material-persistence-backend-v1.gs');

  const ledgerHeaders=vm.runInContext('GABER_MATERIAL_LEDGER_V1_HEADERS.slice()',ctx);
  const approvalHeaders=vm.runInContext('GABER_MATERIAL_WASTE_APPROVALS_V1_HEADERS.slice()',ctx);
  const materials=[
    ['ID','القسم','اسم الخامة','الوحدة','تكلفة محسوبة','سعر الوحدة','مفعل'],
    ['MAT-1','ليزر','محفظة','قطعة',100,90,'نعم']
  ];
  const purchaseHeaders=['ID','مفتاح الطلب','وقت التسجيل','تاريخ العمل','الموظف','القسم','المورد','رقم فاتورة المورد','الخامة','الكمية','سعر الوحدة','الإجمالي','نوع الدفع','الحالة','حالة المخزون','وقت إضافة المخزون','كمية أضيفت للمخزون','رصيد المخزون بعد الإضافة','رقم فاتورة الشراء الرسمية','وقت عكس المخزون','سبب عكس المخزون','ملاحظات'];
  const map={
    'حسابات - الخامات':new FakeSheet(materials),
    'حسابات - مشتريات الأقسام اليومية':new FakeSheet([purchaseHeaders,...purchaseRows])
  };
  if(withLedger)map['حسابات - حركة خامات جابر V1']=new FakeSheet([ledgerHeaders]);
  if(withApproval)map['حسابات - اعتماد هوالك جابر V1']=new FakeSheet([approvalHeaders,...approvalRows]);
  const ss=new FakeSS(map);ctx.ss_=()=>ss;
  return {ctx,ss,ledger:map['حسابات - حركة خامات جابر V1'],approvalHeaders,purchaseHeaders};
}
function task(){return {taskId:'T-3910',orderId:'3910',lineId:'3910-01',department:'ليزر',employee:'جابر',startedAt:'2026-09-10T19:00:00+03:00'};}
function auth(){return {user:{username:'جابر',role:'laser'}};}
function payload(extra={}){return {
  taskId:'T-3910',orderId:'3910',lineId:'3910-01',purchaseDeclaration:'NO_PURCHASE',
  materials:[{materialId:'MAT-1',issuedQty:10,consumedQty:9,returnedQty:1,offcutQty:0,wasteQty:0,unitCost:1}],wastes:[],lineRevenue:2000,...extra
};}
function call(env,p=payload(),t=task(),a=auth()){
  env.ctx.__p={materialClosePayload:JSON.stringify(p)};env.ctx.__task=t;env.ctx.__auth=a;
  return vm.runInContext('gaberMaterialTaskCloseGateV1_(__p,__task,__auth)',env.ctx);
}

test('balanced Task close persists one append batch and hydrates Accounting unit cost',()=>{
  const env=makeEnv(),r=call(env);
  assert.equal(r.success,true);assert.equal(r.canClose,true);assert.equal(r.appendCount,3);
  assert.equal(env.ledger.rows.length,4);
  const consumedRow=env.ledger.rows.slice(1).find(r=>r[8]==='PRODUCTION_CONSUMED');
  assert.ok(consumedRow);
  const event=JSON.parse(consumedRow[17]);
  assert.equal(event.materialId,'MAT-1');assert.equal(event.unitCost,100);assert.equal(event.taskId,'T-3910');assert.equal(event.orderId,'3910');assert.equal(event.lineId,'3910-01');
});

test('retry after clock changes reuses first server close stamp and appends zero duplicate rows',()=>{
  const env=makeEnv(),first=call(env);assert.equal(first.canClose,true);
  const count=env.ledger.rows.length;env.ctx.__nowIso='2026-09-10T21:20:00+03:00';
  const retry=call(env);assert.equal(retry.success,true);assert.equal(retry.canClose,true);assert.equal(retry.replayed,true);assert.equal(retry.appendCount,0);assert.equal(env.ledger.rows.length,count);assert.equal(retry.materialCloseId,first.materialCloseId);
});

test('client cannot close a different Task/Order/Line by editing payload IDs',()=>{
  const env=makeEnv(),r=call(env,payload({orderId:'9999'}));
  assert.equal(r.success,false);assert.equal(r.code,'GABER_MATERIAL_TASK_IDENTITY_MISMATCH');assert.ok(r.blockers.some(b=>b.code==='ORDER_ID_MISMATCH'));assert.equal(env.ledger.rows.length,1);
});

test('missing persistence store fails closed and gate never creates it implicitly',()=>{
  const env=makeEnv({withLedger:false}),r=call(env);
  assert.equal(r.success,false);assert.equal(r.code,'GABER_MATERIAL_STORE_MISSING');assert.equal(env.ss.getSheetByName('حسابات - حركة خامات جابر V1'),null);
});

test('abnormal waste ignores client-side fake approval and requires server approval record',()=>{
  const env=makeEnv();
  const p=payload({materials:[{materialId:'MAT-1',issuedQty:10,consumedQty:9,returnedQty:0,offcutQty:0,wasteQty:1}],wastes:[{wasteId:'W-1',materialId:'MAT-1',qty:1,reasonCode:'OPERATOR_ERROR',evidenceRef:'photo-1',approval:{approved:true,approver:'ضياء'}}]});
  const r=call(env,p);assert.equal(r.success,true);assert.equal(r.canClose,false);assert.ok(r.blockers.some(b=>b.code==='WASTE_APPROVAL_REQUIRED'));assert.equal(env.ledger.rows.length,1);
});

test('server approval record allows abnormal waste and keeps factual Accounting cost',()=>{
  const approval=[['GWA-1','W-1','T-3910','3910','3910-01','MAT-1','APPROVED','ضياء','تمت المراجعة','2026-09-10T20:40:00+03:00','photo-1']];
  const env=makeEnv({approvalRows:approval});
  const p=payload({materials:[{materialId:'MAT-1',issuedQty:10,consumedQty:9,returnedQty:0,offcutQty:0,wasteQty:1}],wastes:[{wasteId:'W-1',materialId:'MAT-1',qty:1,reasonCode:'OPERATOR_ERROR',evidenceRef:'photo-1'}]});
  const r=call(env,p);assert.equal(r.success,true);assert.equal(r.canClose,true);
  const waste=env.ledger.rows.slice(1).find(x=>x[8]==='WASTE_SCRAP');assert.ok(waste);assert.equal(JSON.parse(waste[17]).unitCost,100);
});

test('EasyStore purchase reference is hydrated from server row and persisted as PURCHASE_RECEIPT',()=>{
  const purchase=[['DPP-1','REQ-1','2026-09-10T18:00:00+03:00','2026-09-10','جابر','ليزر','مورد أ','INV-1','محفظة',40,100,4000,'كاش','قيد المراجعة','مضاف فورًا','2026-09-10T18:00:00+03:00',40,40,'','','','']];
  const env=makeEnv({purchaseRows:purchase});
  const p=payload({purchaseDeclaration:'PURCHASE_RECORDED',purchases:[{purchaseId:'DPP-1'}]});
  const r=call(env,p);assert.equal(r.success,true);assert.equal(r.canClose,true);
  const receipt=env.ledger.rows.slice(1).find(x=>x[8]==='PURCHASE_RECEIPT');assert.ok(receipt);const e=JSON.parse(receipt[17]);assert.equal(e.purchaseId,'DPP-1');assert.equal(e.qty,40);assert.equal(e.materialId,'MAT-1');
});

test('rejected/reversed EasyStore purchase cannot satisfy purchase declaration',()=>{
  const purchase=[['DPP-2','REQ-2','2026-09-10T18:00:00+03:00','2026-09-10','جابر','ليزر','مورد أ','INV-2','محفظة',40,100,4000,'كاش','مرفوض','تم عكس المخزون','2026-09-10T18:00:00+03:00',40,0,'','2026-09-10T19:00:00+03:00','رفض ضياء','']];
  const env=makeEnv({purchaseRows:purchase});
  const r=call(env,payload({purchaseDeclaration:'PURCHASE_RECORDED',purchases:[{purchaseId:'DPP-2'}]}));assert.equal(r.success,false);assert.equal(r.code,'GABER_MATERIAL_HYDRATION_BLOCKED');assert.ok(r.blockers.some(b=>b.code==='PURCHASE_NOT_ACTIVE'));
});

test('waste approval writer forbids self-approval even for a manager identity',()=>{
  const env=makeEnv();env.ctx.__ap={wasteId:'W1',taskId:'T1',orderId:'1',lineId:'1-01',materialId:'MAT-1',operator:'ضياء',decision:'APPROVED'};env.ctx.__aa={user:{username:'ضياء',role:'admin'}};
  const r=vm.runInContext('gaberMaterialRecordWasteApprovalV1_(__ap,__aa)',env.ctx);assert.equal(r.success,false);assert.equal(r.code,'WASTE_SELF_APPROVAL_FORBIDDEN');
});