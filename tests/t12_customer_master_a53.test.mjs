import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { issueOrdersEdgeToken } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import {
  cleanPhone,
  customerSearchKey,
  searchT12Customers,
  upsertT12Customer
} from '../cloudflare-d1/src/t12-customer-master.mjs';
import { handleT12CustomerWriteRequest } from '../cloudflare-d1/src/t12-customer-write-handler.mjs';

const schema=fs.readFileSync(new URL('../cloudflare-d1/migrations/0008_t12_customer_master.sql',import.meta.url),'utf8');

class Stmt {
  constructor(db,sql){this.db=db;this.sql=sql;this.params=[];}
  bind(...p){this.params=p;return this;}
  async first(){return this.db.raw.prepare(this.sql).get(...this.params)||null;}
  async all(){return {results:this.db.raw.prepare(this.sql).all(...this.params)};}
  async run(){return this.db.raw.prepare(this.sql).run(...this.params);}
}
class D1 {
  constructor(mode='OFF',budget=0){
    this.raw=new DatabaseSync(':memory:');
    this.raw.exec('PRAGMA foreign_keys=ON;');
    this.raw.exec(schema);
    this.raw.prepare('UPDATE t12_customer_control SET mode=?,canary_remaining=? WHERE singleton=1').run(mode,budget);
    this.turn=Promise.resolve();
    this.failAt=0;
    this.ambiguous=false;
  }
  prepare(sql){return new Stmt(this,sql);}
  async batch(ss){
    let release; const prev=this.turn; this.turn=new Promise(r=>release=r); await prev;
    try{
      this.raw.exec('BEGIN IMMEDIATE');
      try{
        for(let i=0;i<ss.length;i++){
          if(this.failAt===i+1) throw Error('SIM_FAIL');
          await ss[i].run();
        }
        this.raw.exec('COMMIT');
      }catch(e){try{this.raw.exec('ROLLBACK');}catch{} throw e;}
      if(this.ambiguous) throw Error('SIM_LOST_ACK');
    }finally{release();}
  }
  control(){
    const x=this.raw.prepare('SELECT mode,canary_remaining AS remaining,next_customer_number AS nextNo FROM t12_customer_control WHERE singleton=1').get();
    return {mode:x.mode,remaining:Number(x.remaining),nextNo:Number(x.nextNo)};
  }
  count(t){return Number(this.raw.prepare('SELECT COUNT(*) AS n FROM '+t).get().n);}
  seedLegacy({id,row,name,phone='',extra='',type='خارجي',active='نعم',debt=0}){
    this.raw.prepare(`
      INSERT INTO t12_customers
      (customer_id,legacy_row_number,customer_name,customer_name_key,manager,phone,extra_phone,
       customer_type,active,debt_amount,notes,branch_code,branch_name,legacy_chat_code,
       legacy_customer_code,source,created_by,version)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)
    `).run(
      id,row,name,customerSearchKey(name),'legacy',cleanPhone(phone),cleanPhone(extra),
      type,active,debt,'','','','','','legacy-mirror','bootstrap'
    );
  }
}

const actor='admin-owner';
const makeInput=(key='cust1_1790000030000_CUSTOMERCREATE_1234567890123456',extra={})=>({
  clientRequestId:key,
  customerName:'عميل كلاود اختبار',
  manager:'admin-owner',
  phone:'01012345678',
  extraPhone:'',
  customerType:'خارجي',
  active:'نعم',
  debtAmount:'125.50',
  notes:'A53 test',
  franchiseBranchCode:'B1',
  franchiseBranchName:'بنها',
  ...extra
});

assert.equal(cleanPhone('+20 101 234 5678'),'01012345678');
assert.equal(customerSearchKey('أحمد  محمد'),'احمد محمد');

{
  const db=new D1('CANARY',1);
  const first=await upsertT12Customer(db,makeInput(),actor,{canary:true});
  assert.equal(first.success,true,JSON.stringify(first));
  assert.equal(first.customerId,'CUS-C000001');
  assert.equal(first.operation,'CREATE');
  assert.equal(first.customer.name,'عميل كلاود اختبار');
  assert.equal(first.customer.debtAmount,125.5);
  assert.deepEqual(db.control(),{mode:'CANARY',remaining:0,nextNo:2});
  assert.equal(db.count('t12_customers'),1);
  assert.equal(db.count('t12_customer_request_ledger'),1);
  assert.equal(db.count('t12_customer_events'),1);

  const replay=await upsertT12Customer(db,makeInput(),actor,{canary:true});
  assert.equal(replay.success,true);
  assert.equal(replay.idempotent,true);
  assert.equal(replay.customerId,'CUS-C000001');

  const second=await upsertT12Customer(
    db,
    makeInput('cust1_1790000030001_CUSTOMERCREATE_1234567890123457',{customerName:'عميل آخر',phone:'01012345679'}),
    actor,
    {canary:true}
  );
  assert.equal(second.success,false);
  assert.equal(second.reason,'customer-canary-not-armed');
}

{
  const db=new D1('GENERAL',0);
  db.seedLegacy({id:'CUS-L000002',row:2,name:'محمود مناع',phone:'01007131332',debt:50});
  const update=await upsertT12Customer(
    db,
    makeInput('cust1_1790000031000_CUSTOMERUPDATE_1234567890123456',{
      customerId:'CUS-L000002',
      customerName:'محمود مناع',
      phone:'01007131332',
      debtAmount:'75',
      notes:'updated'
    }),
    actor
  );
  assert.equal(update.success,true,JSON.stringify(update));
  assert.equal(update.operation,'UPDATE');
  assert.equal(update.updated,true);
  assert.equal(update.customer.customerId,'CUS-L000002');
  assert.equal(Number(update.customer.version),2);
  assert.equal(Number(update.customer.debtAmount),75);

  const replay=await upsertT12Customer(
    db,
    makeInput('cust1_1790000031000_CUSTOMERUPDATE_1234567890123456',{
      customerId:'CUS-L000002',
      customerName:'محمود مناع',
      phone:'01007131332',
      debtAmount:'75',
      notes:'updated'
    }),
    actor
  );
  assert.equal(replay.success,true);
  assert.equal(replay.idempotent,true);
  assert.equal(replay.customerId,'CUS-L000002');
}

{
  const db=new D1('GENERAL',0);
  db.seedLegacy({id:'CUS-L000002',row:2,name:'اسم مكرر',phone:'01011111111'});
  db.seedLegacy({id:'CUS-L000003',row:3,name:'اسم مكرر',phone:'01022222222'});
  const r=await upsertT12Customer(
    db,
    makeInput('cust1_1790000032000_CUSTOMERAMBIG_1234567890123456',{
      customerName:'اسم مكرر',
      phone:''
    }),
    actor
  );
  assert.equal(r.success,false);
  assert.equal(r.reason,'ambiguous-customer-match');
  assert.equal(r.customerIds.length,2);
}

{
  const db=new D1('GENERAL',0);
  db.seedLegacy({id:'CUS-L000002',row:2,name:'عميل نشط',phone:'01011111111',active:'نعم'});
  db.seedLegacy({id:'CUS-L000003',row:3,name:'عميل غير نشط',phone:'01022222222',active:'لا'});
  const active=await searchT12Customers(db,'عميل',12);
  assert.equal(active.length,1);
  assert.equal(active[0].customerId,'CUS-L000002');
  assert.equal(active[0].cloudNative,true);
  const byPhone=await searchT12Customers(db,'01011111111',12);
  assert.equal(byPhone.length,1);
}

{
  const db=new D1('CANARY',1);
  db.ambiguous=true;
  const r=await upsertT12Customer(db,makeInput(),actor,{canary:true});
  assert.equal(r.success,true,JSON.stringify(r));
  assert.equal(r.ambiguousAckRecovered,true);
  assert.equal(r.customerId,'CUS-C000001');
}

{
  const db=new D1('OFF',0);
  const env={DB:db,EDGE_SESSION_SECRET:'unit-secret',CORS_ORIGINS:'https://fawakhry.github.io'};
  let req=new Request('https://x/v1/t12/customers/write/health');
  let res=await handleT12CustomerWriteRequest(req,env);
  assert.equal(res.status,200);
  let body=await res.json();
  assert.equal(body.schemaReady,true);
  assert.equal(body.mode,'OFF');
  assert.equal(body.customerCount,0);

  const token=await issueOrdersEdgeToken(
    {sub:'admin-owner',role:'admin',department:'إدارة',screens:['service','print','laser','press','']},
    'unit-secret',
    Math.floor(Date.now()/1000),
    600
  );
  req=new Request('https://x/v1/t12/customers/write',{
    method:'POST',
    headers:{authorization:'Bearer '+token,'content-type':'application/json'},
    body:JSON.stringify(makeInput())
  });
  res=await handleT12CustomerWriteRequest(req,env);
  assert.equal(res.status,423);

  db.raw.prepare("UPDATE t12_customer_control SET mode='CANARY',canary_remaining=1 WHERE singleton=1").run();
  req=new Request('https://x/v1/t12/customers/write',{
    method:'POST',
    headers:{
      authorization:'Bearer '+token,
      'content-type':'application/json',
      'x-t12-customer-canary-confirm':'1'
    },
    body:JSON.stringify(makeInput())
  });
  res=await handleT12CustomerWriteRequest(req,env);
  assert.equal(res.status,201);
  body=await res.json();
  assert.equal(body.customerId,'CUS-C000001');
  assert.equal(body.generalCutover,false);

  req=new Request('https://x/v1/t12/customers/write/readback?customerId=CUS-C000001',{
    headers:{authorization:'Bearer '+token}
  });
  res=await handleT12CustomerWriteRequest(req,env);
  assert.equal(res.status,200);
  body=await res.json();
  assert.equal(body.customer.customerId,'CUS-C000001');
}

console.log('T12 A53 Cloud-native customer master isolated PASS');
