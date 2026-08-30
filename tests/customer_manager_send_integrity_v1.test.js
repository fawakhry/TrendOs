const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=process.argv[2]||process.cwd();
const source=fs.readFileSync(root+'/customer-manager-send-integrity-v1.js','utf8');
let store={},calls=[];
const sessionStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
const window={crypto:{randomUUID:()=> 'uuid-1'},trendosSecureApiV1922:async function(action,p){calls.push({action,p:Object.assign({},p)});if(p.text==='fail')throw Error('network');return{success:true};}};
const ctx={window,sessionStorage,Date,Math,JSON,Object,String,setInterval(fn){fn();return 1;},clearInterval(){},console};
vm.createContext(ctx);vm.runInContext(source,ctx,{filename:'customer-manager-send-integrity-v1.js'});
(async()=>{
  let out=await window.trendosSecureApiV1922('customerManagerV1',{op:'send',phone:'010',text:'hello'});assert.equal(out.success,true);assert.equal(calls.length,1);assert.equal(calls[0].p.clientRequestId,'cm_uuid-1');assert.equal(sessionStorage.getItem('trendosCmPendingSendV1'),null);
  window.crypto.randomUUID=()=> 'uuid-2';let failed=false;try{await window.trendosSecureApiV1922('customerManagerV1',{op:'send',phone:'010',text:'fail'});}catch(e){failed=true;}assert.equal(failed,true);let pending=JSON.parse(sessionStorage.getItem('trendosCmPendingSendV1'));assert.equal(pending.requestId,'cm_uuid-2');
  try{await window.trendosSecureApiV1922('customerManagerV1',{op:'send',phone:'010',text:'fail'});}catch(e){}assert.equal(calls[calls.length-1].p.clientRequestId,'cm_uuid-2');
  assert.ok(source.includes('sessionStorage'));assert.ok(source.includes('clientRequestId'));assert.ok(source.includes("action==='customerManagerV1'"));
  console.log('Customer Manager send integrity frontend tests: OK');
})().catch(e=>{console.error(e);process.exit(1);});
