const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const root=process.argv[2]||process.cwd();
const foundation=fs.readFileSync(root+'/trendos-integrity-v1.gs','utf8');
const remediation=fs.readFileSync(root+'/trendos-core-p0-remediation-v1.gs','utf8');
const ctx={
  console,Date,JSON,Object,Array,String,Number,Math,RegExp,isFinite,isNaN,
  Utilities:{
    DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},
    computeDigest(a,v){return Array.from(crypto.createHash('sha256').update(String(v)).digest()).map(x=>x>127?x-256:x);},
    formatDate(){return'2026-09-01';},getUuid(){return'UUID';}
  },
  LockService:{
    getScriptLock(){return{waitLock(){},releaseLock(){}}},
    getUserLock(){return{waitLock(){},releaseLock(){}}},
    getDocumentLock(){return{waitLock(){},releaseLock(){}}}
  }
};
vm.createContext(ctx);vm.runInContext(foundation,ctx);vm.runInContext(remediation,ctx);

const legacyDate=new Date('3112-01-01T00:00:00.000Z');
assert.strictEqual(ctx.trendosNormalizeLineId_(legacyDate),'','global Date rejection must remain');
assert.strictEqual(ctx.trendosLineIdFromSheetCellV1_(legacyDate,'3112-01'),'3112-01');
assert.strictEqual(ctx.trendosLineIdFromSheetCellV1_(45292,'٣١١٢-٠١'),'3112-01');
assert.strictEqual(ctx.trendosLineIdFromSheetCellV1_(legacyDate,'3112/01'),'');
assert.strictEqual(ctx.trendosLineIdFromSheetCellV1_('bad','3112-01'),'');
assert.strictEqual(ctx.trendosLineIdFromSheetCellV1_('TM2606150097-1',''),'TM2606150097-01');

const evidence={metric:'X',rows:[{id:'A',state:'old'},{id:'B',state:'new'}]};
const hash=ctx.trendosIntegrityEvidenceHashV1_(evidence);
const base={'Metric ID':'DUPLICATE_INVOICE_DRAFTS','Entity Key':'3569','Canonical ID':'DR-NEW','Classification':'SUPERSEDED_LEGACY_DUPLICATE','Evidence Hash':hash,'Active?':'نعم'};
let rows=[
  Object.assign({},base,{'Superseded ID':'DR-OLD-1'}),
  Object.assign({},base,{'Superseded ID':'DR-OLD-2'})
];
let r=ctx.trendosIntegrityResolutionV1_('DUPLICATE_INVOICE_DRAFTS','3569',evidence,rows);
assert.strictEqual(r.resolved,true);assert.strictEqual(r.canonicalId,'DR-NEW');
assert.deepStrictEqual(Array.from(r.supersededIds),['DR-OLD-1','DR-OLD-2']);
r=ctx.trendosIntegrityResolutionV1_('DUPLICATE_INVOICE_DRAFTS','3569',{metric:'X',rows:[]},rows);
assert.strictEqual(r.resolved,false);assert.strictEqual(r.stale,true);
rows.push(Object.assign({},base,{'Canonical ID':'DR-OTHER','Superseded ID':'DR-OLD-3'}));
r=ctx.trendosIntegrityResolutionV1_('DUPLICATE_INVOICE_DRAFTS','3569',evidence,rows);
assert.strictEqual(r.resolved,false);assert.strictEqual(r.conflict,true);

const a=ctx.trendosIntegrityInvoiceDraftEvidenceV1_([
  {draftId:'B',orderId:'3569',subtotal:0,status:'blocked'},
  {draftId:'A',orderId:'3569',subtotal:0,status:'blocked'}
]);
const b=ctx.trendosIntegrityInvoiceDraftEvidenceV1_([
  {draftId:'A',orderId:'3569',subtotal:0,status:'blocked'},
  {draftId:'B',orderId:'3569',subtotal:0,status:'blocked'}
]);
assert.strictEqual(JSON.stringify(a),JSON.stringify(b),'invoice evidence must be order-independent');
assert.ok(!/sk-[A-Za-z0-9_-]{20,}/.test(remediation));
assert.ok(!/EAA[A-Za-z0-9]{30,}/.test(remediation));
console.log('TrendOS CORE-P0 remediation V1 tests: OK');
