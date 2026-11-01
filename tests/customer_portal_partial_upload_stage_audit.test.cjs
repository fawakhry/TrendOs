// Synthetic-only fault injection into the original unmodified customer add-item
// function. Documents a REAL partial-upload risk; never contacts external APIs.
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {test}=require("node:test");
const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
const begin=app.indexOf("async function addCustomerDraftItem()");
const end=app.indexOf("async function submitCustomerDraft()",begin);
assert.ok(begin>=0&&end>begin,"Original customer draft functions must exist");
const original=app.slice(begin,end);
test("synthetic failed file upload leaves created remote item; retry duplicates it",async()=>{
  const recorded={remoteItems:[],uploadAttempts:0,errors:[]};
  const controls={
    customerOrderDepartment:{value:"طباعة"},
    customerOrderItem:{value:"تابلوه"},
    customerOrderQty:{value:"1"},
    customerOrderNotes:{value:"صور تجريبية"},
    customerHeatPress:{checked:false},
    customerFlyPrint:{checked:false},
    customerAddDraftItemBtn:{disabled:false,textContent:""}
  };
  const state={
    visitorPreview:false,customer:{customerCode:"TEST-OWNER-A"},
    customerDraftBusy:false,customerPendingFiles:[{file:{name:"synthetic.png",size:24}}],
    customerDraft:{draftId:"FAKE-DRAFT-A",items:[]}
  };
  const sandbox={
    state,
    $:id=>controls[id]||null,
    setMsg:(id,message,isError)=>{if(isError)recorded.errors.push(message);},
    ensureCustomerDraftOnServer:async()=>state.customerDraft.draftId,
    ensureCustomerDraftStarted:()=>state.customerDraft,
    customerAuthParams:x=>x,
    api:async(name,params)=>{
      assert.equal(name,"addCustomerDraftItem");
      const itemId="FAKE-ITEM-"+(recorded.remoteItems.length+1);
      recorded.remoteItems.push({itemId,params});
      return {success:true,itemId};
    },
    uploadFilesForDraftItem:async(draftId,itemId,files)=>{
      recorded.uploadAttempts++;
      assert.equal(files.length,1);
      if(recorded.uploadAttempts===1)throw Error("SYNTHETIC_SECOND_FILE_FAILURE");
      return [{name:"synthetic.png",fileId:"FAKE-FILE-2"}];
    },
    renderCustomerDraft:()=>{},
    clearCustomerDraftInputs:()=>{},
    branchPublicName:()=>""
  };
  const add=vm.runInNewContext("("+original+")",sandbox,{timeout:1000});
  await add();
  assert.equal(recorded.remoteItems.length,1,"server item exists after failed upload");
  assert.equal(state.customerDraft.items.length,0,"client cannot see partial server item");
  assert.equal(recorded.errors[0],"SYNTHETIC_SECOND_FILE_FAILURE");
  assert.equal(state.customerDraftBusy,false);
  await add();
  assert.equal(recorded.remoteItems.length,2,"retry created a distinct server item");
  assert.equal(recorded.uploadAttempts,2);
  assert.equal(state.customerDraft.items.length,1,"only the later item appears in local draft");
  assert.notEqual(recorded.remoteItems[0].itemId,recorded.remoteItems[1].itemId);
});
