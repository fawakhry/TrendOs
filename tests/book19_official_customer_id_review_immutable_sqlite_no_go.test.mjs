import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {DatabaseSync} from 'node:sqlite';

// BOOK19/BOOK18/BOOK28: real additive migration, genuine SQLite foreign keys,
// immutable candidate proposal, NO trusted order/customer proof or finance writes.
// This fixture deliberately inserts an UNVERIFIED review *directly* in discarded
// memory: NO API for insertion/attestation/activation exists in app source.
const db=new DatabaseSync(':memory:');
try{
  db.exec('PRAGMA foreign_keys=ON;');
  for(const file of [
    '0005_t12_production_create_canary.sql',
    '0008_t12_customer_master.sql',
    '0024_employee_accounting_party_balances_v1.sql',
    '0032_t12_order_customer_binding_review_only_v1.sql'
  ])db.exec(fs.readFileSync('cloudflare-d1/migrations/'+file,'utf8'));
  const one=(sql,...args)=>db.prepare(sql).get(...args);
  const count=table=>one('SELECT COUNT(*) AS n FROM '+table).n;
  const addOrder=(id,mode,externalId='')=>{
    db.prepare("INSERT INTO t12_prod_request_ledger(request_key,actor,policy_epoch,canonical_json,order_id,status) VALUES(?,'FAKE_OWNER','FAKE_EPOCH','{}',?,'COMMITTED')")
      .run('FAKE_REQ_'+id,id);
    db.prepare("INSERT INTO t12_prod_orders(order_id,request_key,customer_mode,customer_name,customer_phone,external_customer_id,department,priority,status,actor) VALUES(?,?,?,?,?,?,'طباعة','عادي','طلب جديد','FAKE_OWNER')")
      .run(id,'FAKE_REQ_'+id,mode,'FAKE_UNVERIFIED_PERSON','01000000001',externalId);
  };
  for(const id of ['CUS-C000111','CUS-C000222']){
    db.prepare("INSERT INTO t12_customers(customer_id,customer_name,customer_name_key,source) VALUES(?,'FAKE_UNVERIFIED_PERSON','fake_unverified_person','cloud-native')")
      .run(id);
  }
  addOrder('FAKE_T12_REGISTERED_ORDER','registered');
  addOrder('FAKE_T12_EXTERNAL_ORDER','external','999002');
  const add=(orderId,customerId)=>db.prepare("INSERT INTO t12_order_customer_binding_review_v1(order_id,customer_id,recorded_by,evidence_ref) VALUES(?,?,'FAKE_REVIEWER','FAKE_SOURCE_ONLY_NO_AUTHORITY')")
    .run(orderId,customerId);
  await test('01 migration starts with ZERO bindings and has no way to authorize payments or delivery',()=>{
    assert.equal(count('t12_order_customer_binding_review_v1'),0);
    const cols=db.prepare("PRAGMA table_info(t12_order_customer_binding_review_v1)").all();
    assert.ok(cols.some(x=>x.name==='finance_authorized'));
    assert.ok(cols.some(x=>x.name==='delivery_authorized'));
    assert.equal(one("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='t12_order_customer_binding_review_v1' AND type='table'").n,1);
  });
  await test('02 official customer PRIMARY KEY candidate is FK-valid but ALWAYS unverified',()=>{
    add('FAKE_T12_REGISTERED_ORDER','CUS-C000111');
    const r=one("SELECT customer_id AS customerId,review_status AS reviewStatus,finance_authorized AS canPay,delivery_authorized AS canDeliver FROM t12_order_customer_binding_review_v1 WHERE order_id='FAKE_T12_REGISTERED_ORDER'");
    assert.deepEqual(r,{customerId:'CUS-C000111',reviewStatus:'UNVERIFIED',canPay:0,canDeliver:0});
  });
  await test('03 caller external_customer_id cannot be treated as official accounting key',()=>{
    assert.equal(one("SELECT external_customer_id AS id FROM t12_prod_orders WHERE order_id='FAKE_T12_EXTERNAL_ORDER'").id,'999002');
    assert.throws(()=>add('FAKE_T12_EXTERNAL_ORDER','999002'),/FOREIGN KEY constraint failed/i);
    assert.equal(count('t12_order_customer_binding_review_v1'),1);
  });
  await test('04 non-existing order cannot silently create a customer-to-order link',()=>{
    assert.throws(()=>add('FAKE_MISSING_ORDER','CUS-C000111'),/FOREIGN KEY constraint failed/i);
    assert.equal(count('t12_order_customer_binding_review_v1'),1);
  });
  await test('05 foreign key rejection for deleted/inactive or unregistered ID and only customer PK',()=>{
    assert.throws(()=>add('FAKE_T12_EXTERNAL_ORDER','CUS-NOT-A-CUSTOMER'),/FOREIGN KEY constraint failed/i);
    assert.equal(count('t12_order_customer_binding_review_v1'),1);
  });
  await test('06 identical or conflicting second candidate cannot replace immutable first proposal',()=>{
    assert.throws(()=>add('FAKE_T12_REGISTERED_ORDER','CUS-C000111'),/UNIQUE constraint failed/i);
    assert.throws(()=>add('FAKE_T12_REGISTERED_ORDER','CUS-C000222'),/UNIQUE constraint failed/i);
    assert.equal(one("SELECT customer_id AS customerId FROM t12_order_customer_binding_review_v1 WHERE order_id='FAKE_T12_REGISTERED_ORDER'").customerId,'CUS-C000111');
  });
  await test('07 SQL UPDATE and DELETE are prohibited, including attempts to approve or rebind',()=>{
    assert.throws(()=>db.exec("UPDATE t12_order_customer_binding_review_v1 SET customer_id='CUS-C000222' WHERE order_id='FAKE_T12_REGISTERED_ORDER'"),/BOOK19_REVIEW_BINDING_IMMUTABLE_NO_UPDATE/);
    assert.throws(()=>db.exec("UPDATE t12_order_customer_binding_review_v1 SET finance_authorized=1 WHERE order_id='FAKE_T12_REGISTERED_ORDER'"),/BOOK19_REVIEW_BINDING_IMMUTABLE_NO_UPDATE/);
    assert.throws(()=>db.exec("DELETE FROM t12_order_customer_binding_review_v1 WHERE order_id='FAKE_T12_REGISTERED_ORDER'"),/BOOK19_REVIEW_BINDING_IMMUTABLE_NO_DELETE/);
    assert.equal(count('t12_order_customer_binding_review_v1'),1);
  });
  await test('08 review status and authority CHECK constraints reject promotion even on INSERT',()=>{
    assert.throws(()=>db.prepare("INSERT INTO t12_order_customer_binding_review_v1(order_id,customer_id,recorded_by,review_status) VALUES('FAKE_T12_EXTERNAL_ORDER','CUS-C000222','FAKE','VERIFIED')").run(),/CHECK constraint failed/i);
    assert.throws(()=>db.prepare("INSERT INTO t12_order_customer_binding_review_v1(order_id,customer_id,recorded_by,finance_authorized) VALUES('FAKE_T12_EXTERNAL_ORDER','CUS-C000222','FAKE',1)").run(),/CHECK constraint failed/i);
    assert.throws(()=>db.prepare("INSERT INTO t12_order_customer_binding_review_v1(order_id,customer_id,recorded_by,delivery_authorized) VALUES('FAKE_T12_EXTERNAL_ORDER','CUS-C000222','FAKE',1)").run(),/CHECK constraint failed/i);
    assert.equal(count('t12_order_customer_binding_review_v1'),1);
  });
  await test('09 exact ledger party-ID join is candidate-only and proves NO order consent',()=>{
    db.prepare("INSERT INTO employee_accounting_party_balances_v1(party_type,party_id,party_name,balance) VALUES('customer','CUS-C000111','FAKE_UNVERIFIED_PERSON',0)").run();
    const match=one("SELECT r.customer_id AS officialCustomerId,a.balance AS candidateBalance,r.review_status AS status,r.delivery_authorized AS deliveryPermission FROM t12_order_customer_binding_review_v1 r LEFT JOIN employee_accounting_party_balances_v1 a ON a.party_type='customer' AND a.party_id=r.customer_id WHERE r.order_id='FAKE_T12_REGISTERED_ORDER'");
    assert.equal(match.officialCustomerId,'CUS-C000111');
    assert.equal(match.candidateBalance,0);
    assert.equal(match.status,'UNVERIFIED');assert.equal(match.deliveryPermission,0);
  });
  await test('10 FK validity and review immutability retain safety for whole fake fixture',()=>{
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
    assert.equal(one("SELECT COUNT(*) AS n FROM t12_order_customer_binding_review_v1 WHERE review_status<>'UNVERIFIED' OR finance_authorized<>0 OR delivery_authorized<>0").n,0);
    assert.equal(count('t12_order_customer_binding_review_v1'),1);
  });
  console.log('BOOK19_OFFICIAL_ID_REVIEW_FK_IMMUTABLE=FAKE_SQLITE_ONLY');
  console.log('BOOK19_ATTESTED_ORDER_ACCOUNT_LINK=NOT_AVAILABLE');
  console.log('BOOK19_FINANCE_RELEASE=NO_GO');
}finally{db.close();}
