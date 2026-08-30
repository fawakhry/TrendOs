const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const root=process.argv[2]||process.cwd(),src=fs.readFileSync(root+'/D1_Fast_Auth_V2_5_Safe.gs','utf8');
const cache=new Map(),props=new Map(),ttls=[];let authCalls=0,allowAuth=true,expiredValue='';
const scriptCache={get:k=>cache.get(k)||null,put(k,v,ttl){cache.set(k,v);ttls.push(ttl);},remove:k=>cache.delete(k)};
const scriptProps={getProperty:k=>props.get(k)||null,setProperty(k,v){props.set(k,String(v));}};
const ctx={console,Date,JSON,Object,Array,String,Number,Math,RegExp,isFinite,isNaN,
 normalize_:v=>String(v==null?'':v).trim().toLowerCase(),
 sessionExpiredV1922_:v=>String(v)===expiredValue,
 authorize_(u,t){authCalls++;if(!allowAuth)return{ok:false,message:'revoked'};return{ok:true,user:{username:u,name:u,department:'الإدارة',role:'admin',active:'نعم',mustChange:'لا',lastLogin:'2026-08-30T10:00:00Z',password:'HASH-SECRET',token:t,row:7,colToken:10}};},
 Utilities:{DigestAlgorithm:{SHA_256:'sha'},Charset:{UTF_8:'utf8'},computeDigest(_a,v){return Array.from(crypto.createHash('sha256').update(String(v)).digest()).map(x=>x>127?x-256:x);}},
 CacheService:{getScriptCache:()=>scriptCache},PropertiesService:{getScriptProperties:()=>scriptProps},LockService:{getScriptLock(){return{waitLock(){},releaseLock(){}}}}
};
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'D1_Fast_Auth_V2_5_Safe.gs'});
const token='TOKEN-SECRET-123';
assert.strictEqual(ctx.trendosFastAuthStatusV25_().enabled,false);
let off1=ctx.authorizeD1FastV25_('Diaa',token),off2=ctx.authorizeD1FastV25_('Diaa',token);assert.strictEqual(off1.ok,true);assert.strictEqual(off2.ok,true);assert.strictEqual(authCalls,2);assert.strictEqual(cache.size,0,'flag OFF must bypass cache completely');assert.strictEqual(off1.user.token,token,'OFF path preserves authoritative legacy user contract');
props.set('TRENDOS_FAST_AUTH_V25_ENABLED','1');assert.strictEqual(ctx.trendosFastAuthStatusV25_().enabled,true);
const a1=ctx.authorizeD1FastV25_('Diaa',token);assert.strictEqual(a1.ok,true);assert.strictEqual(a1.cacheHit,false);assert.strictEqual(authCalls,3);assert.strictEqual(a1.user.username,'diaa');assert.strictEqual(a1.user.password,undefined);assert.strictEqual(a1.user.token,undefined);assert.strictEqual(ttls[0],120);
let raw=[...cache.values()].join('\n');assert.ok(!raw.includes(token));assert.ok(!raw.includes('HASH-SECRET'));assert.ok(!/"password"\s*:/.test(raw));assert.ok(!/"token"\s*:/.test(raw));
const keys=[...cache.keys()].join('\n');assert.ok(!keys.includes(token));assert.ok(!keys.toLowerCase().includes('diaa'));
const a2=ctx.authorizeD1FastV25_('Diaa',token);assert.strictEqual(a2.ok,true);assert.strictEqual(a2.cacheHit,true);assert.strictEqual(a2.authSource,'FAST_AUTH_CACHE_V25');assert.strictEqual(authCalls,3);
const rev1=ctx.trendosFastAuthInvalidateUserV25_('Diaa');assert.strictEqual(rev1,'1');const a3=ctx.authorizeD1FastV25_('Diaa',token);assert.strictEqual(a3.ok,true);assert.strictEqual(a3.cacheHit,false);assert.strictEqual(authCalls,4);
allowAuth=false;ctx.trendosFastAuthAfterLogoutV25_('Diaa');const denied=ctx.authorizeD1FastV25_('Diaa',token);assert.strictEqual(denied.ok,false);assert.strictEqual(denied.message,'revoked');assert.strictEqual(authCalls,5);
allowAuth=true;expiredValue='2026-08-30T10:00:00Z';ctx.trendosFastAuthAfterLoginV25_('Diaa');const expired=ctx.authorizeD1FastV25_('Diaa',token);assert.strictEqual(expired.ok,false);assert.strictEqual(authCalls,6);expiredValue='';
const safe=ctx.trendosFastAuthSafeUserV25_({username:'x',password:'p',token:'t',role:'service',department:'خدمة العملاء',active:'نعم',lastLogin:'now',secret:'z'});assert.deepStrictEqual(Object.keys(safe).sort(),['active','department','lastLogin','mustChange','name','role','username'].sort());
const rev2=ctx.trendosFastAuthAfterPasswordChangeV25_('Diaa');const rev3=ctx.trendosFastAuthAfterActiveChangeV25_('Diaa');assert.strictEqual(Number(rev3),Number(rev2)+1);
props.set('TRENDOS_FAST_AUTH_V25_ENABLED','0');const before=authCalls;const rolledBack=ctx.authorizeD1FastV25_('Diaa',token);assert.strictEqual(rolledBack.ok,true);assert.strictEqual(authCalls,before+1);assert.strictEqual(rolledBack.user.token,token,'rollback must return to authoritative legacy path');
assert.ok(src.includes('Direct manual edits to Users Active/password/token fields'));assert.ok(src.includes("TRENDOS_FAST_AUTH_V25_ENABLED_PROP='TRENDOS_FAST_AUTH_V25_ENABLED'"));assert.ok(!/sk-[A-Za-z0-9_-]{20,}/.test(src));assert.ok(!/EAA[A-Za-z0-9]{30,}/.test(src));
console.log('TrendOS Fast Auth V2.5 SAFE tests: OK');