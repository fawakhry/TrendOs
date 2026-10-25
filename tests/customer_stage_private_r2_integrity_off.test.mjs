import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectCustomerPrivateR2IntegrityV0,handleCustomerPrivateR2IntegrityStageV0}
  from '../cloudflare-d1/customer-stage/private-r2-integrity-ro-v0.mjs';
const DRAFT='CDR-'+'22'.repeat(16),FILE='CDF-'+'44'.repeat(16),
  ITEM='CDI-'+'33'.repeat(16),TOKEN='ab'.repeat(32),
  SECRET='LOCAL_FAKE_NATIVE_SESSION_HMAC_NO_PRODUCTION_DATA_2026',
  NOW=1800000000000,ORIGIN='http://127.0.0.1:8000';
const bytes=new Uint8Array([137,80,78,71,13,10,26,10,1,2,3,4,5]);
const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const digest=async b=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',b)));
async function setup(opts={}){
 const sha=await digest(bytes),row={
  fileId:FILE,itemId:ITEM,sha256Hex:sha,byteSize:bytes.length,
  contentType:'image/png',objectKey:'customer-drafts/'+FILE,state:'READY',
  updatedAtMs:NOW
 };
 const trace=[];
 let sessions=0,reads=0,objects=0;
 const db={
  prepare(sql){
    const kind=sql.includes('SELECT a.customer_id AS customerId')?'auth':
      sql.includes('SELECT d.draft_id AS draftId')?'draft':
      sql.includes('SELECT f.file_id AS fileId')?'files':'UNEXPECTED';
    assert.notEqual(kind,'UNEXPECTED','Unauthorized/altering D1 SQL');
    assert.match(sql,/SELECT/);
    return {
      bind(...args){
        trace.push({kind,args});
        return {
          async first(){
            assert.ok(['auth','draft'].includes(kind));
            if(kind==='auth'){
              sessions++;
              return (opts.revokeAtEnd&&sessions>1)||opts.denyAuth?
                null:{customerId:'LOCAL-C1'};
            }
            return opts.denyDraft?null:{draftId:DRAFT};
          },
          async all(){
            assert.equal(kind,'files');
            reads++;
            if(opts.noFiles)return {results:[]};
            if(opts.tooMany)return {results:Array.from({length:6},()=>row)};
            const r={...row};
            if(opts.pending)r.state='PENDING';
            if(opts.invalidKey)r.objectKey='other/'+FILE;
            if(opts.invalidId)r.fileId='invalid';
            if(opts.metadataChanged&&reads>1)r.sha256Hex='ff'.repeat(32);
            return {results:[r]};
          }
        };
      }
    };
  }
 };
 const bucket={async get(key){
  objects++;assert.equal(key,'customer-drafts/'+FILE);
  if(opts.missingObject)return null;
  const out=opts.tamper?Uint8Array.from([...bytes,0]):bytes;
  return {size:opts.sizeMismatch?bytes.length+2:bytes.length,
    httpMetadata:{contentType:opts.wrongType?'application/pdf':'image/png'},
    async arrayBuffer(){return out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength);}};
 }};
 return {db,bucket,trace,counts:()=>({sessions,reads,objects}),
  input:{db,bucket,token:TOKEN,secret:SECRET,draftId:DRAFT,nowMs:NOW,clock:()=>NOW}};
}
test('integrity output does not grant malware clearance, T12 create, file download or public R2 URLs',async()=>{
 const ctx=await setup();
 const r=await inspectCustomerPrivateR2IntegrityV0(ctx.input);
 assert.equal(r.status,200);
 assert.equal(r.body.integrityNowVerified,true);
 assert.equal(r.body.verifiedFileCount,1);
 assert.equal(r.body.malwareScanComplete,false);
 assert.equal(r.body.eligibleForT12FileHandoff,false);
 assert.equal(r.body.officialOrderCreated,false);
 assert.equal(r.body.productionWriteAuthorized,false);
 const json=JSON.stringify(r);
 for(const sensitive of [FILE,ITEM,DRAFT,TOKEN,SECRET,'customer-drafts/','LOCAL-C1',shaPrivate()])
  assert.equal(json.includes(sensitive),false,'Leaked internal file metadata');
 assert.deepEqual(ctx.counts(),{sessions:2,reads:2,objects:1});
 assert.equal(ctx.trace.filter(x=>x.kind==='auth').length,2);
});
function shaPrivate(){return 'FAKE_INTERNAL_SALT';}
test('tampered/private mismatched R2 bytes, content-type, size and missing object always DENY',async()=>{
 for(const key of ['tamper','sizeMismatch','wrongType','missingObject']){
  const ctx=await setup({[key]:true});
  const r=await inspectCustomerPrivateR2IntegrityV0(ctx.input);
  assert.notEqual(r.status,200,key);
  assert.equal(r.body.integrityNowVerified,false,key);
  assert.equal(r.body.productionWriteAuthorized,false,key);
  assert.equal(r.body.malwareScanComplete,false,key);
 }
});
test('not-ready, unauthorized, empty, >5, wrong key, changed D1 snapshot or revoked session all DENY',async()=>{
 for(const key of ['pending','denyAuth','denyDraft','noFiles','tooMany','invalidKey',
  'invalidId','metadataChanged','revokeAtEnd']){
  const ctx=await setup({[key]:true});
  const result=await inspectCustomerPrivateR2IntegrityV0(ctx.input);
  assert.notEqual(result.status,200,key);
  assert.equal(result.body.integrityNowVerified,false,key);
  assert.equal(result.body.productionWriteAuthorized,false,key);
 }
});
test('invalid bearer and missing actual R2 binding fail before any D1 read or get',async()=>{
 const ctx=await setup();
 let r=await inspectCustomerPrivateR2IntegrityV0({...ctx.input,token:'bad'});
 assert.equal(r.status,401);
 r=await inspectCustomerPrivateR2IntegrityV0({...ctx.input,bucket:null});
 assert.equal(r.status,503);
 assert.deepEqual(ctx.counts(),{sessions:0,reads:0,objects:0});
});
test('HTTP own Origin, GET, bearer and stage-only OFF flag; query and injection rejected',async()=>{
 const ctx=await setup();
 const route='https://isolated.test/v1/customer/native/drafts/'+DRAFT+'/files-integrity';
 const env={DB:ctx.db,CUSTOMER_DRAFT_FILES_BUCKET:ctx.bucket,CORS_ORIGINS:ORIGIN,
  TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET};
 let request=new Request(route,{headers:{Origin:ORIGIN,Authorization:'Bearer '+TOKEN}});
 let r=await handleCustomerPrivateR2IntegrityStageV0(request,env);
 assert.equal(r.status,503);
 assert.equal((await r.json()).code,'CUSTOMER_R2_INTEGRITY_ROUTE_OFF');
 const allow={...env,TRENDOS_CUSTOMER_PRIVATE_R2_INTEGRITY_RO_V0_ENABLED:'true'};
 r=await handleCustomerPrivateR2IntegrityStageV0(new Request(route,{
   headers:{Origin:'https://evil.test',Authorization:'Bearer '+TOKEN}}),allow);
 assert.equal(r.status,403);
 r=await handleCustomerPrivateR2IntegrityStageV0(new Request(route+'?customerId=C2',{
   headers:{Origin:ORIGIN,Authorization:'Bearer '+TOKEN}}),allow);
 assert.equal(r.status,404);
 r=await handleCustomerPrivateR2IntegrityStageV0(new Request(route,{
   method:'POST',headers:{Origin:ORIGIN,Authorization:'Bearer '+TOKEN}}),allow);
 assert.equal(r.status,405);
 r=await handleCustomerPrivateR2IntegrityStageV0(new Request(route,{
   headers:{Origin:ORIGIN}}),allow);
 assert.equal(r.status,401);
 assert.deepEqual(ctx.counts(),{sessions:0,reads:0,objects:0});
});
test('production binding and T12/Printshop submission remain source-OFF and unwired',()=>{
 const cfg=readFileSync('cloudflare-d1/wrangler.customer-stage.toml','utf8');
 assert.ok(cfg.includes('TRENDOS_CUSTOMER_PRIVATE_R2_INTEGRITY_RO_V0_ENABLED = "false"'));
 assert.ok(cfg.includes('TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED = "false"'));
 assert.doesNotMatch(cfg,/\[\[r2_buckets\]\]|\[\[d1_databases\]\]|database_id/);
 const prod=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 assert.doesNotMatch(prod,/private-r2-integrity-ro-v0/);
 const src=readFileSync('cloudflare-d1/customer-stage/private-r2-integrity-ro-v0.mjs','utf8');
 assert.doesNotMatch(src,/createT12GeneralOrder|INSERT INTO t12_prod_orders|\.put\(/);
});
