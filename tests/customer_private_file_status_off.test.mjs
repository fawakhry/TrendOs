import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  inspectCustomerPrivateFileStatusV0,handleCustomerPrivateFileStatusStageV0,
  CUSTOMER_PRIVATE_FILE_STATUS_SQL_V0,CUSTOMER_PRIVATE_FILE_STATUS_POLICY_V0
} from '../cloudflare-d1/customer-stage/private-file-status-ro-v0.mjs';
import {CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0}
 from '../cloudflare-d1/src/customer-portal-native-orders-v0.mjs';

const A='a1'.repeat(32),B='b2'.repeat(32);
const SECRET='test-only-32+chars-customer-session-secret-no-live-key';
const NOW=1800000000000,ORIGIN='https://customer.fake.test';
const DRAFT='CDR-'+'22'.repeat(16),ITEM='CDI-'+'33'.repeat(16),
  FILE='CDF-'+'44'.repeat(16);
const BASE={
  fileId:FILE,fileState:'READY',contentType:'image/png',byteSize:64,
  sha256Hex:'aa'.repeat(32),quarantineDisposition:'QUARANTINED',
  scanCompleted:0,printReleaseAuthorized:0
};
function fixture({session='CUST-A',owner='CUST-A',revokeAtEnd=false,
  row=BASE,missing=false}={}){
  let authReads=0,fileReads=0;const bindings=[];
  const db={prepare(sql){
    assert.ok([CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0,
      CUSTOMER_PRIVATE_FILE_STATUS_SQL_V0].includes(sql),'unexpected query');
    return{bind(...params){
      bindings.push({sql,params});
      return{async first(){
        if(sql===CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0){
          authReads++;
          if(!session||(revokeAtEnd&&authReads>1))return null;
          return {customerId:session};
        }
        fileReads++;
        assert.equal(params.length,5);
        const [fileId,draftId,itemId,verified,verified2]=params;
        if(missing||fileId!==FILE||draftId!==DRAFT||itemId!==ITEM||
            verified!==owner||verified2!==owner)return null;
        return row;
      }};
    }};
  }};
  return {db,get authReads(){return authReads},
    get fileReads(){return fileReads},bindings};
}
const invoke=(f,changes={})=>inspectCustomerPrivateFileStatusV0({
  db:f.db,secret:SECRET,token:A,draftId:DRAFT,itemId:ITEM,
  fileId:FILE,nowMs:NOW,clock:()=>NOW+2,...changes
});
const url='https://api.fake.test/v1/customer/native/drafts/'+DRAFT+
  '/items/'+ITEM+'/files/'+FILE+'/status';
const env=(x={})=>({
  CORS_ORIGINS:ORIGIN,
  TRENDOS_CUSTOMER_PRIVATE_FILE_STATUS_RO_V0_ENABLED:'true',
  TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET,
  DB:fixture().db,
  ...x
});
const request=(u=url,h={},method='GET')=>new Request(u,{method,headers:{
  Origin:ORIGIN,Authorization:'Bearer '+A,...h
}});
test('two customers with identical names can only read owner-scoped file status',async()=>{
  const yes=fixture();
  const result=await invoke(yes);
  assert.equal(result.status,200);
  assert.equal(result.body.status,'STORED_QUARANTINED');
  assert.equal(result.body.previewAvailable,false);
  assert.equal(result.body.scanCompleted,false);
  assert.equal(result.body.printReleaseAuthorized,false);
  assert.equal(yes.authReads,2);
  assert.equal(yes.fileReads,1);
  const other=fixture({session:'CUST-B',owner:'CUST-A'});
  const denied=await invoke(other,{token:B});
  assert.equal(denied.status,404);
  assert.equal(other.fileReads,1);
  assert.equal(other.bindings.filter(x=>x.sql===CUSTOMER_PRIVATE_FILE_STATUS_SQL_V0)[0].params[3],'CUST-B');
  assert.equal(JSON.stringify(denied.body).includes('CUST-A'),false);
  assert.equal(JSON.stringify(result.body).includes(FILE),false);
  assert.equal(JSON.stringify(result.body).includes('sha256'),false);
});
test('PENDING or READY metadata remain quarantined; neither is a photo preview',async()=>{
  for(const fileState of ['READY','PENDING']){
    const result=await invoke(fixture({row:{...BASE,fileState}}));
    assert.equal(result.status,200);
    assert.equal(result.body.previewAvailable,false);
    assert.equal(result.body.printReleaseAuthorized,false);
    assert.equal(result.body.publicUrlIssued,false);
    assert.equal(result.body.downloadUrlIssued,false);
    assert.ok(result.body.status.endsWith('_QUARANTINED'));
  }
});
test('bad quarantine, malformed hash, wrong row and missing file deny by default',async()=>{
  for(const overrides of [
    {scanCompleted:1},{printReleaseAuthorized:1},{quarantineDisposition:'CLEAN'},
    {fileState:'UNKNOWN'},{sha256Hex:'wrong'},{byteSize:0},
    {fileId:'CDF-'+'99'.repeat(16)}
  ]){
    const result=await invoke(fixture({row:{...BASE,...overrides}}));
    assert.equal(result.status,409,JSON.stringify(overrides));
    assert.equal(result.body.previewAvailable,false);
  }
  assert.equal((await invoke(fixture({missing:true}))).status,404);
  assert.equal((await invoke(fixture({session:null}))).status,401);
  assert.equal((await invoke(fixture({revokeAtEnd:true}))).status,401);
});
test('invalid token and identifiers deny before any file query; no R2 access anywhere',async()=>{
  const f=fixture();
  assert.equal((await invoke(f,{token:'invalid'})).status,401);
  assert.equal((await invoke(f,{fileId:'../'+FILE})).status,400);
  assert.equal((await invoke(f,{draftId:'CDR-malformed'})).status,400);
  assert.equal(f.fileReads,0);
  assert.equal(CUSTOMER_PRIVATE_FILE_STATUS_POLICY_V0.readsR2,false);
  assert.equal(CUSTOMER_PRIVATE_FILE_STATUS_POLICY_V0.workerEntryWired,false);
  assert.equal(CUSTOMER_PRIVATE_FILE_STATUS_POLICY_V0.defaultEnabled,false);
});
test('HTTP route OFF even with valid bearer, and denies origins/queries/methods',async()=>{
  const off=await handleCustomerPrivateFileStatusStageV0(
    request(),env({TRENDOS_CUSTOMER_PRIVATE_FILE_STATUS_RO_V0_ENABLED:'false'}));
  assert.equal(off.status,503);
  const crossOrigin=await handleCustomerPrivateFileStatusStageV0(
    request(url,{Origin:'https://evil.fake.test'}),env());
  assert.equal(crossOrigin.status,403);
  assert.equal(crossOrigin.headers.get('access-control-allow-origin'),null);
  const query=await handleCustomerPrivateFileStatusStageV0(request(url+'?fileId=anything'),env());
  assert.equal(query.status,404);
  const post=await handleCustomerPrivateFileStatusStageV0(request(url,{},'POST'),env());
  assert.equal(post.status,405);
  const unauth=await handleCustomerPrivateFileStatusStageV0(
    request(url,{Authorization:'Bearer bad'}),env());
  assert.equal(unauth.status,401);
  const live=await handleCustomerPrivateFileStatusStageV0(request(),env());
  assert.equal(live.status,200);
  assert.equal(live.headers.get('cache-control'),'no-store');
  assert.equal(live.headers.get('x-content-type-options'),'nosniff');
  assert.equal(live.headers.get('access-control-allow-origin'),ORIGIN);
  const body=await live.text();
  for(const forbidden of ['customer-drafts/','sha256Hex','objectKey','data:','downloadUrl:',FILE,'CUST-A']){
    assert.ok(!body.includes(forbidden),forbidden);
  }
  assert.equal(JSON.parse(body).previewAvailable,false);
});
test('HTTP OPTIONS only allows exact configured origin, no unrestricted wildcard',async()=>{
  const options=await handleCustomerPrivateFileStatusStageV0(request(url,{},'OPTIONS'),env());
  assert.equal(options.status,204);
  assert.equal(options.headers.get('access-control-allow-origin'),ORIGIN);
  assert.equal(options.headers.get('access-control-allow-headers'),'authorization,accept');
  assert.equal(options.headers.get('access-control-allow-credentials'),null);
});
