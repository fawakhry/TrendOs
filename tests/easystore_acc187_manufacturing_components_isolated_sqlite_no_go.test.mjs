// ACC187 entirely disposable local SQLite ledger rehearsal; FAKE jobs, costs,
// evidence and production overhead pool. The pool size/driver are fabricated
// for conflict-detection tests, NOT an owner-approved costing allocation method.
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec("PRAGMA foreign_keys=ON;"+
  "CREATE TABLE fake_production_pool(pool_id TEXT PRIMARY KEY,capacity_cents INTEGER NOT NULL CHECK(capacity_cents>=0));"+
  "CREATE TABLE fake_return_cost(case_id TEXT PRIMARY KEY,item_id TEXT NOT NULL,"+
  "materials_cents INTEGER NOT NULL CHECK(materials_cents>=0),"+
  "direct_labor_cents INTEGER NOT NULL CHECK(direct_labor_cents>=0),"+
  "allocated_overhead_cents INTEGER NOT NULL CHECK(allocated_overhead_cents>=0),"+
  "overhead_pool_id TEXT NOT NULL REFERENCES fake_production_pool(pool_id),"+
  "cost_evidence_id TEXT NOT NULL UNIQUE,"+
  "gross_manufacturing_cost_cents INTEGER GENERATED ALWAYS AS "+
  "(materials_cents+direct_labor_cents+allocated_overhead_cents) STORED);"+
  "CREATE TRIGGER fake_prevent_overallocated_pool BEFORE INSERT ON fake_return_cost BEGIN "+
  "SELECT CASE WHEN (SELECT COALESCE(SUM(allocated_overhead_cents),0) FROM fake_return_cost "+
  "WHERE overhead_pool_id=NEW.overhead_pool_id) + NEW.allocated_overhead_cents > "+
  "(SELECT capacity_cents FROM fake_production_pool WHERE pool_id=NEW.overhead_pool_id) "+
  "THEN RAISE(ABORT,'FAKE_OVERHEAD_POOL_DOUBLE_COUNT') END; END;"
 );
 db.prepare('INSERT INTO fake_production_pool VALUES(?,?)').run('FAKE-POOL-01',5000);
 const add=(caseId='FAKE-RETURN-100',materials=6000,labor=2500,overhead=2000,pool='FAKE-POOL-01')=>
  db.prepare('INSERT INTO fake_return_cost(case_id,item_id,materials_cents,direct_labor_cents,allocated_overhead_cents,overhead_pool_id,cost_evidence_id) VALUES(?,?,?,?,?,?,?)')
   .run(caseId,'FAKE-ITEM-'+caseId,materials,labor,overhead,pool,'FAKE-COST-EVIDENCE-'+caseId);
 const rows=()=>db.prepare('SELECT case_id,materials_cents,direct_labor_cents,allocated_overhead_cents,gross_manufacturing_cost_cents FROM fake_return_cost ORDER BY case_id')
  .all().map(x=>({case_id:x.case_id,materials:x.materials_cents,labor:x.direct_labor_cents,overhead:x.allocated_overhead_cents,gross:x.gross_manufacturing_cost_cents}));
 return {db,add,rows};
}
function withFake(fn){const x=fixture();try{fn(x);}finally{x.db.close();}}
test('full fake manufacturing cost computes material plus direct labor plus allocated overhead',()=>withFake(f=>{
 f.add();
 assert.deepEqual(f.rows(),[{case_id:'FAKE-RETURN-100',materials:6000,labor:2500,overhead:2000,gross:10500}]);
}));
test('a second production job fake overhead cannot use more than fabricated pool',()=>withFake(f=>{
 f.add();
 const before=f.rows();
 assert.throws(()=>f.add('FAKE-RETURN-200',3000,1000,3001),/FAKE_OVERHEAD_POOL_DOUBLE_COUNT/);
 assert.deepEqual(f.rows(),before);
}));
test('remaining fake overhead budget may be used once without changing earlier cost',()=>withFake(f=>{
 f.add();
 f.add('FAKE-RETURN-200',3000,1000,3000);
 assert.deepEqual(f.rows(),[
  {case_id:'FAKE-RETURN-100',materials:6000,labor:2500,overhead:2000,gross:10500},
  {case_id:'FAKE-RETURN-200',materials:3000,labor:1000,overhead:3000,gross:7000},
 ]);
}));
test('repeated fake return cannot create duplicate gross waste cost',()=>withFake(f=>{
 f.add();const before=f.rows();
 assert.throws(()=>f.add(),/UNIQUE constraint failed/);
 assert.deepEqual(f.rows(),before);
}));
test('negative material cost rejected without corrupting previous batch',()=>withFake(f=>{
 f.add();const before=f.rows();
 assert.throws(()=>f.add('FAKE-RETURN-200',-1,100,100),/CHECK constraint failed/);
 assert.deepEqual(f.rows(),before);
}));
test('negative direct-labor cost rejected',()=>withFake(f=>{
 assert.throws(()=>f.add('FAKE-RETURN-100',1000,-1,200),/CHECK constraint failed/);
 assert.deepEqual(f.rows(),[]);
}));
test('negative overhead allocation rejected',()=>withFake(f=>{
 assert.throws(()=>f.add('FAKE-RETURN-100',1000,300,-1),/CHECK constraint failed/);
 assert.deepEqual(f.rows(),[]);
}));
test('missing independent production pool cannot be used',()=>withFake(f=>{
 assert.throws(()=>f.add('FAKE-RETURN-100',1000,300,100,'FAKE-NONEXISTENT-POOL'),/FOREIGN KEY constraint failed/);
 assert.deepEqual(f.rows(),[]);
}));
test('same fake production job reference must not be counted as independent evidence twice',()=>withFake(f=>{
 f.add();const before=f.rows();
 assert.throws(()=>f.db.prepare('INSERT INTO fake_return_cost(case_id,item_id,materials_cents,direct_labor_cents,allocated_overhead_cents,overhead_pool_id,cost_evidence_id) VALUES(?,?,?,?,?,?,?)')
 .run('FAKE-RETURN-300','FAKE-ITEM-300',1000,200,100,'FAKE-POOL-01','FAKE-COST-EVIDENCE-FAKE-RETURN-100'),/UNIQUE constraint failed/);
 assert.deepEqual(f.rows(),before);
}));
test('only fictitious production-cost tables exist, no accounting or material inventory',()=>withFake(f=>{
 const names=f.db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
   .all().map(x=>x.name);
 assert.deepEqual(names,['fake_production_pool','fake_return_cost']);
}));
console.log('ACC187_THREE_COMPONENT_MANUFACTURING_GROSS=FAKE_LOCAL_SQLITE_ONLY');
console.log('ACC187_FAKE_OVERHEAD_POOL_EXHAUSTION_AND_DUPLICATE_COST_EVIDENCE=DENIED');
console.log('ACC187_ACTUAL_OVERHEAD_DRIVER_AND_UNIT_COST_POLICY=NOT_YET_APPROVED');
console.log('ACC187_REAL_COST_LEDGER_MANUFACTURING_OR_PRINTSHOP_OPERATIONS=ZERO');
console.log('FINANCE_RELEASE=NO_GO');
