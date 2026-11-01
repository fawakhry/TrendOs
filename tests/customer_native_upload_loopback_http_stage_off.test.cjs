// Real loopback HTTP protocol exercise (Node 22), but a SYNTHETIC server:
// no workerd, D1 migrations, R2 bindings, customer records or production access.
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const http=require("node:http");
const crypto=require("node:crypto");
const {createNativeCustomerLoopbackTransportV0,localOrigin}=
  require("../customer-native-upload-loopback-http-stage-off-v0.cjs");
const {createNativeCustomerUploadCoordinatorV0}=
  require("../customer-native-upload-coordinator-off-v0.js");
const makeId=(prefix,c)=>prefix+c.repeat(32);
const A={token:"a".repeat(64),owner:"owner-A",draft:makeId("CDR-","a"),name:"محمد"};
const B={token:"b".repeat(64),owner:"owner-B",draft:makeId("CDR-","b"),name:"محمد"};
const PNG=new Uint8Array([137,80,78,71,13,10,26,10,5,6,7,8]);
const PDF=new Uint8Array([37,80,68,70,45,49,46,55,10,0,1,2]);
const item={department:"طباعة",itemName:"مج وهمي",qty:1,notes:"synthetic",
  heatPress:false,flyPrint:false};
async function serverFixture() {
  let lostItem=false,lostSecondFile=false,forcePending=false;
  const state={items:new Map(),files:new Map(),itemWrites:0,fileWrites:0,
    itemCalls:[],fileCalls:[],denied:0};
  const server=http.createServer(async(req,res)=>{
    const fail=(status,body)=>{res.writeHead(status,{"content-type":"application/json"});
      res.end(JSON.stringify(body));};
    const bearer=/^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization||"");
    const identity=bearer&&(bearer[1]===A.token?A:bearer[1]===B.token?B:null);
    if(!identity||req.headers.origin!=="http://127.0.0.1:18881"||
       req.method!=="POST"){state.denied++;return fail(403,{success:false,code:"DENIED"});}
    const itemPath=/^\/v1\/customer\/native\/drafts\/(CDR-[a-f0-9]{32})\/items$/;
    const filePath=/^\/v1\/customer\/native\/drafts\/(CDR-[a-f0-9]{32})\/items\/(CDI-[a-f0-9]{32})\/files$/;
    const path=new URL(req.url,"http://127.0.0.1").pathname;
    const im=itemPath.exec(path),fm=filePath.exec(path);
    if(!im&&!fm)return fail(404,{success:false,code:"ROUTE_MISSING"});
    const draft=im?im[1]:fm[1];
    if(draft!==identity.draft){state.denied++;return fail(404,{success:false,code:"SCOPE_NOT_FOUND"});}
    const chunks=[];let size=0;
    for await(const chunk of req){size+=chunk.length;if(size>5*1024*1024+4096)
      return fail(413,{success:false,code:"TOO_BIG"});chunks.push(chunk);}
    const body=Buffer.concat(chunks);
    if(im){
      if(req.headers["content-type"]!=="application/json")
        return fail(415,{success:false,code:"WRONG_TYPE"});
      let data;try{data=JSON.parse(body.toString("utf8"));}catch{
        return fail(400,{success:false,code:"WRONG_JSON"});}
      const key=data.requestKey;
      state.itemCalls.push({owner:identity.owner,key});
      if(!/^[a-f0-9]{32}$/.test(key))return fail(400,{success:false,code:"NO_KEY"});
      const stored=state.items.get(key);
      if(stored){
        if(stored.owner!==identity.owner||stored.draft!==draft||
           stored.data!==JSON.stringify(data))
          return fail(409,{success:false,code:"ITEM_CONFLICT"});
        return fail(200,{success:true,alreadyAdded:true,itemId:stored.itemId,
          officialOrderCreated:false});
      }
      const itemId=makeId("CDI-",identity===A?"c":"d");
      state.items.set(key,{owner:identity.owner,draft,itemId,data:JSON.stringify(data)});
      state.itemWrites++;
      if(lostItem){lostItem=false;res.destroy();return;}
      return fail(201,{success:true,alreadyAdded:false,itemId,officialOrderCreated:false});
    }
    const key=req.headers["x-idempotency-key"];
    state.fileCalls.push({owner:identity.owner,key,itemId:fm[2]});
    const ownsItem=Array.from(state.items.values()).some(i=>
      i.owner===identity.owner&&i.draft===draft&&i.itemId===fm[2]);
    if(!ownsItem){state.denied++;return fail(404,{success:false,code:"FILE_ITEM_DENIED"});}
    if(!/^[a-f0-9]{32}$/.test(key))
      return fail(400,{success:false,code:"MISSING_KEY"});
    const digest=crypto.createHash("sha256").update(body).digest("hex");
    const stored=state.files.get(key);
    if(stored){
      if(stored.owner!==identity.owner||stored.itemId!==fm[2]||
         stored.digest!==digest||stored.type!==req.headers["content-type"])
        return fail(409,{success:false,code:"FILE_CONFLICT"});
      if(stored.pending)
        return fail(409,{success:false,code:"CUSTOMER_FILE_PENDING_RECONCILIATION"});
      return fail(200,{success:true,fileReady:true,privateObject:true,
        alreadyUploaded:true,fileId:stored.fileId});
    }
    const fileId=makeId("CDF-",state.fileWrites===0?"e":"f");
    const pending=forcePending;state.files.set(key,{owner:identity.owner,
      itemId:fm[2],digest,type:req.headers["content-type"],fileId,pending});
    state.fileWrites++;
    if(pending)return fail(409,{success:false,code:"CUSTOMER_FILE_PENDING_RECONCILIATION"});
    if(lostSecondFile&&state.fileWrites===2){
      lostSecondFile=false;res.destroy();return;
    }
    return fail(201,{success:true,fileReady:true,privateObject:true,
      alreadyUploaded:false,fileId});
  });
  await new Promise((resolve,reject)=>server.listen(0,"127.0.0.1",err=>
    err?reject(err):resolve()));
  const port=server.address().port;
  const endpoint="http://127.0.0.1:"+port;
  return {
    state,endpoint,
    loseFirstItem(){lostItem=true},
    loseSecondFile(){lostSecondFile=true},
    pending(){forcePending=true},
    async close(){await new Promise(resolve=>server.close(resolve))}
  };
}
function transport(f,identity,open=()=>true){
  return createNativeCustomerLoopbackTransportV0({
    enabled:true,baseUrl:f.endpoint,requestOrigin:"http://127.0.0.1:18881",
    fetchImpl:fetch,getBearer:()=>identity.token,isStageAuthorized:open
  });
}
function plan(f,identity,files,open=()=>true){
  return createNativeCustomerUploadCoordinatorV0({
    ownerId:identity.owner,draftId:identity.draft,item,
    files:files.map(f=>({bytes:f.bytes,contentType:f.type})),
    getActiveOwnerId:()=>identity.owner,
    transport:transport(f,identity,open),random:crypto.webcrypto
  });
}
test("actual loopback HTTP, lost item + second file responses: same keys, no duplicate writes",async()=>{
  const f=await serverFixture();
  try {
    f.loseFirstItem();f.loseSecondFile();
    const c=plan(f,A,[{bytes:PNG,type:"image/png"},{bytes:PDF,type:"application/pdf"}]);
    assert.equal((await c.resume()).phase,"ITEM_UNCERTAIN");
    assert.equal(f.state.itemWrites,1);
    assert.equal((await c.resume()).phase,"FILE_UNCERTAIN");
    assert.equal(c.status().completedFiles,1);
    assert.equal(f.state.itemWrites,1);
    assert.equal(f.state.fileWrites,2);
    assert.equal((await c.resume()).phase,"STAGED_NOT_SUBMITTED");
    assert.equal(c.status().completedFiles,2);
    assert.equal(f.state.itemWrites,1);
    assert.equal(f.state.fileWrites,2);
    assert.equal(f.state.itemCalls.length,2);
    assert.equal(f.state.itemCalls[0].key,f.state.itemCalls[1].key);
    assert.equal(f.state.fileCalls.length,3);
    assert.equal(f.state.fileCalls[1].key,f.state.fileCalls[2].key);
    assert.equal(c.status().officialOrderCreated,false);
    assert.equal(JSON.stringify(c.status()).includes(A.token),false);
  }finally{await f.close();}
});
test("two same-name synthetic customers have distinct owners: cross-tenant HTTP 404",async()=>{
  const f=await serverFixture();
  try{
    assert.equal(A.name,B.name);
    const a=plan(f,A,[{bytes:PNG,type:"image/png"}]);
    assert.equal((await a.resume()).phase,"STAGED_NOT_SUBMITTED");
    const tB=transport(f,B);
    const aItemId=Array.from(f.state.items.values())[0].itemId;
    // B session is valid but cannot upload to A's draft/item.
    const attempt=await tB.uploadFile({draftId:A.draft,itemId:aItemId,
      requestKey:"f".repeat(32),bytes:PNG,contentType:"image/png"});
    assert.equal(attempt.status,404);
    assert.equal(attempt.body.success,false);
    const b=plan(f,B,[{bytes:PNG,type:"image/png"}]);
    assert.equal((await b.resume()).phase,"STAGED_NOT_SUBMITTED");
    assert.equal(f.state.itemWrites,2);
    assert.equal(f.state.fileWrites,2);
    assert.equal(f.state.denied,1);
  }finally{await f.close();}
});
test("HTTP 409 PENDING halts customer progress; no repeat request",async()=>{
  const f=await serverFixture();
  try{
    f.pending();
    const c=plan(f,A,[{bytes:PNG,type:"image/png"},{bytes:PDF,type:"application/pdf"}]);
    assert.equal((await c.resume()).phase,"PENDING_REVIEW_REQUIRED");
    assert.equal((await c.resume()).phase,"PENDING_REVIEW_REQUIRED");
    assert.equal(f.state.fileCalls.length,1);
    assert.equal(f.state.fileWrites,1);
    assert.equal(c.status().completedFiles,0);
    assert.equal(c.status().needsOperatorReview,true);
  }finally{await f.close();}
});
test("HTTP transport defaults OFF and rejects public cloud host & wrong bearer",async()=>{
  const f=await serverFixture();
  try{
    const defaults={enabled:true,fetchImpl:fetch,getBearer:()=>A.token,
      isStageAuthorized:()=>true,requestOrigin:"http://127.0.0.1:18881"};
    assert.throws(()=>createNativeCustomerLoopbackTransportV0({
      ...defaults,baseUrl:"https://trendos-d1-api.trendmall-contact.workers.dev"
    }),/STAGE_ORIGIN_FORBIDDEN/);
    assert.throws(()=>createNativeCustomerLoopbackTransportV0({
      ...defaults,baseUrl:"http://localhost:8080"
    }),/STAGE_ORIGIN_FORBIDDEN/);
    assert.throws(()=>createNativeCustomerLoopbackTransportV0({
      ...defaults,baseUrl:f.endpoint,enabled:false
    }),/STAGE_TRANSPORT_OFF/);
    const closed=transport(f,A,()=>false);
    await assert.rejects(()=>closed.addItem({draftId:A.draft,
      requestKey:"f".repeat(32),...item}),/STAGE_AUTHORIZATION_OFF/);
    const unauth=createNativeCustomerLoopbackTransportV0({
      ...defaults,baseUrl:f.endpoint,getBearer:()=>"bad-token"
    });
    await assert.rejects(()=>unauth.addItem({draftId:A.draft,
      requestKey:"f".repeat(32),...item}),/NATIVE_BEARER_REQUIRED/);
    assert.equal(f.state.itemWrites,0);
  }finally{await f.close();}
});
test("never loaded in customer UI or existing original Native browser dispatcher",()=>{
  const fs=require("node:fs"),path=require("node:path");
  const root=path.resolve(__dirname,"..");
  const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
  const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
  for(const s of [html,app]){
    assert.ok(!s.includes("customer-native-upload-loopback-http-stage-off-v0.cjs"));
  }
  const source=fs.readFileSync(path.join(root,
    "customer-native-upload-loopback-http-stage-off-v0.cjs"),"utf8");
  assert.ok(!/sessionStorage|localStorage|ANYONE_WITH_LINK|OPENAI_API_KEY/.test(source));
  assert.equal(localOrigin("http://127.0.0.1:2222"),"http://127.0.0.1:2222");
});
