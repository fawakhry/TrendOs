// BOOK27 — pure in-memory UI/security regressions. No browser, WA, finance or network.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const APP = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const BACKEND = fs.readFileSync(new URL('../Code.gs', import.meta.url), 'utf8');
function segment(source, start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  assert.ok(a !== -1 && b > a, 'Missing contract markers: ' + start + ' / ' + end);
  return source.slice(a, b);
}

function dayClose(caseData) {
  const ids = {};
  for (const name of [
    'runAccountingCloseBtn', 'dayCloseReadyBadge', 'dayClosePreviewList',
    'dayClosePreviewPanel', 'trendMasterSummary'
  ]) {
    ids[name] = { textContent: '', innerHTML: '', disabled: false, classList: { toggle() {} } };
  }
  const context = {
    state: { trendMaster: { success: true, system: {}, permissions: {canCloseDay:true}, dayClose: caseData }},
    $: id => ids[id] || null,
    dashboardItem: () => '',
    trendListItem: () => '',
    escapeHtml: s => String(s).replace(/</g, '&lt;')
  };
  vm.createContext(context);
  vm.runInContext(segment(APP, '  function renderTrendMasterCenter() {',
    '  async function loadTrendMasterCenter(force)') + '\nthis.render = renderTrendMasterCenter', context);
  context.render();
  return ids;
}

test('BOOK27-DAYCLOSE: missing, error, malformed and inconsistent preview fail closed', () => {
  for (const data of [null, {error:'D1_DOWN'}, {}, {blockers:[]},
    {ready:true,blockers:['pending']}, {ready:false,blockers:[]}]) {
    const ids = dayClose(data);
    assert.equal(ids.runAccountingCloseBtn.disabled, true, JSON.stringify(data));
    assert.match(ids.dayCloseReadyBadge.textContent, /غير جاهز للتحقق/);
    assert.doesNotMatch(ids.dayClosePreviewList.innerHTML, /كل المراجعات سليمة/);
  }
});

test('BOOK27-DAYCLOSE: verified clear preview is ready; verified blockers prevent close', () => {
  const ready = dayClose({ready:true,blockers:[]});
  assert.equal(ready.runAccountingCloseBtn.disabled, false);
  assert.match(ready.dayCloseReadyBadge.textContent, /جاهز/);
  const blocked = dayClose({ready:false,blockers:['المشتريات معلقة']});
  assert.equal(blocked.runAccountingCloseBtn.disabled, true);
  assert.match(blocked.dayClosePreviewList.innerHTML, /المشتريات معلقة/);
});

function waHarness(url, popup) {
  let callback, opened = 0, marked = 0;
  const alerts=[];
  const context={
    $: id => id==='automationMessagesList' ? {addEventListener:(_, fn)=>{callback=fn;}}:null,
    window:{open(){opened++;return popup;}},
    alert:message=>alerts.push(message),
    URL,
    copyTextToClipboard:async()=>true,
    runTrendMasterAction:async()=>{marked++;throw Error('legacy mark sent must not run');}
  };
  vm.createContext(context);
  vm.runInContext(segment(APP,'    const messageList = $("automationMessagesList");',
    '    const saveDebtRestrictionButton='),context);
  assert.equal(typeof callback,'function');
  const button={getAttribute:n=>n==='data-wa-url'?url:'SYNTHETIC-MESSAGE'};
  return {click:()=>callback({target:{closest:selector=>selector==='.open-automation-wa'?button:null}}),
    state:()=>({opened,marked,alerts})};
}

test('BOOK27-WA: successful WhatsApp window open does NOT mark sent',async()=>{
  const h=waHarness('https://wa.me/2001000000000?text=synthetic', {closed:false});
  await h.click();
  assert.equal(h.state().opened,1);
  assert.equal(h.state().marked,0);
  assert.match(h.state().alerts.join(' '), /لم يتم تأكيد إرسال/);
});

test('BOOK27-WA: blocked popup and invalid/non-WhatsApp URL never mark sent',async()=>{
  for(const [url,popup,shouldOpen] of [
    ['https://wa.me/2001000000000', null,1],
    ['javascript:alert(1)',{},0],
    ['https://fake.example/?token=BAD',{},0]
  ]){
    const h=waHarness(url,popup);
    await h.click();
    assert.equal(h.state().marked,0);
    assert.equal(h.state().opened,shouldOpen);
  }
});

test('BOOK27-WA: legacy server markSent rejects even authenticated client WITHOUT sheet access',()=>{
  const source=segment(BACKEND,'function markAutomationMessageSentV1931_(e){',
    '\n\nfunction getDashboard_(e)');
  let writes=0;
  const context={
    authorize_:()=>({ok:true,user:{username:'synthetic'}}),
    ensureAutomationQueueV1931_:()=>{writes++;throw Error('NO_SHEET_WRITE_ALLOWED');}
  };
  vm.createContext(context);
  vm.runInContext(source+'\nthis.run=markAutomationMessageSentV1931_',context);
  const out=context.run({parameter:{id:'ALT-123',username:'synthetic',token:'TEST'}});
  assert.equal(out.success,false);
  assert.equal(out.code,'PROVIDER_ACK_REQUIRED');
  assert.equal(out.states.delivered,'UNVERIFIED');
  assert.equal(writes,0);
});

function refreshHarness(options={}) {
  const state={editing:!!options.editing,saving:!!options.saving,refreshInFlight:false};
  let loadCalls=0, finishRead;
  const read=new Promise(resolve=>finishRead=resolve);
  const btn={disabled:false,textContent:'تحديث'};
  const context={
    window:{}, state,
    $:id=>id==='refreshBtn'?btn:null,
    loadRows:()=>{loadCalls++;return read;},
    setLoading:()=>{}, Date, Promise
  };
  vm.createContext(context);
  vm.runInContext(segment(APP,'  async function hardRefreshMainScreen() {',
    '  function startRefresh()')+'\nthis.refresh=hardRefreshMainScreen',context);
  return {state,btn,refresh:context.refresh,complete:finishRead,calls:()=>loadCalls};
}
test('BOOK27-REFRESH: in-flight clicks coalesce and editing/saving are never reset',async()=>{
  for(const flag of ['editing','saving']){
    const h=refreshHarness({[flag]:true});
    assert.equal(await h.refresh(),false);
    assert.equal(h.calls(),0);
    assert.equal(h.state[flag],true);
  }
  const h=refreshHarness();
  const first=h.refresh();
  const second=await h.refresh();
  assert.equal(second,false);
  assert.equal(h.calls(),1);
  assert.equal(h.btn.disabled,true);
  h.complete();
  await first;
  assert.equal(h.state.refreshInFlight,false);
  assert.equal(h.btn.disabled,false);
});

function refreshClickHarness({dirty=false,editing=false,modal=false}={}){
  let listener,executed=0;
  const window={state:{editing,saving:false,refreshInFlight:false},
    __TRENDOS_CH27_SAFE_REFRESH_V1__:()=>executed++,
    addEventListener:(event,fn,capture)=>{assert.equal(event,'click');assert.equal(capture,true);listener=fn;}};
  let prevented=false,stopped=false,immediate=false;
  const context={window,dirty,modalOpen:()=>modal,lastSafeRefresh:0,Date,alert:()=>{}};
  vm.createContext(context);
  vm.runInContext(segment(APP,"  // CH27: a single capture owner bypasses historical refresh onclick patches.",
    "  document.addEventListener('visibilitychange'"),context);
  const btn={};
  const event={target:{closest:selector=>selector==='#refreshBtn'?btn:null},
    preventDefault:()=>prevented=true,stopPropagation:()=>stopped=true,
    stopImmediatePropagation:()=>immediate=true};
  listener(event);
  return {executed,prevented,stopped,immediate,dirty:context.dirty};
}
test('BOOK27-REFRESH: canonical capture intercepts legacy onclick and preserves dirty forms',()=>{
  let r=refreshClickHarness();
  assert.equal(r.executed,1);
  assert.equal(r.immediate,true);
  assert.equal(r.stopped,true);
  r=refreshClickHarness({dirty:true});
  assert.equal(r.executed,0);
  assert.equal(r.dirty,true);
  r=refreshClickHarness({editing:true});
  assert.equal(r.executed,0);
  r=refreshClickHarness({modal:true});
  assert.equal(r.executed,0);
});

function handoffHarness(){
  const u={name:'fake-name',username:'fake-user',role:'print',token:'TEST-ONLY-TOKEN'};
  const state={user:{role:'print'}};
  const window={state,MATBAGY_EASY_STORE_URL:'https://fawakhry.github.io/EasyStore/'};
  const storage={getItem:k=>k==='trendos_session'?JSON.stringify({user:{name:'evil admin ضياء',role:'admin',token:'fake'}}):''};
  const alerts=[],children=[];
  const context={
    window,sessionStorage:storage,localStorage:storage,
    txt:v=>String(v==null?'':v).trim(),norm:v=>String(v==null?'':v).trim().toLowerCase(),
    safeLS:()=>'',sessionUser:()=>u,URL,location:{href:'https://fawakhry.github.io/TrendOs/'},
    CACHE_TAG:'TEST',entry619SsoNonce:()=> 'synthetic-nonce',
    entry619PostEmployeeSso:(...args)=>children.push(args),
    alert:m=>alerts.push(m)
  };
  vm.createContext(context);
  // The bundle contains an older homonymous roleMode patch; isolate LAST handoff.
  const roleStart=APP.lastIndexOf('  function roleMode(){');
  const roleEnd=APP.indexOf('  function entry619SsoNonce()',roleStart);
  assert.ok(roleStart>=0&&roleEnd>roleStart);
  vm.runInContext(APP.slice(roleStart,roleEnd)+'\nthis.roleMode=roleMode',context);
  vm.runInContext(segment(APP,'  function openAccounting(dayClose){','  function mount()')+'\nthis.openAccounting=openAccounting',context);
  return {context,window,alerts,children};
}
function ssoProtocolHarness({live=true}={}){
  const posts=[],removed=[],timers=[];
  let ack;
  const session={username:'fixture-employee',token:'SYNTHETIC_FAKE_ONLY',role:'print'};
  const child={postMessage:(message,origin)=>posts.push({message,origin})};
  const window={state:{user:live?{...session}:null},
    addEventListener:(name,listener)=>{if(name==='message')ack=listener;},
    removeEventListener:(name,listener)=>removed.push({name,listener})
  };
  const context={window,Date,Promise,
    setInterval:fn=>{timers.push(fn);return timers.length;},
    clearInterval:()=>{},
    setTimeout:()=>{}};
  vm.createContext(context);
  vm.runInContext(segment(APP,'  function entry619PostEmployeeSso(child,targetOrigin,nonce,u,params){',
    '  function openAccounting(dayClose)')+'\nthis.sso=entry619PostEmployeeSso',context);
  return {window,child,session,posts,removed,timers,getAck:()=>ack,sso:context.sso};
}

test('BOOK27/30-SSO: expired/missing live session blocks initial token handoff',()=>{
  const h=ssoProtocolHarness({live:false});
  assert.equal(h.sso(h.child,'https://fawakhry.github.io','nonce',h.session,{}),false);
  assert.equal(h.posts.length,0);
});

test('BOOK27/30-SSO: forged ACK origin/source/nonce cannot stop session-checked retry',()=>{
  const h=ssoProtocolHarness();
  const approved='https://fawakhry.github.io';
  assert.equal(h.sso(h.child,approved,'nonce',h.session,{mode:'dept',roleMode:'print'}),true);
  assert.equal(h.posts.length,1);
  assert.equal(h.posts[0].origin,approved);
  assert.equal(h.posts[0].message.user.token,'SYNTHETIC_FAKE_ONLY');
  const ack=h.getAck();
  assert.equal(typeof ack,'function');
  for(const event of [
    {origin:'https://evil.invalid',source:h.child,data:{type:'EASYSTORE_EMPLOYEE_SSO_ACK_V1',nonce:'nonce'}},
    {origin:approved,source:{},data:{type:'EASYSTORE_EMPLOYEE_SSO_ACK_V1',nonce:'nonce'}},
    {origin:approved,source:h.child,data:{type:'EASYSTORE_EMPLOYEE_SSO_ACK_V1',nonce:'WRONG'}}
  ])ack(event);
  h.timers[0]();
  assert.equal(h.posts.length,2,'forged ack must not stop an authorized retry');
  ack({origin:approved,source:h.child,data:{type:'EASYSTORE_EMPLOYEE_SSO_ACK_V1',nonce:'nonce'}});
  h.timers[0]();
  assert.equal(h.posts.length,2,'valid ack stops handoff');
  assert.equal(h.removed.length,1);
});

test('BOOK30-SSO-LOGOUT-RACE: no token replay after logout or account switch',()=>{
  const h=ssoProtocolHarness();
  assert.equal(h.sso(h.child,'https://fawakhry.github.io','nonce',h.session,{}),true);
  assert.equal(h.posts.length,1);
  h.window.state.user={username:'another',token:'REPLACED_SESSION'};
  h.timers[0]();
  assert.equal(h.posts.length,1);
  h.window.state.user={...h.session};
  h.timers[0]();
  assert.equal(h.posts.length,1,'once stopped after account switch, never resume old token');
});

test('BOOK27-SSO: forged stored admin string does not grant admin UI hint',()=>{
  const h=handoffHarness();
  assert.equal(h.context.roleMode(),'print');
  h.window.state.user=null;
  assert.equal(h.context.roleMode(),'employee');
});

test('BOOK27-SSO: forged config host cannot receive token via postMessage',()=>{
  const h=handoffHarness();
  let opened=0;
  h.window.open=()=>{opened++;return {postMessage(){throw Error('token leaked');}}};
  for(const invalid of ['https://attacker.invalid/EasyStore/',
    'http://fawakhry.github.io/EasyStore/','https://fawakhry.github.io/elsewhere']){
    h.window.MATBAGY_EASY_STORE_URL=invalid;
    assert.equal(h.context.openAccounting(false),false);
  }
  assert.equal(opened,0);
  assert.equal(h.children.length,0);
});

test('BOOK27-SSO: approved route can hand off to target origin, never token in URL',()=>{
  const h=handoffHarness();
  let opened='';
  h.window.open=url=>{opened=url;return {postMessage(){}}};
  assert.equal(h.context.openAccounting(false),true);
  assert.match(opened,/https:\/\/fawakhry.github.io\/EasyStore\//);
  assert.doesNotMatch(opened,/TEST-ONLY-TOKEN/);
  assert.equal(h.children.length,1);
  assert.equal(h.children[0][1],'https://fawakhry.github.io');
});
