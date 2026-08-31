const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const root=process.argv[2]||process.cwd();
const foundation=fs.readFileSync(root+'/trendos-integrity-v1.gs','utf8');
const tools=fs.readFileSync(root+'/trendos-integrity-runtime-tools-v1.gs','utf8');
const ctx={console,Date,JSON,Object,Array,String,Number,Math,RegExp,isFinite,isNaN,
  Logger:{log(){}},
  Utilities:{DigestAlgorithm:{SHA_256:'SHA_256'},Charset:{UTF_8:'UTF_8'},computeDigest(_a,v){return Array.from(crypto.createHash('sha256').update(String(v),'utf8').digest()).map(x=>x>127?x-256:x);},formatDate(){return '2026-08-31';},getUuid(){return '12345678-1234-1234-1234-123456789abc';}},
  LockService:{getScriptLock(){return{waitLock(){},releaseLock(){}}},getUserLock(){return{waitLock(){},releaseLock(){}}},getDocumentLock(){return{waitLock(){},releaseLock(){}}}}
};
vm.createContext(ctx);vm.runInContext(foundation,ctx,{filename:'trendos-integrity-v1.gs'});vm.runInContext(tools,ctx,{filename:'trendos-integrity-runtime-tools-v1.gs'});
assert.strictEqual(typeof ctx.trendosIntegritySelfTestV1,'function');
const self=ctx.trendosIntegritySelfTestV1();assert.strictEqual(self.success,true,JSON.stringify(self.checks&&self.checks.filter(x=>!x.pass)));
const originalSelf=ctx.trendosIntegritySelfTestV1_;
ctx.trendosIntegritySelfTestV1_=()=>({success:false,checks:[{name:'forced-failure',pass:false}]});
assert.throws(()=>ctx.trendosIntegritySelfTestV1(),/self-test failed: forced-failure/i);
ctx.trendosIntegritySelfTestV1_=originalSelf;
assert.strictEqual(typeof ctx.trendosIntegrityDependencyHealthV1,'function');
const health=ctx.trendosIntegrityDependencyHealthV1();assert.strictEqual(health.success,false);assert.strictEqual(health.codeReady,false);assert.ok(health.missing.includes('trendosIntegrityDependencyHealthV1_'));
assert.ok(!/function\s+trendosIntegritySelfTestV1_\s*\(/.test(tools),'runtime tools must wrap, not duplicate private implementation');
console.log('TrendOS Integrity runtime tools V1 tests: OK');
