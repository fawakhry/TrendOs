import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Public EasyStore source, synthetic browser, mock GET-only health.
// No live financial POST, D1 credentials, client token or customer data.
const [configPath,appPath]=process.argv.slice(2);
assert.ok(configPath && appPath,'explicit read-only asset paths required');
let config=fs.readFileSync(configPath,'utf8');
const app=fs.readFileSync(appPath,'utf8');
const off="window.EASYSTORE_ACCOUNTING_D1_WRITE_MODE = 'OFF';";
const noActions="window.EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS = [];";
assert.equal(config.split(off).length-1,1);
assert.equal(config.split(noActions).length-1,1);
config=config.replace(off,"window.EASYSTORE_ACCOUNTING_D1_WRITE_MODE = 'CANARY';")
  .replace(noActions,"window.EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS = ['closePurchaseCustodyV1920'];");

const anchor="  window.ES = window.ES27;";
assert.equal(app.split(anchor).length-1,1,'stable test-only export injection');
const injected=app.replace(anchor,
  "  window.__ACC163_TEST_ONLY = {refreshA213PilotArmState,a213CustodyClosePilotEligible};\n"+anchor);
const allowedOrigin='https://trendos-ui.trendmall-contact.workers.dev';
const nonce='ACC163-FAKE-NONCE';
function scenario() {
  const appDiv={innerHTML:''},screen={innerHTML:''};
  const other={innerHTML:'',textContent:'',value:'',classList:{toggle(){},add(){},remove(){}}};
  const received={},stored=new Map(),local=new Map(),requests=[];
  const opener={postMessage(message,origin){requests.push({ack:message,origin});}};
  const location={search:'?from=trendos&employeeSSO=1&ssoNonce='+nonce+'&screen=purchase'};
  const storage=m=>({
    getItem:k=>m.has(k)?m.get(k):null,
    setItem:(k,v)=>m.set(k,String(v)),
    removeItem:k=>m.delete(k)
  });
  const window={opener,addEventListener(name,fn){received[name]=fn;}};
  const document={
    getElementById(id){return id==='app'?appDiv:id==='screen'?screen:other;},
    querySelectorAll(){return [];},
    querySelector(){return null;},
    addEventListener(){},hidden:false
  };
  let response={
    success:true,mode:'READONLY',authoritativeWrites:false,writeAuthorityMode:'READONLY',
    writeCanaryAllowedUserCount:0,writeCanaryAllowedActionCount:0,
    writeCanaryMaxAmount:0,writeCanaryMaxCommands:0,writeCanaryCommandsStarted:0,
    writeCanaryExpiresAtMs:0
  };
  const context=vm.createContext({
    window,document,location,sessionStorage:storage(stored),localStorage:storage(local),
    URL,URLSearchParams,Date,Intl,Number,Math,JSON,Array,Object,Map,Set,Promise,
    console,AbortController,history:{back(){}},
    setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},
    async fetch(url,options){
      const u=String(url);requests.push({url:u,method:options?.method||'GET'});
      assert.match(u,/\/v1\/employee\/accounting\/health\?pilotStatus=/,
        'do not call an accounting financial API during synthetic UI test');
      assert.equal(options?.method,'GET');
      return {ok:true,json:async()=>response};
    }
  });
  vm.runInContext(config,context,{timeout:5000,filename:'synthetic-config.js'});
  vm.runInContext(injected,context,{timeout:12000,filename:'published-app.js'});
  const sso=(origin=allowedOrigin,username='ضياء')=>received.message({
    origin,source:opener,data:{
      type:'TRENDOS_EMPLOYEE_SSO_V1',nonce,issuedAt:Date.now(),
      user:{name:username,username,mode:'admin',token:'FAKE-NON-PRODUCTION-TEST-TOKEN',department:'إدارة'}
    }
  });
  return {
    appDiv,screen,requests,window,stored,sso,
    setHealth(h){response=h;},
    refresh:()=>window.__ACC163_TEST_ONLY.refreshA213PilotArmState(),
    armed:()=>window.__ACC163_TEST_ONLY.a213CustodyClosePilotEligible(),
    goPurchase:()=>window.ES27.go('purchase')
  };
}
const c=scenario();
assert.match(c.appDiv.innerHTML,/إيزي ستور/);
assert.ok(!c.screen.innerHTML.includes('تنفيذ تقفيل العهدة الصفرية مرة واحدة'));
assert.equal(c.armed(),false,'URL-only identity cannot expose pilot');
await c.refresh();
assert.equal(c.requests.filter(r=>r.url).length,0,'no health GET without verified identity');

c.sso('https://untrusted.invalid');
assert.equal(c.armed(),false,'reject wrong sender origin');
assert.ok(!c.stored.has('EASYSTORE_SESSION_V1922'),'no fake SSO accepted');
c.sso();
assert.ok(c.stored.has('EASYSTORE_SESSION_V1922'),'valid opener/origin/nonce SSO accepted');
c.goPurchase();
assert.match(c.appDiv.innerHTML,/فواتير الشراء/);
assert.equal(c.armed(),false,'backend READONLY after SSO');
assert.ok(!c.screen.innerHTML.includes('تنفيذ تقفيل العهدة الصفرية مرة واحدة'));

const ok={
  success:true,mode:'CANARY',authoritativeWrites:false,writeAuthorityMode:'CANARY_BOUNDED',
  writeCanaryAllowedUserCount:1,writeCanaryAllowedActionCount:1,
  writeCanaryMaxAmount:0,writeCanaryMaxCommands:1,
  writeCanaryCommandsStarted:0,writeCanaryExpiresAtMs:Date.now()+90000
};
c.setHealth(ok);
assert.equal(await c.refresh(),true,'one-command backend health accepted');
assert.equal(c.armed(),true);
assert.match(c.screen.innerHTML,/تنفيذ تقفيل العهدة الصفرية مرة واحدة/,
  'button must render after verified SSO and mock server arm');
assert.equal(c.requests.filter(r=>r.method==='POST').length,0);

c.setHealth({...ok,writeCanaryCommandsStarted:1});
assert.equal(await c.refresh(),false,'budget use revokes UI');
assert.ok(!c.screen.innerHTML.includes('تنفيذ تقفيل العهدة الصفرية مرة واحدة'),
  'button must disappear after backend budget consumption');
c.setHealth({...ok,mode:'READONLY'});
assert.equal(await c.refresh(),false);
assert.equal(c.armed(),false);
assert.equal(c.requests.filter(r=>r.method==='POST').length,0);
console.log('A213_BROWSER_SSO_TO_VISIBLE_BUTTON=PASS');
console.log('A213_BROWSER_BUTTON_DISAPPEARS_ON_BUDGET_CONSUMPTION=PASS');
console.log('A213_BROWSER_UNTRUSTED_SSO_REJECTED=PASS');
console.log('A213_BROWSER_REAL_FINANCIAL_POST=ZERO');
