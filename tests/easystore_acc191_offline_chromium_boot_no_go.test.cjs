#!/usr/bin/env node
/* ACC191: REAL headless Chromium renderer, MOCK session, localhost-only transport.
 * This is NOT a production browser test and does not authenticate a staff member.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

(async()=>{
 const root=path.resolve(process.argv[2]||'isolated-easystore-source');
 const pin='373d06381594e3ab32a55009fcc74907b1c37c9c';
 assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),pin);
 const moduleRoot=process.env.ACC191_PLAYWRIGHT_ROOT;
 assert.ok(moduleRoot,'offline runner must provide pinned ephemeral browser package path');
 const {chromium}=require(path.join(moduleRoot,'node_modules','playwright'));
 let served=0;
 const server=http.createServer((req,res)=>{
   const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
   const requested=path.resolve(root,'.'+pathname);
   if(requested!==root&&!requested.startsWith(root+path.sep)){
     res.writeHead(403);res.end();return;
   }
   const file=requested===root?path.join(root,'index.html'):requested;
   if(!fs.existsSync(file)||!fs.statSync(file).isFile()){
     res.writeHead(404);res.end();return;
   }
   const contentType=file.endsWith('.js')?'application/javascript; charset=utf-8':
     file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8';
   served++;
   res.writeHead(200,{'Content-Type':contentType,'Cache-Control':'no-store'});
   fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
   const port=server.address().port;
   let remoteRequestsBlocked=0;
   let permittedExternal=0;
   let simulatedOpenerResponses=0;
   browser=await chromium.launch({
     headless:true,
     args:['--no-sandbox','--disable-background-networking',
       '--host-resolver-rules=MAP * 0.0.0.0, EXCLUDE 127.0.0.1']
   });
   const context=await browser.newContext({
     serviceWorkers:'block',
     permissions:[],
     acceptDownloads:false,
   });
   await context.route('**/*',route=>{
     const u=new URL(route.request().url());
     if(u.protocol==='http:'&&u.hostname==='127.0.0.1'&&u.port===String(port)){
       return route.continue();
     }
     // A locally fulfilled *mock* allowed origin, never a network request.
     if(u.origin==='https://trendos-ui.trendmall-contact.workers.dev'&&
        u.pathname==='/acc191-offline-mock-opener'){
       simulatedOpenerResponses++;
       return route.fulfill({
         status:200,contentType:'text/html',
         body:'<!doctype html><html><body><button id="open">Open fake SSO popup</button>'+
           '<script>document.getElementById("open").onclick=function(){'+
           'window.__acc191Child=window.open("http://127.0.0.1:'+port+
           '/?from=trendos&employeeSSO=1&ssoNonce=ACC191-NONPRODUCTION-NONCE","acc191FakePopup");'+
           '};</script></body></html>'
       });
     }
     remoteRequestsBlocked++;
     return route.abort('blockedbyclient');
   });
   const page=await context.newPage();
   const response=await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded',timeout:30000});
   assert.equal(response.status(),200);
   await page.waitForFunction(()=>window.EASYSTORE_ACCOUNTING_D1_WRITE_MODE==='OFF',null,{timeout:20000});
   const before=await page.evaluate(()=>({
     version:window.EASYSTORE_VERSION,
     mode:window.EASYSTORE_ACCOUNTING_D1_WRITE_MODE,
     writes:window.EASYSTORE_ACCOUNTING_D1_WRITES,
     readonly:window.EASYSTORE_ACCOUNTING_D1_READONLY,
     canary:window.EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS,
     token:sessionStorage.getItem('EASYSTORE_SESSION_V1922'),
     opener:!!window.opener
   }));
   assert.equal(before.version,'ES47 V1922 Unified Safe Build');
   assert.equal(before.mode,'OFF');
   assert.equal(before.writes,false);
   assert.equal(before.readonly,true);
   assert.equal(JSON.stringify(before.canary),'[]');
   assert.equal(before.token,null,'no real/forged SSO session may be assumed');
   assert.equal(before.opener,false,'browser has no real TrendOS opener');
   await page.evaluate(()=>{
     window.postMessage({
       type:'TRENDOS_EMPLOYEE_SSO_V1',
       user:{username:'SYNTHETIC_FAKE_OPERATOR',token:'SYNTHETIC_NEVER_A_REAL_TOKEN'},
       nonce:'FORGED_NONCE',
       issuedAt:Date.now()
     },'*');
   });
   await page.waitForTimeout(250);
   const after=await page.evaluate(()=>({
     token:sessionStorage.getItem('EASYSTORE_SESSION_V1922'),
     mode:window.EASYSTORE_ACCOUNTING_D1_WRITE_MODE,
     writes:window.EASYSTORE_ACCOUNTING_D1_WRITES,
   }));
   assert.equal(after.token,null,'without a verified opener, spoofed SSO cannot create trusted session');
   assert.equal(after.mode,'OFF');
   assert.equal(after.writes,false);
   assert.ok(served>=3,'browser must load pinned index and its script/config resources');
   // A real browser popup but a synthetic, locally fulfilled TrendOS opener.
   // The browser still checks real window.opener, origin, nonce, and freshness.
   await context.addInitScript(()=>{
     if(location.search.includes('employeeSSO=1')){
       sessionStorage.setItem('EASYSTORE_SESSION_V1922',
         JSON.stringify({user:{username:'STALE_FAKE',token:'STALE_SYNTHETIC_TOKEN'},
           params:{token:'STALE_SYNTHETIC_TOKEN'}}));
     }
   });
   const opener=await context.newPage();
   const openerResponse=await opener.goto(
     'https://trendos-ui.trendmall-contact.workers.dev/acc191-offline-mock-opener',
     {waitUntil:'domcontentloaded',timeout:20000});
   assert.equal(openerResponse.status(),200);
   const popupPromise=opener.waitForEvent('popup');
   await opener.locator('#open').click();
   const popup=await popupPromise;
   await popup.waitForLoadState('domcontentloaded');
   const testPopup=async()=>popup.evaluate(()=>({
     token:sessionStorage.getItem('EASYSTORE_SESSION_V1922'),
     opener:!!window.opener,
     mode:window.EASYSTORE_ACCOUNTING_D1_WRITE_MODE,
     actions:window.EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS
   }));
   const virgin=await testPopup();
   assert.equal(virgin.token,null,
     'opening a fresh nonce-bound fake popup must clear stale sessionStorage');
   assert.equal(virgin.opener,true);
   assert.equal(virgin.mode,'OFF');
   const popupOrigin='http://127.0.0.1:'+port;
   async function fakeMessage(nonce,issuedAt,token){
     await opener.evaluate(({nonce,issuedAt,token,target})=>{
       window.__acc191Child.postMessage({
         type:'TRENDOS_EMPLOYEE_SSO_V1',nonce,issuedAt,
         user:{username:'ACC191_FAKE_EMPLOYEE',name:'Synthetic local operator',
               mode:'print',token}
       },target);
     },{nonce,issuedAt,token,target:popupOrigin});
   }
   const validNonce='ACC191-NONPRODUCTION-NONCE';
   await fakeMessage('WRONG_NONCE',Date.now(),'WRONG_FAKE_TOKEN');
   await popup.waitForTimeout(70);
   assert.equal((await testPopup()).token,null,'wrong nonce denied');
   await fakeMessage(validNonce,Date.now()-31000,'STALE_FAKE_TOKEN');
   await popup.waitForTimeout(70);
   assert.equal((await testPopup()).token,null,'stale 31s handoff denied');
   await fakeMessage(validNonce,Date.now()+31000,'FUTURE_FAKE_TOKEN');
   await popup.waitForTimeout(70);
   assert.equal((await testPopup()).token,null,'future 31s handoff denied');
   await fakeMessage(validNonce,Date.now(),'');
   await popup.waitForTimeout(70);
   assert.equal((await testPopup()).token,null,'missing token denied');
   await fakeMessage(validNonce,Date.now(),'ACC191_VALID_SYNTHETIC_TOKEN');
   await popup.waitForFunction(()=>{
     const session=JSON.parse(sessionStorage.getItem('EASYSTORE_SESSION_V1922')||'{}');
     return session.user?.token==='ACC191_VALID_SYNTHETIC_TOKEN';
   },null,{timeout:5000});
   const accepted=JSON.parse((await testPopup()).token);
   assert.equal(accepted.user.token,'ACC191_VALID_SYNTHETIC_TOKEN');
   await fakeMessage(validNonce,Date.now(),'REPLAY_DIFFERENT_FAKE_TOKEN');
   await popup.waitForTimeout(100);
   assert.equal(JSON.parse((await testPopup()).token).user.token,
     'ACC191_VALID_SYNTHETIC_TOKEN','single-use nonce rejects replay');
   const post=await testPopup();
   assert.equal(post.mode,'OFF');
   assert.equal(JSON.stringify(post.actions),'[]');
   assert.equal(simulatedOpenerResponses,1,'only one local mock origin document');
   assert.equal(permittedExternal,0);
   console.log('ACC191_CHROMIUM_ACTUAL_RENDER_PINNED_EASYSTORE_SOURCE=PASS');
   console.log('ACC191_CHROMIUM_STALE_SESSION_WRONG_NONCE_EXPIRED_FUTURE_AND_MISSING_TOKEN=DENIED');
   console.log('ACC191_CHROMIUM_LOCAL_MOCK_ORIGIN_OPENER_SINGLE_USE_NONCE=PASS');
   console.log('ACC191_CHROMIUM_FAKE_SSO_WITHOUT_OPENER_DENIED=PASS');
   console.log('ACC191_CHROMIUM_EXTERNAL_NETWORK_PERMITTED=ZERO');
   console.log('ACC191_REAL_DEPLOYED_PAGES_AND_EMPLOYEE_SSO=NOT_TESTED');
   console.log('ACC191_FINANCE_RELEASE=NO_GO');
   await context.close();
 }finally{
   if(browser)await browser.close();
   await new Promise(resolve=>server.close(resolve));
 }
})().catch(err=>{console.error('ACC191_OFFLINE_CHROMIUM=FAIL',err);process.exitCode=1;});
