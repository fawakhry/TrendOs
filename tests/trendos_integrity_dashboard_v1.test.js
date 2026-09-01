const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=process.argv[2]||process.cwd();
const foundation=fs.readFileSync(root+'/trendos-integrity-v1.gs','utf8');
const remediation=fs.readFileSync(root+'/trendos-core-p0-remediation-v1.gs','utf8');
const dashboard=fs.readFileSync(root+'/trendos-integrity-dashboard-v1.gs','utf8');
const ctx={console,Date,JSON,Object,Array,String,Number,Math,RegExp,isFinite,isNaN,Utilities:{formatDate(){return'2026-08-30';},DigestAlgorithm:{SHA_256:'x'},Charset:{UTF_8:'x'},computeDigest(){return[]},getUuid(){return'12345678-1111-2222-3333-444444444444';}},LockService:{getScriptLock(){return{waitLock(){},releaseLock(){}}},getUserLock(){return{waitLock(){},releaseLock(){}}}}};
vm.createContext(ctx);vm.runInContext(foundation,ctx);vm.runInContext(remediation,ctx);vm.runInContext(dashboard,ctx);
const snap={
 lines:[
  {orderId:'3637',lineId:'3637-01',status:'تحت التنفيذ'},
  {orderId:'3637',lineId:'3637-01',status:'بدأ التنفيذ'},
  {orderId:'3637',lineId:'3637-02',status:'مكرر'},
  {orderId:'3637',lineId:'3637-02',status:'تحت التنفيذ'},
  {orderId:'4000',lineId:'4000-01',status:'تم التسليم'},
  {orderId:'5000',lineId:'5000-01',status:'تم التنفيذ',press:'نعم'},
  {orderId:'9999',lineId:'Tue Jan 01 3202 00:00:00 GMT+0000',status:'تحت التنفيذ'}
 ],
 attendance:[{employee:'وائل',date:'2026-08-30'},{employee:'وائل',date:'2026-08-30'}],
 cleaning:[{employee:'ريفان',date:'2026-08-30'},{employee:'ريفان',date:'2026-08-30'}],
 drafts:[
  {orderId:'4000','Draft ID':'D-4000',status:'تم التقفيل',subtotal:100},
  {orderId:'7000','Draft ID':'D-7000-A',status:'يحتاج تسعير/اعتماد',subtotal:0},
  {orderId:'7000','Draft ID':'D-7000-B',status:'يحتاج تسعير/اعتماد',subtotal:0}
 ],
 pressSourceItems:[{lineId:'6000-01'}],pressViewItems:[],pressSessionLineIds:[],
 opsEvents:[{eventId:'ANDON-1',type:'ANDON',status:'OPEN'},{eventId:'ANDON-2',type:'ANDON',status:'RESOLVED'}],
 automationRuns:[{runId:'RUN-1',status:'SUCCESS'},{runId:'RUN-2',status:'FAILED'}]
};
const report=ctx.trendosHealthAnalyzeSnapshotV1_(snap);assert.strictEqual(report.healthy,false);
const by=Object.fromEntries(report.metrics.map(m=>[m.id,m]));
assert.strictEqual(by.ACTIVE_DUPLICATE_LINE_IDS.count,1);assert.deepStrictEqual(Array.from(by.ACTIVE_DUPLICATE_LINE_IDS.ids),['3637-01']);
assert.strictEqual(by.INVALID_LINE_IDS.count,1);
assert.strictEqual(by.DUPLICATE_ATTENDANCE_SESSIONS.count,1);
assert.strictEqual(by.DUPLICATE_CLEANING_RECORDS.count,1);
assert.strictEqual(by.DUPLICATE_INVOICE_DRAFTS.count,1);assert.deepStrictEqual(Array.from(by.DUPLICATE_INVOICE_DRAFTS.ids),['7000']);
assert.strictEqual(by.CLOSED_ORDERS_WITH_DRAFT.count,1);assert.deepStrictEqual(Array.from(by.CLOSED_ORDERS_WITH_DRAFT.ids),['4000']);
assert.strictEqual(by.UNPRICED_DRAFTS.count,2);assert.strictEqual(by.UNPRICED_DRAFTS.status,'WARN');
assert.strictEqual(by.PRESS_SOURCE_VIEW_MISMATCH.count,1);assert.strictEqual(by.PRESS_SOURCE_VIEW_MISMATCH.details.sourceCount,1);assert.strictEqual(by.PRESS_SOURCE_VIEW_MISMATCH.details.viewCount,0);
assert.strictEqual(by.PRESS_SOURCE_VIEW_MISMATCH.status,'WARN');assert.strictEqual(by.PRESS_SOURCE_VIEW_MISMATCH.p0,false);
assert.strictEqual(by.PRESS_COMPLETED_WITHOUT_SESSION.count,1);assert.deepStrictEqual(Array.from(by.PRESS_COMPLETED_WITHOUT_SESSION.ids),['5000-01']);
assert.strictEqual(by.OPEN_ANDON.count,1);assert.deepStrictEqual(Array.from(by.OPEN_ANDON.ids),['ANDON-1']);
assert.strictEqual(by.AUTOMATION_LAST_SUCCESS.count,1);assert.strictEqual(by.AUTOMATION_LAST_ERROR.count,1);assert.strictEqual(by.AUTOMATION_LAST_ERROR.status,'FAIL');
assert.ok(by.OPEN_CORE_P0_BLOCKERS.count>=1);assert.ok(by.OPEN_CORE_P0_BLOCKERS.ids.includes('ACTIVE_DUPLICATE_LINE_IDS'));assert.ok(by.OPEN_CORE_P0_BLOCKERS.ids.includes('AUTOMATION_LAST_ERROR'));
ctx.trendosIntegrityResolutionV1_=(metric,key)=>{
  if(metric==='DUPLICATE_INVOICE_DRAFTS'&&key==='7000')return{resolved:true,canonicalId:'D-7000-B',supersededIds:['D-7000-A']};
  if(metric==='DUPLICATE_ATTENDANCE_SESSIONS'||metric==='DUPLICATE_CLEANING_RECORDS'||metric==='PRESS_COMPLETED_WITHOUT_SESSION')return{resolved:true,canonicalId:'',supersededIds:[]};
  return{resolved:false,missing:true};
};
const resolved=ctx.trendosHealthAnalyzeSnapshotV1_(snap),resolvedBy=Object.fromEntries(resolved.metrics.map(m=>[m.id,m]));
assert.strictEqual(resolvedBy.DUPLICATE_ATTENDANCE_SESSIONS.count,0);
assert.strictEqual(resolvedBy.DUPLICATE_CLEANING_RECORDS.count,0);
assert.strictEqual(resolvedBy.DUPLICATE_INVOICE_DRAFTS.count,0);
assert.strictEqual(resolvedBy.PRESS_COMPLETED_WITHOUT_SESSION.count,0);
assert.ok(resolvedBy.ACKNOWLEDGED_LEGACY_BASELINES.count>=4);
assert.ok(!/sk-[A-Za-z0-9_-]{20,}/.test(dashboard));assert.ok(!/EAA[A-Za-z0-9]{30,}/.test(dashboard));
console.log('TrendOS Integrity Dashboard V1 tests: OK');
