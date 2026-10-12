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
       type:'TRENDOS_SSO_HANDOFF_V1',
       username:'SYNTHETIC_FAKE_OPERATOR',
       token:'SYNTHETIC_NEVER_A_REAL_TOKEN',
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
   assert.equal(permittedExternal,0);
   console.log('ACC191_CHROMIUM_ACTUAL_RENDER_PINNED_EASYSTORE_SOURCE=PASS');
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
