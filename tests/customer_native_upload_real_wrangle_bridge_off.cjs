/* E2E to original isolated PR311 workerd + disposable D1/R2.
 * Only runs when launched by the explicit local Python harness. No live host.
 * Injects response loss AFTER the real local Worker has committed; uses
 * main's existing coordinator & HTTP adapter unchanged.
 */
"use strict";
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const {createNativeCustomerUploadCoordinatorV0}=
  require("../customer-native-upload-coordinator-off-v0.js");
const {createNativeCustomerLoopbackTransportV0}=
  require("../customer-native-upload-loopback-http-stage-off-v0.cjs");
const env=process.env;
if(env.CUSTOMER_UPLOAD_REAL_LOCAL_E2E!=="1")throw Error("LOCAL_OPT_IN_REQUIRED");
const BASE=env.CUSTOMER_UPLOAD_LOCAL_BASE;
const ORIGIN="http://127.0.0.1:8000";
if(!/^http:\/\/127\.0\.0\.1:\d{2,5}$/.test(BASE||""))
  throw Error("NO_REAL_OR_PUBLIC_HOST_ALLOWED");
const ids=[
  {owner:"LOCAL-C1",draft:env.CUSTOMER_UPLOAD_DRAFT_C1,bearer:env.CUSTOMER_UPLOAD_BEARER_C1},
  {owner:"LOCAL-C2",draft:env.CUSTOMER_UPLOAD_DRAFT_C2,bearer:env.CUSTOMER_UPLOAD_BEARER_C2}
];
for(const i of ids){
  if(!/^CDR-[a-f0-9]{32}$/.test(i.draft||"")||
     !/^[a-f0-9]{64}$/.test(i.bearer||""))throw Error("SYNTHETIC_LOCAL_IDENTITY_MISSING");
}
const bytePng=new Uint8Array([137,80,78,71,13,10,26,10,1,2,3,4,5]);
const bytePdf=new TextEncoder().encode("%PDF-1.7\nDUMMY-DOCUMENT-LOCAL-NO-USER-DATA");
const item={department:"طباعة",itemName:"TEST ONLY بنود وهمية",
  qty:1,notes:"test-only-no-customer-image",heatPress:false,flyPrint:false};
const counters={itemPost:0,filePost:0,lostItem:false,lostFile:false,
  itemKeys:[],fileKeys:[]};
const recordedIds=[];
function transport(identity,{loss=false}={}){
  const injectedFetch=async(url,options)=>{
    const isItem=/\/items$/.test(url);
    const isFile=/\/files$/.test(url);
    if(isItem){counters.itemPost++;counters.itemKeys.push(JSON.parse(options.body).requestKey);}
    if(isFile){counters.filePost++;counters.fileKeys.push(options.headers["x-idempotency-key"]);}
    const response=await fetch(url,options); // Actual workerd + D1/R2.
    if(loss&&isItem&&!counters.lostItem&&response.status===201){
      counters.lostItem=true;throw Error("SYNTHETIC_LOST_AFTER_REAL_LOCAL_D1_COMMIT");
    }
    if(loss&&isFile&&!counters.lostFile&&counters.filePost===2&&response.status===201){
      counters.lostFile=true;throw Error("SYNTHETIC_LOST_AFTER_REAL_LOCAL_R2_PUT");
    }
    return response;
  };
  return createNativeCustomerLoopbackTransportV0({
    enabled:true,baseUrl:BASE,requestOrigin:ORIGIN,
    getBearer:()=>identity.bearer,
    isStageAuthorized:()=>true,
    fetchImpl:injectedFetch,timeoutMs:12000
  });
}
function coordinator(identity,files,tx){
  return createNativeCustomerUploadCoordinatorV0({
    ownerId:identity.owner,draftId:identity.draft,item,
    files:files.map(f=>({bytes:f.bytes,contentType:f.type})),
    transport:tx,getActiveOwnerId:()=>identity.owner,random:crypto.webcrypto
  });
}
async function getPrivateIntegrity(identity){
  const res=await fetch(BASE+"/v1/customer/native/drafts/"+
    identity.draft+"/files-integrity",{
      method:"GET",headers:{origin:ORIGIN,authorization:"Bearer "+identity.bearer},
      credentials:"omit",redirect:"error",cache:"no-store"
    });
  const body=await res.json();
  return {status:res.status,body};
}
async function main(){
  const txA=transport(ids[0],{loss:true});
  const planA=coordinator(ids[0],[
    {bytes:bytePng,type:"image/png"},{bytes:bytePdf,type:"application/pdf"}
  ],txA);
  assert.equal((await planA.resume()).phase,"ITEM_UNCERTAIN",
    "real D1 completed but client dropped success response");
  assert.equal((await planA.resume()).phase,"FILE_UNCERTAIN",
    "real R2 completed file 2 but client dropped success response");
  const final=await planA.resume();
  assert.equal(final.phase,"STAGED_NOT_SUBMITTED");
  assert.equal(final.completedFiles,2);
  assert.equal(final.officialOrderCreated,false);
  assert.equal(counters.itemPost,2);
  assert.equal(counters.filePost,3);
  assert.equal(counters.itemKeys[0],counters.itemKeys[1]);
  assert.equal(counters.fileKeys[1],counters.fileKeys[2]);
  assert.notEqual(counters.fileKeys[0],counters.fileKeys[1]);
  assert.equal(counters.lostItem,true);
  assert.equal(counters.lostFile,true);
  recordedIds.push({customer:ids[0].owner,draft:ids[0].draft,item:final.itemId});
  const txB=transport(ids[1]);
  const cross=await txB.uploadFile({
    draftId:ids[0].draft,itemId:final.itemId,requestKey:crypto.randomBytes(16).toString("hex"),
    bytes:bytePng,contentType:"image/png"
  });
  assert.ok([403,404,409].includes(cross.status));
  assert.equal(cross.body.success,false);
  assert.equal(Object.hasOwn(cross.body,"fileId"),false);
  const planB=coordinator(ids[1],[{bytes:bytePng,type:"image/png"}],txB);
  const b=await planB.resume();
  assert.equal(b.phase,"STAGED_NOT_SUBMITTED");
  assert.equal(b.completedFiles,1);
  assert.notEqual(b.itemId,final.itemId);
  recordedIds.push({customer:ids[1].owner,draft:ids[1].draft,item:b.itemId});
  // Real private R2 integrity inspection: never a photo viewer or scan PASS.
  const ownA=await getPrivateIntegrity(ids[0]);
  assert.equal(ownA.status,200);
  assert.equal(ownA.body.integrityNowVerified,true);
  assert.equal(ownA.body.verifiedFileCount,2);
  assert.equal(ownA.body.allFilesQuarantined,true);
  assert.equal(ownA.body.malwareScanComplete,false);
  assert.equal(ownA.body.productionWriteAuthorized,false);
  const wrong=await getPrivateIntegrity({...ids[0],bearer:ids[1].bearer});
  assert.equal(wrong.status,404);
  assert.notEqual(wrong.body.integrityNowVerified,true);
  const ownB=await getPrivateIntegrity(ids[1]);
  assert.equal(ownB.status,200);
  assert.equal(ownB.body.verifiedFileCount,1);
  assert.equal(ownB.body.allFilesQuarantined,true);
  const forbidden=await fetch(BASE+"/v1/customer/native/drafts/"+ids[0].draft+
    "/items/"+final.itemId+"/files",{
      method:"GET",headers:{origin:ORIGIN,authorization:"Bearer "+ids[0].bearer},
      redirect:"error",credentials:"omit"
    });
  assert.equal(forbidden.status,405,"private file bytes are not readable");
  const output={
    stage:"REAL_LOCAL_WORKER_D1_R2",sourceOnly:true,realCloudflareDeploy:false,
    itemRetryKeptKey:true,fileRetryKeptKey:true,
    crossTenantDenied:true,quarantinedFiles:3,
    allOfficialOrdersUnchanged:true,privateBytesServed:false,
    openAiApiCalled:false,productionReady:false,customerGoLive:"NO_GO"
  };
  const serialized=JSON.stringify(output);
  assert.ok(ids.every(i=>!serialized.includes(i.bearer)));
  console.log(serialized);
  planA.dispose();planB.dispose();
}
main().catch(e=>{
  // Never print bearer, customer tokens or raw HTTP response.
  console.error("LOCAL_CUSTOMER_WORKER_BRIDGE_TEST_FAILURE:",e.code||e.message);
  process.exitCode=1;
});
