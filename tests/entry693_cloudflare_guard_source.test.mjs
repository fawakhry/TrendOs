// Entry693 source-only deployment safety regression; NEVER invokes Cloudflare or Wrangler.
// Run: node tests/entry693_cloudflare_guard_source.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const file={
  r2:fs.readFileSync('.github/workflows/trendos-entry645-content-r2-foundation-controlled.yml','utf8'),
  auth:fs.readFileSync('.github/workflows/trendos-entry642-deploy-resilient-auth-hardening.yml','utf8'),
  deploy:fs.readFileSync('.github/workflows/trendos-02cw-worker-codeonly-deploy-temp.yml','utf8')
};
for(const [name,source] of Object.entries(file)){
  assert.match(source,/group: trendos-d1-api-production-mutator/,name+' missing shared lock');
}
for(const name of ['r2','auth']){
  const prefix=name==='r2'?'entry645':'entry642';
  assert.ok(file[name].includes('/tmp/'+prefix+'-patch-intent'),'ambiguous PATCH marker absent '+name);
  assert.ok(file[name].includes('/tmp/'+prefix+'-new-version.txt'),'own-version witness missing '+name);
  assert.ok(file[name].includes('READONLY_RECONCILIATION_REQUIRED'),'reconciliation veto missing '+name);
}
assert.match(file.r2,/by\.size!==bs\.length/);
assert.match(file.r2,/by\.has\('FILES_PUBLIC_BASE_URL'\)/);
assert.match(file.deploy,/tomllib\.loads/);
assert.match(file.deploy,/r2_buckets/);
assert.match(file.deploy,/trendos-employee-content-files/);

function extractRollback(code){
  const start=code.indexOf('      - name: Roll back');
  assert.ok(start>=0,'rollback step missing');
  const lines=code.slice(start).split('\n');
  const a=lines.findIndex(l=>l.includes("const fs=require('fs');"));
  const b=lines.findIndex((l,i)=>i>a&&l.includes('})().catch(e=>'));
  assert.ok(a>=0&&b>a);
  return lines.slice(a,b+1).join('\n').replace('(async()=>{','return (async()=>{')
    .replace(/\.catch\(e=>\{console\.error\(String\(e&&e\.message\|\|e\)\);process\.exit\(1\);\}\);/,
      '.catch(e=>{throw e;});');
}
const cases=[
  {name:'own new version',initial:'OWN',post:'PRE',success:true,posts:1,reads:2},
  {name:'unrelated third-party version',initial:'THIRD',fail:true,posts:0,reads:1},
  {name:'already previous version',initial:'PRE',success:true,posts:0,reads:1},
  {name:'post ACK without convergence',initial:'OWN',post:'OWN',fail:true,posts:1,reads:2},
  {name:'failed rollback POST',initial:'OWN',httpFail:true,fail:true,posts:1,reads:1}
];
let count=0;
for(const name of ['r2','auth']){
  const prefix=name==='r2'?'entry645':'entry642';
  const code=extractRollback(file[name]);
  for(const c of cases){
    let active=c.initial,reads=0,posts=0;
    const fetch=async (_url,opts={})=>{
      if(opts.method==='POST'){
        posts++;
        if(c.httpFail)return{ok:false,json:async()=>({success:false})};
        active=c.post||active;
        return{ok:true,json:async()=>({success:true})};
      }
      reads++;
      return{ok:true,json:async()=>({success:true,result:{deployments:[{
        created_on:'2026-10-24T00:00:00Z',
        versions:[{version_id:active,percentage:100}]
      }]}})};
    };
    const fakeFS={readFileSync:path=>path.includes('new-version')?'OWN':'PRE'};
    const ctx={
      require:n=>{assert.equal(n,'fs');return fakeFS;},
      process:{env:{CLOUDFLARE_API_TOKEN:'test-only',CLOUDFLARE_ACCOUNT_ID:'test-only',API_WORKER:'test-only'}},
      fetch,console:{log:()=>{},error:()=>{}}
    };
    const run=vm.runInNewContext('(function(){'+code+'})',ctx);
    let failed=false;
    try{await run();}catch{failed=true;}
    assert.equal(failed,Boolean(c.fail),name+' '+c.name);
    assert.equal(posts,c.posts,name+' '+c.name+' unexpected POST');
    assert.equal(reads,c.reads,name+' '+c.name+' unexpected readback');
    count++;console.log('PASS '+prefix+' '+c.name);
  }
}
assert.equal(count,10);
console.log('ENTRY693_CONTROL_PLANE_GUARDS=10/10_SOURCE_MOCK; PROD_MUTATIONS=0');
