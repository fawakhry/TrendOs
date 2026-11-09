import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sortOperationalRows,operationalDeliverySortKey,operationalQueueTier} from '../cloudflare-d1/src/edge-orders-read-02cr-canary.mjs';

const now = new Date('2026-11-09T19:34:00Z');
const row=(id,due,priority='عادي',extras={})=>({
  orderId:id, lineId:id+'-01', department:'طباعة', status:'طلب جديد',
  priority, flyPrint:'لا', expectedDeliveryAt:due, ...extras
});

test('reproduces owner screenshots: Nov 9 orders on page 5 must precede Nov 11 orders on page 1',()=>{
  const historicalSourceOrder=[
    row('5724','2026-11-04'),
    row('5952','2026-11-11'),row('5953','2026-11-11'),row('5955','2026-11-11'),
    row('5850','2026-11-09'),row('5851','2026-11-09'),row('5855','2026-11-09'),row('5866','2026-11-09')
  ];
  const ordered=sortOperationalRows(historicalSourceOrder,'print',now);
  assert.deepEqual(ordered.map(x=>x.orderId),
    ['5724','5850','5851','5855','5866','5952','5953','5955']);
  assert.deepEqual(ordered.slice(0,4).map(x=>x.orderId),['5724','5850','5851','5855']);
  assert.deepEqual(ordered.slice(4,8).map(x=>x.orderId),['5866','5952','5953','5955']);
  assert.deepEqual(historicalSourceOrder.slice(1,4).map(x=>x.orderId),['5952','5953','5955'],
    'full collection input order is unchanged: no production data mutation');
});

test('priority tiers remain absolute; due date sorts ascending ONLY inside each tier',()=>{
 const input=[
  row('normal-11','2026-11-11'),
  row('urgent-13','2026-11-13','عاجل'),
  row('fly-12','2026-11-12','عاجل',{flyPrint:'نعم'}),
  row('overdue-08','2026-11-08'),
  row('normal-09','2026-11-09'),
  row('urgent-10','2026-11-10','VIP'),
  row('fly-09','2026-11-09','عادي',{flyPrint:'نعم'}),
  row('missing',''),
  row('overdue-04','2026-11-04'),
  row('normal-11b','2026-11-11')
 ];
 const print=sortOperationalRows(input,'print',now);
 assert.deepEqual(print.map(x=>x.orderId),
 ['fly-09','fly-12','urgent-10','urgent-13','overdue-04','overdue-08','normal-09','normal-11','normal-11b','missing']);
 assert.equal(new Set(print.map(x=>x.orderId)).size,input.length);
 assert.equal(operationalDeliverySortKey(input[7]),'9999-12-31');
 assert.equal(operationalQueueTier(input[2],'laser',now),1);
 const laser=sortOperationalRows(input,'laser',now).map(x=>x.orderId);
 assert.deepEqual(laser,
 ['urgent-10','fly-12','urgent-13','overdue-04','overdue-08','normal-09','fly-09','normal-11','normal-11b','missing']);
});

test('ISO, Egyptian digits, mixed legacy formats, and missing dates keep deterministic chronological order',()=>{
 const mixed=[
  row('late','٢٠٢٦/١١/١٢'),
  row('early','2026-11-09 (محسوب حسب سياسة النظام)', 'عادي',{expectedDeliveryAt:'' ,expectedDeliveryText:'2026-11-09 (محسوب حسب سياسة النظام)'}),
  row('middle','09/11/2026'),
  row('unknown','')
 ];
 assert.equal(operationalDeliverySortKey(mixed[0]),'2026-11-12');
 assert.equal(operationalDeliverySortKey(mixed[1]),'2026-11-09');
 assert.equal(operationalDeliverySortKey(mixed[2]),'2026-11-09');
 assert.deepEqual(sortOperationalRows(mixed,'print',now).map(x=>x.orderId),['early','middle','late','unknown']);
});

function extractFunction(src,name) {
 const start=src.indexOf('  function '+name+'(');
 assert.ok(start>=0,name+' missing');
 const end=src.indexOf('\n  }\n',start);
 assert.ok(end>start,name+' end missing');
 return src.slice(start,end+5);
}

test('browser list and current-order banner use same chronological tie-break as full backend queue',()=>{
 const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const funcs=['parseRowDate','defaultWorkSortRank','workDeliverySortTime','compareOperationalWork'];
 const env={
  state:{screen:'print'},
  text:v=>String(v==null?'':v).trim(),
  arabicDigitsToEnglish:v=>String(v||'').replace(/[٠-٩]/g, c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))),
  isHiddenFromUserScreens:s=>['تم التسليم','ملغى','مكرر','جاهز للاستلام'].includes(s),
  isFlyPrint:v=>v==='نعم',
  isOverdueRow:r=>r.expectedDeliveryAt && r.expectedDeliveryAt < '2026-11-09',
 };
 const lib=vm.runInNewContext(funcs.map(n=>extractFunction(app,n)).join('\n')+
   '\n({defaultWorkSortRank,workDeliverySortTime,compareOperationalWork})',env);
 const input=[
  row('5952','2026-11-11'),row('5850','2026-11-09'),
  row('5953','2026-11-11'),row('5851','2026-11-09'),
  row('5724','2026-11-04')
 ];
 const displayed=input.slice().sort(lib.compareOperationalWork).map(x=>x.orderId);
 assert.deepEqual(displayed,['5724','5850','5851','5952','5953']);
 assert.match(app,/\}\)\.sort\(compareOperationalWork\);/);
 assert.match(app,/function renderCurrentOrder\(rows\)[\s\S]*?compareOperationalWork\(a\.row, b\.row\)/);
 env.state.screen='laser';
 const old=lib.defaultWorkSortRank(row('laser-fly','2026-11-09','عادي',{flyPrint:'نعم'}));
 assert.equal(old,3,'laser must never introduce a Fly Print tier');
});
