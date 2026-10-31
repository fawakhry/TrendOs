import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import { webcrypto } from 'node:crypto';

// ACC268 executes original employee-accounting-native-v1.mjs against ONLY
// disposable source migrations. No Cloudflare, no production staff or money.
// In particular no t12_customers, original operational order or employee DB.
test('ACC268: original EasyStore finance party master supports standalone cash sale without TrendOS',async()=>{
  const migrations=[
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
  ];
  const db=new DatabaseSync(':memory:');
  try {
    for(const m of migrations) db.exec(fs.readFileSync('cloudflare-d1/migrations/'+m,'utf8'));
    const code=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8')
      .replace(/^import \{ verifyEmployeeSessionCloudFirst \} from '\.\/cloud-session-bridge-v3\.mjs';\s*/,'')
      .replace(/^export /gm,'');
    const settings={
      DB:{
        prepare(sql){
          const state={sql:String(sql),args:[]};
          const stmt={
            bind(...args){state.args=args;return stmt},
            first(){return Promise.resolve(db.prepare(state.sql).get(...state.args)||null)},
            all(){return Promise.resolve({results:db.prepare(state.sql).all(...state.args)})},
            run(){return Promise.resolve(db.prepare(state.sql).run(...state.args))}
          };
          stmt.state=state;
          return stmt;
        },
        async batch(stmts){
          db.exec('BEGIN IMMEDIATE');
          try{
            const result=stmts.map(x=>db.prepare(x.state.sql).run(...x.state.args));
            db.exec('COMMIT');return result;
          }catch(e){db.exec('ROLLBACK');throw e}
        }
      },
      CORS_ORIGINS:'https://fawakhry.github.io',
      EASYSTORE_STANDALONE_CUSTOMERS_V1:'OFF',
      EASYSTORE_CUSTOMER_SOURCE_V1:'FINANCE_LOCAL_ONLY',
      ACCOUNTING_FINANCE_GRANTS_MODE_V1:'ENFORCE',
      ACCOUNTING_FINANCE_GRANTS_V1:JSON.stringify({
        version:1,grants:[{username:'ACC268_FAKE_ADMIN',mode:'full'}]
      }),
      EASYSTORE_CUSTOMER_CREDIT_V1:'OFF'
    };
    const ctx=vm.createContext({
      crypto:webcrypto,atob:globalThis.atob,TextEncoder,Response,Request,Headers,
      URL,URLSearchParams,Date,Intl,JSON,Math,console,
      verifyEmployeeSessionCloudFirst:async (username,token)=>
        (username==='ACC268_FAKE_ADMIN'&&token==='ACC268_FAKE_SESSION')
          ?{ok:true,authSource:'ACC268_FAKE_VERIFIED_SESSION',
            body:{user:{username,role:'admin',department:''}}}
          :{ok:false,message:'not a verified fake login'}
    });
    vm.runInContext(code+'\n;globalThis.ACC268_HANDLER=handleEmployeeAccountingNativeRequest;',ctx,{timeout:12000});
    const send=async(action,data={},token='ACC268_FAKE_SESSION')=>{
      const req=new Request('https://acc268.invalid/v1/employee/accounting',{
        method:'POST',
        headers:{Origin:'https://fawakhry.github.io','Content-Type':'application/json',
          Authorization:'Bearer '+token},
        body:JSON.stringify({action,username:'ACC268_FAKE_ADMIN',...data})
      });
      const res=await ctx.ACC268_HANDLER(req,settings);
      return {status:res.status,...await res.json()};
    };
    const count=t=>Number(db.prepare('SELECT COUNT(*) AS n FROM '+t).get().n);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='t12_customers'").get().n,0);
    assert.equal(db.prepare('SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1').get().mode,'OFF');
    const closed=await send('saveEasyStoreCustomer',{requestId:'ACC268-CUSTOMER-REQ-01',customerName:'ACC268 Synthetic Customer'});
    assert.equal(closed.status,503);
    assert.equal(count('employee_accounting_parties_v1'),0);
    db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1");
    const readOnly=await send('saveEasyStoreCustomer',{requestId:'ACC268-CUSTOMER-REQ-01',customerName:'ACC268 Synthetic Customer'});
    assert.equal(readOnly.status,503);
    db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1");
    db.exec("UPDATE employee_accounting_write_canary_v1 SET enabled=0,max_commands=0,commands_started=0 WHERE singleton=1");
    const disabled=await send('saveEasyStoreCustomer',{requestId:'ACC268-CUSTOMER-REQ-01',customerName:'ACC268 Synthetic Customer'});
    assert.equal(disabled.success,false);
    assert.equal(disabled.code,'accounting-standalone-customer-source-off');
    assert.equal(count('employee_accounting_parties_v1'),0);
    // ACC277: real historic supplier debt is not an ordinary new supplier.
    // The ORIGINAL Worker must not create a party, balance or ledger entry.
    const blockedOpening=await send('saveEasyStoreSupplier',{
      requestId:'ACC277-SUPPLIER-OPENING-001',
      name:'ACC277 Synthetic Supplier',opening:1250
    });
    assert.equal(blockedOpening.success,false,JSON.stringify(blockedOpening));
    assert.equal(blockedOpening.code,'acc277-nonzero-opening-unqualified');
    assert.equal(count('employee_accounting_parties_v1'),0);
    assert.equal(count('employee_accounting_party_balances_v1'),0);
    assert.equal(count('employee_accounting_party_ledger_v1'),0);
    const negativeOpening=await send('saveEasyStoreSupplier',{
      requestId:'ACC277-SUPPLIER-NEGATIVE-001',
      name:'ACC277 Synthetic Supplier',opening:-5
    });
    assert.equal(negativeOpening.code,'acc277-nonzero-opening-unqualified');
    assert.equal(count('employee_accounting_parties_v1'),0);
    settings.EASYSTORE_STANDALONE_CUSTOMERS_V1='ENFORCE';
    const forged=await send('saveEasyStoreCustomer',{requestId:'ACC268-CUSTOMER-FORGE-01',customerName:'Forgery'},'BAD_TOKEN');
    assert.equal(forged.status,401);
    const unsafe=await send('saveEasyStoreCustomer',{
      requestId:'ACC268-CUSTOMER-FORGE-02',customerName:'Forgery',openingDebt:100
    });
    assert.equal(unsafe.success,false);
    assert.equal(unsafe.code,'accounting-customer-foreign-id-or-opening-denied');
    const created=await send('saveEasyStoreCustomer',{
      requestId:'ACC268-CUSTOMER-REQ-01',customerName:'ACC268 Synthetic Customer'
    });
    assert.equal(created.success,true,JSON.stringify(created));
    assert.match(created.customerId,/^ESC-[A-F0-9]{20}$/);
    assert.equal(count('employee_accounting_parties_v1'),1);
    assert.equal(count('employee_accounting_party_balances_v1'),0);
    const replay=await send('saveEasyStoreCustomer',{
      requestId:'ACC268-CUSTOMER-REQ-01',customerName:'ACC268 Synthetic Customer'
    });
    assert.equal(replay.success,true,JSON.stringify(replay));
    assert.equal(replay.duplicatePrevented,true);
    assert.equal(count('employee_accounting_parties_v1'),1);
    const duplicate=await send('saveEasyStoreCustomer',{
      requestId:'ACC268-CUSTOMER-REQ-02',customerName:'ACC268 Synthetic Customer'
    });
    assert.equal(duplicate.success,false);
    assert.equal(duplicate.code,'accounting-customer-name-already-registered');
    const search=await send('searchCustomers',{q:'acc268'});
    assert.equal(search.success,true,JSON.stringify(search));
    assert.equal(search.customers.length,1);
    assert.equal(search.customers[0].customerId,created.customerId);
    const customers=await send('getEasyStoreCustomers',{limit:10});
    assert.equal(customers.customers.length,1);
    const nameOnly=await send('saveEasyStoreSaleV2',{
      requestId:'ACC268-SALE-NAMEONLY-01',
      customerName:'ACC268 Synthetic Customer',invoiceNo:'ACC268-INVALID-SALE',
      item:'Cash only sample',qty:1,unitPrice:25,total:25,paid:25,paymentMethod:'cash'
    });
    assert.equal(nameOnly.success,false);
    assert.equal(nameOnly.code,'accounting-local-customer-id-required');
    const saleData={
      requestId:'ACC268-SALE-REQ-00001',customerId:created.customerId,
      invoiceNo:'ACC268-CASH-00001',item:'Cash Only Offline Sample',
      qty:1,unitPrice:25,total:25,paid:25,paymentMethod:'cash',department:'طباعة'
    };
    const sale=await send('saveEasyStoreSaleV2',saleData);
    assert.equal(sale.success,true,JSON.stringify(sale));
    assert.equal(sale.remaining,0);
    assert.equal(count('employee_accounting_final_invoices_v1'),1);
    assert.equal(count('employee_accounting_cashbox_v1'),1);
    assert.equal(count('employee_accounting_party_ledger_v1'),2);
    assert.equal(db.prepare('SELECT order_id AS x FROM employee_accounting_final_invoices_v1').get().x,'');
    assert.equal(db.prepare("SELECT balance FROM employee_accounting_party_balances_v1 WHERE party_type='customer'").get().balance,0);
    const again=await send('saveEasyStoreSaleV2',saleData);
    assert.equal(again.success,true,JSON.stringify(again));
    assert.equal(count('employee_accounting_final_invoices_v1'),1);
    assert.equal(count('employee_accounting_cashbox_v1'),1);
    const account=await send('getCustomerAccountV1915',{customerId:created.customerId});
    assert.equal(account.success,true,JSON.stringify(account));
    assert.equal(account.customer.customerId,created.customerId);
    assert.equal(account.balance,0);
    settings.EASYSTORE_STANDALONE_CUSTOMERS_V1='OFF';
    const afterOff=await send('saveEasyStoreSaleV2',{
      ...saleData,requestId:'ACC268-POST-OFF-SALE-01',invoiceNo:'ACC268-DENIED-AFTER-OFF'
    });
    assert.equal(afterOff.success,false);
    assert.equal(count('employee_accounting_final_invoices_v1'),1);
    console.log('ACC268_EXISTING_FINANCE_CUSTOMER_MASTER=PASS');
    console.log('ACC268_DIRECT_CASH_SALE_WITHOUT_ORDER=PASS');
    console.log('ACC268_CASHBOX_AND_LEDGER=PASS');
    console.log('ACC268_EXACT_REPLAY_NO_DUPLICATE_CASH=PASS');
    console.log('ACC268_AUTH_FALLBACK_AND_OPENING_DENIED=PASS');
    console.log('ACC268_ORIGINAL_T12_ORDERS_CUSTOMERS_NOT_REQUIRED_IN_TEST=PASS');
    console.log('FINANCE_RELEASE=NO_GO');
  } finally{db.close();}
});
