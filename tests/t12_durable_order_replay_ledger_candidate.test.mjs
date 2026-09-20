import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const path='cloudflare-d1/t12-preview/t12-durable-order-replay-ledger-candidate.gs';
const src=fs.readFileSync(path,'utf8');
const names=[
  'trendosDurableReplayV1Identity_','trendosDurableReplayV1Lookup_',
  'trendosDurableReplayV1Reserve_','trendosDurableReplayV1Commit_'
];
for(const name of names)assert.match(src,new RegExp('function '+name+'\\('));
for(const banned of [/\.setProperty\s*\(/,/\.deleteProperty\s*\(/,
   /ScriptApp\.newTrigger/,/d1FullPost_\s*\(/,/createManualOrder_\s*\(/]){
  assert.doesNotMatch(src,banned,'no production hot-path/property/trigger mutation');
}

const headers=['keyDigest','payloadDigest','state','responseJson','orderId',
  'lineId','createdAt','updatedAt','schemaVersion'];
function setup(mode='ok'){
  const rows=[headers.slice()], flushes=[], mutations=[];
  let throwFlushAt=0, sheet=null;
  function range(r,c,n=1,w=1){
    return {
      getDisplayValues(){return rows.slice(r-1,r-1+n).map(x=>x.slice(c-1,c-1+w))},
      getValues(){return rows.slice(r-1,r-1+n).map(x=>x.slice(c-1,c-1+w))},
      createTextFinder(text){
        return {matchEntireCell(v){assert.equal(v,true);return this},
          findAll(){
            return rows.slice(r-1,r-1+n).map((x,i)=>({x,row:i+r})).
              filter(z=>String(z.x[c-1])===text).map(z=>({getRow:()=>z.row}));
          }
        };
      },
      setValues(values){
        assert.equal(values.length,n);assert.equal(values[0].length,w);
        mutations.push('setValues');
        for(let i=0;i<n;i++)for(let j=0;j<w;j++)rows[r+i-1][c+j-1]=values[i][j];
      },
      setValue(value){
        assert.equal(n,1);assert.equal(w,1);
        mutations.push('setValue:'+c); rows[r-1][c-1]=value;
      }
    };
  }
  sheet={
    getLastColumn(){return mode==='badHeader'?8:9},
    getLastRow(){return rows.length},
    getRange:range,
    appendRow(values){
      assert.equal(values.length,9);
      mutations.push('appendRow'); rows.push(values.slice());
    }
  };
  const heldLock={hasLock:()=>true}, unheldLock={hasLock:()=>false};\n  const ss={\n    getId:()=>mode==='wrongWorkbook'?'wrong':'1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI',
    getSheetByName(name){return mode==='missingSheet'?null:
      name==='TRENDOS_ORDER_REQUEST_LEDGER_V1'?sheet:null;}
  };
  const sandbox={
    Utilities:{
      DigestAlgorithm:{SHA_256:'SHA_256'},Charset:{UTF_8:'UTF_8'},
      computeDigest(alg,text,charset){
        assert.equal(alg,'SHA_256');assert.equal(charset,'UTF_8');
        return [...createHash('sha256').update(text,'utf8').digest()].map(b=>b>127?b-256:b);
      }
    },
    SpreadsheetApp:{flush(){flushes.push(true);if(throwFlushAt===flushes.length){
      throw Error('SIMULATED_FLUSH_FAILURE');
    }}}
  };
  vm.createContext(sandbox); vm.runInContext(src,sandbox,{filename:path});
  const identity=(req='co_1234567890123_abc',qty='2')=>
    sandbox.trendosDurableReplayV1Identity_(req,'wael',{
      clientRequestId:req,username:'wael',token:'SUPER_SECRET',
      customerName:'a customer',itemName:'mug',qty
    });
  return {sandbox,ss,rows,mutations,flushes,identity,heldLock,unheldLock,\n    failFlushAt(n){throwFlushAt=n},
    lookup(x){return sandbox.trendosDurableReplayV1Lookup_(ss,x,heldLock)},\n    reserve(x){return sandbox.trendosDurableReplayV1Reserve_(ss,x,heldLock)},\n    commit(r,response){return sandbox.trendosDurableReplayV1Commit_(ss,r,response,heldLock)}};
}
{
  const x=setup(),key=x.identity();
  assert.throws(()=>x.sandbox.trendosDurableReplayV1Lookup_(x.ss,key),
    /DURABLE_REPLAY_GLOBAL_SCRIPT_LOCK_REQUIRED/);
  assert.throws(()=>x.sandbox.trendosDurableReplayV1Reserve_(x.ss,key,x.unheldLock),
    /DURABLE_REPLAY_GLOBAL_SCRIPT_LOCK_REQUIRED/);
  assert.throws(()=>x.sandbox.trendosDurableReplayV1Commit_(x.ss,
    {kind:'RESERVED'}, {success:true,orderId:'a',lineId:'b'}, x.unheldLock),
    /DURABLE_REPLAY_GLOBAL_SCRIPT_LOCK_REQUIRED/);
  assert.equal(x.rows.length,1,'no ledger reservation without acquired lock');
}

const response={success:true,orderId:'ORD-101',lineId:'ORD-101-01',
    message:'business create complete',linesCreated:1};
{
  const x=setup(),key=x.identity(),same=x.identity();
  assert.equal(key.keyDigest,same.keyDigest);
  assert.equal(key.payloadDigest,same.payloadDigest);
  assert.equal(key.keyDigest.length,64);
  assert.notEqual(x.identity('co_1234567890123_other').keyDigest,key.keyDigest);
  assert.notEqual(x.identity('co_1234567890123_abc','3').payloadDigest,key.payloadDigest);
  assert.equal(x.lookup(key).kind,'NEW');
  let reserved=x.reserve(key);
  assert.equal(reserved.kind,'RESERVED');
  assert.equal(x.rows.length,2);
  assert.equal(x.lookup(key).kind,'PENDING');
  assert.equal(x.reserve(key).kind,'PENDING');
  assert.equal(x.rows.length,2,'same key cannot create second reservation');
  assert.equal(x.lookup(x.identity('co_1234567890123_abc','3')).kind,'CONFLICT');
  assert.equal(x.lookup(x.identity('co_1234567890123_other')).kind,'NEW');
  let committed=x.commit(reserved,response);
  assert.equal(committed.kind,'COMMITTED');
  const replay=x.lookup(key);
  assert.equal(replay.kind,'REPLAY');
  assert.equal(replay.response.orderId,'ORD-101');
  assert.equal(replay.response.duplicatePrevented,true);
  assert.equal(replay.response.idempotentReplay,true);
  assert.equal(x.reserve(key).kind,'REPLAY','same request never reserves again');
  assert.equal(x.rows.length,2);
  assert.throws(()=>x.commit(reserved,response),/DURABLE_REPLAY_COMMIT_MISMATCH/);
  assert.equal(x.mutations.filter(m=>m==='appendRow').length,1);
  assert.equal(x.rows[1].join(' ').includes('SUPER_SECRET'),false);
  assert.equal(x.rows[1].join(' ').includes('a customer'),false);
  assert.equal(x.rows[1][8],'1');
}
{
  const x=setup(),key=x.identity(),r=x.reserve(key);
  // Writer crashes midway through business Order/Line writes:
  // PENDING remains forever; automatic replay is denied.
  assert.equal(x.lookup(key).kind,'PENDING');
  assert.equal(x.reserve(key).kind,'PENDING');
  assert.equal(x.rows.length,2);
  assert.equal(x.mutations.filter(m=>m==='appendRow').length,1);
  assert.throws(()=>x.commit(r,{success:true,orderId:'ORD',lineId:''}),
    /DURABLE_REPLAY_INVALID_COMMIT/);
}
{
  const x=setup(),key=x.identity();
  x.failFlushAt(1);
  assert.throws(()=>x.reserve(key),/SIMULATED_FLUSH_FAILURE/);
  assert.equal(x.lookup(key).kind,'PENDING');
  assert.equal(x.rows.length,2,'reservation may persist after flush error');
}
{
  const x=setup(),key=x.identity(),r=x.reserve(key);
  x.failFlushAt(2);
  assert.throws(()=>x.commit(r,response),/SIMULATED_FLUSH_FAILURE/);
  assert.equal(x.lookup(key).kind,'PENDING');
  assert.equal(x.rows.length,2,'partial commit must not create another row');
}
{
  const x=setup(),key=x.identity(),r=x.reserve(key);
  x.failFlushAt(3);
  assert.throws(()=>x.commit(r,response),/SIMULATED_FLUSH_FAILURE/);
  assert.equal(x.lookup(key).kind,'REPLAY',
    'if the commit status was stored before flush failed, replay is possible');
  assert.equal(x.reserve(key).kind,'REPLAY');
  assert.equal(x.rows.length,2);
}
for(const bad of ['wrongWorkbook','missingSheet','badHeader']){
  const x=setup(bad),key=x.identity();
  assert.throws(()=>x.lookup(key),/DURABLE_REPLAY_/);
  assert.throws(()=>x.reserve(key),/DURABLE_REPLAY_/);
  assert.equal(x.rows.length,1);
}
{
  const x=setup(),key=x.identity();
  assert.throws(()=>x.sandbox.trendosDurableReplayV1Identity_(
    '', 'wael',{}),/DURABLE_REPLAY_INVALID_REQUEST/);
  assert.throws(()=>x.sandbox.trendosDurableReplayV1Identity_(
    'good','wael',{extra:{unexpected:'object'}}),/DURABLE_REPLAY_UNSUPPORTED_PAYLOAD_TYPE/);
  x.reserve(key);x.rows.push(x.rows[1].slice());
  assert.throws(()=>x.lookup(key),/DURABLE_REPLAY_DUPLICATE_DIGEST/);
}
console.log('Durable replay candidate isolated PASS: held global ScriptLock required, same-key single reserve, pending/timeout fail-closed, replay, payload conflicts, ledger identity, no Property writes');
