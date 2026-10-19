// ACC213 — source-only actual D1 handler checks on disposable fake SQLite.
// No Cloudflare credentials, payment provider, live customer or production calls.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';

await test('ACC213: Wael/Gaber department lines become exactly one authenticated customer invoice (NO_GO)', async t=>{
  const db=new DatabaseSync(':memory:');
  t.after(()=>db.close());
  for(const m of [
    '0015_employee_accounting_zero_google_v1.sql',
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
  ])db.exec(fs.readFileSync('cloudflare-d1/migrations/'+m,'utf8'));
  db.exec("CREATE TABLE t12_customers(customer_id TEXT PRIMARY KEY,customer_name TEXT,active TEXT,updated_at TEXT)");
  db.prepare("INSERT INTO t12_customers(customer_id,customer_name,active) VALUES ('ACC213_CUST_A','ACC213 FAKE A','نعم'),('ACC213_CUST_B','ACC213 FAKE B','نعم')").run();
  db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1");
  db.exec("UPDATE employee_accounting_write_canary_v1 SET enabled=0,max_commands=0,commands_started=0 WHERE singleton=1");
  const env={
    CORS_ORIGINS:'https://fawakhry.github.io',
    ACCOUNTING_FINANCE_GRANTS_MODE_V1:'ENFORCE',
    ACCOUNTING_FINANCE_GRANTS_V1:JSON.stringify({version:1,grants:[
      {username:'ACC213_WAEL',mode:'print'},
      {username:'ACC213_GABER',mode:'laser'},
      {username:'ACC213_RAHMA',mode:'final'},
      {username:'ACC213_DIAA',mode:'full'}
    ]}),
    DB:{
      prepare(sql){const d={sql:String(sql),args:[]},stmt={
        bind(...a){d.args=a;return stmt},
        first(){return Promise.resolve(db.prepare(d.sql).get(...d.args)||null)},
        all(){return Promise.resolve({results:db.prepare(d.sql).all(...d.args)})},
        run(){return Promise.resolve(db.prepare(d.sql).run(...d.args))}
      };stmt._data=d;return stmt},
      async batch(statements){
        db.exec('BEGIN IMMEDIATE');
        try{const x=statements.map(s=>db.prepare(s._data.sql).run(...s._data.args));db.exec('COMMIT');return x}
        catch(e){db.exec('ROLLBACK');throw e}
      }
    }
  };
  const code=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8')
    .replace(/^import \{ verifyEmployeeSessionCloudFirst \} from '\.\/cloud-session-bridge-v3\.mjs';\s*/,'')
    .replace(/^export /gm,'');
  const context=vm.createContext({
    crypto:webcrypto,Request,Response,Headers,TextEncoder,URL,URLSearchParams,Intl,Date,Math,JSON,console,
    verifyEmployeeSessionCloudFirst:async (username,token)=>(
      token==='ACC213_FAKE_TOKEN'&&['ACC213_WAEL','ACC213_GABER','ACC213_RAHMA','ACC213_DIAA'].includes(username)
        ?{ok:true,authSource:'ACC213_DISPOSABLE_FAKE_SESSION',body:{user:{username,role:'service',department:'عام'}}}
        :{ok:false})
  });
  vm.runInContext(code+'\n;globalThis.ACC213_HANDLER=handleEmployeeAccountingNativeRequest;',context,{timeout:15000});
  let networkCalls=0;
  async function send(user,action,data={}){
    const before=globalThis.fetch;
    globalThis.fetch=()=>{networkCalls++;throw Error('OFFLINE_NETWORK_FORBIDDEN')};
    try{
      const resp=await context.ACC213_HANDLER(new Request('https://offline.invalid/v1/employee/accounting',{
        method:'POST',headers:{Origin:'https://fawakhry.github.io',
          Authorization:'Bearer ACC213_FAKE_TOKEN','Content-Type':'application/json'},
        body:JSON.stringify({action,username:user,...data})
      }),env);
      return {httpStatus:resp.status,...await resp.json()};
    }finally{globalThis.fetch=before}
  }
  let serial=0;
  const rid=()=> 'ACC213-REQ-'+String(++serial).padStart(7,'0');
  async function addLine(user,id,item,price,orderId='ACC213_ORDER_A',customer='ACC213 FAKE A'){
    return send(user,'saveAccountingDeptLine',{requestId:rid(),accountingLineId:id,
      orderId,customerName:customer,itemName:item,qty:1,salePrice:price});
  }
  const saved=await addLine('ACC213_WAEL','ACC213_PRINT_1','fake print job',20);
  assert.equal(saved.success,true,JSON.stringify(saved));
  await t.test('recorded line cannot move to another order/customer/department',async()=>{
    for(const patch of [
      {orderId:'ACC213_ORDER_OTHER'},
      {customerName:'ACC213 FAKE B'}
    ]){
      const result=await send('ACC213_WAEL','saveAccountingDeptLine',{
        requestId:rid(),accountingLineId:'ACC213_PRINT_1',orderId:'ACC213_ORDER_A',
        customerName:'ACC213 FAKE A',itemName:'fake print job',qty:1,salePrice:20,...patch
      });
      assert.equal(result.success,false,JSON.stringify(result));
      assert.equal(result.code,'accounting-dept-line-immutable-identity');
    }
    const cross=await send('ACC213_GABER','saveAccountingDeptLine',{
      requestId:rid(),accountingLineId:'ACC213_PRINT_1',
      orderId:'ACC213_ORDER_A',customerName:'ACC213 FAKE A',
      itemName:'stolen print item',qty:1,salePrice:30});
    assert.equal(cross.code,'accounting-dept-line-immutable-identity',JSON.stringify(cross));
    const row=db.prepare("SELECT order_id,department,customer_name FROM employee_accounting_dept_lines_v1 WHERE accounting_line_id='ACC213_PRINT_1'").get();
    assert.equal(row.order_id,'ACC213_ORDER_A');
    assert.equal(row.department,'طباعة');
    assert.equal(row.customer_name,'ACC213 FAKE A');
  });
  assert.equal((await addLine('ACC213_GABER','ACC213_LASER_1','fake laser job',30)).success,true);
  await t.test('department approver cannot close, finance closer cannot approve department',async()=>{
    const deny=await send('ACC213_RAHMA','approveAccountingDeptInvoice',{requestId:rid(),orderId:'ACC213_ORDER_A',department:'طباعة'});
    assert.equal(deny.success,false,JSON.stringify(deny));
    const close=await send('ACC213_WAEL','saveAccountingFinalInvoice',{requestId:rid(),
      orderId:'ACC213_ORDER_A',customerId:'ACC213_CUST_A',paid:10});
    assert.equal(close.success,false,JSON.stringify(close));
    const wrong=await send('ACC213_GABER','approveAccountingDeptInvoice',{requestId:rid(),orderId:'ACC213_ORDER_A',department:'طباعة'});
    assert.equal(wrong.success,false,JSON.stringify(wrong));
  });
  for(const [user,department] of [['ACC213_WAEL','طباعة'],['ACC213_GABER','ليزر']]){
    const a=await send(user,'approveAccountingDeptInvoice',{requestId:rid(),orderId:'ACC213_ORDER_A',department});
    assert.equal(a.success,true,JSON.stringify(a));
    const second=await send(user,'approveAccountingDeptInvoice',{requestId:rid(),orderId:'ACC213_ORDER_A',department});
    assert.equal(second.success,false,'cannot approve already approved department twice');
  }
  assert.equal((await addLine('ACC213_WAEL','ACC213_PRINT_2','extra fake print job',5)).success,true);
  await t.test('no final invoice while a department has unapproved lines',async()=>{
    const r=await send('ACC213_RAHMA','saveAccountingFinalInvoice',{
      requestId:rid(),orderId:'ACC213_ORDER_A',customerId:'ACC213_CUST_A',paid:10});
    assert.equal(r.code,'accounting-dept-lines-not-all-approved',JSON.stringify(r));
  });
  assert.equal((await send('ACC213_WAEL','approveAccountingDeptInvoice',{
    requestId:rid(),orderId:'ACC213_ORDER_A',department:'طباعة'})).success,true);
  await t.test('one customer, all department lines, no cross-customer swap or partial selection',async()=>{
    const badCustomer=await send('ACC213_RAHMA','saveAccountingFinalInvoice',{
      requestId:rid(),orderId:'ACC213_ORDER_A',customerId:'ACC213_CUST_B',paid:10});
    assert.equal(badCustomer.code,'accounting-final-customer-mismatch',JSON.stringify(badCustomer));
    const partial=await send('ACC213_RAHMA','saveAccountingFinalInvoice',{
      requestId:rid(),orderId:'ACC213_ORDER_A',customerId:'ACC213_CUST_A',
      lineIds:JSON.stringify(['ACC213_PRINT_1']),paid:10});
    assert.equal(partial.code,'accounting-final-invoice-missing-dept-lines',JSON.stringify(partial));
  });
  const close=await send('ACC213_RAHMA','saveAccountingFinalInvoice',{
    requestId:rid(),orderId:'ACC213_ORDER_A',customerId:'ACC213_CUST_A',
    lineIds:JSON.stringify(['ACC213_PRINT_1','ACC213_LASER_1','ACC213_PRINT_2']),
    paymentMethod:'نقدي',paid:10});
  assert.equal(close.success,true,JSON.stringify(close));
  assert.equal(close.lineCount,3);
  assert.equal(close.finalTotal,55);
  assert.equal(close.newCashReceipt,10);
  const count=table=>db.prepare('SELECT COUNT(*) AS n FROM '+table).get().n;
  assert.equal(count('employee_accounting_final_invoices_v1'),1);
  assert.equal(count('employee_accounting_cashbox_v1'),1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM employee_accounting_party_ledger_v1 WHERE operation='payment_received'").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM employee_accounting_dept_lines_v1 WHERE final_invoice_no=?").get(close.invoiceNo).n,3);
  await t.test('new approved item for same order cannot create a second CLOSED invoice or cash receipt',async()=>{
    assert.equal((await addLine('ACC213_GABER','ACC213_LASER_2','later fake laser job',15)).success,true);
    assert.equal((await send('ACC213_GABER','approveAccountingDeptInvoice',{
      requestId:rid(),orderId:'ACC213_ORDER_A',department:'ليزر'})).success,true);
    const repeat=await send('ACC213_RAHMA','saveAccountingFinalInvoice',{
      requestId:rid(),orderId:'ACC213_ORDER_A',customerId:'ACC213_CUST_A',
      lineIds:JSON.stringify(['ACC213_LASER_2']),paid:15,paymentMethod:'نقدي'});
    assert.equal(repeat.code,'accounting-order-already-final-invoiced',JSON.stringify(repeat));
    assert.equal(count('employee_accounting_final_invoices_v1'),1);
    assert.equal(count('employee_accounting_cashbox_v1'),1);
  });
  assert.equal(networkCalls,0);
  assert.equal(db.prepare("SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1").get().mode,'GENERAL');
  console.log('ACC213_DISPOSABLE_SQLITE_ONLY=YES; FINANCE_RELEASE=NO_GO; LIVE_VERIFIED=NO');
});
