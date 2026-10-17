import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {DatabaseSync} from 'node:sqlite';

// Existing BOOK19/BOOK18/BOOK28: append-only owner evidence/CORRECTION chain,
// not customer consent, verified identity, finance release or delivered status.
// Direct fake row insertion only; NO production INSERT API is introduced.
const db=new DatabaseSync(':memory:');
try{
  db.exec('PRAGMA foreign_keys=ON;');
  for(const f of [
    '0005_t12_production_create_canary.sql',
    '0008_t12_customer_master.sql',
    '0032_t12_order_customer_binding_review_only_v1.sql',
    '0033_t12_customer_binding_correction_audit_sourceonly_v1.sql'
  ])db.exec(fs.readFileSync('cloudflare-d1/migrations/'+f,'utf8'));
  const tbl='t12_order_customer_binding_revision_v1';
  const row=(sql,...args)=>db.prepare(sql).get(...args);
  const count=()=>Number(row('SELECT COUNT(*) AS n FROM '+tbl).n);
  const customer=id=>db.prepare("INSERT INTO t12_customers(customer_id,customer_name,customer_name_key,source,active) VALUES(?,'BOOK19_FAKE_PERSON','book19_fake_person','cloud-native','نعم')").run(id);
  const order=(id,committed=true)=>{
    db.prepare("INSERT INTO t12_prod_request_ledger(request_key,actor,policy_epoch,canonical_json,order_id,status) VALUES(?,'FAKE_OWNER','FAKE_EPOCH','{}',?,?)")
      .run('BOOK19_FAKE_REQ_'+id,id,committed?'COMMITTED':'PREPARED');
    db.prepare("INSERT INTO t12_prod_orders(order_id,request_key,customer_mode,customer_name,customer_phone,external_customer_id,department,priority,status,actor) VALUES(?,?, 'registered','BOOK19_FAKE_PERSON','01000000001','','طباعة','عادي','طلب جديد','FAKE_OWNER')")
      .run(id,'BOOK19_FAKE_REQ_'+id);
  };
  customer('CUS-C000111');customer('CUS-C000222');
  order('BOOK19_FAKE_ORDER_A');order('BOOK19_FAKE_ORDER_PREPARED',false);
  order('BOOK19_FAKE_ORDER_B');
  const sha='a'.repeat(64);
  const put=(kind,orderId,customerId,requestKey,parent=null,options={})=>
    db.prepare('INSERT INTO '+tbl+'(request_key,order_id,candidate_customer_id,event_kind,supersedes_revision_id,actor_subject,actor_role,evidence_ref,evidence_sha256,reason) VALUES(?,?,?,?,?,?,?,?,?,?)')
      .run(requestKey,orderId,customerId,kind,parent,
        options.actor||'FAKE_VERIFIED_ADMIN',options.role||'admin',
        options.evidence||'FAKE_INDEPENDENT_DOCUMENT_REFERENCE',options.sha||sha,
        options.reason||'FAKE_MANUAL_REVIEW_NOT_IDENTITY_VERIFIED');
  const one=(id='BOOK19_FAKE_ORDER_A')=>row('SELECT revision_id AS revisionId,candidate_customer_id AS customerId,event_kind AS kind,review_status AS status,finance_authorized AS financeAuthorized,delivery_authorized AS deliveryAuthorized FROM '+tbl+' WHERE order_id=? ORDER BY revision_id DESC LIMIT 1',id);
  await test('01 migration starts EMPTY, all default authorizations remain 0',()=>{
    assert.equal(count(),0);
    const cols=db.prepare('PRAGMA table_info('+tbl+')').all();
    for(const key of ['request_key','order_id','candidate_customer_id','supersedes_revision_id','review_status','finance_authorized','delivery_authorized','evidence_ref','evidence_sha256'])
      assert.ok(cols.some(c=>c.name===key),key);
  });
  await test('02 initial owner evidence candidate is NOT_ATTESTED, cannot allow finance/delivery',()=>{
    put('PROPOSE','BOOK19_FAKE_ORDER_A','CUS-C000111','BOOK19_FAKE_REVIEW_001');
    assert.equal(one().status,'NOT_ATTESTED');
    assert.equal(one().financeAuthorized,0);
    assert.equal(one().deliveryAuthorized,0);
    assert.equal(one().customerId,'CUS-C000111');
  });
  await test('03 exact receipt/request replay cannot duplicate evidence events',()=>{
    assert.throws(()=>put('PROPOSE','BOOK19_FAKE_ORDER_A','CUS-C000111','BOOK19_FAKE_REVIEW_001'),/(UNIQUE|BOOK19_)/);
    assert.equal(count(),1);
  });
  await test('04 second proposal for same order cannot bypass revision chain',()=>{
    assert.throws(()=>put('PROPOSE','BOOK19_FAKE_ORDER_A','CUS-C000222','BOOK19_FAKE_REVIEW_002'),/BOOK19_/);
    assert.equal(count(),1);
  });
  await test('05 correction requires exact latest prior revision ID',()=>{
    assert.throws(()=>put('CORRECT','BOOK19_FAKE_ORDER_A','CUS-C000222','BOOK19_FAKE_BAD_PARENT',999),/BOOK19_/);
    assert.throws(()=>put('CORRECT','BOOK19_FAKE_ORDER_A','CUS-C000222','BOOK19_FAKE_MISSING_PARENT',null),/(BOOK19_|NOT NULL)/);
    assert.equal(count(),1);
  });
  await test('06 valid correction appends evidence, previous candidate remains immutable',()=>{
    const initial=one();
    put('CORRECT','BOOK19_FAKE_ORDER_A','CUS-C000222','BOOK19_FAKE_CORRECTION_001',initial.revisionId,{reason:'FAKE_SUPERSESSION_OF_WRONG_ID'});
    assert.equal(count(),2);
    assert.equal(one().customerId,'CUS-C000222');
    assert.equal(one().kind,'CORRECT');
    assert.equal(row('SELECT candidate_customer_id AS id FROM '+tbl+' WHERE revision_id=?',initial.revisionId).id,'CUS-C000111');
    assert.equal(one().status,'NOT_ATTESTED');
  });
  await test('07 stale concurrent correction is rejected even when it references a real prior event',()=>{
    const first=row('SELECT MIN(revision_id) AS id FROM '+tbl);
    assert.throws(()=>put('CORRECT','BOOK19_FAKE_ORDER_A','CUS-C000111','BOOK19_FAKE_STALE_PARENT',first.id),/BOOK19_/);
    assert.equal(count(),2);
  });
  await test('08 correction cannot silently change same customer to inflate history',()=>{
    assert.throws(()=>put('CORRECT','BOOK19_FAKE_ORDER_A','CUS-C000222','BOOK19_FAKE_SAME_ID',one().revisionId),/BOOK19_/);
    assert.equal(count(),2);
  });
  await test('09 withdraw must reference exact latest and preserve candidate in audit',()=>{
    const before=one();
    assert.throws(()=>put('WITHDRAW','BOOK19_FAKE_ORDER_A','CUS-C000111','BOOK19_FAKE_BAD_WITHDRAW',before.revisionId),/BOOK19_/);
    put('WITHDRAW','BOOK19_FAKE_ORDER_A','CUS-C000222','BOOK19_FAKE_WITHDRAW_001',before.revisionId);
    assert.equal(one().kind,'WITHDRAW');
    assert.equal(one().customerId,'CUS-C000222');
    assert.equal(one().status,'NOT_ATTESTED');
    assert.equal(count(),3);
  });
  await test('10 withdrawn chain cannot be silently reactivated by correction or second proposal',()=>{
    assert.throws(()=>put('CORRECT','BOOK19_FAKE_ORDER_A','CUS-C000111','BOOK19_FAKE_CORRECT_AFTER_WITHDRAW',one().revisionId),/BOOK19_/);
    assert.throws(()=>put('PROPOSE','BOOK19_FAKE_ORDER_A','CUS-C000111','BOOK19_FAKE_NEW_AFTER_WITHDRAW'),/BOOK19_/);
    assert.equal(count(),3);
  });
  await test('11 no unknown customer, unknown order, or PREPARED T12 order',()=>{
    assert.throws(()=>put('PROPOSE','BOOK19_FAKE_ORDER_B','CUS-NOT-EXIST','BOOK19_FAKE_UNKNOWN_CUSTOMER'),/(BOOK19_|FOREIGN KEY)/);
    assert.throws(()=>put('PROPOSE','BOOK19_FAKE_ORDER_NOT_EXIST','CUS-C000111','BOOK19_FAKE_UNKNOWN_ORDER'),/(BOOK19_|FOREIGN KEY)/);
    assert.throws(()=>put('PROPOSE','BOOK19_FAKE_ORDER_PREPARED','CUS-C000111','BOOK19_FAKE_PREPARED_ORDER'),/BOOK19_/);
    assert.equal(count(),3);
  });
  await test('12 role, evidence pointer and SHA must be present and bounded',()=>{
    assert.throws(()=>put('PROPOSE','BOOK19_FAKE_ORDER_B','CUS-C000111','BOOK19_FAKE_NOT_OWNER',null,{role:'service'}),/CHECK/);
    assert.throws(()=>put('PROPOSE','BOOK19_FAKE_ORDER_B','CUS-C000111','BOOK19_FAKE_MISSING_EVIDENCE',null,{evidence:'abc'}),/CHECK/);
    assert.throws(()=>put('PROPOSE','BOOK19_FAKE_ORDER_B','CUS-C000111','BOOK19_FAKE_BAD_SHA',null,{sha:'a'}),/CHECK/);
    assert.equal(count(),3);
  });
  await test('13 no SQL UPDATE/DELETE, including status or authorization escalation',()=>{
    assert.throws(()=>db.exec('UPDATE '+tbl+" SET candidate_customer_id='CUS-C000111' WHERE order_id='BOOK19_FAKE_ORDER_A'"),/BOOK19_/);
    assert.throws(()=>db.exec('UPDATE '+tbl+" SET review_status='ATTESTED' WHERE order_id='BOOK19_FAKE_ORDER_A'"),/BOOK19_/);
    assert.throws(()=>db.exec('UPDATE '+tbl+" SET finance_authorized=1 WHERE order_id='BOOK19_FAKE_ORDER_A'"),/BOOK19_/);
    assert.throws(()=>db.exec('DELETE FROM '+tbl+" WHERE order_id='BOOK19_FAKE_ORDER_A'"),/BOOK19_/);
    assert.equal(count(),3);
  });
  await test('14 no INSERT can set approval bits or claim identity verified',()=>{
    const options=[
      ['finance_authorized',1],['delivery_authorized',1],['review_status','ATTESTED']
    ];
    for(const [column,val] of options){
      assert.throws(()=>db.prepare('INSERT INTO '+tbl+'(request_key,order_id,candidate_customer_id,event_kind,actor_subject,actor_role,evidence_ref,evidence_sha256,reason,'+column+') VALUES(?,?,?,\'PROPOSE\',\'FAKE\',\'admin\',?,?,?,?)')
        .run('BOOK19_FAKE_BIT_'+column,'BOOK19_FAKE_ORDER_B','CUS-C000111','FAKE_TEST_DOCUMENT_REF_001',sha,'FAKE_MANUAL_REVIEW_REASON_ONLY',val),/CHECK/);
    }
    assert.equal(count(),3);
  });
  await test('15 final history has no authority and no FK corruption',()=>{
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
    assert.equal(row('SELECT COUNT(*) AS n FROM '+tbl+' WHERE review_status<>\'NOT_ATTESTED\' OR finance_authorized<>0 OR delivery_authorized<>0').n,0);
    assert.equal(count(),3);
  });
  console.log('BOOK19_OFFLINE_OWNER_EVIDENCE_CORRECTION_AUDIT=SOURCE_ONLY_PASS');
  console.log('BOOK19_CUSTOMER_ACCOUNT_IDENTITY_ATTESTED=NO');
  console.log('BOOK19_FINANCE_RELEASE=NO_GO');
}finally{db.close()}
