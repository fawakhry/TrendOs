import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { issueOrdersEdgeToken } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import {
  handleEdgeCustomerSearchRequest,
  searchNativeCustomerDirectory
} from '../cloudflare-d1/src/edge-customer-search-v1.mjs';
import { customerSearchKey } from '../cloudflare-d1/src/t12-customer-master.mjs';

const schema=fs.readFileSync(new URL('../cloudflare-d1/migrations/0008_t12_customer_master.sql',import.meta.url),'utf8');
const raw=new DatabaseSync(':memory:');
raw.exec('PRAGMA foreign_keys=ON;');
raw.exec(schema);

class Stmt {
  constructor(sql){this.sql=sql;this.params=[];}
  bind(...p){this.params=p;return this;}
  async first(){return raw.prepare(this.sql).get(...this.params)||null;}
  async all(){return {results:raw.prepare(this.sql).all(...this.params)};}
  async run(){return raw.prepare(this.sql).run(...this.params);}
}
const DB={
  prepare(sql){return new Stmt(sql);},
  async batch(items){
    raw.exec('BEGIN IMMEDIATE');
    try{for(const item of items) await item.run(); raw.exec('COMMIT');}
    catch(e){try{raw.exec('ROLLBACK');}catch{} throw e;}
  }
};

const insert=raw.prepare(`
  INSERT INTO t12_customers
  (customer_id,legacy_row_number,customer_name,customer_name_key,manager,phone,extra_phone,
   customer_type,active,debt_amount,notes,branch_code,branch_name,legacy_chat_code,
   legacy_customer_code,source,created_by,version)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)
`);
for(let i=2;i<=248;i++){
  const target=i===33;
  const name=target?'محمود مناع':'عميل '+i;
  const phone=target?'01007131332':('010'+String(10000000+i).padStart(8,'0')).slice(0,11);
  insert.run(
    'CUS-L'+String(i).padStart(6,'0'),i,name,customerSearchKey(name),'legacy',
    phone,'','خارجي','نعم',target?125.5:0,'','','','','','legacy-mirror','bootstrap'
  );
}
assert.equal(Number(raw.prepare('SELECT COUNT(*) n FROM t12_customers').get().n),247);

const env={
  DB,
  CORS_ORIGINS:'https://fawakhry.github.io',
  EDGE_SESSION_SECRET:'a54-secret'
};

{
  const direct=await searchNativeCustomerDirectory(env,'محمود',12);
  assert.equal(direct.ready,true);
  assert.equal(direct.state.customerCount,247);
  assert.equal(direct.customers.length,1);
  assert.equal(direct.customers[0].customerId,'CUS-L000033');
  assert.equal(direct.customers[0].phone,'01007131332');
  assert.equal(Number(direct.customers[0].debtAmount),125.5);
}

{
  const token=await issueOrdersEdgeToken(
    {sub:'wael',role:'admin',department:'إدارة',screens:['service','print','laser','press','']},
    'a54-secret',
    Math.floor(Date.now()/1000),
    600
  );
  const req=new Request('https://edge.test/v1/edge/customers/search?q=%D9%85%D8%AD%D9%85%D9%88%D8%AF',{
    headers:{Origin:'https://fawakhry.github.io',Authorization:'Bearer '+token}
  });
  const res=await handleEdgeCustomerSearchRequest(req,env);
  assert.equal(res.status,200);
  const body=await res.json();
  assert.equal(body.success,true);
  assert.equal(body.dataSource,'t12-customer-master');
  assert.equal(body.customers.length,1);
  assert.equal(body.customers[0].customerId,'CUS-L000033');
  assert.equal(body.nativeMaster.customerCount,247);
  assert.equal(body.nativeMaster.mode,'OFF');
  assert.equal(Object.prototype.hasOwnProperty.call(body,'mirror'),false);
}

{
  const token=await issueOrdersEdgeToken(
    {sub:'wael',role:'admin',department:'إدارة',screens:['service']},
    'a54-secret',
    Math.floor(Date.now()/1000),
    600
  );
  const req=new Request('https://edge.test/v1/edge/customers/search?q=NO_SUCH_CUSTOMER',{
    headers:{Authorization:'Bearer '+token}
  });
  const res=await handleEdgeCustomerSearchRequest(req,env);
  assert.equal(res.status,200);
  const body=await res.json();
  assert.equal(body.dataSource,'t12-customer-master');
  assert.deepEqual(body.customers,[]);
}

console.log('T12 A54 native customer search primary PASS');
