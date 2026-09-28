import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { issueOrdersEdgeToken } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import { customerSearchKey } from '../cloudflare-d1/src/t12-customer-master.mjs';
import { projectLegacyCustomer } from '../cloudflare-d1/src/t12-customer-legacy-projection.mjs';
import { handleT12CustomerWriteRequest } from '../cloudflare-d1/src/t12-customer-write-handler.mjs';

const schema=fs.readFileSync(new URL('../cloudflare-d1/migrations/0008_t12_customer_master.sql',import.meta.url),'utf8');

class Stmt{
  constructor(db,sql){this.db=db;this.sql=sql;this.params=[];}
  bind(...p){this.params=p;return this;}
  async first(){return this.db.raw.prepare(this.sql).get(...this.params)||null;}
  async all(){return {results:this.db.raw.prepare(this.sql).all(...this.params)};}
  async run(){return this.db.raw.prepare(this.sql).run(...this.params);}
}
class D1{
  constructor(mode='OFF'){
    this.raw=new DatabaseSync(':memory:');
    this.raw.exec('PRAGMA foreign_keys=ON;');
    this.raw.exec(schema);
    this.raw.prepare('UPDATE t12_customer_control SET mode=? WHERE singleton=1').run(mode);
    this.turn=Promise.resolve();
    this.ambiguous=false;
  }
  prepare(sql){return new Stmt(this,sql);}
  async batch(ss){
    let release;const prev=this.turn;this.turn=new Promise(r=>release=r);await prev;
    try{
      this.raw.exec('BEGIN IMMEDIATE');
      try{for(const s of ss)await s.run();this.raw.exec('COMMIT');}
      catch(e){try{this.raw.exec('ROLLBACK');}catch{}throw e;}
      if(this.ambiguous)throw Error('SIM_LOST_ACK');
    }finally{release();}
  }
  seed(id,row,name,phone,extra=''){
    this.raw.prepare(`
      INSERT INTO t12_customers
      (customer_id,legacy_row_number,customer_name,customer_name_key,manager,phone,extra_phone,
       customer_type,active,debt_amount,notes,branch_code,branch_name,legacy_chat_code,
       legacy_customer_code,source,created_by,version)
      VALUES (?,?,?,?,? ,?,?, 'خارجي','نعم',0,'','','','','','legacy-mirror','bootstrap',1)
    `).run(id,row,name,customerSearchKey(name),'legacy',phone,extra);
  }
  count(t){return Number(this.raw.prepare('SELECT COUNT(*) n FROM '+t).get().n);}
}

const actor='admin-owner';
const payload=(key='custp_1790000040000_PROJECTION_1234567890123456',extra={})=>({
  clientRequestId:key,
  customerName:'محمود مناع',
  manager:'admin-owner',
  phone:'01007131332',
  extraPhone:'',
  customerType:'خارجي',
  active:'نعم',
  debtAmount:'125',
  notes:'authoritative sheet save',
  franchiseBranchCode:'B1',
  franchiseBranchName:'بنها',
  ...extra
});

{
  const db=new D1('OFF');
  db.seed('CUS-L000033',33,'محمود مناع','01007131332');
  const r=await projectLegacyCustomer(db,payload(),actor);
  assert.equal(r.success,true,JSON.stringify(r));
  assert.equal(r.operation,'UPDATE');
  assert.equal(r.customerId,'CUS-L000033');
  assert.equal(Number(r.customer.debtAmount),125);
  assert.equal(Number(r.customer.version),2);
  assert.equal(db.count('t12_customer_request_ledger'),1);

  const replay=await projectLegacyCustomer(db,payload(),actor);
  assert.equal(replay.success,true);
  assert.equal(replay.idempotent,true);
  assert.equal(replay.customerId,'CUS-L000033');
}

{
  const db=new D1('OFF');
  db.raw.prepare('UPDATE t12_customer_control SET next_customer_number=10 WHERE singleton=1').run();
  const p=payload('custp_1790000040001_PROJECTION_1234567890123457',{
    customerName:'عميل جديد من الشيت',
    phone:'01099999999',
    debtAmount:'0'
  });
  const r=await projectLegacyCustomer(db,p,actor);
  assert.equal(r.success,true,JSON.stringify(r));
  assert.equal(r.operation,'CREATE');
  assert.equal(r.customerId,'CUS-C000010');
  assert.equal(r.customer.source,'legacy-mirror');
  const ctl=db.raw.prepare('SELECT next_customer_number n FROM t12_customer_control WHERE singleton=1').get();
  assert.equal(Number(ctl.n),11);

  const replay=await projectLegacyCustomer(db,p,actor);
  assert.equal(replay.success,true);
  assert.equal(replay.idempotent,true);
  assert.equal(replay.customerId,'CUS-C000010');
}

{
  const db=new D1('OFF');
  db.seed('CUS-L000002',2,'اسم مكرر','01011111111');
  db.seed('CUS-L000003',3,'اسم مكرر','01022222222');
  const exactPhone=await projectLegacyCustomer(db,payload('custp_1790000040002_PROJECTION_1234567890123458',{
    customerName:'اسم مكرر',phone:'01022222222'
  }),actor);
  assert.equal(exactPhone.success,true);
  assert.equal(exactPhone.customerId,'CUS-L000003');

  const ambiguous=await projectLegacyCustomer(db,payload('custp_1790000040003_PROJECTION_1234567890123459',{
    customerName:'اسم مكرر',phone:''
  }),actor);
  assert.equal(ambiguous.success,false);
  assert.equal(ambiguous.reason,'ambiguous-legacy-customer-projection');
  assert.equal(ambiguous.matchBy,'name');
}

{
  const db=new D1('GENERAL');
  const r=await projectLegacyCustomer(db,payload(),actor);
  assert.equal(r.success,false);
  assert.equal(r.reason,'projection-requires-customer-write-off');
}

{
  const db=new D1('OFF');
  db.seed('CUS-L000033',33,'محمود مناع','01007131332');
  db.ambiguous=true;
  const r=await projectLegacyCustomer(db,payload(),actor);
  assert.equal(r.success,true,JSON.stringify(r));
  assert.equal(r.ambiguousAckRecovered,true);
}

{
  const db=new D1('OFF');
  db.seed('CUS-L000033',33,'محمود مناع','01007131332');
  const env={DB:db,EDGE_SESSION_SECRET:'a55-secret',CORS_ORIGINS:'https://fawakhry.github.io'};
  const token=await issueOrdersEdgeToken(
    {sub:'admin-owner',role:'admin',department:'إدارة',screens:['service']},
    'a55-secret',
    Math.floor(Date.now()/1000),
    600
  );
  const req=new Request('https://x/v1/t12/customers/legacy-projection',{
    method:'POST',
    headers:{authorization:'Bearer '+token,'content-type':'application/json'},
    body:JSON.stringify(payload())
  });
  const res=await handleT12CustomerWriteRequest(req,env);
  assert.equal(res.status,201);
  const body=await res.json();
  assert.equal(body.success,true);
  assert.equal(body.authoritativeSource,'apps-script');
  assert.equal(body.customerId,'CUS-L000033');
}

console.log('T12 A55 legacy customer projection PASS');
