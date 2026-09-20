import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {
  createT12CloudNativeSynthetic,T12_CLOUD_NATIVE_SYNTHETIC_VERSION
} from '../cloudflare-d1/src/t12-cloud-native-synthetic-create.mjs';

const schema=fs.readFileSync(new URL('../cloudflare-d1/schema-prep/t12-cloud-native-synthetic-create-v1.sql',import.meta.url),'utf8');
const candidate=fs.readFileSync(new URL('../cloudflare-d1/src/t12-cloud-native-synthetic-create.mjs',import.meta.url),'utf8');
const worker=fs.readFileSync(new URL('../cloudflare-d1/src/index_v2.js',import.meta.url),'utf8');
const prod=fs.readFileSync(new URL('../cloudflare-d1/production-shadow/index.js',import.meta.url),'utf8');
const wrangler=fs.readFileSync(new URL('../cloudflare-d1/wrangler.toml',import.meta.url),'utf8');
for(const [name,source] of [['worker',worker],['prod',prod],['wrangler',wrangler]]) {
  assert.doesNotMatch(source,/t12-cloud-native-synthetic-create/,'must never wire synthetic create into '+name);
}
for(const forbidden of [/\bCREATE\s+TABLE\s+(?:orders|sheet_rows|cloud_write_events)\b/i,
  /\bDROP\s+TABLE\b/i,/\bDELETE\s+FROM\b/i])assert.doesNotMatch(schema,forbidden);
assert.doesNotMatch(candidate,/PropertiesService|ScriptApp|SpreadsheetApp|fetch\s*\(|new\s+Response\s*\(/);
assert.match(T12_CLOUD_NATIVE_SYNTHETIC_VERSION,/SYNTHETIC/);

class Stmt {
  constructor(db,sql){this.db=db;this.sql=sql;this.params=[];}
  bind(...params){this.params=params;return this;}
  async first(){return this.db.raw.prepare(this.sql).get(...this.params)||null;}
  async run(){return this.db.raw.prepare(this.sql).run(...this.params);}
}
class SyntheticD1 {
  constructor({seed=true,misconfigured=false,missingSchema=false}={}){
    this.raw=new DatabaseSync(':memory:');
    this.raw.exec('PRAGMA foreign_keys=ON;');
    if(!missingSchema)this.raw.exec(schema);
    if(!missingSchema&&seed){
      this.raw.prepare(`INSERT INTO t12_synth_control
        (singleton,fixture_marker,google_writer_fenced,r5_mirror_writer_fenced,next_order_number)
        VALUES (1,?,?,?,1601)`).run('T12_SYNTHETIC_ONLY',misconfigured?0:1,1);
    }
    this.failStatement=0;this.ambiguousAfterCommit=false;
  }
  prepare(sql){return new Stmt(this,sql);}
  async batch(statements){
    this.raw.exec('BEGIN IMMEDIATE');
    try {
      for(let i=0;i<statements.length;i++){
        if(this.failStatement===i+1)throw Error('SIMULATED_MID_TRANSACTION_FAILURE');
        await statements[i].run();
      }
      this.raw.exec('COMMIT');
    }catch(e){
      try{this.raw.exec('ROLLBACK');}catch{}
      throw e;
    }
    if(this.ambiguousAfterCommit)throw Error('SIMULATED_LOST_SUCCESS_AFTER_COMMIT');
  }
  count(name){return Number(this.raw.prepare('SELECT COUNT(*) AS n FROM '+name).get().n);}
  sequence(){return Number(this.raw.prepare('SELECT next_order_number AS n FROM t12_synth_control').get().n);}
  close(){this.raw.close();}
}
const gates={mode:'isolated-cloud-native-synthetic-qualification',
  allowSyntheticBusinessCreate:true,testDatabaseIsolationVerified:true,
  googleCreateFrozenInTest:true,r5MirrorFencedInTest:true,edgeSessionVerifiedInTest:true};
const params=(key='co_1790000000000_TEST001',qty=1)=>({
  clientRequestId:key,customerName:'SYNTHETIC TEST CUSTOMER',
  customerPhone:'01000000000',itemName:'TEST MUG',qty,
  department:'طباعة',priority:'عادي',status:'طلب جديد'
});
const actor='SYNTHETIC-EMPLOYEE';
async function add(db,input=params(),who=actor,g=gates) {
  return createT12CloudNativeSynthetic(db,input,who,g);
}
function noBusinessWrites(db){
  for(const n of ['t12_synth_request_ledger','t12_synth_orders',
    't12_synth_lines','t12_synth_events','t12_synth_outbox']){
    assert.equal(db.count(n),0,'unapproved test create mutated '+n);
  }
  assert.equal(db.sequence(),1601,'unapproved create advanced number allocator');
}
function complete(db,n){
  for(const x of ['t12_synth_request_ledger','t12_synth_orders',
    't12_synth_lines','t12_synth_events','t12_synth_outbox']) {
    assert.equal(db.count(x),n,'atomic records missing '+x);
  }
}
{
  const db=new SyntheticD1();
  assert.equal((await add(db,params(),actor,{})).reason,'synthetic-exclusive-gates-not-met');
  for(const key of Object.keys(gates)){
    assert.equal((await add(db,params(),actor,{...gates,[key]:false})).success,false);
  }
  assert.equal((await add(db,{...params(),username:'secret'})).reason,'synthetic-input-shape-refused');
  assert.equal((await add(db,{...params(),department:'ليزر'})).reason,
    'unsupported-canonical-business-case-not-qualified');
  assert.equal((await add(db,{...params(),department:'متعدد الأقسام'})).success,false);
  assert.equal((await add(db,{...params(),forceCreate:'YES'})).success,false);
  assert.equal((await add(db,params(),'')).reason,'authenticated-test-actor-required');
  noBusinessWrites(db);db.close();
}
for(const db of [new SyntheticD1({seed:false})]){
  assert.equal((await add(db)).reason,'synthetic-db-identity-or-writer-fence-mismatch');
  db.close();
}
{
  const db=new SyntheticD1({missingSchema:true});
  assert.equal((await add(db)).reason,'synthetic-test-schema-unavailable');
  db.close();
}
{
  const db=new SyntheticD1();
  const first=await add(db);
  assert.equal(first.success,true);
  assert.equal(first.syntheticOnly,true);
  assert.equal(first.productionAuthorized,false);
  assert.equal(first.stored,true);
  assert.equal(first.idempotent,false);
  assert.equal(first.orderId,'1601');
  assert.equal(first.lineId,'1601-01');
  assert.equal(db.sequence(),1602);
  complete(db,1);
  const saved=await add(db);
  assert.equal(saved.success,true);
  assert.equal(saved.idempotent,true);
  assert.equal(saved.stored,false);
  assert.equal(saved.orderId,first.orderId);
  assert.equal(db.sequence(),1602);
  complete(db,1);
  const badPayload=await add(db,params(undefined,2));
  assert.equal(badPayload.reason,'same-key-actor-or-payload-conflict');
  const differentActor=await add(db,params(), 'ANOTHER-SYNTHETIC-EMPLOYEE');
  assert.equal(differentActor.reason,'same-key-actor-or-payload-conflict');
  assert.equal(db.sequence(),1602);
  complete(db,1);
  const second=await add(db,params('co_1790000000001_TEST002'));
  assert.equal(second.orderId,'1602');
  assert.equal(second.lineId,'1602-01');
  assert.equal(db.sequence(),1603);
  complete(db,2);
  db.raw.prepare("DELETE FROM t12_synth_outbox WHERE request_key=?")
    .run(params().clientRequestId);
  const partial=await add(db);
  assert.equal(partial.reason,'existing-transaction-incomplete-no-retry');
  assert.equal(db.sequence(),1603);
  db.close();
}
for(const failAt of [1,2,3,4,5,6]){
  const db=new SyntheticD1();
  db.failStatement=failAt;
  const r=await add(db);
  assert.equal(r.success,false);
  assert.equal(r.reason,'transaction-outcome-unknown-no-retry');
  noBusinessWrites(db);
  db.close();
}
{
  const db=new SyntheticD1();
  db.ambiguousAfterCommit=true;
  const r=await add(db);
  assert.equal(r.success,true,'after lost response, readback can confirm committed result');
  assert.equal(r.idempotent,true);
  assert.equal(r.stored,false);
  assert.equal(r.orderId,'1601');
  complete(db,1);
  assert.equal(db.sequence(),1602);
  db.close();
}
{
  const db=new SyntheticD1();
  const jobs=await Promise.all(Array.from({length:8},()=>add(db)));
  assert.equal(jobs.every(r=>r.success===true),true);
  assert.equal(new Set(jobs.map(r=>r.orderId)).size,1);
  complete(db,1);
  assert.equal(db.sequence(),1602);
  db.close();
}
console.log('T12 Cloud synthetic atomic-create PASS: 6-step rollback, same-key/cross-account replay, unknown-outcome readback, 8-call concurrency, single ID and no production wiring');
