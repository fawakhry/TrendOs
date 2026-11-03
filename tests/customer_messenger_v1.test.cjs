'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),api=require('../customer-messenger-v1.js'),source=fs.readFileSync(path.join(root,'customer-messenger-v1.js'),'utf8');
test('OFF and missing flag neither read nor move DOM; direct app hooks stay inert',()=>{
 for(const flag of [undefined,false]){
  const window={TRENDOS_CUSTOMER_CHAT_V1_ENABLED:flag,document:{getElementById(){throw Error('OFF read DOM');}}};
  vm.runInNewContext(source,{window,module:{exports:{}}});const presenter=window.TrendOSCustomerMessenger;
  assert.equal(presenter.mount(window.document),false);assert.equal(presenter.renderOrders([{orderId:'OTHER'}]),false);assert.equal(presenter.renderDraft({draft:{items:[]}}),false);
 }
});
test('messages retain typed Arabic, reject oversize notes, never create an order',()=>{
 assert.equal(api.appendNotes('بدون تغيير ملامح',' مج 20×9 '),'بدون تغيير ملامح\nمج 20×9');
 assert.equal(api.appendNotes('نص سابق','   '),'نص سابق');assert.throws(()=>api.appendNotes('x'.repeat(1200),'y'),/اختصر/);
 assert.equal(api.sourceOnly,true);assert.equal(api.productionEnabled,false);
});
test('saved summary keeps exact product and garment dimensions while hiding internal print policy text',()=>{
 const note='[مواصفات مطبعجي]\nالمنتج: تيشيرت\nالمقاس النهائي: 20 × 9 سم\nمقاس التيشيرت: L\nحفظ الأصل: LONG_INTERNAL_RULE\n[نهاية المواصفات]\nتعليمات العميل: نص';
 assert.equal(api.recipeSummary(note),'المقاس النهائي: 20 × 9 سم\nمقاس التيشيرت: L');assert.equal(api.recipeSummary('نص عميل عادي'),'');assert.equal(api.recipeSummary('[مواصفات مطبعجي]\nالمقاس النهائي: 20 × 9'),'');
});
test('media preview requires an original local blob; every remote or disguised URL rejected',()=>{
 for(const previewUrl of ['https://drive.google.com/file/d/x','https://example.test/photo.png','data:image/png;base64,AAAA','javascript:alert(1)','//drive.google.com/x'])assert.equal(api.safeLocalPreview({localPreview:true,previewUrl,mimeType:'image/png'}),'');
 assert.equal(api.safeLocalPreview({localPreview:true,previewUrl:'blob:http://127.0.0.1/test',mimeType:'image/png'}),'blob:http://127.0.0.1/test');
 assert.equal(api.safeLocalPreview({localPreview:false,previewUrl:'blob:fake',mimeType:'image/png'}),'');
 assert.equal(api.safeLocalPreview({localPreview:true,previewUrl:'blob:fake',mimeType:'text/html'}),'');
});
test('orders passed to presenter exclude tokens/customer identity and keep delivery after filtering',()=>{
 const order=api.publicOrder({orderId:'C1-1',itemName:'مج',status:'مراجعة',deliveryText:'غدًا',customerCode:'PRIVATE',token:'SECRET',fileUrl:'https://example.test/private'});
 assert.deepEqual(Object.keys(order),['orderId','itemName','department','status','notes','delivery']);assert.equal(order.delivery,'غدًا');assert.equal(api.publicOrder(order).delivery,'غدًا');assert.ok(!JSON.stringify(order).includes('SECRET'));
});
test('original pending renderer displays text-only messages in enabled chat, preserves legacy OFF behavior',()=>{
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8'),start=app.indexOf('function refreshCustomerPendingPreview()'),end=app.indexOf('function ensureCustomerDraftStarted()',start),code=app.slice(start,end);let renders=0,active=true;
 const context={state:{customerPendingFiles:[]},customerMessengerApi:()=>active?{}:null,renderCustomerDraft(){renders++;}};
 const update=vm.runInNewContext('('+code+')',context);update();assert.equal(renders,1);active=false;update();assert.equal(renders,1);context.state.customerPendingFiles=[{}];update();assert.equal(renders,2);
});
test('presentation owns no network/auth/storage/official submit and keeps existing form/writer identity',()=>{
 assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage/);
 assert.doesNotMatch(source,/api\(["']|apiPost\(|submitCustomerDraft\(|DEMO-C1|Demo-only|\.cloneNode\(/);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.match(html,/customer-messenger-v1\.js/);assert.match(app,/TRENDOS_CUSTOMER_CHAT_V1_ENABLED === true && presenter/);
 assert.match(app,/messenger\.renderDraft\(\{draft: draft/);assert.match(app,/messenger\.renderOrders\(rows\.map/);
 const config=fs.readFileSync(path.join(root,'config.js'),'utf8');assert.doesNotMatch(config,/TRENDOS_CUSTOMER_CHAT_V1_ENABLED\s*=\s*true/);
});
