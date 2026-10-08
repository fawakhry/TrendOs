import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('employee-andon-v1.js','utf8');
const config=fs.readFileSync('config.js','utf8');

assert.match(source,/EMPLOYEE_ANDON_STRUCTURED_V2_20261007/);
assert.match(source,/\/blockers\/report/);
assert.match(source,/\/blockers\/my-open/);
assert.match(source,/\/blockers\/resolve/);
assert.match(source,/clientRequestId/);
assert.match(source,/authorization':'Bearer '/);
assert.match(source,/sessionStorage/);
assert.match(source,/MACHINE_BREAKDOWN/);
assert.match(source,/MATERIAL_MISSING/);
assert.match(source,/WAITING_CUSTOMER/);
assert.match(source,/PRICE_OR_OWNER_DECISION/);
assert.match(source,/QUALITY_ISSUE/);
assert.match(source,/HELP_NEEDED/);
assert.doesNotMatch(source,/saveMatbagyNote/);
assert.doesNotMatch(source,/OPS_REPLY/);
assert.doesNotMatch(source,/trendosEmployeeApiV1/);
assert.match(source,/trendos:employee-session-invalid/);
assert.match(source,/if\(response\.status===401\)signalSessionInvalidV2\(\)/);
assert.doesNotMatch(source,/data-andon="تم حل المشكلة"/);
assert.match(config,/MATBAGY_EMPLOYEE_SUPERVISOR_API_URL = "https:\/\/autonomous-printshop-employee-supervisor\.trendmall-contact\.workers\.dev"/);
assert.match(config,/MATBAGY_EMPLOYEE_ANDON_STRUCTURED_V1 = true/);
assert.match(config,/employee-andon-v1\.js\?v=20261008-entry652-session-lifecycle/);

const store=new Map();
const sessionStorage={
  getItem:k=>store.has(k)?store.get(k):null,
  setItem:(k,v)=>store.set(k,String(v)),
  removeItem:k=>store.delete(k)
};
const calls=[];
let reportAttempts=0;
const fetchMock=async(url,options={})=>{
  const body=JSON.parse(options.body||'{}');
  calls.push({url:String(url),options,body});
  if(String(url).endsWith('/blockers/report')){
    reportAttempts++;
    if(reportAttempts===1) throw new Error('simulated network loss');
    return {ok:true,status:200,text:async()=>JSON.stringify({success:true,inserted:true,idempotentReplay:false,blockerId:'BLK-1',reasonCode:body.reasonCode,state:'OPEN'})};
  }
  if(String(url).endsWith('/blockers/my-open')){
    return {ok:true,status:200,text:async()=>JSON.stringify({success:true,blockers:[{blockerId:'BLK-1',reasonCode:'MACHINE_BREAKDOWN',state:'OPEN'}]})};
  }
  if(String(url).endsWith('/blockers/resolve')){
    return {ok:true,status:200,text:async()=>JSON.stringify({success:true,inserted:true,idempotentReplay:false,blockerId:'BLK-1',state:'RESOLVED'})};
  }
  throw new Error('unexpected url '+url);
};
const windowObject={
  MATBAGY_EMPLOYEE_ANDON_V1:true,
  MATBAGY_EMPLOYEE_ANDON_STRUCTURED_V1:true,
  MATBAGY_EMPLOYEE_SUPERVISOR_API_URL:'https://supervisor.example.test',
  trendosState:{user:{username:'وائل',token:'native-token',department:'ليزر'}},
  sessionStorage,
  crypto:{randomUUID:()=> 'uuid-fixed'}
};
const documentObject={
  getElementById:()=>null,
  createElement:()=>({}),
  head:{appendChild(){}},
  documentElement:{appendChild(){}}
};
const sandbox={
  window:windowObject,
  document:documentObject,
  fetch:fetchMock,
  console,JSON,Error,String,Number,Date,Math,Object,Array,Promise,
  setInterval:()=>1,clearInterval:()=>{},setTimeout:()=>1,clearTimeout:()=>{}
};
vm.runInNewContext(source,sandbox,{filename:'employee-andon-v1.js'});
assert.ok(windowObject.TrendEmployeeAndonV1);
assert.equal(windowObject.TrendEmployeeAndonV1.structured,true);

await assert.rejects(
  ()=>windowObject.TrendEmployeeAndonV1.reportBlocker('MACHINE_BREAKDOWN','laser stopped'),
  /simulated network loss/
);
const out=await windowObject.TrendEmployeeAndonV1.reportBlocker('MACHINE_BREAKDOWN','laser stopped');
assert.equal(out.blockerId,'BLK-1');
const reportCalls=calls.filter(x=>x.url.endsWith('/blockers/report'));
assert.equal(reportCalls.length,2);
assert.equal(reportCalls[0].body.clientRequestId,reportCalls[1].body.clientRequestId);
assert.equal(reportCalls[1].body.username,'وائل');
assert.equal(reportCalls[1].body.reasonCode,'MACHINE_BREAKDOWN');
assert.equal(reportCalls[1].body.department,'ليزر');
assert.equal(reportCalls[1].options.headers.authorization,'Bearer native-token');

const open=await windowObject.TrendEmployeeAndonV1.loadOpenBlockers();
assert.equal(open.blockers.length,1);
assert.equal(open.blockers[0].blockerId,'BLK-1');

const resolved=await windowObject.TrendEmployeeAndonV1.resolveBlocker('BLK-1');
assert.equal(resolved.state,'RESOLVED');
const resolveCall=calls.find(x=>x.url.endsWith('/blockers/resolve'));
assert.equal(resolveCall.body.blockerId,'BLK-1');
assert.ok(resolveCall.body.clientRequestId);

console.log('ENTRY649_EMPLOYEE_ANDON_STRUCTURED_REPO=PASS');
console.log('LEGACY_OPS_REPLY_CALLS=0');
console.log('NATIVE_SESSION_BEARER=PASS');
console.log('IDEMPOTENT_RETRY_CLIENT_ID=PASS');
console.log('GENERIC_RESOLVE_BUTTON=REMOVED');
