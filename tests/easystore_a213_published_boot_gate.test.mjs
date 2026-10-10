import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Read a public EasyStore JS/config pair from GET-only files. This test is
// intentionally local: no production bearer token, browser automation, POST,
// D1 SQL write or cloud permission. It runs BEFORE a financial canary is armed.
//
// Usage:
// node tests/easystore_a213_published_boot_gate.test.mjs config.js app.js --expect-off
// node tests/easystore_a213_published_boot_gate.test.mjs config.js app.js --simulate-canary
// node tests/easystore_a213_published_boot_gate.test.mjs config.js app.js --expect-canary
const [configPath,appPath,modeArg]=process.argv.slice(2);
assert.ok(configPath && appPath,'explicit config.js and app.js paths required');
assert.ok(['--expect-off','--simulate-canary','--expect-canary'].includes(modeArg),'explicit mode required');
let config=fs.readFileSync(configPath,'utf8');
const appSource=fs.readFileSync(appPath,'utf8');

if(modeArg==='--simulate-canary'){
  // Offline CI on the currently OFF production code: prove that an equivalent
  // one-action CANARY config would not trigger a blank screen. No file writes.
  const off="window.EASYSTORE_ACCOUNTING_D1_WRITE_MODE = 'OFF';";
  const empty="window.EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS = [];";
  assert.equal(config.split(off).length-1,1,'offline fixture must start OFF exactly once');
  assert.equal(config.split(empty).length-1,1,'offline fixture must start with empty canary allowlist');
  config=config.replace(off,"window.EASYSTORE_ACCOUNTING_D1_WRITE_MODE = 'CANARY';")
    .replace(empty,"window.EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS = ['closePurchaseCustodyV1920'];");
}

const expectedMode=modeArg==='--expect-off'?'OFF':'CANARY';
const marker='  let a213PilotServerReady=false;';
const readyAt=appSource.indexOf(marker);
const stateAt=appSource.indexOf('  const state = {');
assert.ok(readyAt>=0 && stateAt>readyAt,'pilot readiness must initialize before state.active/initialScreen/allowedScreens');
assert.equal(appSource.split(marker).length-1,1,'pilot readiness must have exactly one declaration');
assert.ok(appSource.includes('function a213PilotHealthAllowsOneCommand(h)'),'server-gated canary visibility must remain');
assert.ok(appSource.includes('a213PilotServerReady && a213CustodyCloseCanaryEnabled()'),'client must not show a button solely from its CANARY flag');

function boot(src){
  const app={innerHTML:''};
  const screen={innerHTML:''};
  const other={innerHTML:'',classList:{toggle(){}},value:''};
  const session=new Map(),local=new Map(),listeners=new Map();
  const window={opener:{postMessage(){}},addEventListener(e,fn){listeners.set(e,fn);}};
  const location={search:'?from=trendos&employeeSSO=1&ssoNonce=SYNTHETIC-ACC162&screen=dashboard'};
  const document={
    getElementById(id){return id==='app'?app:id==='screen'?screen:other;},
    querySelectorAll(){return [];},querySelector(){return null;},addEventListener(){}
  };
  const storage=m=>({
    getItem:k=>m.has(k)?m.get(k):null,
    setItem:(k,v)=>m.set(k,String(v)),
    removeItem:k=>m.delete(k)
  });
  const ctx=vm.createContext({
    window,document,location,
    sessionStorage:storage(session),localStorage:storage(local),
    URL,URLSearchParams,Date,Intl,Number,Math,JSON,Array,Object,Map,Set,console,Promise,
    AbortController,history:{back(){}},
    setTimeout(){return 0;},clearTimeout(){},setInterval(){return 0;},
    fetch(){throw Error('Unexpected network during local A2.13 boot');}
  });
  vm.runInContext(config,ctx,{timeout:5000,filename:'published-config.js'});
  assert.equal(window.EASYSTORE_ACCOUNTING_D1_WRITE_MODE,expectedMode);
  assert.equal(window.EASYSTORE_ACCOUNTING_D1_READONLY,true);
  assert.equal(window.EASYSTORE_ACCOUNTING_D1_WRITES,false);
  if(expectedMode==='CANARY'){
    assert.deepEqual([...window.EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS],['closePurchaseCustodyV1920']);
  }else{
    assert.deepEqual([...window.EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS],[]);
  }
  vm.runInContext(src,ctx,{timeout:10000,filename:'published-app.js'});
  assert.match(app.innerHTML,/إيزي ستور/,'accounting shell must render before the SSO message arrives');
  assert.match(screen.innerHTML,/فاتورة|لوحة|تسجيل|الفواتير/,'accounting main screen must not be blank');
  assert.equal(typeof window.ES27?.go,'function','navigation must be connected');
  assert.equal(typeof listeners.get('message'),'function','authenticated cross-window SSO receiver required');
  assert.ok(!screen.innerHTML.includes('تنفيذ تقفيل العهدة الصفرية مرة واحدة'),
    'pilot action must remain invisible to a provisional URL-only identity before backend arm');
  return {app,screen,window};
}
boot(appSource);

if(modeArg==='--simulate-canary'){
  // Regression: move the declaration to its old wrong location, AFTER state
  // was initialized, proving the test fixture would catch the historical TDZ.
  const broken=appSource.replace(marker,'')
    .replace('  function newAccountingRequestId(prefix){',marker+'\n  function newAccountingRequestId(prefix){');
  assert.notEqual(broken,appSource,'synthetic old-bug injection must modify JS');
  assert.throws(()=>boot(broken),/before initialization|not defined/,
    'historical A2.13 blank-screen error must be detected offline');
  console.log('A213_OLD_BLANK_SCREEN_REGRESSION_DETECTED=PASS');
}
console.log('A213_DEPLOYED_JS_BOOTSTRAP_MODE_'+expectedMode+'=PASS');
console.log('A213_PREARM_NONCE_URL_HAS_NO_WRITE_AUTH=PASS');
console.log('A213_BROWSER_SIMULATION_NETWORK_WRITES=ZERO');
