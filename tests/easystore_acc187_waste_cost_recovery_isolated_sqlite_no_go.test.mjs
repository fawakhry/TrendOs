// Entirely invented SQLite accounting rehearsal: no source-of-truth costing
// formula, real supplier recovery, employee approval, production inventory or D1.
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec(
  "PRAGMA foreign_keys=ON;"+
  "CREATE TABLE fake_cost_waste(waste_id TEXT PRIMARY KEY,return_id TEXT NOT NULL UNIQUE,"+
   "cost_evidence_id TEXT NOT NULL,manufacturing_cost_cents INTEGER NOT NULL CHECK(manufacturing_cost_cents>0));"+
  "CREATE TABLE fake_recovery(recovery_id TEXT PRIMARY KEY,waste_id TEXT NOT NULL REFERENCES fake_cost_waste(waste_id),"+
   "recovery_party_type TEXT NOT NULL CHECK(recovery_party_type IN ('SUPPLIER','RESPONSIBLE_PARTY')),"+
   "recovery_party_id TEXT NOT NULL,recovery_cents INTEGER NOT NULL CHECK(recovery_cents>0),"+
   "manager_ref TEXT NOT NULL,evidence_ref TEXT NOT NULL UNIQUE);"+
  "CREATE VIEW fake_accounting_report AS SELECT w.waste_id,w.manufacturing_cost_cents AS gross_waste_cost_cents,"+
   "COALESCE((SELECT SUM(r.recovery_cents) FROM fake_recovery r WHERE r.waste_id=w.waste_id),0) AS recovered_cents "+
   "FROM fake_cost_waste w;"
 );
 const waste=(id='FAKE-WASTE-100',cost=12500)=>db.prepare(
  'INSERT INTO fake_cost_waste VALUES(?,?,?,?)'
 ).run(id,'FAKE-RETURN-'+id,'FAKE-VERIFIED-ACTUAL-MFG-COST-'+id,cost);
 const recover=(id='FAKE-RECOVERY-100',party='SUPPLIER',cents=4200,wasteId='FAKE-WASTE-100')=>db.prepare(
  'INSERT INTO fake_recovery VALUES(?,?,?,?,?,?,?)'
 ).run(id,wasteId,party,'FAKE-THIRD-PARTY-100',cents,
       'FAKE-MANAGER-APPROVAL-'+id,'FAKE-RECEIPT-'+id);
 const report=()=>db.prepare('SELECT * FROM fake_accounting_report ORDER BY waste_id')
  .all().map(x=>({waste_id:x.waste_id,gross_waste_cost_cents:x.gross_waste_cost_cents,
                  recovered_cents:x.recovered_cents}));
 const rows=()=>JSON.stringify(db.prepare(
  'SELECT recovery_id,waste_id,recovery_party_type,recovery_cents FROM fake_recovery ORDER BY recovery_id'
 ).all());
 return {db,waste,recover,report,rows};
}
function use(fn){const f=fixture();try{fn(f);}finally{f.db.close();}}
test('gross waste equals FAKE manufacturing cost, not selling price',()=>use(f=>{
 f.waste();
 assert.deepEqual(f.report(),[{waste_id:'FAKE-WASTE-100',gross_waste_cost_cents:12500,recovered_cents:0}]);
}));
test('no supplier recovery is implied by recording damaged goods waste',()=>use(f=>{
 f.waste();
 assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM fake_recovery').get().n,0);
 assert.equal(f.report()[0].gross_waste_cost_cents,12500);
}));
test('fake manager-authorized supplier recovery recorded separately, gross unchanged',()=>use(f=>{
 f.waste();f.recover();
 assert.deepEqual(f.report(),[{waste_id:'FAKE-WASTE-100',gross_waste_cost_cents:12500,recovered_cents:4200}]);
 assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM fake_cost_waste').get().n,1);
}));
test('supplier plus responsible party recovery do not net down original waste ledger',()=>use(f=>{
 f.waste();f.recover();
 f.recover('FAKE-RECOVERY-101','RESPONSIBLE_PARTY',2100);
 assert.deepEqual(f.report(),[{waste_id:'FAKE-WASTE-100',gross_waste_cost_cents:12500,recovered_cents:6300}]);
}));
test('recovery exceeding cost does not silently modify original manufacturing valuation',()=>use(f=>{
 f.waste();f.recover('FAKE-RECOVERY-HIGH','SUPPLIER',13500);
 assert.equal(f.report()[0].gross_waste_cost_cents,12500);
 assert.equal(f.report()[0].recovered_cents,13500);
}));
test('reused recovery identity cannot register a second supplier payment',()=>use(f=>{
 f.waste();f.recover();const before=f.rows();
 assert.throws(()=>f.recover('FAKE-RECOVERY-100','SUPPLIER',4200),/UNIQUE constraint failed/);
 assert.equal(f.rows(),before);
}));
test('recoveries cannot attach to a nonexistent fake waste document',()=>use(f=>{
 assert.throws(()=>f.recover(),/FOREIGN KEY constraint failed/);
 assert.equal(f.rows(),'[]');
}));
test('waste write-off itself is unique per returned fake case',()=>use(f=>{
 f.waste();const before=f.report();
 assert.throws(()=>f.waste('FAKE-WASTE-100'),/UNIQUE constraint failed/);
 assert.deepEqual(f.report(),before);
}));
test('a different fake waste case has its own gross and separate recovery',()=>use(f=>{
 f.waste();f.waste('FAKE-WASTE-200',9800);
 f.recover('FAKE-RECOVERY-200','RESPONSIBLE_PARTY',3500,'FAKE-WASTE-200');
 assert.deepEqual(f.report(),[
  {waste_id:'FAKE-WASTE-100',gross_waste_cost_cents:12500,recovered_cents:0},
  {waste_id:'FAKE-WASTE-200',gross_waste_cost_cents:9800,recovered_cents:3500}
 ]);
}));
test('no real employee accounting, supplier ledger, inventory or cashbox table exists',()=>use(f=>{
 const names=f.db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all().map(z=>z.name);
 assert.deepEqual(names,['fake_cost_waste','fake_recovery']);
}));
console.log('ACC187_GROSS_WASTE_MANUFACTURING_COST_IS_SEPARATE_FROM_THIRD_PARTY_RECOVERY=FAKE_PASS');
console.log('ACC187_RECOVERY_REPEAT_AND_UNLINKED_WASTE_DOCUMENTS=FAKE_DENIED');
console.log('ACC187_REAL_WASTE_AND_RECOVERY_LEDGER_POSTS=ZERO');
console.log('FINANCE_RELEASE=NO_GO');
