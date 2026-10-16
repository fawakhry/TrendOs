import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import {webcrypto} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

// BOOK19 existing P0: exercise REAL checked-in accounting and Core HTTP handlers
// against ONE disposable SQLite database. No network, no external credentials,
// no production D1, no real funds. GENERAL is enabled in memory ONLY.
// This tests source divergence; it does not authorize delivery or source switch.
const native=(path,handle,tag,db,DB,env)=> {
  const src=fs.readFileSync(path,'utf8')
    .replace(/^import \{ verifyEmployeeSessionCloudFirst \} from '\.\/cloud-session-bridge-v3\.mjs';\s*/,'')
    .replace(/^export /gm,'');
  const context=vm.createContext({
    crypto:webcrypto,TextEncoder,Date,Math,Intl,JSON,URL,URLSearchParams,
    Response,Request,Headers,console,
    verifyEmployeeSessionCloudFirst:async(username,token)=>{
      if(username!=='BOOK19_FAKE_OWNER'||token!=='BOOK19_OFFLINE_TOKEN')
        return {ok:false,message:'FAKE_AUTH_DENIED'};
      return {ok:true,authSource:'FAKE_LOCAL_VERIFIER_NOT_SSO',
        body:{user:{username,role:'admin',department:'إدارة'}}};
    }
  });
  vm.runInContext(src+'\n;globalThis.verifiedHandler='+handle+';',context,{timeout:18000});
  return async(action,data={})=>{
    const response=await context.verifiedHandler(new Request('https://offline.invalid/v1/employee/'+tag,{
      method:'POST',headers:{Origin:'https://fawakhry.github.io','Content-Type':'application/json',
        Authorization:'Bearer BOOK19_OFFLINE_TOKEN'},
      body:JSON.stringify({action,username:'BOOK19_FAKE_OWNER',...data})
    }),env);
    return {httpStatus:response.status,...await response.json()};
  };
};
const db=new DatabaseSync(':memory:');
try{
  for(const f of [
    '0015_employee_accounting_zero_google_v1.sql',
    '0016_employee_core_zero_google_v1.sql',
    '0017_employee_core_current_orders_v1.sql',
    '0020_employee_accounting_party_master_v1.sql',
    '0021_employee_accounting_material_dimensions_v1.sql',
    '0022_employee_accounting_day_ops_v1.sql',
    '0023_employee_accounting_command_audit_v1.sql',
    '0024_employee_accounting_party_balances_v1.sql',
    '0025_employee_accounting_final_reversal_day_close_v1.sql',
    '0026_employee_accounting_tx_guard_v1.sql',
    '0027_employee_accounting_direct_sale_cost_v1.sql',
    '0028_employee_accounting_write_canary_v1.sql',
    '0029_employee_accounting_canary_mode_v1.sql',
    '0030_employee_accounting_write_canary_budget_v1.sql',
    '0031_employee_accounting_customer_advance_credit_v1.sql'
  ])db.exec(fs.readFileSync('cloudflare-d1/migrations/'+f,'utf8'));
  db.exec([
    "CREATE TABLE t12_prod_orders(order_id TEXT PRIMARY KEY,customer_mode TEXT DEFAULT 'external',",
    " customer_name TEXT DEFAULT '',customer_phone TEXT DEFAULT '',external_customer_id TEXT DEFAULT '',",
    " source TEXT DEFAULT '',notes TEXT DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP,",
    " updated_at TEXT DEFAULT CURRENT_TIMESTAMP,department TEXT DEFAULT '',priority TEXT DEFAULT '',",
    " status TEXT DEFAULT '',raw_json TEXT DEFAULT '{}');",
    "CREATE TABLE t12_prod_lines(line_id TEXT PRIMARY KEY,order_id TEXT,ordinal INTEGER DEFAULT 1,",
    " department TEXT DEFAULT '',assigned_to TEXT DEFAULT '',item_name TEXT DEFAULT '',",
    " qty REAL DEFAULT 1,priority TEXT DEFAULT '',status TEXT DEFAULT 'طلب جديد',",
    " heat_press INTEGER DEFAULT 0,fly_print INTEGER DEFAULT 0,",
    " created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);",
    "CREATE TABLE t12_customers(customer_id TEXT PRIMARY KEY,customer_name TEXT NOT NULL,",
    " phone TEXT DEFAULT '',extra_phone TEXT DEFAULT '',active TEXT DEFAULT 'نعم',",
    " debt_amount REAL DEFAULT 0,notes TEXT DEFAULT '',updated_at TEXT DEFAULT CURRENT_TIMESTAMP);",
    "CREATE TABLE t12_prod_line_runtime(line_id TEXT PRIMARY KEY,order_id TEXT,status TEXT DEFAULT '',",
    " notes TEXT DEFAULT '',customer_notified TEXT DEFAULT '',notified_at TEXT DEFAULT '',",
    " notified_by TEXT DEFAULT '',last_whatsapp_message TEXT DEFAULT '',last_whatsapp_at TEXT DEFAULT '',",
    " last_whatsapp_by TEXT DEFAULT '',updated_by TEXT DEFAULT '',version INTEGER DEFAULT 1,",
    " updated_at TEXT DEFAULT CURRENT_TIMESTAMP);",
    "CREATE TABLE t12_prod_runtime_events(event_id INTEGER PRIMARY KEY AUTOINCREMENT,",
    " order_id TEXT,line_id TEXT,event_type TEXT,old_status TEXT,new_status TEXT,",
    " actor TEXT NOT NULL,payload_json TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);"
  ].join('\n'));
  const one=(sql,...args)=>db.prepare(sql).get(...args);
  const count=table=>one('SELECT COUNT(*) AS n FROM '+table).n;
  // Two fictional customers, no shared phone/name, with deliberately stale
  // imported and Native operational snapshots representing distinct sources.
  const identities=[
    ['BOOK19_FAKE_CUST_IMPORTED','Book19 Fake Imported','FAKE_PHONE_IMPORTED',50],
    ['BOOK19_FAKE_CUST_NATIVE','Book19 Fake Native','FAKE_PHONE_NATIVE',70]
  ];
  for(const [id,name,phone,debt] of identities)
    db.prepare('INSERT INTO t12_customers(customer_id,customer_name,phone,debt_amount) VALUES(?,?,?,?)')
      .run(id,name,phone,debt);
  db.prepare('INSERT INTO employee_core_orders_v1(order_id,customer_name,customer_phone,active) VALUES(?,?,?,1)')
    .run('BOOK19_FAKE_ORDER_IMPORTED','Book19 Fake Imported','FAKE_PHONE_IMPORTED');
  db.prepare("INSERT INTO employee_core_lines_v1(line_id,order_id,customer_name,customer_phone,department,item_name,status,debt_amount,active) VALUES(?,?,?,?,'طباعة','FAKE_JOB','طلب جديد',50,1)")
    .run('BOOK19_FAKE_LINE_IMPORTED','BOOK19_FAKE_ORDER_IMPORTED','Book19 Fake Imported','FAKE_PHONE_IMPORTED');
  db.prepare("INSERT INTO t12_prod_orders(order_id,customer_name,customer_phone,department) VALUES(?,?,?,'طباعة')")
    .run('BOOK19_FAKE_ORDER_NATIVE','Book19 Fake Native','FAKE_PHONE_NATIVE');
  db.prepare("INSERT INTO t12_prod_lines(line_id,order_id,department,item_name,status) VALUES(?,?,'طباعة','FAKE_JOB','طلب جديد')")
    .run('BOOK19_FAKE_LINE_NATIVE','BOOK19_FAKE_ORDER_NATIVE');
  for(const [name,key] of [
    ['Book19 Fake Imported','book19 fake imported'],
    ['Book19 Fake Native','book19 fake native']
  ])db.prepare("INSERT INTO employee_core_delivery_restrictions_v1(customer_key,customer_name,valid_until) VALUES(?,?,'')")
      .run(key,name);
  const DB={
    prepare(sql){
      const s={sql:String(sql),args:[]};
      const stmt={
        bind(...args){s.args=args;return stmt;},
        async first(){return db.prepare(s.sql).get(...s.args)||null;},
        async all(){return {results:db.prepare(s.sql).all(...s.args)};},
        async run(){return db.prepare(s.sql).run(...s.args);}
      };
      stmt.__statement=s;return stmt;
    },
    async batch(stmts){
      db.exec('BEGIN IMMEDIATE');
      try{
        const rows=stmts.map(q=>db.prepare(q.__statement.sql).run(...q.__statement.args));
        db.exec('COMMIT');return rows;
      }catch(error){db.exec('ROLLBACK');throw error;}
    }
  };
  const env={DB,CORS_ORIGINS:'https://fawakhry.github.io',
    EASYSTORE_CUSTOMER_CREDIT_V1:'OFF'};
  const sendAccounting=native('cloudflare-d1/src/employee-accounting-native-v1.mjs',
    'handleEmployeeAccountingNativeRequest','accounting',db,DB,env);
  const sendCore=native('cloudflare-d1/src/employee-core-native-v1.mjs',
    'handleEmployeeCoreNativeRequest','core',db,DB,env);
  const opening=(id,amount)=>({
    operation:'opening_debt',customerId:id,amount,
    requestId:'BOOK19_FAKE_OPEN_'+id
  });
  const receipt=(id,amount)=>({
    operation:'payment_received',customerId:id,amount,
    requestId:'BOOK19_FAKE_RECEIPT_'+id,paymentMethod:'نقدي',
    workDate:'2099-12-31',sourceSystem:'BOOK19_OFFLINE_E2E'
  });
  const accountBalance=id=>Number(one(
    "SELECT balance FROM employee_accounting_party_balances_v1 WHERE party_type='customer' AND party_id=?",id)?.balance);
  let networkCalls=0;
  const previousFetch=globalThis.fetch;
  globalThis.fetch=()=>{networkCalls++;throw Error('NO_EXTERNAL_NETWORK');};
  try{
    await test('01 accounting OFF and Core OFF deny mutation before isolated activation',async()=>{
      assert.equal(one('SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1').mode,'OFF');
      assert.equal(one('SELECT mode FROM employee_core_control_v1 WHERE singleton=1').mode,'OFF');
      const r=await sendAccounting('saveCustomerAccountMovementV1915',receipt(identities[0][0],50));
      assert.equal(r.httpStatus,503,JSON.stringify(r));
      assert.equal(count('employee_accounting_cashbox_v1'),0);
    });
    await test('02 real finance Worker posts two opening debts only to accounting balances',async()=>{
      db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1");
      db.exec("UPDATE employee_accounting_write_canary_v1 SET enabled=0,max_commands=0,commands_started=0 WHERE singleton=1");
      db.exec("UPDATE employee_core_control_v1 SET mode='READONLY' WHERE singleton=1");
      for(const [id,, ,amount] of identities){
        const r=await sendAccounting('saveCustomerAccountMovementV1915',opening(id,amount));
        assert.equal(r.success,true,JSON.stringify(r));
        assert.equal(accountBalance(id),amount);
      }
      assert.equal(count('employee_accounting_cashbox_v1'),0);
    });
    await test('03 real Core read preview and getRows show debt restriction before receipt',async()=>{
      for(const [lineId,amount] of [
        ['BOOK19_FAKE_LINE_IMPORTED',50],['BOOK19_FAKE_LINE_NATIVE',70]
      ]){
        const p=await sendCore('previewDeliveryDebtReconciliationV1',{lineId});
        assert.equal(p.success,true,JSON.stringify(p));
        assert.equal(p.operationalDebt,amount);
        assert.equal(p.postedCustomerBalance,amount);
        assert.equal(p.receiptEvidenceStatus,'NO_COMMITTED_RECEIPT_OBSERVED');
        assert.equal(p.deliveryAuthorized,false);
      }
      const rows=await sendCore('getRows',{screen:'service'});
      assert.equal(rows.success,true,JSON.stringify(rows));
      for(const row of rows.rows){
        assert.equal(row.deliveryDebtRestricted,true,JSON.stringify(row));
      }
    });
    await test('04 real Core updateLine denies restricted delivery before payment',async()=>{
      db.exec("UPDATE employee_core_control_v1 SET mode='GENERAL' WHERE singleton=1");
      for(const lineId of ['BOOK19_FAKE_LINE_IMPORTED','BOOK19_FAKE_LINE_NATIVE']){
        const r=await sendCore('updateLine',{lineId,status:'تم التسليم'});
        assert.equal(r.success,false,JSON.stringify(r));
        assert.equal(r.code,'employee-core-delivery-debt-restricted');
      }
      assert.equal(count('t12_prod_line_runtime'),0);
      assert.equal(one("SELECT status FROM employee_core_lines_v1 WHERE line_id='BOOK19_FAKE_LINE_IMPORTED'").status,'طلب جديد');
    });
    await test('05 REAL accounting Worker posts 50 and 51 cash and COMMITTED receipt ledger',async()=>{
      for(const [id,, ,cash] of [
        [...identities[0].slice(0,3),50],
        [...identities[1].slice(0,3),51]
      ]){
        const r=await sendAccounting('saveCustomerAccountMovementV1915',receipt(id,cash));
        assert.equal(r.success,true,JSON.stringify(r));
        assert.equal(r.cashboxPosted,true,JSON.stringify(r));
      }
      assert.equal(accountBalance(identities[0][0]),0);
      assert.equal(accountBalance(identities[1][0]),19);
      const posted=one("SELECT COUNT(*) AS n FROM employee_accounting_request_ledger_v1 WHERE status='COMMITTED' AND operation='party-ledger:customer:payment_received'");
      assert.equal(posted.n,2);
      assert.equal(one("SELECT COALESCE(SUM(amount),0) AS n FROM employee_accounting_cashbox_v1 WHERE movement_type='CUSTOMER_RECEIPT'").n,101);
      assert.equal(one("SELECT COUNT(*) AS n FROM employee_accounting_party_ledger_v1 WHERE operation='payment_received'").n,2);
    });
    await test('06 actual Core read preview observes COMMITTED receipts, old operational debt stays',async()=>{
      const expectations=[
        ['BOOK19_FAKE_LINE_IMPORTED',50,0,50,'BOOK19_FAKE_CUST_IMPORTED'],
        ['BOOK19_FAKE_LINE_NATIVE',70,19,51,'BOOK19_FAKE_CUST_NATIVE']
      ];
      for(const [lineId,operational,posted,amount,id] of expectations){
        const r=await sendCore('previewDeliveryDebtReconciliationV1',{lineId});
        assert.equal(r.success,true,JSON.stringify(r));
        assert.equal(r.operationalDebt,operational);
        assert.equal(r.postedCustomerBalance,posted);
        assert.equal(r.status,'SOURCES_DIFFER');
        assert.equal(r.receiptEvidenceStatus,'COMMITTED_RECEIPT_FOR_UNVERIFIED_CANDIDATE');
        assert.equal(r.candidateCommittedReceiptEvidence?.amount,amount);
        assert.equal(r.candidateCommittedReceiptEvidence?.requestKey,'BOOK19_FAKE_RECEIPT_'+id);
        assert.equal(r.identityVerified,false);
        assert.equal(r.deliveryAuthorized,false);
        assert.equal(r.postingAllowed,false);
        assert.equal(r.financeRelease,'NO_GO');
      }
      assert.equal(one("SELECT debt_amount AS debt FROM employee_core_lines_v1 WHERE line_id='BOOK19_FAKE_LINE_IMPORTED'").debt,50);
      assert.equal(one("SELECT debt_amount AS debt FROM t12_customers WHERE customer_id='BOOK19_FAKE_CUST_NATIVE'").debt,70);
    });
    await test('07 delivery WRITE gate still denies despite genuine offline posted receipts',async()=>{
      const before=count('employee_core_events_v1');
      const rows=await sendCore('getRows',{screen:'service'});
      assert.equal(rows.success,true,JSON.stringify(rows));
      assert.equal(rows.rows.length,2);
      assert.ok(rows.rows.every(r=>r.deliveryDebtRestricted===true));
      for(const lineId of ['BOOK19_FAKE_LINE_IMPORTED','BOOK19_FAKE_LINE_NATIVE']){
        const r=await sendCore('updateLine',{lineId,status:'تم التسليم',role:'admin',debtAmount:0});
        assert.equal(r.code,'employee-core-delivery-debt-restricted',JSON.stringify(r));
      }
      assert.equal(count('employee_core_events_v1'),before);
      assert.equal(count('t12_prod_line_runtime'),0);
      assert.equal(one("SELECT status FROM employee_core_lines_v1 WHERE line_id='BOOK19_FAKE_LINE_IMPORTED'").status,'طلب جديد');
    });
    await test('08 actual Worker idempotency replays collection without second cash posting',async()=>{
      const before=count('employee_accounting_cashbox_v1');
      const r=await sendAccounting('saveCustomerAccountMovementV1915',receipt(identities[0][0],50));
      assert.equal(r.success,true,JSON.stringify(r));
      assert.equal(r.duplicatePrevented,true,JSON.stringify(r));
      assert.equal(count('employee_accounting_cashbox_v1'),before);
      assert.equal(accountBalance(identities[0][0]),0);
    });
    await test('09 READONLY finance blocks further fake posting, Core remains fail closed',async()=>{
      db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1");
      db.exec("UPDATE employee_core_control_v1 SET mode='READONLY' WHERE singleton=1");
      const before=count('employee_accounting_cashbox_v1');
      const r=await sendAccounting('saveCustomerAccountMovementV1915',{
        ...receipt(identities[1][0],1),requestId:'BOOK19_FAKE_FORBIDDEN_NEW_RECEIPT'
      });
      assert.equal(r.httpStatus,503,JSON.stringify(r));
      assert.equal(count('employee_accounting_cashbox_v1'),before);
      const blocked=await sendCore('updateLine',{lineId:'BOOK19_FAKE_LINE_IMPORTED',status:'تم التسليم'});
      assert.equal(blocked.code,'employee-core-readonly');
      assert.equal(networkCalls,0);
    });
    console.log('BOOK19_REAL_ACCOUNTING_HANDLER_COLLECTION=OFFLINE_SQLITE_PASS');
    console.log('BOOK19_ACTUAL_CORE_DELIVERY_GATE=BLOCKS_STALE_OPERATIONAL_DEBT');
    console.log('BOOK19_LIVE_COLLECTION_AND_DEPLOYMENT=NOT_TESTED');
    console.log('BOOK19_FINANCE_RELEASE=NO_GO');
  }finally{globalThis.fetch=previousFetch;}
}finally{db.close();}
