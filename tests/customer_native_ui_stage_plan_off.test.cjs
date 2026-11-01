"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const crypto=require("node:crypto");
const path=require("node:path");
const ui=require("../customer-native-ui-stage-plan-off-v0.js");
const {createNativeCustomerUploadCoordinatorV0}=require("../customer-native-upload-coordinator-off-v0.js");
const DRAFT="CDR-"+"a".repeat(32), ITEM="CDI-"+"b".repeat(32);
const fId="CDF-"+"c".repeat(32);
const png=new Uint8Array([137,80,78,71,13,10,26,10,1,2,3,4]);
const defaultForm=()=>({department:"طباعة",itemName:"مج تجريبي",qty:"2",
  notes:" ملاحظات وهمية ",heatPress:"نعم",flyPrint:"لا",files:[file(png,"image/png")]});
function file(bytes,type,mutate=()=>{}){
 return {size:bytes.length,type,async arrayBuffer(){mutate();
   return bytes.slice().buffer}};
}
let current,items,uploads;
function testPlan(overrides={}){
 current={ownerId:"LOCAL-C1",draftId:DRAFT,authEpoch:1,
  verified:true,stage:"isolated-local"};
 items=[];uploads=[];
 const transport={
  addItem:async params=>{items.push(params);return {status:201,body:{
    success:true,itemId:ITEM,alreadyAdded:false,officialOrderCreated:false
  }};},
  uploadFile:async params=>{uploads.push(params);return {status:201,body:{
    success:true,fileId:fId,alreadyUploaded:false,fileReady:true,privateObject:true
  }};}
 };
 return ui.createNativeCustomerUiStagePlanV0({
  sourceOnlyLocalOptIn:true,coordinatorFactory:createNativeCustomerUploadCoordinatorV0,
  getVerifiedSession:()=>current,transport,random:crypto.webcrypto,...overrides
 });
}
test("Native UI stage plan is strictly opt-in, no production/default export",()=>{
 assert.throws(()=>ui.createNativeCustomerUiStagePlanV0({}),/NATIVE_UI_STAGE_OFF/);
 assert.equal(ui.loadedByLivePortal,false);
 assert.equal(ui.customerProduction,"NO_GO");
 const source=fs.readFileSync(path.join(__dirname,"..","customer-native-ui-stage-plan-off-v0.js"),"utf8");
 for(const hostname of ["trendos-ui.trendmall-contact.workers.dev","fawakhry.github.io"]){
  const context={window:{location:{hostname},TRENDOS_CUSTOMER_UI_NATIVE_STAGE_TEST_ONLY:true}};
  vm.runInNewContext(source,context);
  assert.equal(context.window.TrendOSCustomerNativeUiStagePlanV0,undefined);
 }
 const context={window:{location:{hostname:"127.0.0.1"},
  TRENDOS_CUSTOMER_UI_NATIVE_STAGE_TEST_ONLY:false}};
 vm.runInNewContext(source,context);
 assert.equal(context.window.TrendOSCustomerNativeUiStagePlanV0,undefined);
 context.window.TRENDOS_CUSTOMER_UI_NATIVE_STAGE_TEST_ONLY=true;
 vm.runInNewContext(source,context);
 assert.equal(typeof context.window.TrendOSCustomerNativeUiStagePlanV0
   .createNativeCustomerUiStagePlanV0,"function");
 for(const name of ["index.html","app.js"]){
  const live=fs.readFileSync(path.join(__dirname,"..",name),"utf8");
  assert.ok(!live.includes("customer-native-ui-stage-plan-off-v0.js"));
 }
 const executable = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
 assert.doesNotMatch(executable,/fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|ANYONE_WITH_LINK|OPENAI_API_KEY/);
});
test("legacy form strings -> exact Native typed DTO, one private file, no create twice",async()=>{
 const p=testPlan();
 assert.equal((await p.prepare(defaultForm())).phase,"READY");
 await assert.rejects(()=>p.prepare(defaultForm()),/NATIVE_UI_PLAN_ALREADY_PREPARED/);
 const r=await p.resume();
 assert.equal(r.phase,"STAGED_NOT_SUBMITTED");
 assert.equal(r.completedFiles,1);
 assert.equal(r.officialOrderCreated,false);
 assert.equal(items.length,1);
 assert.equal(items[0].department,"طباعة");
 assert.equal(items[0].qty,2);
 assert.equal(items[0].heatPress,true);
 assert.equal(items[0].flyPrint,false);
 assert.equal(items[0].notes,"ملاحظات وهمية");
 assert.equal(uploads.length,1);
 assert.equal(uploads[0].bytes.length,png.length);
 assert.ok(!JSON.stringify(p.status()).includes("ملاحظات"));
 assert.equal((await p.resume()).phase,"STAGED_NOT_SUBMITTED");
 assert.equal(items.length,1);
 assert.equal(p.cancel().phase,"EMPTY");
});
test("same owner new Native login epoch cannot resume old media plan",async()=>{
 const p=testPlan();
 await p.prepare(defaultForm());
 current={...current,authEpoch:2};
 await assert.rejects(()=>p.resume(),/NATIVE_UI_SESSION_STALE/);
 assert.equal(p.status().phase,"EMPTY");
 assert.equal(items.length,0);
});
test("two same-display-name account IDs never share Native draft owner",async()=>{
 const p=testPlan();
 await p.prepare(defaultForm());
 current={...current,ownerId:"LOCAL-C2"};
 await assert.rejects(()=>p.resume(),/NATIVE_UI_SESSION_STALE/);
 assert.equal(items.length,0);
});
test("session change during original image read fails before any network write",async()=>{
 const p=testPlan();
 const form=defaultForm();
 form.files=[file(png,"image/png",()=>{current={...current,authEpoch:4}})];
 await assert.rejects(()=>p.prepare(form),/NATIVE_UI_SESSION_STALE/);
 assert.equal(items.length,0);
});
test("cancel while file read awaits invalidates plan and avoids backend calls",async()=>{
 const p=testPlan();let unblock;
 const form=defaultForm();
 form.files=[{size:png.length,type:"image/png",
  async arrayBuffer(){await new Promise(resolve=>unblock=resolve);return png.slice().buffer;}}];
 const pending=p.prepare(form);
 p.cancel();
 unblock();
 await assert.rejects(()=>pending,/NATIVE_UI_SESSION_STALE/);
 assert.equal(items.length,0);
});
test("reject extra client identity, vendor URL, invalid types, 25MiB legacy file",async()=>{
 const malformed=[
  {...defaultForm(),qty:"2.5"}, {...defaultForm(),qty:"00"},
  {...defaultForm(),qty:"100"}, {...defaultForm(),heatPress:"yes"},
  {...defaultForm(),department:"ليزر",heatPress:"نعم"},
  {...defaultForm(),token:"LEGACY_SECRET"},
  {...defaultForm(),customerId:"OTHER_CUSTOMER"},
  {...defaultForm(),vendorCode:"UNTRUSTED"},
  {...defaultForm(),folderUrl:"https://public.invalid"},
  {...defaultForm(),files:[file(png,"image/svg+xml")]},
  {...defaultForm(),files:[{size:6*1024*1024,type:"image/png",async arrayBuffer(){throw Error("SHOULD_NOT_READ");}}]},
  {...defaultForm(),files:Array.from({length:6},()=>file(png,"image/png"))}
 ];
 for(const value of malformed){
  const p=testPlan();
  await assert.rejects(()=>p.prepare(value),/NATIVE_UI_/);
  assert.equal(items.length,0);
 }
});
test("reject unverified/forged session proof or bearer leakage",async()=>{
 const p=testPlan();
 current={...current,verified:false};
 await assert.rejects(()=>p.prepare(defaultForm()),/NATIVE_UI_VERIFIED_LOCAL_SESSION_REQUIRED/);
 current={...current,verified:true,token:"a".repeat(64)};
 await assert.rejects(()=>p.prepare(defaultForm()),/NATIVE_UI_VERIFIED_LOCAL_SESSION_REQUIRED/);
 current={...current,token:undefined,stage:"remote-production"};
 await assert.rejects(()=>p.prepare(defaultForm()),/NATIVE_UI_VERIFIED_LOCAL_SESSION_REQUIRED/);
});
