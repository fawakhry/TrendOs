'use strict';
/* FULL original TrendOS customer index.html + config.js + app.js in REAL Chromium.
 * Read-only test of existing UI; the ONLY config override is a Playwright
 * response-body append to enable Native in this disposable browser context.
 * Original repository frontend API URL/employee/T12/accounting remain intact.
 * Browser permits loopback local Worker and local static assets ONLY.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require(process.env.CUSTOMER_STAGE_LOCAL_PLAYWRIGHT_MODULE);

const frontend = 'http://127.0.0.1:8000';
const worker = 'http://127.0.0.1:' + Number(process.env.CUSTOMER_STAGE_LOCAL_PORT);
const pinned = 'https://trendos-d1-api.trendmall-contact.workers.dev';
const code = 'LOCAL-FIXTURE-PC-C1';
const password = 'LOCAL_ONLY_SAMPLE_PASSWORD_2026_NOT_REAL!';
const originals = [
  'index.html', 'config.js', 'app.js', 'browser-api-transport-v1.js',
  'customer-native-browser-transport-v0.js', 'employee-api-dispatcher-v1.js'
];
if (process.env.CUSTOMER_STAGE_LOCAL_E2E !== '1' ||
    !/^http:\/\/127\.0\.0\.1:[1-9]\d{3,4}$/.test(worker) ||
    !fs.readFileSync('config.js','utf8').match(/TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED\s*=\s*false/))
  throw new Error('Refuse full portal browser test outside explicitly isolated OFF/loopback fixture');

const expectedAncillary = [
  'getPlatformAds', 'getMarketplace', 'getWhiteLabelSettings'
];
async function main() {
  const browser = await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try {
    const context = await browser.newContext({serviceWorkers:'block'});
    const remoteAttempts = [], pageErrors = [], network = [], missingLocal = [];
    try {
      await context.route('**/*', async route => {
        const request = route.request();
        const url = new URL(request.url());
        if(url.origin===frontend && url.pathname==='/real-portal/config.js') {
          const response = await route.fetch();
          if(response.status()!==200) throw new Error('Original config.js was not served');
          const originalConfig = await response.text();
          assert.equal(originalConfig, fs.readFileSync('config.js','utf8'),
            'Full UI fixture must load original source config verbatim before local override');
          // TEST-ONLY opt-in; no Git source flag or API origin is changed.
          return route.fulfill({response,body:originalConfig+
            '\nwindow.TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED = true; // ISOLATED PLAYWRIGHT ONLY\n'});
        }
        if(url.origin===frontend) return route.continue();
        if(url.origin===worker) {
          const hs={...request.headers()};
          if(request.method()==='POST' && url.pathname==='/v1/customer/native/login')
            hs['CF-Connecting-IP']='192.0.2.17'; // LOCAL synthetic ingress only
          network.push({method:request.method(),path:url.pathname});
          return route.continue({headers:hs});
        }
        remoteAttempts.push(request.url()); // BLOCK, do not contact any remote host.
        return route.abort('blockedbyclient');
      });
      await context.addInitScript(({apiOrigin,localWorker}) => {
        const audit={legacy:[],otherFetch:[],actions:[]};
        Object.defineProperty(window,'__trendosOriginalPortalAudit',{value:audit,configurable:false});
        const rawFetch=window.fetch.bind(window);
        window.fetch=function(input,opts) {
          const original=typeof input==='string'?input:(input&&input.url)||String(input);
          const url=new URL(original,location.href);
          if(url.origin===apiOrigin && url.pathname.startsWith('/v1/customer/native/')){
            if(!['/v1/customer/native/login','/v1/customer/native/orders',
                 '/v1/customer/native/logout',
                 '/v1/customer/native/public-content'].includes(url.pathname))
              throw new Error('FULL_PORTAL_NATIVE_ROUTE_NOT_QUALIFIED');
            return rawFetch(localWorker+url.pathname+url.search,opts);
          }
          if(url.origin===apiOrigin && url.pathname==='/v1/legacy-api'){
            let action='UNPARSEABLE';
            try {action=JSON.parse((opts&&opts.body)||'{}').action||'MISSING_ACTION';} catch {}
            audit.legacy.push(action);
            return Promise.reject(new Error('LOCAL_AUDIT_BLOCKED_LEGACY_API'));
          }
          audit.otherFetch.push(url.href);
          return Promise.reject(new Error('LOCAL_AUDIT_BLOCKED_OTHER_FETCH'));
        };
      },{apiOrigin:pinned,localWorker:worker});

      const page=await context.newPage();
      page.on('pageerror',error=>pageErrors.push(error.message));
      page.on('response',response=>{
        if(response.url().startsWith(frontend+'/real-portal/') && response.status()===404)
          missingLocal.push(response.url());
      });
      await page.goto(frontend+'/real-portal/',{waitUntil:'load',timeout:25000});
      assert.match(await page.title(),/Trend Mall/);
      for(const file of originals) {
        const response=await page.evaluate(async file=>{
          const resource=performance.getEntriesByType('resource').find(x=>
            x.name.includes('/real-portal/'+file));
          return !!resource;
        },file);
        if(file!=='index.html') assert.ok(response,'Original customer asset not loaded: '+file);
      }
      await page.waitForFunction(()=>!document.querySelector('#entryView').classList.contains('hidden'),
        null,{timeout:18000});
      // TEST-ONLY logical action audit at ORIGINAL app.js dispatch boundary.
      // The employee dispatcher can fail a customer content call before fetch;
      // counting HTTP legacy-api calls alone would incorrectly imply success.
      await page.evaluate(()=>{
        const original=window.trendosSecureApiV1922;
        if(typeof original!=='function') throw new Error('ORIGINAL_PORTAL_DISPATCH_MISSING');
        window.trendosSecureApiV1922=async function(action,params){
          const entry={action,status:'pending',code:''};
          window.__trendosOriginalPortalAudit.actions.push(entry);
          try{
            const result=await original.apply(this,arguments);
            entry.status=result&&result.success===true?'success':'unsuccessful';
            entry.code=result&&result.code||'';
            return result;
          } catch(error){
            entry.status='rejected';
            entry.code=error&&error.code||'UNCLASSIFIED';
            throw error;
          }
        };
      });
      assert.equal(await page.evaluate(
        ()=>window.MATBAGY_EDGE_ORDERS_API_URL),pinned,
        'Production API origin must not be rewritten in the original source config');
      assert.equal(await page.evaluate(
        ()=>window.TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED),true);
      await page.locator('#customerEntryBtn').click();
      await page.waitForFunction(()=>!document.querySelector('#customerLoginView').classList.contains('hidden'));
      await page.locator('#customerCode').fill(code);
      await page.locator('#customerPassword').fill(password);
      await page.locator('#customerLoginBtn').click();
      await page.waitForFunction(()=>!document.querySelector('#customerView').classList.contains('hidden'),
        null,{timeout:25000});
      await page.waitForFunction(()=>document.querySelector('#customerOrdersStatus').textContent.includes('تم تحميل 1'),
        null,{timeout:25000});
      await page.locator('#customerShowOrdersBtn').click();
      await page.waitForFunction(()=>!document.querySelector('#customerOrdersPanel').classList.contains('hidden'));
      const ownOrders=await page.locator('#customerOrdersList').textContent();
      assert.ok(ownOrders.includes('LOCAL-ORDER-LOCAL-C1'),'Actual original UI did not render C1 order');
      assert.ok(!ownOrders.includes('LOCAL-ORDER-LOCAL-C2'),'Original UI rendered another customer order');
      assert.ok(!ownOrders.includes('LOCAL_FAKE_PHONE'),'Original UI leaked private phone');
      // Calls may route through other original employee/public adapters;
      // audit the observed list directly, rather than waiting indefinitely.
      await page.waitForTimeout(800);
      const diagnostic=await page.evaluate(()=>({
        legacy:window.__trendosOriginalPortalAudit.legacy.slice(),
        others:window.__trendosOriginalPortalAudit.otherFetch.slice(),
        actions:window.__trendosOriginalPortalAudit.actions.map(x=>({...x}))
      }));
      console.log('FULL_ORIGINAL_UI_NETWORK_DIAGNOSTIC='+JSON.stringify(diagnostic));
      const old=diagnostic.legacy;
      const ancillary=diagnostic.actions.filter(x=>expectedAncillary.includes(x.action));
      assert.deepEqual(ancillary.map(x=>x.action).sort(),expectedAncillary.slice().sort(),
        'Three remaining nonqualified public UI content actions must be explicitly audited');
      assert.ok(ancillary.every(x=>x.status!=='success'),
        'Do not claim customer public content parity when Stage Native HTTP handlers are unavailable');
      assert.match(await page.locator('#customerMarketplaceBoard').textContent(),/غير متاحة مؤقتًا/,
        'Unavailable Native customer marketplace must not show an indefinite loading spinner');
      await page.waitForFunction(()=>document.querySelector('#customerFranchiseBranches').textContent.includes('LOCAL PUBLIC BRANCH'),null,{timeout:10000});
      const publicBranches=await page.locator('#customerFranchiseBranches').textContent();
      assert.ok(publicBranches.includes('LOCAL PUBLIC BRANCH') &&
                !publicBranches.includes('SECRET BRANCH') &&
                !publicBranches.includes('PRIVATE_'),
        'Original customer franchise UI must show only permitted public D1 fields');
      assert.ok(network.filter(x=>x.path==='/v1/customer/native/public-content').length===2,
        'Both customer-only public D1 read routes must be used in real Chromium');
      const sectionResult=await page.evaluate(()=>window.trendosCustomerNativeBrowserDispatchV0('getPlatformSections',{},null));
      assert.equal(sectionResult.sections.length,1);
      assert.equal(sectionResult.sections[0].name,'LOCAL SAFE SECTION');
      assert.ok(!JSON.stringify(sectionResult).includes('PRIVATE_'),
        'Public D1 section response leaked an employee-only field');
      assert.ok(diagnostic.actions.some(x=>x.action==='customerLogin'&&x.status==='success'));
      assert.ok(diagnostic.actions.some(x=>x.action==='getCustomerOrders'&&x.status==='success'));
      assert.deepEqual(old,[],
        'Full customer native-mode startup must not dispatch any HTTP legacy Google bridge');
      const fetched=await page.evaluate(()=>window.__trendosOriginalPortalAudit.otherFetch.slice());
      assert.deepEqual(fetched,[],'Full UI attempted nonqualified raw fetch');
      assert.equal(await page.locator('#customerPassword').inputValue(),'',
        'Original UI must clear raw customer password after login');
      // Full original customer new-order UX must fail closed: do NOT create
      // a second T12 writer or send fake customer data to legacy Google.
      await page.locator('#customerGoHomeBtn').click();
      await page.locator('#customerShowNewOrderBtn').click();
      await page.locator('#customerOrderItem').fill('LOCAL_SYNTHETIC_UNSENT_PRINT_JOB');
      await page.locator('#customerAddDraftItemBtn').click();
      await page.waitForFunction(()=>window.__trendosOriginalPortalAudit.actions.some(x=>
        x.action==='createCustomerDraft' && x.status==='rejected'),null,{timeout:15000});
      const blockedDraft=await page.evaluate(()=>
        window.__trendosOriginalPortalAudit.actions.find(x=>x.action==='createCustomerDraft'));
      assert.equal(blockedDraft.code,'CUSTOMER_NATIVE_ACTION_NOT_WIRED');
      assert.match(await page.locator('#customerOrderMsg').textContent(),/لم تُفعّل بعد/,
        'Original customer draft UI must explain failed-closed source-only feature');
      assert.ok(!network.some(x=>/\/v1\/customer\/native\/(draft|submit|upload)/.test(x.path)),
        'No unqualified customer write was sent to Worker');
      await page.locator('#customerLogoutBtn').click();
      await page.waitForFunction(()=>!document.querySelector('#entryView').classList.contains('hidden'),
        null,{timeout:18000});
      await assert.rejects(async()=>{
        const outcome=await page.evaluate(async()=>{
          try{
            await window.trendosCustomerNativeBrowserDispatchV0('getCustomerOrders',{},()=>{});
            return 'UNEXPECTED_SUCCESS';
          }catch(e){return e.code;}
        });
        if(outcome==='CUSTOMER_NATIVE_SESSION_NOT_AVAILABLE') throw new Error(outcome);
      },/CUSTOMER_NATIVE_SESSION_NOT_AVAILABLE/);
      const stored=await page.evaluate(()=>JSON.stringify({
        local:Object.entries(localStorage),session:Object.entries(sessionStorage)
      }));
      assert.ok(!stored.includes(password) && !stored.includes('NATIVE_SESSION_IN_MEMORY') &&
        !stored.includes('LOCAL_FAKE_GOOGLE_TOKEN'),'Native credentials persisted to browser storage');
      assert.ok(network.some(x=>x.path==='/v1/customer/native/login') &&
        network.some(x=>x.path==='/v1/customer/native/orders') &&
        network.some(x=>x.path==='/v1/customer/native/logout'));
      assert.ok(remoteAttempts.every(u=>/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)),
        'Unqualified remote resource in full UI: '+JSON.stringify(remoteAttempts));
      assert.deepEqual(missingLocal,[],'Missing original local script/css assets');
      assert.deepEqual(pageErrors,[],'Original full UI JavaScript runtime errors');
      console.log('PASS: original full TrendOS index.html + app.js real Chromium login → real local Worker/D1 own orders → logout and replay denied');
      console.log('FULL_CUSTOMER_UI_UNWIRED_CONTENT_ACTIONS='+JSON.stringify(ancillary));
      console.log('PASS: original customer Native READONLY sections and public branches sourced from isolated D1, no employee session and no private fields');
      console.log('FULL_CUSTOMER_UI_ACTION_AUDIT='+JSON.stringify(diagnostic.actions));
      console.log('FULL_UI_LEGACY_HTTP_CALLS='+old.length+'; REMOTE_ACTUAL_CONNECTIONS=0; BLOCKED_REMOTE_FONT_ATTEMPTS='+remoteAttempts.length);
      console.log('FULL_PRODUCTION_CUSTOMER_GOOGLE_RETIRED=0/9; REAL_STAGE_HTTPS_TESTED=NO; NO_DEPLOY=YES');
      await page.close();
    } finally {await context.close();}
  } finally {await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
