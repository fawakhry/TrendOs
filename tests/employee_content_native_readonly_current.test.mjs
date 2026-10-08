import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const calls=[],events=[];let revoked=false;let downstreamCalls=0;
const reads=['getPlatformSections','getFranchiseBranches','getServiceProviderRoutes','getMarketplace','getWhiteLabelSettings','getLeadPhoneNumbers','getPlatformAds','getKnowledge','getMatbagyNotes'];
const writes=['savePlatformSection','saveFranchiseBranch','assignCustomerBranch','saveServiceProviderRoute','saveMarketplaceVendor','saveMarketplaceProduct','saveWhiteLabelSettings','deletePlatformAd','uploadPlatformAd','saveKnowledge','saveMatbagyNote'];
const window={MATBAGY_EMPLOYEE_NATIVE_AUTH_V1:true,MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1:false,MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1:false,MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES:[],MATBAGY_EMPLOYEE_CONTENT_CUTOVER_MODE:'READONLY',MATBAGY_EMPLOYEE_API_URL:'https://content.example.test',trendosSecureApiV1922:async()=>{downstreamCalls++;throw Error('LEGACY_CALL_FORBIDDEN');},dispatchEvent(e){events.push(e);},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}};
vm.runInNewContext(fs.readFileSync('employee-api-dispatcher-v1.js','utf8'),{window,URL,Set,Map,JSON,Error,Number,Date,Promise,AbortController,TextEncoder,setTimeout,clearTimeout,setInterval,clearInterval,console,fetch:async(url,options)=>{
 calls.push({url,options});assert.equal(url,'https://content.example.test/v1/employee/content');
 return {ok:!revoked,status:revoked?401:200,url,async text(){return JSON.stringify(revoked?{success:false,message:'Employee session rejected'}:{success:true,authority:'d1-employee-content-v1'});}};
}});
for(const action of reads){
 const before=calls.length;
 const result=await window.trendosEmployeeApiV1(action,{username:'local-employee',token:'synthetic-token',password:'synthetic-password'});
 assert.equal(result.authority,'d1-employee-content-v1');assert.equal(calls.length,before+1);
 const call=calls.at(-1),body=JSON.parse(call.options.body);
 assert.equal(call.options.headers.authorization,'Bearer synthetic-token');assert.equal(body.action,action);
 assert.equal(Object.hasOwn(body,'token'),false);assert.equal(Object.hasOwn(body,'password'),false);
}
const beforeDenied=calls.length;
for(const action of writes)await assert.rejects(()=>window.trendosEmployeeApiV1(action,{username:'local-employee',token:'synthetic-token'}),e=>e.code==='EMPLOYEE_LEGACY_BRIDGE_DISABLED');
assert.equal(calls.length,beforeDenied,'READONLY writes must emit no network requests');
await assert.rejects(()=>window.trendosEmployeeApiV1('getKnowledge',{username:'local-employee'}),e=>e.code==='EMPLOYEE_CONTENT_SESSION_REQUIRED');
assert.equal(calls.length,beforeDenied,'missing session must fail before a request');
revoked=true;
await assert.rejects(()=>window.trendosEmployeeApiV1('getKnowledge',{username:'local-employee',token:'synthetic-token'}),e=>e.status===401);
assert.equal(events.length,1);assert.equal(events[0].type,'trendos:employee-session-invalid');
assert.equal(downstreamCalls,0);
console.log('CURRENT_NATIVE_CONTENT_READONLY=PASS; NATIVE_READS=9; NETWORKLESS_WRITE_DENIALS=11; SESSION401=PASS; LEGACY_CALLS=0');
