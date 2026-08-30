const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=process.argv[2]||process.cwd();
const files=[
 'trendos-integrity-v1.gs',
 'trendos-order-line-integrity-v1.gs',
 'trendos-attendance-cleaning-integrity-v1.gs',
 'trendos-press-integrity-v1.gs',
 'trendos-invoice-integrity-v1.gs',
 'trendos-whatsapp-integrity-v1.gs',
 'trendos-handover-ops-integrity-v1.gs',
 'trendos-andon-integrity-v1.gs',
 'trendos-integrity-dashboard-v1.gs',
 'D1_Fast_Auth_V2_5_Safe.gs',
 'trendos-integrity-router-v1.gs'
];
const missing=files.filter(f=>!fs.existsSync(root+'/'+f));assert.deepStrictEqual(missing,[],'missing files: '+missing.join(','));
const source=files.map(f=>'\n/* ===== '+f+' ===== */\n'+fs.readFileSync(root+'/'+f,'utf8')).join('\n');
const ctx={console,Date,JSON,Object,Array,String,Number,Math,RegExp,isFinite,isNaN,Utilities:{DigestAlgorithm:{SHA_256:'sha'},Charset:{UTF_8:'utf8'},computeDigest(){return[]},formatDate(){return'2026-08-30'},getUuid(){return'12345678-1111-2222-3333-444444444444';}},LockService:{getScriptLock(){return{waitLock(){},releaseLock(){}}},getUserLock(){return{waitLock(){},releaseLock(){}}},getDocumentLock(){return{waitLock(){},releaseLock(){}}}},CacheService:{getScriptCache(){return{get(){return null},put(){},remove(){}}}},PropertiesService:{getScriptProperties(){return{getProperty(){return null},setProperty(){},deleteProperty(){}}}}};
vm.createContext(ctx);assert.doesNotThrow(()=>vm.runInContext(source,ctx,{filename:'TrendOS_Integrity_V1_Composed.gs'}));
[
 'trendosNormalizeOrderId_','trendosNormalizeLineId_','trendosWithLock_','trendosIdempotencyClaim_',
 'trendosCreateHandoverV1_','trendosSaveAndonV1_','trendosHealthAnalyzeSnapshotV1_','authorizeD1FastV25_',
 'trendosIntegrityTryRouteV1_','trendosIntegrityDependencyHealthV1_'
].forEach(fn=>assert.strictEqual(typeof ctx[fn],'function',fn+' missing after composition'));
assert.ok(!/sk-[A-Za-z0-9_-]{20,}/.test(source));assert.ok(!/EAA[A-Za-z0-9]{30,}/.test(source));
console.log('TrendOS Integrity V1 Apps Script composition: OK ('+files.length+' modules)');