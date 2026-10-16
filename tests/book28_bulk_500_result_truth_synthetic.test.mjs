// BOOK28: 501+ fake Core rows, one fixed 500-row window, no production D1.
import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {handleEmployeeCoreNativeRequest,coreBulkWindowV28} from '../cloudflare-d1/src/employee-core-native-v1.mjs';
import {cloudAuthTokenFingerprint} from '../cloudflare-d1/src/cloud-auth-shadow-v1.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const SECRET='SYNTHETIC_BULK_SECRET';
const TOKEN='FAKE_BULK_TOKEN';
const previousFetch=globalThis.fetch;
let outside=0;
globalThis.fetch=async()=>{outside++;throw Error('NO_REMOTE_NETWORK');};
test.after(()=>{globalThis.fetch=previousFetch;});

test('BOOK28: full source window explicitly reports 500 selected and remaining 1, 701, zero',()=>{
  for(const [size,selected,remaining] of [[0,0,0],[1,1,0],[500,500,0],[501,500,1],[1201,500,701]]){
    const items=Array.from({length:size},(_,i)=>i);
    const w=coreBulkWindowV28(items);
    assert.equal(w.totalMatched,size);
    assert.equal(w.selectedLines,selected);
    assert.equal(w.remainingDueToLimit,remaining);
    assert.equal(w.partialByLimit,remaining>0);
    assert.equal(w.items.length,selected);
  }
  assert.equal(coreBulkWindowV28(null).totalMatched,0);
});

function fakeD1({size=501,status='طلب جديد'}={}){
  const lines=Array.from({length:size},(_,i)=>({
    orderId:'FAKE-ORDER-1',lineId:'FAKE-LINE-'+i,
    status,department:'طباعة',sourceKind:'core-import',
    itemName:'FAKE-ITEM',qty:1,notes:'',active:1
  }));
  const ledger=new Map();
  const calls={batches:[],preparedBusiness:0,ledgerCommits:0,auth:0,reads:0};
  const env={EDGE_SESSION_SECRET:SECRET,TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1:'true'};
  env.DB={
    prepare(sql){
      return {
        sql,args:[],
        bind(...args){this.args=args;return this;},
        async first(){
          if(sql.includes('FROM employee_auth_sessions_v1 s')){
            calls.auth++;
            const fp=await cloudAuthTokenFingerprint('fake-admin',TOKEN,env);
            if(this.args[1]!==fp)return null;
            return {canonicalUsername:'fake-admin',role:'admin',department:'إدارة',screensJson:'[]',
              sessionVersion:1,currentSessionVersion:1,active:1,expiresAtMs:Date.now()+60000,mustChange:0};
          }
          if(sql.includes('FROM employee_core_control_v1'))return {mode:'GENERAL',policyEpoch:1,dataVersion:1};
          if(sql.includes('FROM employee_core_request_ledger_v1'))return ledger.get(this.args[0])||null;
          if(sql.includes('FROM employee_core_orders_v1')||sql.includes('FROM t12_prod_orders'))return null;
          throw Error('UNEXPECTED_D1_FIRST:'+sql.slice(0,65));
        },
        async all(){
          calls.reads++;
          if(sql.includes('FROM t12_prod_lines l'))return {results:[]};
          if(sql.includes('FROM employee_core_lines_v1 l'))
            return {results:lines.filter(r=>r.active).map(r=>({...r}))};
          if(sql.includes('FROM employee_core_delivery_restrictions_v1'))return {results:[]};
          throw Error('UNEXPECTED_D1_ALL:'+sql.slice(0,65));
        },
        async run(){
          if(sql.includes('INSERT INTO employee_core_request_ledger_v1')){
            const [key,action,actor,canonical]=this.args;
            ledger.set(key,{canonicalJson:canonical,responseJson:'',status:'PREPARED'});
          }else if(sql.includes("UPDATE employee_core_request_ledger_v1 SET status='COMMITTED'")){
            const [response,key]=this.args;
            const old=ledger.get(key);
            assert.ok(old,'missing fake ledger');
            ledger.set(key,{...old,status:'COMMITTED',responseJson:response});
            calls.ledgerCommits++;
          }else if(/employee_core_lines_v1|t12_prod_line_runtime/.test(sql)){
            calls.preparedBusiness++;
          }
          return {success:true,meta:{changes:1}};
        }
      };
    },
    async batch(stmts){
      calls.batches.push(stmts.length);
      for(const stmt of stmts){
        if(stmt.sql.includes('UPDATE employee_core_lines_v1 SET status=')){
          const line=lines.find(x=>x.lineId===stmt.args[2]);
          if(!line)throw Error('UNKNOWN_FAKE_LINE');
          line.status=stmt.args[0];
        }else if(stmt.sql.includes('UPDATE employee_core_lines_v1 SET active=0')){
          const line=lines.find(x=>x.lineId===stmt.args[1]);
          if(!line)throw Error('UNKNOWN_FAKE_ARCHIVE_LINE');
          line.active=0;
        }
      }
      return stmts.map(()=>({success:true}));
    }
  };
  return {env,lines,calls,ledger};
}
async function run(f,action,requestId){
  const p={username:'fake-admin',action,screen:'print',requestId};
  if(action==='bulkUpdateDepartmentStatusV1926'){
    p.fromStatus='طلب جديد';p.toStatus='بدأ التنفيذ';
  }
  const request=new Request('https://fixture.invalid/v1/employee/core',{
    method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+TOKEN},body:JSON.stringify(p)
  });
  const response=await handleEmployeeCoreNativeRequest(request,f.env);
  return {status:response.status,body:await response.json()};
}
test('BOOK28: 501 matching lines change 500, accurately report 1 remaining, replay idempotent, then finish',async()=>{
  const f=fakeD1();
  const a=await run(f,'bulkUpdateDepartmentStatusV1926','FAKE-BULK-FIRST');
  assert.equal(a.status,200);
  assert.equal(a.body.success,true);
  assert.equal(a.body.matchedLines,501);
  assert.equal(a.body.selectedLines,500);
  assert.equal(a.body.changed,500);
  assert.equal(a.body.remainingDueToLimit,1);
  assert.equal(a.body.partialByLimit,true);
  assert.match(a.body.message,/500/);
  assert.match(a.body.message,/تبقى 1/);
  assert.equal(f.lines.filter(x=>x.status==='بدأ التنفيذ').length,500);
  const batchCount=f.calls.batches.length;
  const replay=await run(f,'bulkUpdateDepartmentStatusV1926','FAKE-BULK-FIRST');
  assert.deepEqual(replay.body,a.body);
  assert.equal(f.calls.batches.length,batchCount,'replay MUST not run a second mutation');
  const b=await run(f,'bulkUpdateDepartmentStatusV1926','FAKE-BULK-SECOND');
  assert.equal(b.status,200);
  assert.equal(b.body.matchedLines,1);
  assert.equal(b.body.changed,1);
  assert.equal(b.body.remainingDueToLimit,0);
  assert.equal(b.body.partialByLimit,false);
  assert.equal(f.lines.filter(x=>x.status==='بدأ التنفيذ').length,501);
});
test('BOOK28: archive 501 delivered lines reports partial and keeps last until second request',async()=>{
  const f=fakeD1({status:'تم التسليم'});
  const a=await run(f,'archiveDeliveredDepartmentV1926','FAKE-ARCHIVE-FIRST');
  assert.equal(a.status,200);
  assert.equal(a.body.archivedLines,500);
  assert.equal(a.body.matchedLines,501);
  assert.equal(a.body.remainingDueToLimit,1);
  assert.equal(a.body.partialByLimit,true);
  assert.equal(f.lines.filter(x=>x.active).length,1);
  const count=f.calls.batches.length;
  const duplicate=await run(f,'archiveDeliveredDepartmentV1926','FAKE-ARCHIVE-FIRST');
  assert.deepEqual(duplicate.body,a.body);
  assert.equal(f.calls.batches.length,count);
  const b=await run(f,'archiveDeliveredDepartmentV1926','FAKE-ARCHIVE-SECOND');
  assert.equal(b.body.archivedLines,1);
  assert.equal(b.body.matchedLines,1);
  assert.equal(b.body.remainingDueToLimit,0);
  assert.equal(b.body.partialByLimit,false);
  assert.equal(f.lines.filter(x=>x.active).length,0);
});
test('BOOK28: a 500-line exact window never advertises partial completion',async()=>{
  const f=fakeD1({size:500});
  const a=await run(f,'bulkUpdateDepartmentStatusV1926','FAKE-BULK-EXACT');
  assert.equal(a.body.changed,500);
  assert.equal(a.body.remainingDueToLimit,0);
  assert.equal(a.body.partial,false);
});
test('BOOK28: all fake tests abstain from network access',()=>assert.equal(outside,0));
