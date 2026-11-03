// Actual original customer functions; synthetic fault injection, no network.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {test}=require('node:test');
const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
function extract(name){
 const start=new RegExp('  (?:async )?function '+name+'\\(').exec(app)?.index;
 assert.ok(start>=0,'original function exists: '+name);
 const next=/\n  (?:async )?function /.exec(app.slice(start+4));
 return app.slice(start,next?start+4+next.index:app.length);
}
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject};}
function fixture(options={}){
 const recorded={items:[],files:[],orders:[],errors:[],renders:0,requests:[]};
 const controls={customerOrderDepartment:{value:'طباعة'},customerOrderItem:{value:'مج'},
  customerOrderQty:{value:'2'},customerOrderNotes:{value:'صورة تركيبية'},
  customerHeatPress:{checked:false},customerFlyPrint:{checked:false},
  customerAddDraftItemBtn:{disabled:false},customerSubmitDraftBtn:{disabled:false},
  customerOrdersStatus:{textContent:''}};
 const state={customer:{customerCode:'A',token:'TEST-A'},customerDraftBusy:false,
  customerOrders:[],customerPendingFiles:[{file:{name:'a.png',size:24,type:'image/png'}},{file:{name:'b.png',size:24,type:'image/png'}}],
  customerDraft:{draftId:'DRAFT-A',items:[]}};
 const sandbox={state,Number,Error,$:id=>controls[id]||null,
  customerMessengerApi:()=>null,
  setMsg:(id,message,error)=>{if(error)recorded.errors.push(message)},
  ensureCustomerDraftStarted:()=>state.customerDraft,
  renderCustomerDraft:()=>{recorded.renders++},renderCustomerOrders:()=>{recorded.renders++},
  clearCustomerDraftInputs:()=>{state.customerPendingFiles=[]},
  branchPublicName:()=>'',confirm:()=>true,
  fileToBase64:options.fileRead|| (async()=>Buffer.from('synthetic').toString('base64')),
  api:async(action,payload)=>{
   recorded.requests.push({action,payload});
   if(action==='getCustomerOrders')return options.orderRead?options.orderRead.promise:{success:true,orders:[]};
   if(action==='createCustomerDraft')return options.draftCreate?options.draftCreate.promise:{success:true,draftId:'CREATED-A'};
   if(action==='addCustomerDraftItem'){
    const itemId='ITEM-'+(recorded.items.length+1);recorded.items.push({itemId,payload});
    if(options.itemWait)return options.itemWait.promise;
    if(options.loseItem)throw Error('LOST_ITEM_RESPONSE');
    return {success:true,itemId};
   }
   if(action==='submitCustomerDraft'){
    recorded.orders.push(payload);if(options.submitWait)return options.submitWait.promise;
    if(options.loseSubmit)throw Error('LOST_ORDER_RESPONSE');
    return {success:true,orderId:'ORDER-A'};
   }
   throw Error('UNEXPECTED_ACTION');
  },
  apiPost:async(action,payload)=>{
   assert.equal(action,'uploadCustomerDraftFile');recorded.files.push(payload);
   if(recorded.files.length===options.loseFile)throw Error('LOST_FILE_RESPONSE');
   return {success:true,fileId:'FILE-'+recorded.files.length};
  }
 };
 vm.createContext(sandbox);
 for(const name of ['customerAuthParams','customerRequestFence','loadCustomerOrders','ensureCustomerDraftOnServer','uploadFilesForDraftItem','addCustomerDraftItem','submitCustomerDraft'])vm.runInContext(extract(name),sandbox);
 return {state,recorded,controls,add:sandbox.addCustomerDraftItem,submit:sandbox.submitCustomerDraft,
  load:sandbox.loadCustomerOrders,upload:sandbox.uploadFilesForDraftItem,create:sandbox.ensureCustomerDraftOnServer,
  swap(){state.customer={customerCode:'B',token:'TEST-B'};state.customerDraft={draftId:'DRAFT-B',items:[]};state.customerDraftBusy=true;}}
}
test('lost second attachment response cannot create another item, reupload files, or submit a partial draft',async()=>{
 const f=fixture({loseFile:2});await f.add();
 assert.equal(f.recorded.items.length,1);assert.equal(f.recorded.files.length,2);
 assert.equal(f.state.customerDraft.items.length,0);assert.equal(f.state.customerDraft.writeUncertain,true);
 await f.add();await f.submit();
 assert.equal(f.recorded.items.length,1);assert.equal(f.recorded.files.length,2);assert.equal(f.recorded.orders.length,0);
 assert.equal(f.controls.customerSubmitDraftBtn.disabled,true);
});
test('item response loss blocks another add even when the server may have created the item',async()=>{
 const f=fixture({loseItem:true});await f.add();await f.add();await f.submit();
 assert.equal(f.recorded.items.length,1);assert.equal(f.recorded.files.length,0);assert.equal(f.recorded.orders.length,0);
});
test('invalid file size is rejected before any draft/item write',async()=>{
 for(const size of [0,-1,NaN,25*1024*1024+1]){
  const f=fixture();f.state.customerPendingFiles[1].file.size=size;await f.add();
  assert.equal(f.recorded.requests.length,0);assert.equal(f.state.customerDraft.writeUncertain,undefined);
 }
});
test('successful item and all attachments clear the fence and can submit once',async()=>{
 const f=fixture();await f.add();assert.equal(f.state.customerDraft.items.length,1);
 assert.equal(f.state.customerDraft.writeUncertain,false);assert.equal(f.controls.customerSubmitDraftBtn.disabled,false);
 await f.submit();await f.submit();assert.equal(f.recorded.orders.length,1);
 assert.equal(f.state.customerDraft.orderId,'ORDER-A');assert.equal(f.controls.customerSubmitDraftBtn.disabled,true);
});
test('lost official submit response cannot issue a second official request',async()=>{
 const f=fixture({loseSubmit:true});await f.add();await f.submit();await f.submit();
 assert.equal(f.recorded.orders.length,1);assert.equal(f.state.customerDraft.writeUncertain,true);
});
test('same-name replacement customer cannot receive the old orders response',async()=>{
 const orderRead=deferred(),f=fixture({orderRead});f.state.customer.name='Same Name';const pending=f.load();f.swap();f.state.customer.name='Same Name';
 f.state.customerOrders=[{orderId:'ORDER-B'}];const oldStatus=f.controls.customerOrdersStatus.textContent;
 orderRead.resolve({success:true,orders:[{orderId:'SECRET-A'}]});await pending;
 assert.equal(f.state.customerOrders[0].orderId,'ORDER-B');assert.equal(f.recorded.renders,0);
 assert.equal(f.controls.customerOrdersStatus.textContent,oldStatus);
});
test('late error cannot overwrite the next customer status',async()=>{
 const orderRead=deferred(),f=fixture({orderRead});const pending=f.load();f.swap();f.controls.customerOrdersStatus.textContent='B';
 orderRead.reject(Error('PRIVATE OLD ERROR'));await pending;assert.equal(f.controls.customerOrdersStatus.textContent,'B');
});
test('relogin with the same code rejects the old customer object response',async()=>{
 const orderRead=deferred(),f=fixture({orderRead});const pending=f.load();f.state.customer={customerCode:'A',token:'TEST-A'};
 orderRead.resolve({success:true,orders:[{orderId:'STALE'}]});await pending;assert.equal(f.state.customerOrders.length,0);
});
test('switch during item creation sends no attachment using the next customer credential',async()=>{
 const itemWait=deferred(),f=fixture({itemWait});const pending=f.add();
 await new Promise(setImmediate);f.swap();itemWait.resolve({success:true,itemId:'ITEM-1'});await pending;
 assert.equal(f.recorded.files.length,0);assert.equal(f.state.customerDraft.items.length,0);
 assert.equal(f.state.customerDraftBusy,true,'old finally cannot unlock B operation');assert.equal(f.recorded.errors.length,0);
});
test('switch during file reading prevents POST with new credentials',async()=>{
 const read=deferred(),f=fixture({fileRead:()=>read.promise});const pending=f.add();
 await new Promise(setImmediate);f.swap();read.resolve('dGVzdA==');await pending;
 assert.equal(f.recorded.files.length,0);assert.equal(f.state.customerDraft.items.length,0);
});
test('late draft-create response cannot attach old draft id to the next customer',async()=>{
 const draftCreate=deferred(),f=fixture({draftCreate});f.state.customerDraft.draftId='';const old=f.state.customerDraft;
 const pending=f.create();f.swap();draftCreate.resolve({success:true,draftId:'OLD-DRAFT'});
 await assert.rejects(pending,/جلسة/);assert.equal(old.draftId,'');assert.equal(f.state.customerDraft.draftId,'DRAFT-B');
});
test('late official response cannot mark the next customer draft submitted',async()=>{
 const submitWait=deferred(),f=fixture({submitWait});f.state.customerPendingFiles=[];await f.add();
 const pending=f.submit();f.swap();submitWait.resolve({success:true,orderId:'OLD-ORDER'});await pending;
 assert.equal(f.state.customerDraft.submitted,undefined);assert.equal(f.state.customerDraftBusy,true);
 assert.equal(f.recorded.requests.filter(x=>x.action==='getCustomerOrders').length,0);
});
