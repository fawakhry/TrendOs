import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {transitionOrderAtomic} from '../tools/ops-pilot-local-v1/server.mjs';

function fixture(){
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE orders(
    id TEXT PRIMARY KEY, status TEXT NOT NULL,
    blocked INTEGER NOT NULL CHECK(blocked IN (0,1))
  );
  CREATE TABLE history(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL REFERENCES orders(id),
    previous_status TEXT NOT NULL,
    next_status TEXT NOT NULL
  );
  INSERT INTO orders(id,status,blocked) VALUES
    ('DEMO-9001','طلب جديد',0),
    ('DEMO-9002','جاهز للتسليم',1);`);
  return db;
}
test('SQLite audit insert failure rolls back the already-attempted status update',()=>{
  const db=fixture();
  try{
    db.exec(`CREATE TRIGGER fake_audit_failure BEFORE INSERT ON history
      BEGIN SELECT RAISE(ABORT,'synthetic audit failure'); END;`);
    assert.throws(()=>transitionOrderAtomic(db,'DEMO-9001','جاري التنفيذ'),/synthetic audit failure/);
    assert.equal(db.prepare("SELECT status FROM orders WHERE id='DEMO-9001'").get().status,'طلب جديد');
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM history').get().n,0);
    db.exec('DROP TRIGGER fake_audit_failure');
    const good=transitionOrderAtomic(db,'DEMO-9001','جاري التنفيذ');
    assert.deepEqual(good,{success:true,id:'DEMO-9001',status:'جاري التنفيذ'});
    assert.equal(db.prepare("SELECT status FROM orders WHERE id='DEMO-9001'").get().status,'جاري التنفيذ');
    assert.deepEqual(db.prepare('SELECT previous_status,next_status FROM history').all(),[
      {previous_status:'طلب جديد',next_status:'جاري التنفيذ'}
    ]);
  }finally{db.close()}
});
test('rejected, replayed, skipped and blocked delivery transitions never append history',()=>{
  const db=fixture();
  try{
    assert.equal(transitionOrderAtomic(db,'DEMO-9002','تم التسليم').code,'DEMO_DELIVERY_RESTRICTION');
    assert.equal(transitionOrderAtomic(db,'DEMO-9001','تم التسليم').code,'NO_STATUS_SKIP_OR_REPLAY');
    assert.equal(transitionOrderAtomic(db,'DEMO-9001','طلب جديد').code,'NO_STATUS_SKIP_OR_REPLAY');
    assert.equal(transitionOrderAtomic(db,'DEMO-9999','جاري التنفيذ').code,'NOT_FOUND');
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM history').get().n,0);
    assert.equal(db.prepare("SELECT status FROM orders WHERE id='DEMO-9002'").get().status,'جاهز للتسليم');
  }finally{db.close()}
});
test('repeat acceptance adds exactly one audit row per authorized state advance',()=>{
  const db=fixture();
  try{
    for(const state of ['جاري التنفيذ','جاهز للتسليم','تم التسليم']){
      assert.equal(transitionOrderAtomic(db,'DEMO-9001',state).success,true);
      assert.equal(transitionOrderAtomic(db,'DEMO-9001',state).code,'NO_STATUS_SKIP_OR_REPLAY');
    }
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM history').get().n,3);
    assert.equal(db.prepare("SELECT status FROM orders WHERE id='DEMO-9001'").get().status,'تم التسليم');
  }finally{db.close()}
});
