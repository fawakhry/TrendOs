import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = process.argv[2] || process.cwd();
const front = fs.readFileSync(root + '/trend-master-resilience-v1931.js','utf8');
const back = fs.readFileSync(root + '/trend-master-panels-v1931.gs','utf8');
const router = fs.readFileSync(root + '/v1932-router.gs','utf8');
const config = fs.readFileSync(root + '/config.js','utf8');

assert.match(router,/getTrendMasterPanelV1931/,'panel route missing');
assert.match(router,/trendMasterPanelReadV1931_/,'panel backend route target missing');
assert.match(config,/MATBAGY_TREND_MASTER_RESILIENCE_V1\s*=\s*true/,'resilience flag missing');
assert.match(config,/trend-master-resilience-v1931\.js/,'resilience loader missing');
assert.match(config,/MATBAGY_EDGE_ORDERS_READ_V1_ENABLED\s*=\s*false/,'D1 frontend read must remain OFF');
assert.match(config,/MATBAGY_DISABLE_DEMO_OPERATIONS\s*=\s*true/,'demo operations must remain disabled');
assert.doesNotMatch(front,/EDGE_SESSION_SECRET|console\.log|console\.debug/,'frontend must not log secrets/PII');
for (const forbidden of ['appendRow(','.setValue(','.setValues(','deleteRow(','ensureAutomationQueueV1931_','ensureDebtDeliveryRestrictionsV1931_','ensureCustomerDebtHeaders_']) {
  assert.equal(back.includes(forbidden),false,'read-only backend contains mutation helper: '+forbidden);
}
assert.match(front,/Math\.min\(2,/,'retry must be bounded to max 2 attempts');
assert.match(front,/AbortController/,'panel-specific timeout controller missing');
assert.match(front,/inflight\[key\]/,'request deduplication missing');
assert.match(front,/tmr-stale/,'stale indicator missing');

function node(id){return {id,innerHTML:'',textContent:'',disabled:false,classList:{toggle(){},add(){},remove(){}},addEventListener(){},closest(){return null;}};}
const ids=['trendMasterCenter','trendMasterStatus','trendMasterSummary','archiveOrdersList','archivePagerText','archivePrevBtn','archiveNextBtn','automationMessagesList','stockAlertsList','debtRestrictionPanel','debtRestrictionCustomers','debtRestrictionList','employeeKpiList','dayClosePreviewPanel','dayClosePreviewList','dayCloseReadyBadge','runTrendAutomationBtn','installTrendAutomationBtn','runAccountingCloseBtn'];
const nodes=Object.fromEntries(ids.map(id=>[id,node(id)]));
const requests=[];
const calls=Object.create(null);
let behavior=Object.create(null);
function responseFor(panel){
  const p={success:true,panel,permissions:{canManageArchive:true,canManageDebtRestrictions:true,canRunAutomation:true,canCloseDay:true}};
  if(panel==='summary')p.system={activeLines:7,archivedLines:3,pagingEnabled:true,deliveryPolicy:'safe',stockAutoDeduct:'invoice'};
  if(panel==='archive')p.archive={success:true,rows:[],pagination:{page:1,totalPages:1,totalRows:0}};
  if(panel==='messages')p.messageQueue=[];
  if(panel==='stock')p.stockAlerts=[{material:'TEST-MATERIAL',department:'طباعة',stock:1,minimum:2}];
  if(panel==='employee')p.employeePerformance=[{employee:'TEST-EMPLOYEE',department:'طباعة',orderCount:1,total:1,completed:1,overdue:0,completionPercent:100,score:100}];
  if(panel==='debt')p.debtControl={customers:[],restrictions:[]};
  if(panel==='dayclose')p.dayClose={blockers:[]};
  return p;
}
const context={
  window:null,
  document:{getElementById:id=>nodes[id]||null,createElement:()=>node('created'),head:{appendChild(){}},documentElement:{appendChild(){}}},
  setTimeout,clearTimeout,setInterval,clearInterval,Promise,Date,JSON,Math,Number,String,Object,Array,RegExp,Error,AbortController,
  fetch:(url,opts)=>{
    const body=JSON.parse(opts.body);requests.push(body);const panel=body.panel;calls[panel]=(calls[panel]||0)+1;
    const mode=behavior[panel]||'success';
    if(mode==='hang')return new Promise((resolve,reject)=>{opts.signal.addEventListener('abort',()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'})));});
    if(mode==='fail')return Promise.resolve({text:async()=>JSON.stringify({success:false,message:'synthetic failure'})});
    return new Promise(resolve=>setTimeout(()=>resolve({text:async()=>JSON.stringify(responseFor(panel))}),8));
  }
};
context.window=context;
context.window.TREND_API_URL='https://example.invalid/apps-script';
context.window.MATBAGY_TREND_MASTER_RESILIENCE_V1=true;
context.window.MATBAGY_TREND_MASTER_PANEL_TIMEOUTS={summary:40,archive:40,messages:40,stock:40,employee:15,debt:40,dayclose:40};
context.window.trendosState={archivePage:1,archiveQuery:'',user:{username:'tester',token:'TOKEN_TEST'}};
context.window.trendosSecureApiV1922=async(action,params)=>({success:true,action,params});
vm.createContext(context);
vm.runInContext(front,context,{filename:'trend-master-resilience-v1931.js'});
const api=context.window.trendMasterPanelResilienceV1;
assert.ok(api,'resilience API not installed');

// Dedup: same panel/key shares one concurrent request.
calls.stock=0;
await Promise.all([api.readPanel('stock',{username:'tester',token:'TOKEN_TEST'}),api.readPanel('stock',{username:'tester',token:'TOKEN_TEST'})]);
assert.equal(calls.stock,1,'duplicate concurrent stock calls were not coalesced');

// Bounded retry: one initial attempt + one retry, never an unbounded loop.
behavior.employee='fail';calls.employee=0;
const failed=await api.readPanel('employee',{username:'tester',token:'TOKEN_TEST'});
assert.equal(failed.ok,false);
assert.equal(calls.employee,2,'employee retry count must be exactly 2 attempts');

// Stale cache: a prior good result is retained on later failure.
behavior.messages='success';
const firstMessages=await api.readPanel('messages',{username:'tester',token:'TOKEN_TEST'});
assert.equal(firstMessages.ok,true);
behavior.messages='fail';
const staleMessages=await api.readPanel('messages',{username:'tester',token:'TOKEN_TEST'});
assert.equal(staleMessages.stale,true,'last-good cache was not used');

// Panel independence: stock succeeds while employee fails; neither blocks the other.
behavior.stock='success';behavior.employee='fail';behavior.messages='success';behavior.summary='success';behavior.archive='success';behavior.debt='success';behavior.dayclose='success';
await context.window.trendosSecureApiV1922('getTrendMasterCenterV1931',{username:'tester',token:'TOKEN_TEST',archivePage:1,archiveQuery:''});
await api.refresh({username:'tester',token:'TOKEN_TEST',archivePage:1,archiveQuery:''});
assert.match(nodes.stockAlertsList.innerHTML,/TEST-MATERIAL/,'successful stock panel did not render');
assert.match(nodes.employeeKpiList.innerHTML,/إعادة المحاولة/,'failed employee panel did not expose retry');
assert.doesNotMatch(nodes.employeeKpiList.innerHTML,/جاري الحساب/,'timeout/failure left employee panel loading forever');
behavior.messages='fail';
await api.retry('messages');
assert.match(nodes.automationMessagesList.innerHTML,/بيانات محفوظة/,'stale cache indicator missing in panel');

// Timeout is bounded and ends in a panel error instead of an eternal spinner.
behavior.employee='hang';calls.employee=0;
await api.retry('employee');
assert.equal(calls.employee,2,'timeout retry was not bounded');
assert.match(nodes.employeeKpiList.innerHTML,/انتهت مهلة تحميل القسم|إعادة المحاولة/);
assert.doesNotMatch(nodes.employeeKpiList.innerHTML,/جاري الحساب/);

// Explicit retry can recover after a prior failure.
behavior.employee='success';
const recovered=await api.retry('employee');
assert.ok(recovered.data && recovered.data.employeePerformance,'retry did not recover employee panel');
assert.match(nodes.employeeKpiList.innerHTML,/TEST-EMPLOYEE/);

// Auth remains attached to every panel request; token is not dropped by the wrapper.
assert.ok(requests.length>0);
for(const req of requests){assert.equal(req.username,'tester');assert.equal(req.token,'TOKEN_TEST');}

console.log('Trend Master V1931 resilience tests: PASS');
