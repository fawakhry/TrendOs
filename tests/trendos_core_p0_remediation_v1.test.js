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
  Object.assign({},base,{__rowNumber:2,'Superseded ID':'DR-OLD-1'}),
  Object.assign({},base,{__rowNumber:3,'Superseded ID':'DR-OLD-2'})
];
let r=ctx.trendosIntegrityResolutionV1_('DUPLICATE_INVOICE_DRAFTS','3569',evidence,rows);
assert.strictEqual(r.resolved,true);assert.strictEqual(r.canonicalId,'DR-NEW');
assert.deepStrictEqual(Array.from(r.supersededIds),['DR-OLD-1','DR-OLD-2']);
r=ctx.trendosIntegrityResolutionV1_('DUPLICATE_INVOICE_DRAFTS','3569',{metric:'X',rows:[]},rows);
assert.strictEqual(r.resolved,false);assert.strictEqual(r.stale,true);
rows.push(Object.assign({},base,{__rowNumber:4,'Canonical ID':'DR-OTHER','Superseded ID':'DR-OLD-3'}));
r=ctx.trendosIntegrityResolutionV1_('DUPLICATE_INVOICE_DRAFTS','3569',evidence,rows);
assert.strictEqual(r.resolved,false);assert.strictEqual(r.conflict,true);

rows=[
  Object.assign({},base,{__rowNumber:2,'Superseded ID':'DR-OLD-1'}),
  Object.assign({},base,{__rowNumber:3,'Superseded ID':'DR-OLD-2'}),
  Object.assign({},base,{__rowNumber:4,'Superseded ID':'DR-OLD-1','Active?':false,Reason:'rollback'})
];
r=ctx.trendosIntegrityResolutionV1_('DUPLICATE_INVOICE_DRAFTS','3569',evidence,rows);
assert.strictEqual(r.resolved,true,'an inactive latest revision must deactivate only its exact mapping');
assert.deepStrictEqual(Array.from(r.supersededIds),['DR-OLD-2']);
rows.push(Object.assign({},base,{__rowNumber:5,'Superseded ID':'DR-OLD-2','Active?':'off',Reason:'rollback'}));
r=ctx.trendosIntegrityResolutionV1_('DUPLICATE_INVOICE_DRAFTS','3569',evidence,rows);
assert.strictEqual(r.resolved,false);assert.strictEqual(r.missing,true);assert.strictEqual(r.deactivated,true);
rows.push(Object.assign({},base,{__rowNumber:6,'Superseded ID':'DR-OLD-1','Active?':'yes',Reason:'re-approved'}));
r=ctx.trendosIntegrityResolutionV1_('DUPLICATE_INVOICE_DRAFTS','3569',evidence,rows);
assert.strictEqual(r.resolved,true,'a later active revision must safely reactivate the same mapping');
assert.deepStrictEqual(Array.from(r.supersededIds),['DR-OLD-1']);

const fallbackRows=[
  Object.assign({},base,{'Superseded ID':'DR-OLD-1','Active?':false}),
  Object.assign({},base,{'Superseded ID':'DR-OLD-1','Active?':true})
];
r=ctx.trendosIntegrityResolutionV1_('DUPLICATE_INVOICE_DRAFTS','3569',evidence,fallbackRows);
assert.strictEqual(r.resolved,true,'array order must provide deterministic revision order when row numbers are absent');
const classificationRows=[
  Object.assign({},base,{__rowNumber:2,'Superseded ID':'DR-OLD-1'}),
  Object.assign({},base,{__rowNumber:3,'Superseded ID':'DR-OLD-1',Classification:'DIFFERENT_CLASS','Active?':false})
];
r=ctx.trendosIntegrityResolutionV1_('DUPLICATE_INVOICE_DRAFTS','3569',evidence,classificationRows);
assert.strictEqual(r.resolved,true,'classification must remain part of the exact mapping identity');

const a=ctx.trendosIntegrityInvoiceDraftEvidenceV1_([
  {draftId:'B',orderId:'3569',subtotal:0,status:'blocked'},
  {draftId:'A',orderId:'3569',subtotal:0,status:'blocked'}
]);
const b=ctx.trendosIntegrityInvoiceDraftEvidenceV1_([
  {draftId:'A',orderId:'3569',subtotal:0,status:'blocked'},
  {draftId:'B',orderId:'3569',subtotal:0,status:'blocked'}
]);
assert.strictEqual(JSON.stringify(a),JSON.stringify(b),'invoice evidence must be order-independent');
const displayedA=ctx.trendosIntegrityGroupEvidenceV1_('ATT','X',[{__rowNumber:2,date:new Date('2026-08-30T07:00:00Z'),__display:{date:'2026-08-30',employee:'وائل'}}]);
const displayedB=ctx.trendosIntegrityGroupEvidenceV1_('ATT','X',[{__rowNumber:2,date:new Date('2026-08-30T00:00:00Z'),__display:{date:'2026-08-30',employee:'وائل'}}]);
assert.strictEqual(JSON.stringify(displayedA),JSON.stringify(displayedB),'group evidence must use exact displayed values, not timezone-sensitive Date objects');
assert.ok(!/sk-[A-Za-z0-9_-]{20,}/.test(remediation));
assert.ok(!/EAA[A-Za-z0-9]{30,}/.test(remediation));
console.log('TrendOS CORE-P0 remediation V1 tests: OK');
