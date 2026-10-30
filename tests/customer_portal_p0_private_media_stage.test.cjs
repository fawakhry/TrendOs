// Isolated dynamic execution of the ORIGINAL Google Apps Script handler functions
// with synthetic sheets/Drive mocks. No credentials, API calls or production writes.
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const {test}=require("node:test");
const source=fs.readFileSync(path.join(__dirname,"..","Code.gs"),"utf8");
function extract(start,next){
 const i=source.indexOf("function "+start+"(");
 const j=source.indexOf("function "+next+"(",i+9);
 assert.ok(i>=0&&j>i,"Expected handlers not found");
 return source.slice(i,j);
}
function createContext(options={}){
 const original=options.original??"CODE1";
 const orderData=[
  ["header"],["row","ORD-OWN","L-1","CODE1","Same Name","طباعة","مج",1,"جاهز"],
  ["row","ORD-OTHER","L-2","CODE2","Same Name","طباعة","تابلوه",1,"جاهز"],
  ["row","ORD-LEGACY","L-3","","Same Name","طباعة","برواز",1,"جديد"],
 ];
 const colMap={
  "رقم الأوردر":1,"رقم البند":2,"كود الشات":3,"اسم الشات / المكتب":4,
  "القسم":5,"اسم البند / نوع الشغل":6,"الكمية":7,"الحالة":8,
  "رقم المسودة":1,"رقم بند المسودة":2,"نوع السجل":3,
  "معرف فولدر البند":4
 };
 const state={created:0,recorded:0,trashed:0,sharing:[],flush:0,folderPrivate:options.folderPrivate!==false};
 const orderSheet={getDataRange(){return{getValues:()=>orderData}}};
 const filesSheet={getDataRange(){return{getValues:()=>[
  ["head"],["row","DR-1","ITEM-1","بند","PRIVATE-FOLDER"]
 ]}}};
 const file={
  setSharing(a,b){state.sharing.push([a,b]);if(options.failSetSharing)throw Error("sharing unavailable");},
  getSharingAccess(){return options.filePrivate===false?"ANYONE_WITH_LINK":"PRIVATE"},
  getId(){return "MOCK-FILE-ID"},getUrl(){return "mock://private-file"},
  setTrashed(x){if(x)state.trashed++}
 };
 const folder={
  getSharingAccess(){return state.folderPrivate?"PRIVATE":"ANYONE_WITH_LINK"},
  createFile(){state.created++;return file},
  getUrl(){return "mock://private-folder"}
 };
 const context={
  SHEET_NAME_LINES:"LINES",CUSTOMER_UPLOAD_MAX_BYTES:25*1024*1024,
  customerAuthorize_(){return{ok:true,customer:{customerCode:original,name:"Same Name"}}},
  ss_(){return{getSheetByName(){return orderSheet}}},
  ensureWhatsAppHeaders_(){},
  headersMap_(){return{}},
  firstCol_(h,names,fallback){return options.noCode && names[0]==="كود الشات"?0:
    (colMap[names[0]]||fallback)},
  normalize_(x){return String(x??"").trim()},
  valueAt_(row,col){return col>0?row[col]:null},
  safeDriveName_(s){return s},
  findDraftRow_(){return{}},
  ensureCustomerDraftSheets_(){return{files:filesSheet}},
  Utilities:{
   base64Decode(x){return Uint8Array.from(Buffer.from(x,"base64"))},
   newBlob(bytes,mime,name){return{bytes,mime,name}}
  },
  DriveApp:{
   Access:{PRIVATE:"PRIVATE",ANYONE_WITH_LINK:"ANYONE_WITH_LINK"},
   Permission:{NONE:"NONE",VIEW:"VIEW"},
   getFolderById(){return folder}
  },
  appendByHeaders_(sheet,row){state.recorded++;state.record=row},
  SpreadsheetApp:{flush(){state.flush++}},
  state
 };
 vm.createContext(context);
 return context;
}
test("customer order list requires EXACT code even if customer names match",()=>{
 const ctx=createContext();
 vm.runInContext(extract("getCustomerOrders_","makeCustomerOrderSeparator_"),ctx);
 const result=ctx.getCustomerOrders_({parameter:{customerCode:"CODE1",token:"synthetic"}});
 assert.equal(result.success,true);
 assert.deepEqual(Array.from(result.orders.map(x=>x.orderId)),["ORD-OWN"]);
 assert.equal(result.count,1);
 const missingCodeCtx=createContext({noCode:true});
 vm.runInContext(extract("getCustomerOrders_","makeCustomerOrderSeparator_"),missingCodeCtx);
 assert.equal(missingCodeCtx.getCustomerOrders_({parameter:{}}).success,false);
 const second=createContext({original:"CODE2"});
 vm.runInContext(extract("getCustomerOrders_","makeCustomerOrderSeparator_"),second);
 assert.deepEqual(Array.from(second.getCustomerOrders_({parameter:{}}).orders.map(x=>x.orderId)),["ORD-OTHER"]);
});
function runUpload(opts={}){
 const ctx=createContext(opts);
 vm.runInContext(extract("uploadCustomerDraftFile_","collectDraftItems_"),ctx);
 const raw=Buffer.from("FOUR","utf8");
 const request={customerCode:"CODE1",token:"TEST",draftId:"DR-1",itemId:"ITEM-1",
 fileName:"fake.png",mimeType:"image/png",base64:raw.toString("base64"),size:raw.length,...(opts.payload||{})};
 const result=ctx.uploadCustomerDraftFile_(request);
 return{result,state:ctx.state};
}
test("uploaded byte length and syntax are verified, not trusted from caller",()=>{
 let v=runUpload({payload:{size:1}});
 assert.equal(v.result.success,false);assert.equal(v.state.created,0);
 v=runUpload({payload:{base64:"$$not-base64$$"}});
 assert.equal(v.result.success,false);assert.equal(v.state.created,0);
 v=runUpload({payload:{size:25*1024*1024+1}});
 assert.equal(v.result.success,false);assert.equal(v.state.created,0);
});
test("public folder is rejected BEFORE Google Drive file is created",()=>{
 const v=runUpload({folderPrivate:false});
 assert.equal(v.result.success,false);assert.equal(v.state.created,0);
 assert.equal(v.state.recorded,0);
});
test("private mock file requires explicit private permission and records only after confirmation",()=>{
 const v=runUpload();
 assert.equal(v.result.success,true);
 assert.equal(v.state.created,1);
 assert.deepEqual(v.state.sharing,[["PRIVATE","NONE"]]);
 assert.equal(v.state.recorded,1);
 assert.equal(v.state.trashed,0);
});
test("failed or nonprivate post-create sharing is trashed and never recorded",()=>{
 for(const o of [{failSetSharing:true},{filePrivate:false}]){
  const v=runUpload(o);
  assert.equal(v.result.success,false);
  assert.equal(v.state.created,1);
  assert.equal(v.state.recorded,0);
  assert.equal(v.state.trashed,1);
 }
});
test("source no longer has public anyone-with-link or name-match cross-account fallback in the targeted handlers",()=>{
 const upload=extract("uploadCustomerDraftFile_","collectDraftItems_");
 const list=extract("getCustomerOrders_","makeCustomerOrderSeparator_");
 assert.ok(!upload.includes("setSharing(DriveApp.Access.ANYONE_WITH_LINK"));
 assert.ok(!list.includes("rowNameKey !== nameKey"));
 assert.ok(list.includes("rowCode !== customer.customerCode"));
 assert.ok(upload.includes("bytes.length !== size"));
});
