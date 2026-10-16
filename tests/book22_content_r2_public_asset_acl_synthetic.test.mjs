// BOOK22 P0 Content R2: anonymous PUBLIC images only; no real Cloudflare or PII.
import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {handleEmployeeContentNativeRequest} from '../cloudflare-d1/src/employee-content-native-v1.mjs';
import {cloudAuthTokenFingerprint} from '../cloudflare-d1/src/cloud-auth-shadow-v1.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;

const FILE_ID='FILE-22222222-2222-4222-8222-222222222222';
const SECRET='FAKE_CONTENT_SESSION_SECRET';
const TOKEN='FAKE_CONTENT_BEARER';
const originalFetch=globalThis.fetch;
let remote=0;
globalThis.fetch=async()=>{remote++;throw Error('NO_NETWORK');};
test.after(()=>{globalThis.fetch=originalFetch;});
function make({collection='platform_sections',active=1,ownerRecordId='FAKE-PUBLIC-SECTION',
                ownerJson={},mime='image/png',bucket=true,exists=true,base='',pathKey=null}={}){
  const r2Key=pathKey||'employee-content/'+collection+'/'+FILE_ID+'/image.png';
  const files=new Map([[r2Key,Uint8Array.from([137,80,78,71])]]);
  const counters={metadata:0,owner:0,r2Get:0,r2Put:0,mutations:0,session:0};
  const env={EDGE_SESSION_SECRET:SECRET,TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1:'true',FILES_PUBLIC_BASE_URL:base};
  if(bucket)env.FILES={
    async get(key){counters.r2Get++;return files.has(key)?{body:files.get(key)}:null;},
    async put(key,bytes){counters.r2Put++;files.set(key,bytes);}
  };
  env.DB={prepare(sql){
    return{
      bind(...args){this.args=args;return this;},
      async first(){
        if(sql.includes('FROM employee_content_files_v1')){
          counters.metadata++;
          if(!exists||this.args[0]!==FILE_ID)return null;
          return {r2_key:r2Key,mime_type:mime,collection,owner_record_id:ownerRecordId};
        }
        if(sql.includes('FROM employee_content_records_v1') && sql.includes('SELECT active,record_json')){
          counters.owner++;
          return {active,record_json:JSON.stringify(ownerJson)};
        }
        if(sql.includes('FROM employee_auth_sessions_v1 s')){
          counters.session++;
          const fp=await cloudAuthTokenFingerprint('fixture-admin',TOKEN,env);
          if(this.args[1]!==fp)return null;
          return {canonicalUsername:'fixture-admin',role:'admin',department:'إدارة',screensJson:'[]',
            sessionVersion:1,currentSessionVersion:1,active:1,expiresAtMs:Date.now()+90000,mustChange:0};
        }
        if(sql.includes('FROM employee_content_control_v1'))return {mode:'GENERAL',policyEpoch:1};
        if(sql.includes('SELECT version FROM employee_content_records_v1'))return null;
        if(sql.includes('SELECT record_id,record_json,active,sort_order,version,created_at,updated_at FROM employee_content_records_v1')){
          return {record_id:ownerRecordId,record_json:JSON.stringify(ownerJson),active:1,sort_order:0,version:1};
        }
        throw Error('UNEXPECTED_D1_FIRST:'+sql.slice(0,80));
      },
      async all(){throw Error('UNEXPECTED_D1_ALL');},
      async run(){
        // Auth bridge can audit its own fake session; count CMS business writes only.
        if(/employee_content_(?:files|records|events)_v1/.test(sql))counters.mutations++;
        return {success:true};
      }
    };
  }};
  return {env,counters};
}
async function getFile(f,fileId=FILE_ID){
  const url='https://fixture.invalid/v1/employee/content/file/'+encodeURIComponent(fileId);
  return await handleEmployeeContentNativeRequest(new Request(url),f.env);
}
test('BOOK22: published section image GET works without login, with no-store and nosniff',async()=>{
  const f=make();
  const res=await getFile(f);
  assert.equal(res.status,200);
  assert.equal(res.headers.get('content-type'),'image/png');
  assert.equal(res.headers.get('cache-control'),'no-store');
  assert.equal(res.headers.get('x-content-type-options'),'nosniff');
  assert.deepEqual([...new Uint8Array(await res.arrayBuffer())],[137,80,78,71]);
  assert.equal(f.counters.r2Get,1);
  assert.equal(f.counters.mutations,0);
});
test('BOOK22: explicitly published marketplace product/ads can be read without private auth',async()=>{
  for(const collection of ['marketplace_products','marketplace_vendors','platform_ads']){
    const f=make({collection});
    assert.equal((await getFile(f)).status,200,collection);
    assert.equal(f.counters.r2Get,1);
  }
});
test('BOOK22: knowledge, notes, branch and service routes are NEVER anonymous R2 reads',async()=>{
  for(const collection of ['knowledge','notes','white_label','franchise_branches','service_provider_routes','other_unknown']){
    const f=make({collection});
    assert.equal((await getFile(f)).status,404,collection);
    assert.equal(f.counters.owner,0,'private collection must stop before owner query');
    assert.equal(f.counters.r2Get,0);
  }
});
test('BOOK22: inactive/unpublished owner record fails closed BEFORE R2 get',async()=>{
  for(const options of [
    {active:0},{ownerJson:{hidden:true}},{ownerJson:{public:false}},
    {ownerJson:{published:false}},{ownerJson:{customerVisibility:'مخفي'}},
    {ownerJson:{visibility:'private'}},{ownerJson:{active:'لا'}}
  ]){
    const f=make(options);
    assert.equal((await getFile(f)).status,404,JSON.stringify(options));
    assert.equal(f.counters.r2Get,0);
  }
});
test('BOOK22: text/html, SVG and unknown MIME blocked before R2 get',async()=>{
  for(const mime of ['text/html','image/svg+xml','application/octet-stream','text/plain']){
    const f=make({mime});
    assert.equal((await getFile(f)).status,404,mime);
    assert.equal(f.counters.r2Get,0);
  }
});
test('BOOK22: forged R2 prefix cannot redirect FILE id to another object',async()=>{
  const f=make({pathKey:'employee-content/notes/'+FILE_ID+'/sensitive.txt'});
  assert.equal((await getFile(f)).status,404);
  assert.equal(f.counters.r2Get,0);
});
test('BOOK22: invalid file ID denied before D1 metadata or R2, without file enumeration',async()=>{
  for(const fileId of ['FILE-1','FILE-%2F-secret','notes/secret','FILE-00000000-0000-0000-0000-000000000000/other']){
    const f=make();
    assert.equal((await getFile(f,fileId)).status,404,fileId);
    assert.equal(f.counters.metadata,0);
    assert.equal(f.counters.r2Get,0);
  }
});
test('BOOK22: unknown file or missing R2 bucket returns non-sensitive 404',async()=>{
  for(const opts of [{exists:false},{bucket:false}]){
    const f=make(opts);
    const res=await getFile(f);
    assert.equal(res.status,404);
    assert.equal(res.headers.get('cache-control'),'no-store');
    assert.equal(f.counters.r2Get,0);
  }
});
test('BOOK22: public R2 base blocks NEW uploads before writing any object',async()=>{
  const f=make({base:'https://files-public.invalid'});
  const req=new Request('https://fixture.invalid/v1/employee/content',{
    method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+TOKEN},
    body:JSON.stringify({action:'savePlatformSection',username:'fixture-admin',
      sectionName:'FAKE-PUBLIC-SECTION',mimeType:'image/png',
      base64:'data:image/png;base64,iVBORw0KGgo='})
  });
  const res=await handleEmployeeContentNativeRequest(req,f.env);
  const body=await res.json();
  assert.equal(res.status,503);
  assert.equal(body.code,'content-public-r2-domain-unsafe');
  assert.equal(f.counters.r2Put,0);
  assert.equal(f.counters.mutations,0);
});
test('BOOK22: unsupported upload type is denied before R2 put',async()=>{
  const f=make();
  const req=new Request('https://fixture.invalid/v1/employee/content',{
    method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+TOKEN},
    body:JSON.stringify({action:'savePlatformSection',username:'fixture-admin',
      sectionName:'FAKE-PUBLIC-SECTION',mimeType:'text/html',base64:'PGh0bWw+PC9odG1sPg=='})
  });
  const res=await handleEmployeeContentNativeRequest(req,f.env);
  assert.equal(res.status,400);
  assert.equal((await res.json()).code,'content-upload-policy-denied');
  assert.equal(f.counters.r2Put,0);
});
test('BOOK22: no outside network used',()=>assert.equal(remote,0));
