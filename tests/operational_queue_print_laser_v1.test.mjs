import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sortOperationalRows,operationalQueueTier,isOperationalOverdue} from '../cloudflare-d1/src/edge-orders-read-02cr-canary.mjs';
import {mapT12CloudNativeRows} from '../cloudflare-d1/src/t12-read-overlay.mjs';

const NOW=new Date('2026-11-08T11:00:00Z');
const rows=[
  {orderId:'N1',priority:'عادي',status:'طلب جديد',expectedDeliveryAt:'2026-11-12',flyPrint:'لا'},
  {orderId:'L1',priority:'عادي',status:'بدأ التنفيذ',expectedDeliveryAt:'2026-11-04',flyPrint:'لا',overdue:'لا'},
  {orderId:'U1',priority:'عاجل',status:'طلب جديد',expectedDeliveryAt:'2026-11-11',flyPrint:'لا'},
  {orderId:'F1',priority:'عاجل',status:'طلب جديد',expectedDeliveryAt:'2026-11-03',flyPrint:'نعم'},
  {orderId:'U2',priority:'VIP',status:'طلب جديد',expectedDeliveryAt:'2026-11-03',flyPrint:'لا'},
  {orderId:'F2',priority:'عادي',status:'طلب جديد',expectedDeliveryAt:'2026-11-11',quickPrint:'على الطاير'},
  {orderId:'N2',priority:'مؤجل',status:'طلب جديد',expectedDeliveryAt:'2026-11-09',flyPrint:'لا'},
  {orderId:'DONE',priority:'عاجل',status:'تم التسليم',expectedDeliveryAt:'2026-11-02',flyPrint:'نعم'},
  {orderId:'L2',priority:'عادي',status:'طلب جديد',expectedDeliveryAt:'2026-11-02',flyPrint:'لا',overdue:'نعم'}
];

test('print full queue: Fly Print, urgent/VIP, overdue, all remaining, closed last',()=>{
  const sorted=sortOperationalRows(rows,'print',NOW);
  assert.deepEqual(sorted.map(x=>x.orderId),
    ['F1','F2','U2','U1','L2','L1','N2','N1','DONE']);
  assert.equal(new Set(sorted.map(x=>x.orderId)).size,rows.length,'orders must not duplicate across tiers');
  assert.deepEqual(sorted.slice(0,4).map(x=>x.orderId), ['F1','F2','U2','U1'],
    'server paging must slice AFTER full queue sorting, not per returned page');
});

test('laser has NO fly tier even if corrupt legacy row contains flyPrint=yes',()=>{
  const sorted=sortOperationalRows(rows,'laser',NOW);
  assert.deepEqual(sorted.map(x=>x.orderId),
    ['F1','U2','U1','L2','L1','N2','F2','N1','DONE']);
  assert.equal(operationalQueueTier(rows[3],'laser',NOW),1);
  assert.equal(operationalQueueTier(rows[3],'print',NOW),0);
  assert.equal(operationalQueueTier(rows[5],'laser',NOW),3);
});

test('overdue by Cairo date, not by old flag or an already completed order',()=>{
  assert.equal(isOperationalOverdue(rows[1],NOW),true);
  assert.equal(isOperationalOverdue(rows[5],NOW),false);
  assert.equal(isOperationalOverdue(rows[7],NOW),false);
  assert.equal(isOperationalOverdue({priority:'عادي',status:'طلب جديد',expectedDeliveryAt:'2026-11-08'},NOW),false);
  assert.equal(isOperationalOverdue({priority:'عادي',status:'طلب جديد',expectedDeliveryAt:'2026-11-07'},NOW),true);
  assert.equal(isOperationalOverdue({priority:'عادي',status:'طلب جديد',expectedDeliveryAt:'٢٠٢٦/١١/٠٧'},NOW),true);
});

test('same rules outside print without a global fly print lane',()=>{
  assert.deepEqual(sortOperationalRows(rows,'service',NOW).map(x=>x.orderId).slice(0,4),
    ['F1','U2','U1','L2']);
});

test('Cloud-native expired fixed delivery is classified overdue while closed is not',()=>{
  const old={
    orderId:'5741',lineId:'5741-01',ordinal:1,department:'طباعة',itemName:'مصنف',
    flyPrint:0,priority:'عادي',status:'طلب جديد',
    orderCreatedAt:'2026-11-02 18:49:04',lineCreatedAt:'2026-11-02 18:49:04'
  };
  const line=mapT12CloudNativeRows([old],'print')[0];
  assert.equal(line.expectedDeliveryAt,'2026-11-04');
  assert.equal(line.overdue,'نعم');
  const done=mapT12CloudNativeRows([{...old,status:'تم التسليم'}],'print')[0];
  assert.equal(done.overdue,'لا');
});

test('employee browser uses the same tiers and the current-order banner obeys them',()=>{
 const code=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const m=code.match(/function defaultWorkSortRank\(row\) \{[\s\S]*?\n  \}/);
 assert.ok(m,'production frontend queue tier function missing');
 function byScreen(screen){
   const env={
     state:{screen}, text:x=>String(x==null?'':x).trim(),
     isHiddenFromUserScreens:s=>['تم التسليم','ملغى','جاهز للاستلام','تم التنفيذ'].includes(s),
     isFlyPrint:x=>['نعم','true','1','على الطاير'].includes(String(x||'').toLowerCase()),
     isOverdueRow:r=>r.overdue==='نعم' || r.expectedDeliveryAt==='2026-11-04',
     isTodayWorkRow:()=>false
   };
   return vm.runInNewContext('('+m[0]+')',env);
 }
 const print=byScreen('print'),laser=byScreen('laser');
 assert.equal(print({priority:'عاجل',flyPrint:'نعم',status:'طلب جديد'}),0);
 assert.equal(print({priority:'عاجل',flyPrint:'لا',status:'طلب جديد'}),1);
 assert.equal(print({priority:'عادي',expectedDeliveryAt:'2026-11-04',status:'طلب جديد'}),2);
 assert.equal(laser({priority:'عادي',flyPrint:'نعم',status:'طلب جديد'}),3);
 assert.equal(laser({priority:'عاجل',flyPrint:'نعم',status:'طلب جديد'}),1);
 assert.match(code,/function renderCurrentOrder\(rows\)[\s\S]*?compareOperationalWork\(a\.row, b\.row\)/);
 assert.match(code,/state\.screen === "print" && isFlyPrint\(r\.flyPrint/);
 assert.match(code,/state\.serverPaging\.enabled \? rows : rows\.slice\(start, start \+ state\.pageSize\)/);
});
