// No network, no customer data, no Cloudflare/Google bindings. Contract fixtures
// mirror existing Zero Google Entry665 (item) and Entry666 (private R2 file).
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const api=require("../customer-native-upload-coordinator-off-v0.js");
const DRAFT="CDR-"+"a".repeat(32);
const ITEM="CDI-"+"b".repeat(32);
const FILE1="CDF-"+"c".repeat(32);
const FILE2="CDF-"+"d".repeat(32);
const item={department:"طباعة",itemName:"مج",qty:1,notes:"بيانات وهمية فقط",heatPress:false,flyPrint:false};
const png=()=>({bytes:new Uint8Array([137,80,78,71,13,10,26,10,0,1,2]),contentType:"image/png"});
const pdf=()=>({bytes:new Uint8Array([37,80,68,70,45,49,46,52,0,1,2]),contentType:"application/pdf"});
const rng=()=>{let count=0;return {getRandomValues(a){a.fill(++count);return a;}}};
function plan({owner="CUSTOMER_A",files=[png()],transport,active=()=>owner}={}){
  return api.createNativeCustomerUploadCoordinatorV0({
    ownerId:owner,draftId:DRAFT,item,files,transport,getActiveOwnerId:active,random:rng()
  });
}
function itemResponse(already=false){return {status:already?200:201,body:{
  success:true,itemId:ITEM,alreadyAdded:already,officialOrderCreated:false
}};}
function fileResponse(fileId,already=false){return {status:already?200:201,body:{
  success:true,fileId,alreadyUploaded:already,fileReady:true,privateObject:true
}};}

test("two synthetic private files stage only, stable keys and zero official order",async()=>{
  const items=[],uploads=[];
  const transport={
    addItem:async x=>{items.push(x);return itemResponse();},
    uploadFile:async x=>{uploads.push(x);return fileResponse(uploads.length===1?FILE1:FILE2);}
  };
  const coordinator=plan({files:[png(),pdf()],transport});
  const [a,b]=await Promise.all([coordinator.resume(),coordinator.resume()]);
  assert.equal(a.phase,"STAGED_NOT_SUBMITTED");
  assert.equal(b.phase,"STAGED_NOT_SUBMITTED");
  assert.equal(items.length,1);
  assert.equal(uploads.length,2);
  assert.match(items[0].requestKey,/^[0-9a-f]{32}$/);
  assert.match(uploads[0].requestKey,/^[0-9a-f]{32}$/);
  assert.notEqual(uploads[0].requestKey,uploads[1].requestKey);
  assert.equal(uploads[0].itemId,ITEM);
  assert.equal(coordinator.status().completedFiles,2);
  assert.equal(coordinator.status().officialOrderCreated,false);
  assert.equal((await coordinator.resume()).phase,"STAGED_NOT_SUBMITTED");
  assert.equal(items.length,1);
  assert.equal(uploads.length,2);
  assert.doesNotMatch(JSON.stringify(coordinator.status()),/requestKey|bytes|token|password|name|sha256/i);
});

test("ambiguous item response retries exact same idempotency key; never creates duplicate",async()=>{
  const keys=[],known=new Set(),sent=[];
  const transport={
    addItem:async x=>{
      keys.push(x.requestKey);
      if(!known.has(x.requestKey)){known.add(x.requestKey);throw Error("lost response after insert");}
      return itemResponse(true);
    },
    uploadFile:async x=>{sent.push(x);return fileResponse(FILE1);}
  };
  const c=plan({transport});
  assert.equal((await c.resume()).phase,"ITEM_UNCERTAIN");
  assert.equal(c.status().itemCreated,false);
  assert.equal((await c.resume()).phase,"STAGED_NOT_SUBMITTED");
  assert.equal(known.size,1);
  assert.equal(keys.length,2);
  assert.equal(keys[0],keys[1]);
  assert.equal(sent.length,1);
});

test("file N fails after a successful private R2 write; explicit retry uses same key",async()=>{
  const itemKeys=[],calls=[],stored=new Map();
  const transport={
    addItem:async x=>{itemKeys.push(x.requestKey);return itemResponse();},
    uploadFile:async x=>{
      calls.push({key:x.requestKey,firstByte:x.bytes[0],itemId:x.itemId});
      const existing=stored.get(x.requestKey);
      if(existing)return fileResponse(existing,true);
      const id=stored.size===0?FILE1:FILE2;
      stored.set(x.requestKey,id);
      if(stored.size===2)throw Error("synthetic response lost after R2 save");
      return fileResponse(id);
    }
  };
  const c=plan({files:[png(),pdf()],transport});
  assert.equal((await c.resume()).phase,"FILE_UNCERTAIN");
  assert.equal(c.status().completedFiles,1);
  assert.equal(c.status().itemCreated,true);
  assert.equal((await c.resume()).phase,"STAGED_NOT_SUBMITTED");
  assert.equal(itemKeys.length,1);
  assert.equal(calls.length,3,"only failed second file retried");
  assert.equal(calls[1].key,calls[2].key);
  assert.notEqual(calls[0].key,calls[1].key);
  assert.equal(stored.size,2);
  assert.equal(c.status().completedFiles,2);
});

test("server PENDING 409 halts without retrying or proceeding to next file",async()=>{
  const calls=[];
  const c=plan({files:[png(),pdf()],transport:{
    addItem:async()=>itemResponse(),
    uploadFile:async x=>{calls.push(x.requestKey);return {status:409,body:{
      success:false,code:"CUSTOMER_FILE_PENDING_RECONCILIATION"
    }};}
  }});
  let result=await c.resume();
  assert.equal(result.phase,"PENDING_REVIEW_REQUIRED");
  assert.equal(result.needsOperatorReview,true);
  assert.equal(result.lastCode,"CUSTOMER_FILE_PENDING_RECONCILIATION");
  assert.equal((await c.resume()).phase,"PENDING_REVIEW_REQUIRED");
  assert.equal(calls.length,1,"never auto-reattempt a pending file");
  assert.equal(result.completedFiles,0);
});

test("owner changes during an item request: no file upload, no bearer stored",async()=>{
  let owner="CUSTOMER_A",release,uploads=0;
  const deferred=new Promise(resolve=>release=resolve);
  const c=plan({active:()=>owner,transport:{
    addItem:()=>deferred,uploadFile:async()=>{uploads++;return fileResponse(FILE1);}
  }});
  const waiting=c.resume();
  owner="CUSTOMER_B";release(itemResponse());
  const result=await waiting;
  assert.equal(result.phase,"DISPOSED");
  assert.equal(uploads,0);
  assert.equal((await c.resume()).phase,"DISPOSED");
});

test("invalid owner, types, dimensions, unsafe randomness and oversized files fail before transport",()=>{
  const transport={addItem:async()=>{throw Error("NETWORK_FORBIDDEN")},uploadFile:async()=>{}};
  assert.throws(()=>plan({owner:"customer one",transport}),/NATIVE_UPLOAD_PLAN_INVALID/);
  assert.throws(()=>plan({files:[{bytes:new Uint8Array(10),contentType:"image/png"}],transport}),
    /NATIVE_UPLOAD_PLAN_INVALID/);
  assert.throws(()=>plan({files:[{bytes:new Uint8Array(5*1024*1024+1),contentType:"image/png"}],transport}),
    /NATIVE_UPLOAD_PLAN_INVALID/);
  assert.throws(()=>api.createNativeCustomerUploadCoordinatorV0({
    ownerId:"CUSTOMER_A",draftId:DRAFT,item,files:[png()],transport,
    getActiveOwnerId:()=>"CUSTOMER_A",random:{}
  }),/SECURE_RANDOM_REQUIRED/);
  assert.equal(api.reloadResumeSupported,false);
  assert.equal(api.nativeUploadRouteLive,false);
});

test("invalid response cannot claim official order, private object or customer file READY",async()=>{
  const c=plan({transport:{
    addItem:async()=>itemResponse(),
    uploadFile:async()=>({status:201,body:{
      success:true,fileId:FILE1,alreadyUploaded:false,fileReady:true,
      privateObject:true,fileUrl:"https://example.invalid/forbidden"
    }})
  }});
  assert.equal((await c.resume()).phase,"FILE_REJECTED");
  assert.equal(c.status().officialOrderCreated,false);
});

test("explicit disposal clears copied original bytes and prevents subsequent requests",async()=>{
  let requests=0;
  const transport={addItem:async()=>{requests++;return itemResponse()},
    uploadFile:async()=>{requests++;return fileResponse(FILE1)}};
  const original=png();
  const c=plan({files:[original],transport});
  const disposed=c.dispose();
  assert.equal(disposed.phase,"DISPOSED");
  assert.equal((await c.resume()).phase,"DISPOSED");
  assert.equal(requests,0);
  assert.equal(original.bytes[0],137,"caller's original is unchanged");
  assert.equal(api.autoSubmit,false);
});
const source=fs.readFileSync(path.join(__dirname,"..","customer-native-upload-coordinator-off-v0.js"),"utf8");
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
test("source is not wired to live customer UI and contains no direct network or storage",()=>{
  assert.ok(!html.includes("customer-native-upload-coordinator-off-v0.js"));
  assert.ok(!app.includes("customer-native-upload-coordinator-off-v0.js"));
  assert.ok(!/\bfetch\s*\(|XMLHttpRequest|sessionStorage|localStorage|OPENAI_API_KEY|ANYONE_WITH_LINK/.test(source));
});
