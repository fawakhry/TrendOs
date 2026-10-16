// BOOK20-R2: isolated browser helper regression; fake blob/network only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const fileId='OCF-00000000-0000-4000-8000-000000000001';
function sourceBetween(begin,end){
  const a=source.indexOf(begin),b=source.indexOf(end,a+begin.length);
  assert.ok(a>=0&&b>a,'UI helper not found: '+begin);
  return source.slice(a,b);
}
function text(v){return String(v==null?'':v).trim();}
function safeHtml(v){return text(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}

test('protected R2 attachment card contains no public/direct URL before authorization',()=>{
  const ctx={text,escapeHtml:safeHtml,attachmentName:()=> 'synthetic.pdf',isImageAttachment:()=>false,fileKindIcon:()=> 'FILE'};
  const fn=vm.runInNewContext(sourceBetween('  function renderOrderAttachmentCard(file) {','  function renderCustomerDraft()'),ctx);
  // vm.runInNewContext returns the completion value of the definition (undefined).
  const render=vm.runInNewContext(sourceBetween('  function renderOrderAttachmentCard(file) {','  function renderCustomerDraft()')+'\nrenderOrderAttachmentCard',ctx);
  const html=render({fileId,fileName:'synthetic.pdf',url:'https://public.unit.invalid/private/secret'});
  assert.match(html,/data-secure-order-file/);
  assert.doesNotMatch(html,/public\.unit|href=|src=|token=|Authorization/);
});

function helper({ok=true}={}){
  const calls=[],revoked=[],urls=[],user={username:'synthetic-employee',token:'synthetic-test-token'};
  const state={user,orderConversationRow:{orderId:'ORDER-FAKE'},orderConversationBlobUrls:[]};
  const info={textContent:''},img={src:''};
  const element={
    isConnected:true,
    href:undefined,
    target:'',
    rel:'',
    getAttribute(name){return name==='data-secure-order-file'?fileId:'';},
    querySelector(name){return name==='img'?img:name==='span'?info:null;},
    removeAttribute(name){if(name==='href')delete this.href;}
  };
  const body={querySelectorAll(){return [element];}};
  const urlFake={
    createObjectURL(){urls.push('blob:unit.invalid/fixture');return urls.at(-1);},
    revokeObjectURL(url){revoked.push(url);}
  };
  const sandbox={
    state, window:{MATBAGY_EMPLOYEE_API_URL:'https://unit.invalid/'},
    text, URL:urlFake, Array, Promise,encodeURIComponent,
    fetch:async(url,options)=>{
      calls.push({url,options});
      return new Response(ok?new Uint8Array([1,2]):'Forbidden',{status:ok?200:403});
    },
    Response,
  };
  const helpers=sourceBetween('  function clearProtectedOrderConversationFileUrls() {','  function closeOrderConversationModal()');
  vm.runInNewContext(helpers+'\nthis.testHydrate=hydrateProtectedOrderConversationFiles;this.testClear=clearProtectedOrderConversationFileUrls',sandbox);
  return {state,body,element,img,info,calls,urls,revoked,hydrate:sandbox.testHydrate,clear:sandbox.testClear};
}

test('authorized UI fetch uses headers, not token in URL, then revocable local Blob URL',async()=>{
  const h=helper();
  await h.hydrate(h.body);
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].url,'https://unit.invalid/v1/employee/comms/file/'+fileId);
  assert.equal(h.calls[0].options.headers.Authorization,'Bearer synthetic-test-token');
  assert.equal(h.calls[0].options.headers['X-Employee-Username'],'synthetic-employee');
  assert.doesNotMatch(h.calls[0].url,/synthetic-test-token|username=/);
  assert.equal(h.element.href,'blob:unit.invalid/fixture');
  assert.equal(h.img.src,'blob:unit.invalid/fixture');
  h.clear();
  assert.deepEqual(h.revoked,['blob:unit.invalid/fixture']);
});

test('unauthorized UI response never generates a local URL',async()=>{
  const h=helper({ok:false});
  await h.hydrate(h.body);
  assert.equal(h.calls.length,1);
  assert.equal(h.urls.length,0);
  assert.equal(h.element.href,undefined);
  assert.match(h.info.textContent,/تعذر فتح الملف/);
});
