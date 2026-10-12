// ACC187 disposable local SQLite ONLY. Every policy, rate and cost is FAKE.
// No approved real costing method, D1, production inventory or shop access.
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';

function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec("PRAGMA foreign_keys=ON;"+
  "CREATE TABLE fake_method(department TEXT NOT NULL,work_class TEXT NOT NULL,"+
  "period TEXT NOT NULL,version TEXT NOT NULL,driver TEXT NOT NULL,"+
  "PRIMARY KEY(department,work_class,period),"+
  "UNIQUE(department,work_class,period,version,driver));"+
  "CREATE TABLE fake_pool(pool_id TEXT PRIMARY KEY,department TEXT NOT NULL,"+
  "work_class TEXT NOT NULL,period TEXT NOT NULL,cents INTEGER NOT NULL CHECK(cents>=0),"+
  "driver_units INTEGER NOT NULL CHECK(driver_units>0),"+
  "FOREIGN KEY(department,work_class,period) REFERENCES fake_method(department,work_class,period));"+
  "CREATE TABLE fake_job(job_id TEXT PRIMARY KEY,pool_id TEXT NOT NULL REFERENCES fake_pool(pool_id),"+
  "department TEXT NOT NULL,work_class TEXT NOT NULL,period TEXT NOT NULL,"+
  "version TEXT NOT NULL,driver TEXT NOT NULL,units INTEGER NOT NULL CHECK(units>0),"+
  "cents INTEGER NOT NULL CHECK(cents>=0),proof_id TEXT NOT NULL UNIQUE,"+
  "FOREIGN KEY(department,work_class,period,version,driver) "+
  "REFERENCES fake_method(department,work_class,period,version,driver));"+
  "CREATE TRIGGER fake_budget BEFORE INSERT ON fake_job BEGIN "+
  "SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM fake_pool WHERE pool_id=NEW.pool_id "+
  "AND department=NEW.department AND work_class=NEW.work_class AND period=NEW.period) "+
  "THEN RAISE(ABORT,'FAKE_SCOPE_MISMATCH') END;"+
  "SELECT CASE WHEN (SELECT COALESCE(SUM(units),0) FROM fake_job WHERE pool_id=NEW.pool_id)+NEW.units >"+
  "(SELECT driver_units FROM fake_pool WHERE pool_id=NEW.pool_id) "+
  "THEN RAISE(ABORT,'FAKE_UNITS_OVERALLOCATED') END;"+
  "SELECT CASE WHEN (SELECT COALESCE(SUM(cents),0) FROM fake_job WHERE pool_id=NEW.pool_id)+NEW.cents >"+
  "(SELECT cents FROM fake_pool WHERE pool_id=NEW.pool_id) "+
  "THEN RAISE(ABORT,'FAKE_COST_OVERALLOCATED') END; END;");
 db.prepare('INSERT INTO fake_method VALUES(?,?,?,?,?)')
  .run('PRINT','FAKE_MUG','FAKE_OCT','FAKE_V1','FAKE_MACHINE_MINUTES');
 db.prepare('INSERT INTO fake_method VALUES(?,?,?,?,?)')
  .run('LASER','FAKE_ACRYLIC','FAKE_OCT','FAKE_LASER_V1','FAKE_GOOD_UNITS');
 db.prepare('INSERT INTO fake_pool VALUES(?,?,?,?,?,?)')
  .run('FAKE_PRINT_POOL','PRINT','FAKE_MUG','FAKE_OCT',10000,100);
 db.prepare('INSERT INTO fake_pool VALUES(?,?,?,?,?,?)')
  .run('FAKE_LASER_POOL','LASER','FAKE_ACRYLIC','FAKE_OCT',2000,20);
 const add=(id,units,cents,override={})=>{
  const p={pool:'FAKE_PRINT_POOL',department:'PRINT',workClass:'FAKE_MUG',
   period:'FAKE_OCT',version:'FAKE_V1',driver:'FAKE_MACHINE_MINUTES',
   proof:'FAKE_EVIDENCE_'+id,...override};
  return db.prepare('INSERT INTO fake_job VALUES(?,?,?,?,?,?,?,?,?,?)')
   .run(id,p.pool,p.department,p.workClass,p.period,p.version,p.driver,
    units,cents,p.proof);
 };
 const rows=()=>JSON.stringify(db.prepare('SELECT * FROM fake_job ORDER BY job_id').all());
 return {db,add,rows};
}
function withFixture(fn){const f=fixture();try{fn(f)}finally{f.db.close()}}
test('like jobs share documented fake driver and one overhead pool',()=>withFixture(f=>{
 f.add('FAKE_JOB_A',60,6000);f.add('FAKE_JOB_B',40,4000);
 assert.equal(f.db.prepare('SELECT SUM(cents) AS n FROM fake_job').get().n,10000);
}));
test('reposting same fake job cannot allocate its overhead twice',()=>withFixture(f=>{
 f.add('FAKE_JOB_A',60,6000);const b=f.rows();
 assert.throws(()=>f.add('FAKE_JOB_A',1,100),/UNIQUE constraint/);
 assert.equal(f.rows(),b);
}));
test('reusing prior fake expense proof on another job denied',()=>withFixture(f=>{
 f.add('FAKE_JOB_A',40,4000);const b=f.rows();
 assert.throws(()=>f.add('FAKE_JOB_B',10,1000,
  {proof:'FAKE_EVIDENCE_FAKE_JOB_A'}),/UNIQUE constraint/);
 assert.equal(f.rows(),b);
}));
test('fake pool driver units cannot be allocated twice',()=>withFixture(f=>{
 f.add('FAKE_JOB_A',80,1000);const b=f.rows();
 assert.throws(()=>f.add('FAKE_JOB_B',21,1000),/FAKE_UNITS_OVERALLOCATED/);
 assert.equal(f.rows(),b);
}));
test('fake pool cost cannot be allocated twice',()=>withFixture(f=>{
 f.add('FAKE_JOB_A',40,8000);const b=f.rows();
 assert.throws(()=>f.add('FAKE_JOB_B',10,2001),/FAKE_COST_OVERALLOCATED/);
 assert.equal(f.rows(),b);
}));
test('printing job cannot claim laser method or cost pool',()=>withFixture(f=>{
 const b=f.rows();
 assert.throws(()=>f.add('FAKE_JOB_BAD',10,100,
  {driver:'FAKE_GOOD_UNITS'}),/FOREIGN KEY constraint/);
 assert.throws(()=>f.add('FAKE_JOB_BAD',10,100,
  {pool:'FAKE_LASER_POOL'}),/FAKE_SCOPE_MISMATCH/);
 assert.equal(f.rows(),b);
}));
test('each department may have different independently recorded fake method',()=>withFixture(f=>{
 f.add('FAKE_JOB_LASER',10,1000,{
  department:'LASER',workClass:'FAKE_ACRYLIC',pool:'FAKE_LASER_POOL',
  version:'FAKE_LASER_V1',driver:'FAKE_GOOD_UNITS'
 });
 assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM fake_job').get().n,1);
}));
test('new version cannot override approved method in same period',()=>withFixture(f=>{
 const b=f.rows();
 assert.throws(()=>f.add('FAKE_JOB_V2',10,500,
  {version:'FAKE_V2'}),/FOREIGN KEY constraint/);
 assert.equal(f.rows(),b);
}));
test('all tables are disposable fake accounting objects',()=>withFixture(f=>{
 assert.deepEqual(f.db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all().map(x=>x.name),['fake_job','fake_method','fake_pool']);
}));
console.log('ACC187_FAKE_OVERHEAD_DOUBLE_ALLOCATION_AND_CROSS_DEPARTMENT=DENIED');
console.log('ACC187_LIVE_OVERHEAD_METHOD_AND_RATES=NOT_APPROVED');
console.log('FINANCE_RELEASE=NO_GO');
