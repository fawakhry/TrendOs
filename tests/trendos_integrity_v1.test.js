const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');

const root = process.argv[2] || process.cwd();
const source = fs.readFileSync(root + '/trendos-integrity-v1.gs', 'utf8');

function cairoDateParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone:'Africa/Cairo', year:'numeric', month:'2-digit', day:'2-digit'
  }).formatToParts(date);
  const m = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${m.year}-${m.month}-${m.day}`;
}

const context = {
  console, Date, JSON, Object, Array, String, Number, Math, RegExp, isFinite, isNaN,
  Utilities: {
    DigestAlgorithm:{SHA_256:'SHA_256'}, Charset:{UTF_8:'UTF_8'},
    computeDigest(_alg,value) {
      return Array.from(crypto.createHash('sha256').update(String(value),'utf8').digest()).map(x => x > 127 ? x - 256 : x);
    },
    formatDate(date,tz,format) {
      assert.strictEqual(tz,'Africa/Cairo');
      assert.strictEqual(format,'yyyy-MM-dd');
      return cairoDateParts(date);
    },
    getUuid(){ return '12345678-1234-1234-1234-123456789abc'; }
  },
  LockService: {
    getScriptLock(){ return {waitLock(){},releaseLock(){}}; },
    getUserLock(){ return {waitLock(){},releaseLock(){}}; },
    getDocumentLock(){ return {waitLock(){},releaseLock(){}}; }
  }
};
vm.createContext(context);
vm.runInContext(source, context, {filename:'trendos-integrity-v1.gs'});

assert.strictEqual(context.trendosNormalizeOrderId_(3637),'3637');
assert.strictEqual(context.trendosNormalizeOrderId_("'tm2606150097"),'TM2606150097');
assert.strictEqual(context.trendosNormalizeOrderId_('٣٧٧٤'),'3774');
assert.strictEqual(context.trendosNormalizeLineId_('3637-2'),'3637-02');
assert.strictEqual(context.trendosNormalizeLineId_('TM2606150097-1'),'TM2606150097-01');
assert.strictEqual(context.trendosNormalizeLineId_('٣٦٤٧-٠١'),'3647-01');
assert.strictEqual(context.trendosNormalizeLineId_(new Date('2026-01-01T00:00:00Z')),'');
assert.strictEqual(context.trendosNormalizeLineId_('Tue Jan 01 3202 00:00:00 GMT+0000'),'');
assert.strictEqual(context.trendosNormalizeLineId_('not-a-line'),'');

assert.strictEqual(context.trendosBusinessDate_('2026/09/04'),'2026-09-04');
assert.strictEqual(context.trendosBusinessDate_('2026-09-04T10:00:00+03:00'),'2026-09-04');

const friday = context.trendosResolveBusinessScheduleV1_('2026-09-04',{DEFAULT_WORKDAY_START:'12:00'},[]);
assert.strictEqual(friday.businessDay,false);
assert.strictEqual(friday.start,'12:00');
assert.strictEqual(friday.end,'21:00');
assert.strictEqual(friday.source,'DEFAULT_FRIDAY_CLOSED');

const fridaySpecial = context.trendosResolveBusinessScheduleV1_('2026-09-04',{DEFAULT_WORKDAY_START:'12:00'},[
  {'التاريخ':'2026-09-04','بداية العمل':'10:00','نهاية العمل':'22:00','الوصف':'مواعيد خاصة','مفعل؟':'نعم'}
]);
assert.strictEqual(fridaySpecial.businessDay,true);
assert.strictEqual(fridaySpecial.start,'10:00');
assert.strictEqual(fridaySpecial.end,'22:00');
assert.strictEqual(fridaySpecial.source,'SPECIAL_SCHEDULE');

const disabledFridaySpecial = context.trendosResolveBusinessScheduleV1_('2026-09-04',{},[
  {'التاريخ':'2026-09-04','بداية العمل':'10:00','نهاية العمل':'22:00','مفعل؟':'لا'}
]);
assert.strictEqual(disabledFridaySpecial.businessDay,false);

assert.strictEqual(context.trendosStableJsonV1_({b:2,a:1}),context.trendosStableJsonV1_({a:1,b:2}));
const key1 = context.trendosEventKey_('LINE_UPDATE','3637-02','2026-08-30',{status:'تحت التنفيذ',assigned:'وائل'});
const key2 = context.trendosEventKey_('LINE_UPDATE','3637-02','2026-08-30',{assigned:'وائل',status:'تحت التنفيذ'});
const key3 = context.trendosEventKey_('LINE_UPDATE','3637-02','2026-08-30',{assigned:'وائل',status:'جاهز للاستلام'});
assert.strictEqual(key1,key2);
assert.notStrictEqual(key1,key3);
assert.ok(/^TR1\|LINE_UPDATE\|3637-02\|2026-08-30\|[0-9a-f]{32}$/.test(key1));

assert.strictEqual(context.trendosIsClosedLineStatus_('مكرر'),true);
assert.strictEqual(context.trendosIsClosedLineStatus_('ملغى'),true);
assert.strictEqual(context.trendosIsClosedLineStatus_('تم التسليم'),true);
assert.strictEqual(context.trendosIsOpenLineStatus_('تحت التنفيذ'),true);
assert.strictEqual(context.trendosIsOpenLineStatus_(''),false);

const self = context.trendosIntegritySelfTestV1_();
assert.strictEqual(self.success,true,JSON.stringify(self.checks.filter(x => !x.pass),null,2));

class FakeRange {
  constructor(sheet,r,c,nr=1,nc=1){ Object.assign(this,{sheet,r,c,nr,nc}); }
  getValues(){ const out=[]; for(let i=0;i<this.nr;i++){ const row=[]; for(let j=0;j<this.nc;j++) row.push(this.sheet.getCell(this.r+i,this.c+j)); out.push(row); } return out; }
  setValues(values){ for(let i=0;i<this.nr;i++) for(let j=0;j<this.nc;j++) this.sheet.setCell(this.r+i,this.c+j,values[i][j]); return this; }
  getValue(){ return this.sheet.getCell(this.r,this.c); }
  setValue(v){ this.sheet.setCell(this.r,this.c,v); return this; }
}
class FakeSheet {
  constructor(){ this.rows=[]; this.maxColumns=1; }
  getLastRow(){ return this.rows.length; }
  getLastColumn(){ return Math.max(this.maxColumns,...this.rows.map(r=>r.length),1); }
  getMaxColumns(){ return this.maxColumns; }
  insertColumnsAfter(_after,count){ this.maxColumns += count; }
  getRange(r,c,nr=1,nc=1){ return new FakeRange(this,r,c,nr,nc); }
  appendRow(row){ this.maxColumns=Math.max(this.maxColumns,row.length); this.rows.push(row.slice()); }
  setFrozenRows(){}
  getCell(r,c){ return this.rows[r-1] && this.rows[r-1][c-1] !== undefined ? this.rows[r-1][c-1] : ''; }
  setCell(r,c,v){ while(this.rows.length<r) this.rows.push([]); while(this.rows[r-1].length<c) this.rows[r-1].push(''); this.rows[r-1][c-1]=v; this.maxColumns=Math.max(this.maxColumns,c); }
}
class FakeSpreadsheet {
  constructor(){ this.sheets={}; }
  getSheetByName(name){ return this.sheets[name] || null; }
  insertSheet(name){ return this.sheets[name] = new FakeSheet(); }
}

const fakeSs = new FakeSpreadsheet();
context.ss_ = () => fakeSs;
assert.strictEqual(context.trendosIdempotencyLookup_('MISSING'),null);
assert.strictEqual(fakeSs.getSheetByName('إدارة - سجل التكامل'),null,'lookup must not create ledger');

const evt = context.trendosEventKey_('TEST_EVENT','3637-02','2026-08-30',{v:1});
const claim1 = context.trendosIdempotencyClaim_(evt,{eventType:'TEST_EVENT',entityId:'3637-02',businessDate:'2026-08-30',by:'test'});
assert.strictEqual(claim1.claimed,true);
const claim2 = context.trendosIdempotencyClaim_(evt,{eventType:'TEST_EVENT',entityId:'3637-02',businessDate:'2026-08-30',by:'test'});
assert.strictEqual(claim2.claimed,false);
assert.strictEqual(claim2.duplicate,true);
assert.strictEqual(claim2.inProgress,true);
assert.strictEqual(claim2.existing.attempts,2);
const completed = context.trendosIdempotencyComplete_(evt,{orderId:'3637',ok:true});
assert.strictEqual(String(completed.status),'COMPLETED');
assert.deepStrictEqual(JSON.parse(JSON.stringify(completed.result)),{ok:true,orderId:'3637'});
const claim3 = context.trendosIdempotencyClaim_(evt,{});
assert.strictEqual(claim3.claimed,false);
assert.strictEqual(claim3.completed,true);
assert.strictEqual(claim3.existing.attempts,3);

const failEvt = context.trendosEventKey_('TEST_FAIL','3637-02','2026-08-30',{v:1});
assert.strictEqual(context.trendosIdempotencyClaim_(failEvt,{eventType:'TEST_FAIL',entityId:'3637-02',businessDate:'2026-08-30',by:'test'}).claimed,true);
const failed = context.trendosIdempotencyFail_(failEvt,new Error('boom'));
assert.strictEqual(String(failed.status),'FAILED');
const blockedRetry = context.trendosIdempotencyClaim_(failEvt,{});
assert.strictEqual(blockedRetry.claimed,false);
assert.strictEqual(blockedRetry.failed,true);
const allowedRetry = context.trendosIdempotencyClaim_(failEvt,{by:'test2'},{retryFailed:true});
assert.strictEqual(allowedRetry.claimed,true);
assert.strictEqual(allowedRetry.retried,true);
assert.strictEqual(allowedRetry.rowNumber,failed.rowNumber);
const recovered = context.trendosIdempotencyComplete_(failEvt,{ok:true});
assert.strictEqual(String(recovered.status),'COMPLETED');
assert.strictEqual(recovered.attempts,3);

const badSheet = fakeSs.insertSheet('BAD_SCHEMA');
badSheet.appendRow(['unexpected']);
assert.throws(() => context.trendosEnsureSheetV1_('BAD_SCHEMA',['expected']),/schema mismatch/);

assert.ok(source.includes("const TRENDOS_TZ_V1='Africa/Cairo'"));
assert.ok(source.includes('TRENDOS_IDEMPOTENCY_SHEET_V1'));
assert.ok(source.includes("trendosWithLock_('script'"));
assert.ok(source.includes("'الحالة':'CLAIMED'"));
assert.ok(source.includes("opt.retryFailed===true"));
assert.ok(!/sk-[A-Za-z0-9_-]{20,}/.test(source));
assert.ok(!/EAA[A-Za-z0-9]{30,}/.test(source));

console.log('TrendOS integrity V1 tests: OK');
