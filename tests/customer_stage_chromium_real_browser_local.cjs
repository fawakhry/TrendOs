'use strict';
/* ACTUAL Chromium browser engine ↔ real LOCAL workerd + D1 + SQLite DO.
 * Uses original unchanged customer-native-browser-transport-v0.js.
 * No remote Cloudflare/Google/production requests. Synthetic fake user only.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const playwright=require(process.env.CUSTOMER_STAGE_LOCAL_PLAYWRIGHT_MODULE);
const {chromium}=playwright;

const port=Number(process.env.CUSTOMER_STAGE_LOCAL_PORT);
const frontend='http://127.0.0.1:8000';
const untrustedFrontend='http://127.0.0.1:8001';
const worker='http://127.0.0.1:'+port;
const pinned='https://trendos-d1-api.trendmall-contact.workers.dev';
if(process.env.CUSTOMER_STAGE_LOCAL_E2E!=='1'||
   !Number.isSafeInteger(port)||port<1024||port>65535)
  throw new Error('Refuse browser test without explicit local-only configuration.');
const source=fs.readFileSync('config.js','utf8');
assert.match(source,/TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED\s*=\s*false/);
let external=0,actual=0,errors=[],requests=[];
async function main(){
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
  const context=await browser.newContext({serviceWorkers:'block'});
  try{
    // Network allowlist: only the synthetic local page and isolated Worker.
    // Chromium itself handles CORS preflight; no mocked/synthetic OPTIONS.
    await context.route('**/*', async route=>{
      const r=route.request(),url=new URL(r.url());
      if(url.origin!==frontend&&url.origin!==untrustedFrontend&&url.origin!==worker){
        external++;
        return route.abort('blockedbyclient');
      }
      if(url.origin===worker) {
        const hs={...r.headers()};
        if(r.method()==='POST' && url.pathname==='/v1/customer/native/login'){
          // Cloudflare normally supplies this ingress metadata at the edge.
          // This LOCAL-ONLY Playwright network shim is NOT edge attestation.
          hs['CF-Connecting-IP']='192.0.2.17';
        }
        actual++;
        requests.push({method:r.method(),path:url.pathname,origin:hs.origin||''});
        return route.continue({headers:hs});
      }
      return route.continue();
    });
    await context.addInitScript(({port,apiOrigin})=>{
      window.TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED=true;
      window.MATBAGY_EDGE_ORDERS_API_URL=apiOrigin;
      const originalFetch=window.fetch.bind(window);
      window.fetch=function(input,init){
        if(typeof input!=='string' ||
            !input.startsWith(apiOrigin+'/v1/customer/native/'))
          throw new Error('LOCAL_CHROMIUM_E2E_REFUSED_NON_NATIVE_REMOTE_FETCH');
        const parsed=new URL(input);
        if(!['/v1/customer/native/login','/v1/customer/native/orders',
             '/v1/customer/native/logout'].includes(parsed.pathname))
          throw new Error('LOCAL_CHROMIUM_E2E_REFUSED_OTHER_ROUTE');
        return originalFetch('http://127.0.0.1:'+port+parsed.pathname+parsed.search,init);
      };
    },{port,apiOrigin:pinned});
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(frontend+'/',{waitUntil:'load',timeout:20000});
    assert.equal(await page.title(),'TrendOS isolated customer browser fixture');
    assert.equal(await page.locator('#status').textContent(),'ready');
    assert.equal(await page.evaluate(()=>window.customerStageBrowserFixtureV0.nativeEnabled),true);
    await page.locator('#customer-code').fill('LOCAL-FIXTURE-PC-C1');
    await page.locator('#customer-password').fill('LOCAL_ONLY_SAMPLE_PASSWORD_2026_NOT_REAL!');
    await page.locator('#login').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent==='logged-in',
      null,{timeout:18000});
    assert.equal(await page.locator('#customer-password').inputValue(),'');
    const customer=await page.evaluate(()=>window.customerStageBrowserFixtureV0.customer);
    assert.equal(customer.token,'NATIVE_SESSION_IN_MEMORY');
    assert.equal(customer.nativeSession,true);
    assert.equal(customer.customerCode,'LOCAL-FIXTURE-PC-C1');
    await page.locator('#orders').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent==='orders-ok',
      null,{timeout:18000});
    assert.equal(await page.locator('#order-list').textContent(),'LOCAL-ORDER-LOCAL-C1');
    assert.ok(!(await page.locator('body').textContent()).includes('LOCAL-ORDER-LOCAL-C2'));
    assert.ok(!(await page.locator('body').textContent()).includes('LOCAL_FAKE_PHONE'));
    // The six NOT-YET-WIRED customer features must fail closed inside the
    // ORIGINAL customer adapter: no Google, no Worker POST and no downgrade.
    const pendingActions = [
      'changeCustomerPassword', 'getCustomerPortalAccountsV1859',
      'createCustomerDraft', 'addCustomerDraftItem',
      'submitCustomerDraft', 'uploadCustomerDraftFile'
    ];
    const beforePending = requests.length;
    for (const action of pendingActions) {
      const outcome = await page.evaluate(async name => {
        try {
          await window.customerStageBrowserFixtureV0.call(name, {
            customerId:'LOCAL-C2', token:'LOCAL_FAKE_GOOGLE_TOKEN'
          });
          return 'UNEXPECTED_SUCCESS';
        } catch (error) { return error.code || 'UNKNOWN_ERROR'; }
      }, action);
      assert.equal(outcome, 'CUSTOMER_NATIVE_ACTION_NOT_WIRED',
        'Pending customer feature must fail closed: ' + action);
    }
    assert.equal(requests.length, beforePending,
      'Pending customer actions must never call the Worker or Google');
    assert.equal(await page.evaluate(
      () => window.customerStageBrowserFixtureV0.legacyCalls), 0);
    await page.locator('#logout').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent==='logout-ok',
      null,{timeout:18000});
    await page.locator('#orders').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent===
      'orders-error:CUSTOMER_NATIVE_SESSION_NOT_AVAILABLE',null,{timeout:7000});
    const storage=await page.evaluate(()=>({
      local:Object.entries(localStorage),session:Object.entries(sessionStorage),
      legacy:window.customerStageBrowserFixtureV0.legacyCalls
    }));
    assert.equal(storage.legacy,0);
    assert.deepEqual(storage.local,[]);
    assert.deepEqual(storage.session,[]);
    assert.equal(errors.length,0,'Chrome page errors: '+errors.join(', '));
    assert.equal(external,0,'Browser attempted an external production/Google request');
    // A separate loopback HTTP origin is intentionally NOT in Stage CORS
    // allowlist. A genuine browser must not obtain a Native session.
    const hostilePage = await context.newPage();
    try {
      await hostilePage.goto(untrustedFrontend+'/', {waitUntil:'load',timeout:20000});
      const beforeHostileRequests = requests.length;
      const badOriginResult = await hostilePage.evaluate(async () => {
        try {
          await window.customerStageBrowserFixtureV0.call('customerLogin',{
            customerCode:'LOCAL-FIXTURE-PC-C1',
            password:'LOCAL_ONLY_SAMPLE_PASSWORD_2026_NOT_REAL!'
          });
          return 'UNEXPECTED_SUCCESS';
        } catch (error) {return error.code || 'UNKNOWN_ERROR';}
      });
      assert.equal(badOriginResult, 'CUSTOMER_NATIVE_LOGIN_NETWORK_UNAVAILABLE',
        'Chromium must enforce refusal of an unauthorized CORS Origin');
      // Chromium/Playwright can surface an attempted POST at the routing
      // layer even when the Worker rejects its Origin with HTTP 403 or CORS
      // blocks the response. Counting routed POSTs is NOT proof of issuance.
      assert.equal(await hostilePage.evaluate(
        () => window.customerStageBrowserFixtureV0.customer), null,
        'Unauthorized browser Origin must not establish any customer session');
      assert.equal(await hostilePage.evaluate(
        () => window.customerStageBrowserFixtureV0.legacyCalls), 0);
      assert.ok(requests.slice(beforeHostileRequests).some(
        x=>x.path==='/v1/customer/native/login'),
        'Negative CORS probe must actually reach the local Worker network');
    } finally {await hostilePage.close();}
    const posts=requests.filter(x=>x.method==='POST');
    const gets=requests.filter(x=>x.method==='GET');
    assert.equal(posts.filter(x=>x.path.endsWith('/login')).length,1);
    assert.equal(posts.filter(x=>x.path.endsWith('/logout')).length,1);
    assert.ok(gets.some(x=>x.path.endsWith('/orders')));
    // Native POST content-type and Bearer GET/POST are non-simple browser
    // requests: Chromium enforces real CORS authorization before JS receives
    // the actual responses. Browser network-layer edge metadata is test-only.
    console.log('PASS: actual Chromium browser DOM customer login → scoped D1 orders → D1 CAS logout → replay denied, automatic CORS and no Google fallback');
    console.log('PASS: Chromium cross-origin denied from unauthorized local UI, six pending customer actions fail closed without Google/Worker calls');
    console.log('REAL_BROWSER_ENGINE=CHROMIUM; EXTERNAL_NETWORK_REQUESTS=0; PROD_NATIVE_FLAG=OFF; CLOUD_DEPLOY=NO');
    await page.close();
  }finally { await context.close(); }
}finally { await browser.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
