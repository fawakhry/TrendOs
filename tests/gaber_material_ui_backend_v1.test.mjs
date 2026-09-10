import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {Buffer} from 'node:buffer';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
class FakeSheet{
  constructor(rows=[]){this.rows=rows.map(r=>r.slice());}
  getLastRow(){return this.rows.length;}
  getLastColumn(){return this.rows[0]?.length||0;}
  getDataRange(){return {getValues:()=>this.rows.map(r=>r.slice())};}
  getRange(row,col,numRows=1,numCols=1){return {getValues:()=>Array.from({length:numRows},(_,ri)=>Array.from({length:numCols},(_,ci)=>this.rows[row-1+ri]?.[col-1+ci]??'')),setValues:(values)=>{for(let ri=0;ri<numRows;ri++){const rr=row-1+ri;while(this.rows.length<=rr)this.rows.push([]);for(let ci=0;ci<numCols;ci++)this.rows[rr][col-1+ci]=values[ri][ci];}return this;}};}
  setFrozenRows(){}
}
class FakeSS{constructor(map={}){this.map=map;}getSheetByName(n){return this.map[n]||null;}insertSheet(n){const s=new FakeSheet();this.map[n]=s;return s;}}
function load(ctx,name){vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});}
function makeEnv(){
  const ctx=vm.createContext({console,JSON,Date,Math,Number,String,Array,Object,Map,Set,Error,Buffer});
  ctx.Utilities={
    DigestAlgorithm:{SHA_256:'SHA_256'},Charset:{UTF_8:'UTF_8'},
    computeDigest:(_a,s)=>Array.from(Buffer.from(String(s),'utf8')).slice(0,32),
    base64EncodeWebSafe:(b)=>Buffer.from(b).toString('base64url'),getUuid:()=>`u-${Math.random()}`,
    formatDate:(d,_tz,p)=>p==='yyyy-MM-dd'?'2026-09-11':'2026-09-11T10:00:00+03:00'
  };
  ctx.otRequireEnabledV2_=()=>{};ctx.otGaberMaterialControlEnabledV2_=()=>true;
  ctx.otRoleV2_=(a)=>a?.user?.role==='admin'?'MANAGER':'GABER';ctx.otUserNameV2_=(a)=>a?.user?.username||'';
  const task={taskId:'T-1',orderId:'3910',lineId:'3910-01',department:'ليزر',employee:'جابر',startedAt:'2026-09-11T09:00:00+03:00'};
  ctx.otActiveIndexV2_=()=>({byEmployee:{'جابر':{x:1}}});ctx.otTaskViewV2_=()=>task;ctx.otFindTaskV2_=()=>({x:1});ctx.otIsGaberLaserTaskV2_=()=>true;
  load(ctx,'gaber-material-movement-ledger-v1.js');load(ctx,'gaber-ledger-daily-report-v1.js');load(ctx,'gaber-material-persistence-backend-v1.gs');load(ctx,'gaber-material-ui-backend-v1.gs');
  const ledgerHeaders=vm.runInContext('GABER_MATERIAL_LEDGER_V1_HEADERS.slice()',ctx),approvalHeaders=vm.runInContext('GABER_MATERIAL_WASTE_APPROVALS_V1_HEADERS.slice()',ctx),requestHeaders=vm.runInContext('GABER_MATERIAL_WASTE_REQUESTS_V1_HEADERS.slice()',ctx);
  const materials=[['ID','القسم','اسم الخامة','الوحدة','تكلفة محسوبة','سعر الوحدة','رصيد المخزن','مفعل'],['MAT-1','ليزر','محفظة','قطعة',100,90,1,'نعم']];
  const pHeaders=['ID','مفتاح الطلب','وقت التسجيل','تاريخ العمل','الموظف','القسم','المورد','رقم فاتورة المورد','الخامة','الكمية','سعر الوحدة','الإجمالي','نوع الدفع','الحالة','حالة المخزون','وقت إضافة المخزون','كمية أضيفت للمخزون','رصيد المخزون بعد الإضافة','رقم فاتورة الشراء الرسمية','وقت عكس المخزون','سبب عكس المخزون','ملاحظات'];
  const purchase=['DPP-1','REQ-1','2026-09-11T08:00:00+03:00','2026-09-11','جابر','ليزر','مورد','INV-1','محفظة',40,100,4000,'كاش','قيد المراجعة','مضاف فورًا','2026-09-11T08:00:00+03:00',40,40,'','','',''];
  const stockHeaders=['ID','وقت الحركة','نوع الحركة','رقم الأوردر','رقم البند','القسم','اسم البند','الخامة','كمية واردة','كمية منصرفة','رصيد قبل الحركة','رصيد بعد الحركة','مسجل بواسطة','ملاحظات'];
  const stockMove=['SM-1','2026-09-11T08:00:00+03:00','PURCHASE','','','ليزر','','محفظة',40,0,0,40,'جابر',''];
  const ss=new FakeSS({'حسابات - الخامات':new FakeSheet(materials),'حسابات - مشتريات الأقسام اليومية':new FakeSheet([pHeaders,purchase]),'حسابات - حركة خامات جابر V1':new FakeSheet([ledgerHeaders]),'حسابات - اعتماد هوالك جابر V1':new FakeSheet([approvalHeaders]),'حسابات - طلبات اعتماد هوالك جابر V1':new FakeSheet([requestHeaders]),'حسابات - حركة المخزون':new FakeSheet([stockHeaders,stockMove])});
  ctx.ss_=()=>ss;return {ctx,ss,task,ledger:ss.map['حسابات - حركة خامات جابر V1'],approvals:ss.map['حسابات - اعتماد هوالك جابر V1'],requests:ss.map['حسابات - طلبات اعتماد هوالك جابر V1']};
}
function gaber(){return {user:{username:'جابر',role:'laser'}};}function manager(){return {user:{username:'ضياء',role:'admin'}};}
function call(env,expr,vars={}){Object.assign(env.ctx,vars);return vm.runInContext(expr,env.ctx);}

test('bootstrap returns authoritative catalog cost and active EasyStore purchase refs',()=>{
  const e=makeEnv(),r=call(e,'gaberMaterialBootstrapV1_({taskId:"T-1"},__a)',{__a:gaber()});assert.equal(r.success,true);assert.equal(r.materials[0].materialId,'MAT-1');assert.equal(r.materials[0].unitCost,100);assert.equal(r.purchases[0].purchaseId,'DPP-1');
});

test('abnormal waste request is append-only idempotent and conflicting retry fails closed',()=>{
  const e=makeEnv(),req={taskId:'T-1',orderId:'3910',lineId:'3910-01',materialId:'MAT-1',wasteId:'W-1',qty:1,reasonCode:'OPERATOR_ERROR',evidenceRef:'photo-1'};
  let r=call(e,'gaberMaterialRequestWasteV1_({taskId:"T-1",requestJson:JSON.stringify(__r)},__a)',{__r:req,__a:gaber()});assert.equal(r.success,true);assert.equal(r.created,true);assert.equal(e.requests.rows.length,2);
  r=call(e,'gaberMaterialRequestWasteV1_({taskId:"T-1",requestJson:JSON.stringify(__r)},__a)',{__r:req,__a:gaber()});assert.equal(r.success,true);assert.equal(r.replayed,true);assert.equal(e.requests.rows.length,2);
  r=call(e,'gaberMaterialRequestWasteV1_({taskId:"T-1",requestJson:JSON.stringify(__r)},__a)',{__r:{...req,qty:2},__a:gaber()});assert.equal(r.success,false);assert.equal(r.code,'WASTE_REQUEST_CONFLICT');
});

test('manager sees pending request, decision clears queue, exact decision retry is zero-duplicate',()=>{
  const e=makeEnv(),req={taskId:'T-1',orderId:'3910',lineId:'3910-01',materialId:'MAT-1',wasteId:'W-1',qty:1,reasonCode:'OPERATOR_ERROR',evidenceRef:'photo-1'};
  const made=call(e,'gaberMaterialRequestWasteV1_({taskId:"T-1",requestJson:JSON.stringify(__r)},__a)',{__r:req,__a:gaber()});
  let q=call(e,'gaberMaterialPendingWasteV1_({},__m)',{__m:manager()});assert.equal(q.items.length,1);
  let d=call(e,'gaberMaterialWasteDecisionV1_({requestId:__id,decision:"APPROVED",reason:"ok"},__m)',{__id:made.requestId,__m:manager()});assert.equal(d.success,true);const n=e.approvals.rows.length;
  q=call(e,'gaberMaterialPendingWasteV1_({},__m)',{__m:manager()});assert.equal(q.items.length,0);
  d=call(e,'gaberMaterialWasteDecisionV1_({requestId:__id,decision:"APPROVED",reason:"ok"},__m)',{__id:made.requestId,__m:manager()});assert.equal(d.success,true);assert.equal(d.replayed,true);assert.equal(e.approvals.rows.length,n);
});

test('daily report reads immutable ledger, exact Order/Line drilldown and accounting stock balances',()=>{
  const e=makeEnv();
  const events=[
    {eventId:'P1',type:'PURCHASE_RECEIPT',workDate:'2026-09-11',occurredAt:'2026-09-11T08:00:00+03:00',department:'ليزر',materialId:'MAT-1',materialName:'محفظة',unit:'قطعة',qty:40,unitCost:100,totalValue:4000,purchaseId:'DPP-1',invoiceNo:'INV-1'},
    {eventId:'C1',type:'PRODUCTION_CONSUMED',workDate:'2026-09-11',occurredAt:'2026-09-11T10:00:00+03:00',department:'ليزر',employee:'جابر',taskId:'T-1',orderId:'3910',lineId:'3910-01',materialId:'MAT-1',materialName:'محفظة',unit:'قطعة',qty:39,unitCost:100}
  ];
  const h=vm.runInContext('GABER_MATERIAL_LEDGER_V1_HEADERS.slice()',e.ctx);events.forEach((ev,i)=>e.ledger.rows.push(['R'+i,'TX','TFP','MC','EV'+i,'FP',ev.workDate,'ليزر',ev.type,'MAT-1',ev.taskId||'',ev.orderId||'',ev.lineId||'',ev.purchaseId||'',ev.wasteId||'','SRC','2026-09-11T10:00:00+03:00',JSON.stringify(ev)]));
  const r=call(e,'gaberMaterialDailyReportV1_({workDate:"2026-09-11"},__a)',{__a:gaber()});assert.equal(r.success,true);assert.equal(r.report.rows[0].purchasedQty,40);assert.equal(r.report.rows[0].orderOutQty,39);assert.equal(r.report.rows[0].openingQty,0);assert.equal(r.report.rows[0].actualClosingQty,1);assert.equal(r.report.rows[0].reconciliationStatus,'RECONCILED');assert.equal(r.report.rows[0].orderOutRefs[0].orderId,'3910');assert.equal(r.report.rows[0].orderOutRefs[0].lineId,'3910-01');
});
