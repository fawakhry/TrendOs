// BOOK28 legacy PREPARED inventory — ONLY fake D1 and fictitious sessions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {handleEmployeeCoreNativeRequest} from '../cloudflare-d1/src/employee-core-native-v1.mjs';
import {readCorePreparedRequestsV1} from '../cloudflare-d1/src/employee-core-prepared-audit-v1.mjs';
import {cloudAuthTokenFingerprint} from '../cloudflare-d1/src/cloud-auth-shadow-v1.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const TOKEN='BOOK28_SYNTHETIC_SESSION_ONLY';
const SECRET='BOOK28_FAKE_SECRET_NEVER_PRODUCTION';
const previousFetch=globalThis.fetch;
let outside=0;
globalThis.fetch=async()=>{outside++;throw Error('NO_EXTERNAL_NETWORK_BOOK28');};
test.after(()=>{globalThis.fetch=previousFetch;});

function fixture({role='admin',mode='READONLY',valid=true,entries}={}){
  const ledger=entries||[
    {requestKey:'FAKE-1',status:'PREPARED',action:'archiveDeliveredDepartmentV1926',
      createdAt:'2026-10-01 10:00:00',canonicalJson:'PRIVATE_CUSTOMER_NAME_1',responseJson:'PRIVATE_RESPONSE',
      archiveLines:2,archiveOrders:0},
    {requestKey:'FAKE-2',status:'PREPARED',action:'bulkUpdateDepartmentStatusV1926',
      createdAt:'2026-10-01 10:00:00',canonicalJson:'PRIVATE_CUSTOMER_NAME_2',responseJson:'PRIVATE_RESPONSE',
      archiveLines:0,archiveOrders:0},
    {requestKey:'FAKE-COMMITTED',status:'COMMITTED',action:'archiveDeliveredDepartmentV1926',
      createdAt:'2026-09-30 09:00:00',canonicalJson:'PRIVATE_CUSTOMER_NAME_3',
      responseJson:'PRIVATE_RESPONSE',archiveLines:5,archiveOrders:1},
    {requestKey:'FAKE-3',status:'PREPARED',action:'archiveDeliveredDepartmentV1926',
      createdAt:'2026-10-02 10:00:00',canonicalJson:'PRIVATE_CUSTOMER_NAME_4',
      responseJson:'PRIVATE_RESPONSE',archiveLines:0,archiveOrders:0}
  ];
  const calls={sql:[],writes:0,auth:0,ledgerReads:0,all:0,control:0};
  const env={EDGE_SESSION_SECRET:SECRET,TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1:'true'};
  env.DB={
    prepare(sql){
      calls.sql.push(sql);
      assert.match(sql.trimStart(),/^SELECT\b/i,'audit must never prepare business writes');
      return {
        args:[],
        bind(...a){this.args=a;return this;},
        async first(){
          if(sql.includes('FROM employee_auth_sessions_v1 s')){
            calls.auth++;
            const fp=await cloudAuthTokenFingerprint('fake-admin',TOKEN,env);
            if(!valid||this.args[1]!==fp)return null;
            return {canonicalUsername:'fake-admin',role,department:'إدارة',screensJson:'[]',
              sessionVersion:1,currentSessionVersion:1,active:1,
              expiresAtMs:Date.now()+60000,mustChange:0};
          }
          if(sql.includes('FROM employee_core_control_v1')){
            calls.control++;return {mode,policyEpoch:1,dataVersion:4};
          }
          if(sql.includes('COUNT(*) AS n FROM employee_core_request_ledger_v1')){
            calls.ledgerReads++;return {n:ledger.filter(x=>x.status==='PREPARED').length};
          }
          throw Error('UNEXPECTED_FIRST:'+sql.slice(0,80));
        },
        async all(){
          calls.all++;
          if(!sql.includes('FROM employee_core_request_ledger_v1 l'))throw Error('UNEXPECTED_ALL');
          calls.ledgerReads++;
          const [size,offset]=this.args;
          assert.ok(size>=1&&size<=50);assert.ok(offset>=0&&offset<=2450);
          return {results:ledger.filter(x=>x.status==='PREPARED')
            .sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.requestKey.localeCompare(b.requestKey))
            .slice(offset,offset+size)
            .map(x=>({requestKey:x.requestKey,action:x.action,createdAt:x.createdAt,
              archiveLineCount:x.archiveLines,archiveOrderCount:x.archiveOrders,
              canonicalJson:x.canonicalJson,responseJson:x.responseJson}))};
        },
        async run(){calls.writes++;throw Error('FORBIDDEN_LEDGER_MUTATION');}
      };
    },
    async batch(){calls.writes++;throw Error('FORBIDDEN_BATCH');}
  };
  return {env,calls,ledger};
}
async function invoke(f,{username='fake-admin',action='auditPreparedRequestsV1',page,pageSize}={}){
  const req=new Request('https://fixture.invalid/v1/employee/core',{
    method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+TOKEN},
    body:JSON.stringify({username,action,page,pageSize})
  });
  const res=await handleEmployeeCoreNativeRequest(req,f.env);
  return {status:res.status,body:await res.json(),headers:res.headers};
}
test('BOOK28 legacy: verified admin may audit READONLY, with 3 PREPARED and no raw payload',async()=>{
  const f=fixture();
  const {status,body,headers}=await invoke(f);
  assert.equal(status,200);
  assert.equal(body.success,true);
  assert.equal(body.code,'CORE_PREPARED_AUDIT_READONLY_V1');
  assert.equal(body.total,3);
  assert.equal(body.rows.length,3);
  assert.deepEqual(body.rows.map(x=>x.requestId),['FAKE-1','FAKE-2','FAKE-3']);
  assert.equal(body.rows[0].archiveLineCount,2);
  assert.equal(body.rows[0].evidenceCategory,'ARCHIVE_SNAPSHOTS_PRESENT');
  assert.equal(body.rows[1].evidenceCategory,'ARCHIVE_COUNTS_NOT_ACTION_PROOF');
  assert.equal(body.rows[2].evidenceCategory,'NO_ARCHIVE_SNAPSHOT_FOUND');
  assert.equal(body.rows.every(x=>x.safeToReplay===false&&x.safeToDelete===false),true);
  assert.equal(body.autoRepairEnabled,false);
  assert.equal(body.authoritativeBusinessOutcome,false);
  assert.equal(headers.get('cache-control'),'no-store');
  assert.doesNotMatch(JSON.stringify(body),/PRIVATE_CUSTOMER_NAME|PRIVATE_RESPONSE|FAKE-COMMITTED/);
  assert.equal(f.calls.writes,0);
});
test('BOOK28 legacy: verified non-admin fails before any ledger query, despite admin-looking username',async()=>{
  const f=fixture({role:'print'});
  const res=await invoke(f,{username:'fake-admin'});
  assert.equal(res.status,403);
  assert.equal(res.body.code,'manager-access-denied');
  assert.equal(f.calls.ledgerReads,0);
  assert.equal(f.calls.writes,0);
});
test('BOOK28 legacy: unauthenticated token cannot enumerate PREPARED',async()=>{
  const f=fixture({valid:false});
  const res=await invoke(f);
  assert.equal(res.status,401);
  assert.equal(f.calls.ledgerReads,0);
  assert.equal(f.calls.writes,0);
});
test('BOOK28 legacy: OFF mode rejects before authentication or ledger reads',async()=>{
  const f=fixture({mode:'OFF'});
  const res=await invoke(f);
  assert.equal(res.status,423);
  assert.equal(res.body.code,'employee-core-off');
  assert.equal(f.calls.ledgerReads,0);
  assert.equal(f.calls.auth,0);
});
test('BOOK28 legacy: only PREPARED rows returned, pagination consistent',async()=>{
  const f=fixture({mode:'GENERAL'});
  const first=await invoke(f,{page:1,pageSize:2});
  const second=await invoke(f,{page:2,pageSize:2});
  assert.deepEqual(first.body.rows.map(x=>x.requestId),['FAKE-1','FAKE-2']);
  assert.equal(first.body.hasMore,true);
  assert.deepEqual(second.body.rows.map(x=>x.requestId),['FAKE-3']);
  assert.equal(second.body.hasMore,false);
  assert.equal(first.body.total,3);
  assert.equal(f.calls.writes,0);
});
test('BOOK28 legacy: clamps oversized/invalid pagination, no evidence means UNKNOWN not safe',async()=>{
  const f=fixture();
  const a=await invoke(f,{page:-9,pageSize:999999});
  assert.equal(a.body.page,1);
  assert.equal(a.body.pageSize,50);
  assert.equal(a.body.rows[2].safeToReplay,false);
  const b=await invoke(f,{page:'nope',pageSize:'nope'});
  assert.equal(b.body.page,1);
  assert.equal(b.body.pageSize,20);
  assert.equal(f.calls.writes,0);
});
test('BOOK28 legacy: source module remains read-only even when called standalone',async()=>{
  const f=fixture();
  const result=await readCorePreparedRequestsV1(f.env,{page:2,pageSize:1});
  assert.equal(result.rows.length,1);
  assert.equal(result.rows[0].requestId,'FAKE-2');
  assert.equal(f.calls.writes,0);
  assert.equal(f.calls.ledgerReads,2);
});
test('BOOK28 legacy: zero PREPARED must not imply empty historical issues solved',async()=>{
  const f=fixture({entries:[{requestKey:'FAKE-COMMITTED',status:'COMMITTED',action:'bulk',
    createdAt:'2026-09-30',archiveLines:2,archiveOrders:1}]});
  const res=await invoke(f);
  assert.equal(res.status,200);
  assert.equal(res.body.total,0);
  assert.equal(res.body.authoritativeBusinessOutcome,false);
  assert.equal(res.body.rows.length,0);
  assert.equal(f.calls.writes,0);
});
test('BOOK28 legacy: any read error fails, never falls back to automatic ledger cleanup',async()=>{
  const f=fixture();
  const saved=f.env.DB.prepare;
  f.env.DB.prepare=(sql)=>{
    const statement=saved(sql);
    if(sql.includes('COUNT(*) AS n FROM employee_core_request_ledger_v1')){
      statement.first=async()=>{throw Error('SYNTHETIC_DATABASE_READ_FAILED');};
    }
    return statement;
  };
  const res=await invoke(f);
  assert.equal(res.status,500);
  assert.equal(f.calls.writes,0);
});
test('BOOK28 legacy: test suite never requests external Google or Cloudflare services',()=>{
  assert.equal(outside,0);
});
