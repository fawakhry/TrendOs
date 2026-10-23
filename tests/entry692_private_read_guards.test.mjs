// Entry692 disposable regression suite. No production data, network, secrets or Cloudflare writes.
// Run from repository root: node tests/entry692_private_read_guards.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const src={
  comms:fs.readFileSync('cloudflare-d1/src/employee-comms-native-v1.mjs','utf8'),
  content:fs.readFileSync('cloudflare-d1/src/employee-content-native-v1.mjs','utf8'),
  mirror:fs.readFileSync('cloudflare-d1/src/mirror-gate.mjs','utf8'),
  overlay:fs.readFileSync('cloudflare-d1/src/t12-read-overlay-handler.mjs','utf8')
};
const state={session:{ok:true,body:{user:{username:'TESTER',role:'print'}}},screens:['print'],dbCalls:0,r2Calls:0};
function moduleFunction(source,name){
  const code=source.replace(/^import[\s\S]*?;\s*/gm,'').replace(/^export\s+/gm,'');
  const ctx={
    URL,Headers,Response,crypto:webcrypto,
    verifyEmployeeSessionCloudFirst:async()=>state.session,
    verifyOrdersEdgeToken:async t=>t==='VALID'?{ok:true,payload:{sub:'TESTER',screens:state.screens}}:{ok:false,reason:'invalid'},
    readT12CloudNativeOverlay:async()=>({rows:[],control:{}}),
    filterT12OverlayRows:r=>r,
    handleLegacyMirrorRequest:()=>{throw new Error('legacy should not be reached');}
  };
  return vm.runInNewContext(code+'\n'+name,ctx);
}
const handlers={
  comms:moduleFunction(src.comms,'handleEmployeeCommsNativeRequest'),
  content:moduleFunction(src.content,'handleEmployeeContentNativeRequest'),
  mirror:moduleFunction(src.mirror,'handleMirrorRequest'),
  overlay:moduleFunction(src.overlay,'handleT12ReadOverlayRequest')
};
let orderProof={r2_key:'R2-FAKE',mime_type:'image/png',uploaded_by:'TESTER',content_sha256:''};
let marketing={r2_key:'R2-FAKE',mime_type:'image/png',collection:'notes',owner_active:1,uploaded_by:'TESTER'};
const raw=new Uint8Array([0,1,2,3]);
const sha=[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',raw))].map(n=>n.toString(16).padStart(2,'0')).join('');
orderProof.content_sha256=sha;
const env={
  CORS_ORIGINS:'https://app.test',MIRROR_READ_SECRET:'READER-FAKE',
  DB:{prepare(sql){state.dbCalls++;return{bind(){return this},
    async first(){return sql.includes('employee_order_conversation_files_v1')?orderProof:marketing},
    async all(){return{results:[]}}}}},
  FILES:{async get(){state.r2Calls++;return{body:raw,arrayBuffer:async()=>raw.buffer};}}
};
const req=(path,headers={})=>new Request('https://worker.test'+path,{method:'GET',headers});
const credentials={authorization:'Bearer FAKE','x-employee-username':'TESTER'};
const comms=(h={})=>handlers.comms(req('/v1/employee/comms/file/F1',h),env);
const content=(h={})=>handlers.content(req('/v1/employee/content/file/F1',h),env);
const mirror=(h={})=>handlers.mirror(req('/v1/mirror/sheets',h),env);
const overlay=(h={})=>handlers.overlay(req('/v1/t12/orders/read-overlay?screen=print',h),env);
let passed=0;
async function test(name,fn,status,opts={}){
  const beforeR2=state.r2Calls,beforeDB=state.dbCalls;
  const res=await fn();
  assert.equal(res.status,status,name);
  if(opts.denyBeforeR2)assert.equal(state.r2Calls,beforeR2,name+' read R2');
  if(opts.denyBeforeDB)assert.equal(state.dbCalls,beforeDB,name+' read D1');
  passed++;console.log('PASS '+name);
}
await test('comms no bearer',()=>comms(),401,{denyBeforeR2:true,denyBeforeDB:true});
state.session={ok:false};await test('comms rejected session',()=>comms(credentials),401,{denyBeforeR2:true,denyBeforeDB:true});
state.session={ok:true,body:{user:{username:'OTHER',role:'print'}}};
await test('comms wrong verified identity',()=>comms(credentials),401,{denyBeforeR2:true,denyBeforeDB:true});
state.session={ok:true,body:{user:{username:'TESTER',role:'print'}}};
orderProof.uploaded_by='OTHER';
await test('comms other employee file',()=>comms(credentials),403,{denyBeforeR2:true});
orderProof.uploaded_by='TESTER';orderProof.content_sha256='';
await test('comms missing digest',()=>comms(credentials),409,{denyBeforeR2:true});
orderProof.content_sha256='ff'.repeat(32);
await test('comms checksum mismatch',()=>comms(credentials),502);
orderProof.content_sha256=sha;
await test('comms verified file bytes',()=>comms(credentials),200);
marketing.collection='platform_ads';marketing.owner_active=1;
await test('content active public marketing',()=>content(),200);
marketing.owner_active=0;
await test('content inactive marketing denied',()=>content(),401,{denyBeforeR2:true});
marketing.collection='notes';marketing.owner_active=1;
await test('content private anonymous denied',()=>content(),401,{denyBeforeR2:true});
await test('content uploader session',()=>content(credentials),200);
marketing.uploaded_by='OTHER';
await test('content unrelated employee denied',()=>content(credentials),403,{denyBeforeR2:true});
await test('mirror anonymous denied',()=>mirror(),401,{denyBeforeDB:true});
await test('mirror wrong key denied',()=>mirror({'x-mirror-read-secret':'WRONG'}),401,{denyBeforeDB:true});
await test('mirror write key not allowed for read',()=>mirror({'x-migration-secret':'READER-FAKE'}),401,{denyBeforeDB:true});
await test('mirror dedicated reader key',()=>mirror({'x-mirror-read-secret':'READER-FAKE'}),200);
state.screens=[];await test('T12 empty screens denied',()=>overlay({authorization:'Bearer VALID'}),403,{denyBeforeDB:true});
state.screens=['laser'];await test('T12 wrong screen denied',()=>overlay({authorization:'Bearer VALID'}),403,{denyBeforeDB:true});
state.screens=['print'];await test('T12 allowed screen',()=>overlay({authorization:'Bearer VALID'}),200);
assert.equal(passed,19);
console.log('ENTRY692_SOURCE_REGRESSION=19/19; PROD_MUTATIONS=0');
