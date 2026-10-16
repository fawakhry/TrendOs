// BOOK28 Core native department scope — fabricated employees, lines and D1 only.
// Uses original session verifier with fake D1. Never contacts Cloudflare or staff.
import assert from 'node:assert/strict';
import test from 'node:test';
import {webcrypto} from 'node:crypto';
import {handleEmployeeCoreNativeRequest} from '../cloudflare-d1/src/employee-core-native-v1.mjs';
import {cloudAuthTokenFingerprint} from '../cloudflare-d1/src/cloud-auth-shadow-v1.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;

const SECRET='SYNTHETIC_CORE_SESSION_SECRET_NOT_REAL';
const TOKEN='FAKE_EMPLOYEE_TOKEN_NO_ACCESS';
const oldFetch=globalThis.fetch;
let externalCalls=0;
globalThis.fetch=async()=>{externalCalls++;throw Error('NO_EXTERNAL_NETWORK');};
test.after(()=>{globalThis.fetch=oldFetch;});

function fixture({role='print',username='fake-print',department=role,screens=[],
                valid=true,mode='GENERAL',source='imported',lineDepartment='طباعة',
                status='طلب جديد',hasLine=true}={}){
  const calls={session:0,control:0,importedReads:0,t12Reads:0,runs:[],readSQL:[]};
  const line={orderId:'FAKE-ORDER-999',status,notes:'fake-notes',department:lineDepartment};
  const env={
    EDGE_SESSION_SECRET:SECRET,TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1:'true',
    DB:{prepare(sql){
      return {
        bind(...args){this.args=args;return this;},
        async first(){
          if(sql.includes('FROM employee_auth_sessions_v1 s')){
            calls.session++;
            const fp=await cloudAuthTokenFingerprint(username,TOKEN,env);
            if(!valid||this.args[1]!==fp)return null;
            return {canonicalUsername:username,role,department,screensJson:JSON.stringify(screens),
              sessionVersion:1,currentSessionVersion:1,active:1,expiresAtMs:Date.now()+60000,mustChange:0};
          }
          if(sql.includes('FROM employee_core_control_v1')){
            calls.control++;return {mode,policyEpoch:1,dataVersion:1};
          }
          if(sql.includes('FROM employee_core_lines_v1 WHERE line_id')){
            calls.importedReads++;calls.readSQL.push(sql);
            return source==='imported'&&hasLine?line:null;
          }
          if(sql.includes('FROM t12_prod_lines WHERE line_id')){
            calls.t12Reads++;calls.readSQL.push(sql);
            return source==='t12'&&hasLine?line:null;
          }
          throw Error('UNEXPECTED_D1_READ');
        },
        async all(){throw Error('UNEXPECTED_D1_ALL');},
        async run(){calls.runs.push({sql,args:this.args||[]});return {success:true,meta:{changes:1}};}
      };
    }}
  };
  return {env,calls};
}
async function invoke(fixture,action='updateLine',more={}){
  const req=new Request('https://fixture.invalid/v1/employee/core',{
    method:'POST',
    headers:{'content-type':'application/json',Authorization:'Bearer '+TOKEN},
    body:JSON.stringify({action,username:more.username||fixture.username||'fake-print',
      lineId:'FAKE-LINE-9',status:'بدأ التنفيذ',message:'FAKE MESSAGE',...more})
  });
  const res=await handleEmployeeCoreNativeRequest(req,fixture.env);
  return {status:res.status,body:await res.json(),calls:fixture.calls};
}
function make(opts={}){
  const f=fixture(opts);f.username=opts.username||'fake-print';return f;
}
const actions=['updateLine','markCustomerNotified'];
const sources=['imported','t12'];
test('BOOK28: print employee cannot update or notify laser lines, even if body.screen is forged',async()=>{
  for(const action of actions)for(const source of sources){
    const f=make({source,role:'print',department:'طباعة',lineDepartment:'ليزر'});
    const x=await invoke(f,action,{screen:'print',screens:['laser']});
    assert.equal(x.status,403,action+' '+source);
    assert.equal(x.body.code,'line-write-scope-denied');
    assert.equal(x.calls.runs.length,0);
    assert.ok(x.calls.importedReads>=1);
  }
});
test('BOOK28: laser employee cannot edit/notify print lines',async()=>{
  for(const action of actions)for(const source of sources){
    const f=make({source,role:'laser',department:'ليزر',lineDepartment:'طباعة'});
    const x=await invoke(f,action,{screen:'laser'});
    assert.equal(x.status,403,action+' '+source);
    assert.equal(x.calls.runs.length,0);
  }
});
test('BOOK28: admin-looking username with non-admin session cannot bypass department guard',async()=>{
  for(const username of ['diaa','ضياء']){
    const f=make({username,role:'print',department:'طباعة',lineDepartment:'ليزر'});
    const x=await invoke(f,'updateLine');
    assert.equal(x.status,403,username);
    assert.equal(x.calls.runs.length,0);
  }
});
test('BOOK28: unknown department fails closed for non-admin for each writer',async()=>{
  for(const action of actions){
    const f=make({role:'service',department:'خدمة العملاء',lineDepartment:'غير معروف'});
    const x=await invoke(f,action);
    assert.equal(x.status,403,action);
    assert.equal(x.calls.runs.length,0);
  }
});
test('BOOK28: verified print/laser roles may edit and notify their OWN departments',async()=>{
  for(const [role,department] of [['print','طباعة'],['laser','ليزر']])
    for(const source of sources)for(const action of actions){
      const f=make({role,department,lineDepartment:department,source});
      const x=await invoke(f,action);
      assert.equal(x.status,200,role+'/'+source+'/'+action);
      assert.equal(x.body.success,true);
      assert.ok(x.calls.runs.length>0,'expected fake-only D1 write');
    }
});
test('BOOK28: verified explicit screens override role or user-supplied fake screens',async()=>{
  let f=make({role:'service',department:'خدمة العملاء',screens:['print'],lineDepartment:'طباعة'});
  assert.equal((await invoke(f)).status,200);
  f=make({role:'service',department:'خدمة العملاء',screens:['laser'],lineDepartment:'طباعة'});
  let x=await invoke(f,'updateLine',{screens:['print'],screen:'print'});
  assert.equal(x.status,403);
  assert.equal(x.calls.runs.length,0);
});
test('BOOK28: service is NOT a wildcard permission to mutate another department',async()=>{
  const f=make({role:'service',department:'خدمة العملاء',screens:['service'],lineDepartment:'ليزر'});
  const x=await invoke(f,'markCustomerNotified',{screen:'service'});
  assert.equal(x.status,403);
  assert.equal(x.calls.runs.length,0);
});
test('BOOK28: service can update customer-service own line',async()=>{
  const f=make({role:'service',department:'خدمة العملاء',lineDepartment:'خدمة العملاء'});
  const x=await invoke(f,'updateLine');
  assert.equal(x.status,200);
  assert.equal(x.body.success,true);
});
test('BOOK28: verified explicit admin role can edit across departments, including unnamed department',async()=>{
  for(const source of sources)for(const action of actions){
    const f=make({role:'admin',department:'الإدارة',lineDepartment:'غير معروف',source});
    const x=await invoke(f,action);
    assert.equal(x.status,200);
    assert.equal(x.body.success,true);
  }
});
test('BOOK28: expired or invalid session cannot read line metadata or write it',async()=>{
  for(const action of actions){
    const f=make({role:'admin',valid:false});
    const x=await invoke(f,action);
    assert.equal(x.status,401);
    assert.equal(x.calls.importedReads,0);
    assert.equal(x.calls.t12Reads,0);
    assert.equal(x.calls.runs.length,0);
  }
});
test('BOOK28: missing line returns not found and zero writes',async()=>{
  const f=make({role:'admin',hasLine:false});
  const x=await invoke(f);
  assert.equal(x.body.code,'line-not-found');
  assert.equal(x.calls.runs.length,0);
});
test('BOOK28: Core READONLY denies writes BEFORE line metadata access',async()=>{
  const f=make({mode:'READONLY',role:'admin'});
  const x=await invoke(f);
  assert.equal(x.status,503);
  assert.equal(x.body.code,'employee-core-readonly');
  assert.equal(x.calls.importedReads,0);
  assert.equal(x.calls.runs.length,0);
});
test('BOOK28: no real network calls in any test',()=>assert.equal(externalCalls,0));
