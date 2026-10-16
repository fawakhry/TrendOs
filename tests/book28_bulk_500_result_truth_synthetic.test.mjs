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

function fakeD1({size=501,status='طلب جديد',native=0}={}){
  const lines=Array.from({length:size},(_,i)=>({
    orderId:'FAKE-ORDER-1',lineId:'FAKE-LINE-'+i,
    status,department:'طباعة',sourceKind:i<native?'t12-prod':'core-import',
    itemName:'FAKE-ITEM',qty:1,notes:'',active:1
  }));
  const ledger=new Map(),events=[];
  const calls={batches:[],preparedBusiness:0,ledgerCommits:0,auth:0,reads:0};
  // Controlled fault points emulate atomic SQLite rollback and lost HTTP ACK.
  const fault={once:'',atBatchIndex:-1};
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
          if(fault.once==='before-read'){
            fault.once='';
            throw Error('FAKE_READ_INTERRUPTED');
          }
          if(sql.includes('FROM t12_prod_lines l'))return {results:lines.filter(r=>r.sourceKind==='t12-prod').map(r=>({...r}))};
          if(sql.includes('FROM employee_core_lines_v1 l'))
            return {results:lines.filter(r=>r.active&&r.sourceKind==='core-import').map(r=>({...r}))};
          if(sql.includes('FROM employee_core_delivery_restrictions_v1'))return {results:[]};
          throw Error('UNEXPECTED_D1_ALL:'+sql.slice(0,65));
        },
        async run(){
          if(sql.includes('INSERT INTO employee_core_request_ledger_v1')){
            const [key,action,actor,canonical]=this.args;
            if(ledger.has(key))throw Error('FAKE_DUPLICATE_REQUEST_KEY');
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
      const before=lines.map(x=>({...x})),prior=new Map(ledger),eventLen=events.length;
      const initialCommits=calls.ledgerCommits;
      const mode=fault.once;fault.once='';
      let committed=false;
      try{
        for(let idx=0;idx<stmts.length;idx++){
          const stmt=stmts[idx],sql=stmt.sql;
          if(mode==='mid-batch'&&idx>=1)throw Error('FAKE_D1_TRANSACTION_FAILED');
          if(sql.includes('INSERT INTO employee_core_request_ledger_v1')){
            const [key,action,actor,canonical]=stmt.args;
            if(ledger.has(key))throw Error('FAKE_DUPLICATE_REQUEST_KEY');
            ledger.set(key,{canonicalJson:canonical,responseJson:'',status:'PREPARED'});
          }else if(sql.includes('UPDATE employee_core_lines_v1 SET status=')){
            const line=lines.find(x=>x.lineId===stmt.args[2]);
            if(!line)throw Error('UNKNOWN_FAKE_LINE');
            line.status=stmt.args[0];
          }else if(sql.includes('INTO t12_prod_line_runtime(')){
            const line=lines.find(x=>x.lineId===stmt.args[0]);
            if(!line)throw Error('UNKNOWN_FAKE_NATIVE_LINE');
            line.status=stmt.args[2];
          }else if(sql.includes('UPDATE employee_core_lines_v1 SET active=0')){
            const line=lines.find(x=>x.lineId===stmt.args[1]);
            if(!line)throw Error('UNKNOWN_FAKE_ARCHIVE_LINE');
            line.active=0;
          }else if(sql.includes("UPDATE employee_core_request_ledger_v1 SET status='COMMITTED'")){
            const [response,key]=stmt.args,old=ledger.get(key);
            assert.ok(old,'missing fake ledger');
            ledger.set(key,{...old,status:'COMMITTED',responseJson:response});
            calls.ledgerCommits++;
            committed=true;
          }else if(sql.includes('FROM json_each(?)')&&sql.includes('INTO employee_core_events_v1')){
            const rows=JSON.parse(stmt.args[5]);
            for(const row of rows)events.push({kind:'line-status',lineId:row.lineId,orderId:row.orderId});
          }else if(sql.includes('FROM json_each(?)')&&sql.includes('INTO t12_prod_runtime_events')){
            const rows=JSON.parse(stmt.args[4]);
            for(const row of rows)events.push({kind:'native-status',lineId:row.lineId,orderId:row.orderId});
          }else if(sql.includes("VALUES(?,?,?,?,?)")&&sql.includes('INTO employee_core_events_v1')){
            events.push({kind:'bulk',actor:stmt.args[3]});
          }
        }
        if(mode==='after-commit-ack'&&committed)throw Error('FAKE_NETWORK_ACK_LOST');
        return stmts.map(()=>({success:true,meta:{changes:1}}));
      }catch(err){
        // Model D1 batch transactional rollback on a failed SQL step.
        // Lost response after successful COMMITTED is explicitly NOT rolled back.
        if(!(mode==='after-commit-ack'&&committed)){
          for(let i=0;i<lines.length;i++)Object.assign(lines[i],before[i]);
          ledger.clear();for(const [k,v] of prior)ledger.set(k,v);
          events.length=eventLen;calls.ledgerCommits=initialCommits;
        }
        throw err;
      }
    }
  };
  return {env,lines,calls,ledger,events,fault};
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

test('BOOK28-CORE-RECOVERY: read failure never strands PREPARED',async()=>{
  const f=fakeD1({size:2});
  f.fault.once='before-read';
  const failed=await run(f,'bulkUpdateDepartmentStatusV1926','FAKE-RECOVERY-READ');
  assert.equal(failed.status,500);
  assert.equal(f.ledger.size,0);
  assert.equal(f.lines.filter(x=>x.status==='طلب جديد').length,2);
  const ok=await run(f,'bulkUpdateDepartmentStatusV1926','FAKE-RECOVERY-READ');
  assert.equal(ok.status,200);
  assert.equal(ok.body.changed,2);
  assert.equal(f.ledger.get('FAKE-RECOVERY-READ').status,'COMMITTED');
});
test('BOOK28-CORE-RECOVERY: atomic D1 failure rolls back lines, events and ledger',async()=>{
  const f=fakeD1({size:3});
  f.fault.once='mid-batch';
  const failed=await run(f,'bulkUpdateDepartmentStatusV1926','FAKE-RECOVERY-BATCH');
  assert.equal(failed.status,500);
  assert.equal(f.ledger.size,0,'no permanent PREPARED after failed atomic D1 batch');
  assert.equal(f.events.length,0);
  assert.equal(f.lines.filter(x=>x.status==='طلب جديد').length,3);
  const succeeded=await run(f,'bulkUpdateDepartmentStatusV1926','FAKE-RECOVERY-BATCH');
  assert.equal(succeeded.status,200);
  assert.equal(succeeded.body.changed,3);
  assert.equal(f.lines.filter(x=>x.status==='بدأ التنفيذ').length,3);
  assert.equal(f.events.filter(x=>x.kind==='line-status').length,3);
  assert.equal(f.events.filter(x=>x.kind==='bulk').length,1);
});
test('BOOK28-CORE-RECOVERY: lost HTTP ACK after commit returns saved result on same requestId',async()=>{
  const f=fakeD1({size:4});
  f.fault.once='after-commit-ack';
  const lost=await run(f,'bulkUpdateDepartmentStatusV1926','FAKE-RECOVERY-ACK');
  assert.equal(lost.status,500);
  assert.equal(f.lines.filter(x=>x.status==='بدأ التنفيذ').length,4);
  assert.equal(f.ledger.get('FAKE-RECOVERY-ACK').status,'COMMITTED');
  assert.equal(f.events.filter(x=>x.kind==='line-status').length,4);
  const batchCount=f.calls.batches.length;
  const replay=await run(f,'bulkUpdateDepartmentStatusV1926','FAKE-RECOVERY-ACK');
  assert.equal(replay.status,200);
  assert.equal(replay.body.changed,4);
  assert.equal(f.calls.batches.length,batchCount,'replay has zero new D1 business writes');
  assert.equal(f.events.filter(x=>x.kind==='line-status').length,4);
});
test('BOOK28-CORE-RECOVERY: 500 selected lines need fewer than 510 statements',async()=>{
  const f=fakeD1({size:501});
  const res=await run(f,'bulkUpdateDepartmentStatusV1926','FAKE-RECOVERY-LIMIT');
  assert.equal(res.status,200);
  assert.equal(res.body.selectedLines,500);
  assert.equal(res.body.remainingDueToLimit,1);
  assert.ok(f.calls.batches[0]<510,'set-wise audit keeps D1 statement count bounded');
  assert.equal(f.events.filter(x=>x.kind==='line-status').length,500);
});

test('BOOK28-CORE-RECOVERY: mixed imported/native writes preserve one audit per changed line',async()=>{
  const f=fakeD1({size:4,native:2});
  const response=await run(f,'bulkUpdateDepartmentStatusV1926','FAKE-RECOVERY-MIXED');
  assert.equal(response.status,200);
  assert.equal(response.body.changed,4);
  assert.equal(f.lines.filter(x=>x.status==='بدأ التنفيذ').length,4);
  assert.equal(f.events.filter(x=>x.kind==='native-status').length,2);
  assert.equal(f.events.filter(x=>x.kind==='line-status').length,2);
  assert.equal(f.events.filter(x=>x.kind==='bulk').length,1);
});
