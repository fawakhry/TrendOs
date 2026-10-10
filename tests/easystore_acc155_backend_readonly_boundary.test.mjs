import assert from 'node:assert/strict';
import { handleEmployeeAccountingNativeRequest } from '../cloudflare-d1/src/employee-accounting-native-v1.mjs';

// Synthetic fully mocked database. No Cloudflare secrets, network calls,
// employee credentials, real Orders, billing records or Production mutations.
const allowedOrigin='https://fawakhry.github.io';

async function probe({action,method='POST',origin=allowedOrigin,username='TEST_EMPLOYEE',authorization='',urlPath='/v1/employee/accounting'}={}) {
  const sqlQueries=[], dataWrites=[];
  const DB={
    prepare(sql) {
      sqlQueries.push(String(sql));
      if (/FROM employee_accounting_control_v1/.test(String(sql))) return {
        async first(){return {mode:'READONLY',nextInvoiceNumber:1,policyEpoch:39};}
      };
      throw Error('Unexpected DB statement in ACC155 mock: '+String(sql).slice(0,100));
    },
    async batch(queries) {
      dataWrites.push(queries);
      throw Error('D1 write batch must never be invoked');
    }
  };
  const headers = new Headers();
  if(origin!==null)headers.set('Origin',origin);
  if(method==='POST')headers.set('Content-Type','application/json');
  if(authorization)headers.set('Authorization',authorization);
  const request = new Request('https://test.invalid'+urlPath,{
    method,headers,
    ...(method==='POST'?{body:JSON.stringify({action,username})}:{})
  });
  const response=await handleEmployeeAccountingNativeRequest(request,{DB,CORS_ORIGINS:allowedOrigin});
  const body=await response.json();
  assert.equal(dataWrites.length,0,'financial writes must never reach mock D1');
  assert.ok(sqlQueries.every(q=>/FROM employee_accounting_control_v1/.test(q)),'only control-state SELECT may be performed');
  return {status:response.status,body,sqlCount:sqlQueries.length};
}
for (const action of ['saveAccountingFinalInvoice','closePurchaseCustodyV1920','saveAccountingMaterial','runAccountingDayAutomationV1921','saveEasyStorePurchaseV2','UNKNOWN-UNCLASSIFIED-ACTION']) {
  const out=await probe({action});
  assert.equal(out.status,503,'READONLY must reject '+action);
  assert.equal(out.body.code,'employee-accounting-readonly','must be an explicit financial fail-close');
  assert.equal(out.sqlCount,1);
}
for (const action of ['getAccounting','easyStoreSystemHealth','getEasyStoreCustomers','getPartyAccountV1858']) {
  const out=await probe({action});
  assert.equal(out.status,401,'read without bearer must fail '+action);
  assert.equal(out.body.code,'employee-session-rejected');
  assert.equal(out.sqlCount,1);
}
{
  const out=await probe({action:'getAccounting',username:'',authorization:'Bearer TEST-FAKE-SESSION'});
  assert.equal(out.status,401,'user claimed by client without valid username must fail');
}
{
  const out=await probe({action:'getAccounting',origin:'https://untrusted.invalid'});
  assert.equal(out.status,403,'untrusted origin must fail before DB read');
  assert.equal(out.sqlCount,0);
}
{
  const out=await probe({method:'GET'});
  assert.equal(out.status,405,'accounting business endpoint is POST-only');
  assert.equal(out.sqlCount,0);
}
console.log('ACC155_BACKEND_READONLY_WRITE_ACTIONS_BLOCKED=PASS');
console.log('ACC155_BACKEND_READS_REQUIRE_EMPLOYEE_AUTH=PASS');
console.log('ACC155_BACKEND_ORIGIN_METHOD_GUARDS=PASS');
console.log('ACC155_DB_WRITES=0');
console.log('ACC155_PRODUCTION_MUTATION=NO');
