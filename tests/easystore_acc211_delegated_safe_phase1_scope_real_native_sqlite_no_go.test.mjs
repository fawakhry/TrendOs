import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import { webcrypto } from 'node:crypto';

// End-to-end integration of the exact checked-in D1 Worker + migrations.
// The entire finance authority and every row live ONLY in ephemeral :memory: SQLite.
// No real employees, no real HTTP network, no Wrangler, secrets or remote D1.
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
 '0030_employee_accounting_write_canary_budget_v1.sql'
];
const worker=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8')
 .replace(/^import \{ verifyEmployeeSessionCloudFirst \} from '\.\/cloud-session-bridge-v3\.mjs';\s*/,'')
 .replace(/^export /gm,'');
assert.ok(worker.includes('async function postPurchaseInvoiceV1('));
assert.ok(worker.includes('async function saveEasyStoreSaleV2A2('));
assert.ok(worker.includes('async function reverseApprovedPurchaseV1('));

const db=new DatabaseSync(':memory:');
try{
 for(const filename of migrations)db.exec(fs.readFileSync('cloudflare-d1/migrations/'+filename,'utf8'));
 // Account customer lookup is owned by an existing T12 native family and is not
 // part of the accounting migrations, so provide ONLY its minimum fake schema.
 db.exec("CREATE TABLE t12_customers(customer_id TEXT PRIMARY KEY,customer_name TEXT,active TEXT,updated_at TEXT);");
 db.prepare("INSERT INTO t12_customers(customer_id,customer_name,active,updated_at) VALUES(?,?,'نعم',CURRENT_TIMESTAMP)")
   .run('ACC170-FAKE-CUSTOMER','ACC170_SYNTHETIC_CUSTOMER');
 const financeState=()=>db.prepare("SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1").get().mode;
 const sqlTrace=[], DB={
   prepare(sql){
     const statement={sql:String(sql),args:[]};
     sqlTrace.push(statement);
     const wrapper={
       bind(...args){statement.args=args;return wrapper;},
       first(){return Promise.resolve(db.prepare(statement.sql).get(...statement.args)||null);},
       all(){return Promise.resolve({results:db.prepare(statement.sql).all(...statement.args)});},
       run(){return Promise.resolve(db.prepare(statement.sql).run(...statement.args));}
     };
     wrapper.__statement=statement;
     return wrapper;
   },
   async batch(statements){
     db.exec('BEGIN IMMEDIATE');
     try{
       const out=statements.map(stmt=>db.prepare(stmt.__statement.sql).run(...stmt.__statement.args));
       db.exec('COMMIT');
       return out;
     }catch(error){
       db.exec('ROLLBACK');
       throw error;
     }
   }
 };
 const env={DB,CORS_ORIGINS:'https://fawakhry.github.io'};
 let verifiedRole='admin';
 const ctx=vm.createContext({
   crypto:webcrypto,atob:globalThis.atob,TextEncoder,Response,Request,Headers,URL,URLSearchParams,
   Date,Intl,JSON,Math,console,
   verifyEmployeeSessionCloudFirst:async (username,token)=>{
     if(username!=='ACC170_SYNTHETIC_OPERATOR'||token!=='ACC170_NONPRODUCTION_TOKEN')
       return {ok:false,message:'fake identity rejected'};
     return {ok:true,authSource:'ACC170_LOCAL_VERIFIED_SESSION',
       body:{user:{username,role:verifiedRole,department:''}}};
   }
 });
 vm.runInContext(worker+'\n;globalThis.ACC170_HANDLER=handleEmployeeAccountingNativeRequest;',ctx,{timeout:12000});
 const count=table=>db.prepare('SELECT COUNT(*) AS n FROM '+table).get().n;
 const one=(sql,...args)=>db.prepare(sql).get(...args);
 const request= (action,data={},opts={})=>new Request(
   'https://acc170.invalid/v1/employee/accounting',{
     method:'POST',
     headers:{Origin:'https://fawakhry.github.io','Content-Type':'application/json',
       Authorization:'Bearer '+(opts.token??'ACC170_NONPRODUCTION_TOKEN')},
     body:JSON.stringify({action,username:'ACC170_SYNTHETIC_OPERATOR',
       name:'ACC170_SYNTHETIC_OPERATOR',sourceSystem:'ACC170_OFFLINE_SQLITE',
       ...data})
   });
 async function send(action,data={},opts={}){
   const response=await ctx.ACC170_HANDLER(request(action,data,opts),env);
   return {status:response.status,...await response.json()};
 }
 const balance=(type,id)=>Number(one(
   'SELECT balance FROM employee_accounting_party_balances_v1 WHERE party_type=? AND party_id=?',
   type,id)?.balance??0);
 const stock=id=>Number(one('SELECT stock_qty FROM employee_accounting_materials_v1 WHERE material_id=?',id)?.stock_qty??0);

 assert.equal(financeState(),'OFF','fresh fake D1 must start OFF');
 db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1;");
 const blocked=await send('saveEasyStorePurchaseV2',{requestId:'ACC187-READONLY-BLOCK-0001'});
 assert.equal(blocked.status,503);
 db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1;");
 db.exec("UPDATE employee_accounting_write_canary_v1 SET enabled=0,max_commands=0,commands_started=0 WHERE singleton=1;");
 verifiedRole='service';
 const forged=await send('reverseApprovedPurchaseV1920',{role:'admin',requestId:'ACC187-SPOOF-DENIED-0001'});
 assert.equal(forged.status,403);
 verifiedRole='admin';
 const supplier=await send('saveEasyStoreSupplier',{
   requestId:'ACC187-SUPPLIER-0001',supplierName:'ACC187_FAKE_SUPPLIER',openingDebt:0,active:'نعم'
 });
 assert.equal(supplier.success,true,JSON.stringify(supplier));
 const material=await send('saveAccountingMaterial',{
   requestId:'ACC187-MATERIAL-0001',materialName:'ACC187_FAKE_MATERIAL',
   department:'طباعة',unit:'قطعة',unitCost:10,stockQty:0,active:'نعم'
 });
 assert.equal(material.success,true,JSON.stringify(material));
 const sid=supplier.supplierId,mid=material.materialId,customer='ACC170-FAKE-CUSTOMER';
 assert.ok(sid&&mid);
 const purchase=await send('saveEasyStorePurchaseV2',{
   requestId:'ACC187-PURCHASE-0001',supplierId:sid,materialId:mid,department:'طباعة',
   invoiceNo:'ACC187-PURCHASE-INVOICE-1',qty:5,unitCost:10,total:50,paid:20,
   paymentMethod:'نقدي',workDate:'2099-12-31'
 });
 assert.equal(purchase.success,true,JSON.stringify(purchase));
 assert.equal(stock(mid),5);assert.equal(balance('supplier',sid),30);
 const originalCash=count('employee_accounting_cashbox_v1');
 const sale=await send('saveEasyStoreSaleV2',{
   requestId:'ACC187-SALE-0001',customerId:customer,department:'طباعة',
   item:'ACC187_FAKE_MATERIAL',invoiceNo:'ACC187-SALE-INVOICE-1',
   qty:2,unitPrice:20,total:40,paid:25,paymentMethod:'نقدي',workDate:'2099-12-31'
 });
 assert.equal(sale.success,true,JSON.stringify(sale));
 assert.equal(stock(mid),3);
 assert.equal(balance('customer',customer),15);
 assert.equal(count('employee_accounting_cashbox_v1'),originalCash+1);
 const snapshot=()=>({
   stock:stock(mid),supplierBalance:balance('supplier',sid),customerBalance:balance('customer',customer),
   cash:count('employee_accounting_cashbox_v1'),
   moves:count('employee_accounting_stock_moves_v1'),
   partyLedger:count('employee_accounting_party_ledger_v1'),
   requestLedger:count('employee_accounting_request_ledger_v1'),
   invoiceStatus:one('SELECT status FROM employee_accounting_final_invoices_v1 WHERE invoice_no=?','ACC187-SALE-INVOICE-1').status
 });
 const beforeStockDenial=snapshot();
 const cannotReverseConsumedStock=await send('reverseApprovedPurchaseV1920',{
   requestId:'ACC187-REVERSE-STOCK-BLOCK-0001',
   purchaseId:purchase.purchaseId,reason:'synthetic stock already sold'
 });
 assert.equal(cannotReverseConsumedStock.success,false);
 assert.equal(cannotReverseConsumedStock.status,400);
 assert.deepEqual(snapshot(),beforeStockDenial,'reversal denied with no hidden stock/cash/party mutations');
 const unsupportedActions=['refundEasyStoreSaleV2','returnEasyStoreSaleV2','reverseEasyStoreSaleV2'];
 for(let i=0;i<unsupportedActions.length;i++){
   const beforeAction=snapshot();
   const r=await send(unsupportedActions[i],{
     requestId:'ACC187-UNSUPPORTED-REFUND-'+String(i+1).padStart(4,'0'),
     invoiceNo:'ACC187-SALE-INVOICE-1',amount:25,reason:'synthetic refund only'
   });
   assert.equal(r.status,400,JSON.stringify(r));
   assert.equal(r.code,'employee-accounting-action-unknown');
   assert.deepEqual(snapshot(),beforeAction,'unknown refund action must never credit cash, stock or party account');
 }
 // Returning an invoice for review is NOT the same thing as reimbursing money.
 const cashBeforeReview=count('employee_accounting_cashbox_v1');
 const stockBeforeReview=stock(mid);
 const review=await send('reopenAccountingFinalInvoice',{
   requestId:'ACC187-REOPEN-FOR-REVIEW-0001',
   invoiceNo:'ACC187-SALE-INVOICE-1',reason:'synthetic finance review only'
 });
 assert.equal(review.success,true,'review handler '+JSON.stringify(review));
 assert.equal(review.heldPayment,25,'money stays held, it is NOT returned to the customer');
 assert.equal(one('SELECT status FROM employee_accounting_final_invoices_v1 WHERE invoice_no=?','ACC187-SALE-INVOICE-1').status,'UNDER_REVIEW');
 assert.equal(Number(one('SELECT held_paid FROM employee_accounting_final_invoices_v1 WHERE invoice_no=?','ACC187-SALE-INVOICE-1').held_paid),25);
 assert.equal(count('employee_accounting_cashbox_v1'),cashBeforeReview,'review must not manufacture refund cash movement');
 assert.equal(stock(mid),stockBeforeReview,'review must not imply the customer returned physical stock');
 assert.equal(balance('customer',customer),0,'unpaid remaining balance is removed on review');
 const beforeRepeat=snapshot();
 const repeatReview=await send('reopenAccountingFinalInvoice',{
   requestId:'ACC187-REOPEN-REPEAT-0001',
   invoiceNo:'ACC187-SALE-INVOICE-1',reason:'synthetic finance review only'
 });
 assert.equal(repeatReview.success,true);
 assert.equal(repeatReview.duplicatePrevented,true);
 assert.deepEqual(snapshot(),beforeRepeat,'duplicate review does not affect ledgers');
 // Supplier debt already paid is also a blocker for full purchase cancellation.
 const buy2=await send('saveEasyStorePurchaseV2',{
   requestId:'ACC187-PURCHASE-0002',supplierId:sid,materialId:mid,department:'طباعة',
   invoiceNo:'ACC187-PURCHASE-INVOICE-2',qty:1,unitCost:10,total:10,paid:0,
   paymentMethod:'آجل',workDate:'2099-12-31'
 });
 assert.equal(buy2.success,true,JSON.stringify(buy2));
 const supplierSettlement=await send('savePartyLedgerTransaction',{
   requestId:'ACC187-SUPPLIER-SETTLEMENT-0001',partyType:'supplier',
   supplierId:sid,operation:'payment_paid',amount:40,paymentMethod:'نقدي',workDate:'2099-12-31'
 });
 assert.equal(supplierSettlement.success,true,JSON.stringify(supplierSettlement));
 assert.equal(balance('supplier',sid),0);
 const beforeDebtDenial=snapshot();
 const cannotReverseSettledDebt=await send('reverseApprovedPurchaseV1920',{
   requestId:'ACC187-REVERSE-DEBT-BLOCK-0001',
   purchaseId:buy2.purchaseId,reason:'synthetic invoice has no remaining supplier debt'
 });
 assert.equal(cannotReverseSettledDebt.success,false);
 assert.equal(cannotReverseSettledDebt.status,400);
 assert.deepEqual(snapshot(),beforeDebtDenial,'refuse cancellation after supplier settlement without any financial mutation');
 // Missing / unverified refund policy must never be inferred from a successful review.
 db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1;");
 const afterReadOnly=snapshot();
 const denied=await send('reverseApprovedPurchaseV1920',{
   requestId:'ACC187-READONLY-REV-0001',purchaseId:purchase.purchaseId,reason:'read-only denial'
 });
 assert.equal(denied.status,503);
 const deniedRefund=await send('refundEasyStoreSaleV2',{
   requestId:'ACC187-READONLY-REFUND-0001',invoiceNo:'ACC187-SALE-INVOICE-1',amount:25
 });
 assert.equal(deniedRefund.status,503);
 assert.deepEqual(snapshot(),afterReadOnly);
 assert.equal(financeState(),'READONLY');
 assert.ok(!/fetch\s*\(|Cloudflare|wrangler/i.test(JSON.stringify(sqlTrace)),'must be strictly local SQL');

 // ACC211 delegated conservative launch-scope decision (source-only):
 // Sales + customer receipt are the ONLY money operations the PHASE1
 // optional exact worker-mode ENFORCE guard may pass. This fixture contains
 // NO authentic staff, custody signatures, opening balances or backup.
 db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1;");
 env.EASYSTORE_FINANCE_PHASE1_SCOPE_V1='ENFORCE';
 // Must refuse even the allowed operation without an explicitly verified,
 // private, exact staff roster configured by the owner. Heuristic fake admin
 // name/role must NOT count as a roster.
 const p1Start=snapshot();
 const noRoster=await send('saveEasyStoreSaleV2',{
   requestId:'ACC211-UNVERIFIED-GRANT-0001',customerId:customer,invoiceNo:'ACC211-UNVERIFIED-INV',
   department:'طباعة',item:'ACC187_FAKE_MATERIAL',qty:1,unitPrice:20,total:20,paid:0
 });
 assert.equal(noRoster.status,403,JSON.stringify(noRoster));
 assert.equal(noRoster.code,'acc211-owner-grants-required');
 assert.deepEqual(snapshot(),p1Start);

 // These are only synthetic provider-verified logins in memory, not a real
 // owner authorization. Strict G2 roster still fails closed in production.
 env.ACCOUNTING_FINANCE_GRANTS_MODE_V1='ENFORCE';
 env.ACCOUNTING_FINANCE_GRANTS_V1=JSON.stringify({
   version:1,grants:[{username:'ACC170_SYNTHETIC_OPERATOR',mode:'full'}]
 });
 const deniedActions=[
   ['refundEasyStoreSaleV2',{requestId:'ACC211-NO-REFUND-0001',invoiceNo:'ACC187-SALE-INVOICE-1',amount:25}],
   ['returnEasyStoreSaleV2',{requestId:'ACC211-NO-RETURN-0001',invoiceNo:'ACC187-SALE-INVOICE-1'}],
   ['reopenAccountingFinalInvoice',{requestId:'ACC211-NO-REOPEN-0001',invoiceNo:'ACC187-SALE-INVOICE-1',reason:'blocked'}],
   ['saveAccountingWaste',{requestId:'ACC211-NO-WASTE-0001',amount:2}],
   ['saveAccountingMaterial',{requestId:'ACC211-NO-ADJUST-0001',materialName:'FAKE_SHOULD_NOT_APPEAR'}],
   ['saveCustomerAccountMovementV1915',{requestId:'ACC211-NO-AMBIGUOUS-CUSTOMER-0001',customerId:customer,operation:'payment_received',amount:1}],
   ['savePartyLedgerTransaction',{requestId:'ACC211-NO-SUPPLIER-0001',partyType:'supplier',supplierId:sid,operation:'payment_paid',amount:1}],
   ['savePartyLedgerTransaction',{requestId:'ACC211-NO-OPENING-0001',partyType:'customer',customerId:customer,operation:'opening_debt',amount:2}],
   ['savePartyLedgerTransaction',{requestId:'ACC211-NO-NAME-FALLBACK-0001',partyType:'customer',customerName:'ACC170_SYNTHETIC_CUSTOMER',operation:'payment_received',amount:1}],
   ['saveEasyStoreSaleV2',{requestId:'ACC211-NO-NAME-INVOICE-0001',customer:'ACC170_SYNTHETIC_CUSTOMER',invoiceNo:'ACC211-MISSING-CUSTOMER-ID',qty:1,unitPrice:20,total:20,paid:0}]
 ];
 for(const [name,data] of deniedActions){
   const before=snapshot();
   const r=await send(name,data);
   assert.equal(r.status,403,JSON.stringify({name,r}));
   assert.equal(r.code,'acc211-phase1-action-denied',name);
   assert.deepEqual(snapshot(),before,'denied stage financial routes mutate nothing: '+name);
 }
 // If the credit/advance flag is ON, phase-one cannot quietly create
 // liabilities or allow overpayment: owner G4/ACC187 rules are not verified.
 env.EASYSTORE_CUSTOMER_CREDIT_V1='ON';
 const overCredit=await send('savePartyLedgerTransaction',{
   requestId:'ACC211-ON-CREDIT-0001',partyType:'customer',customerId:customer,
   operation:'payment_received',amount:1
 });
 assert.equal(overCredit.status,403);assert.equal(overCredit.code,'acc211-credit-flow-off-required');
 env.EASYSTORE_CUSTOMER_CREDIT_V1='OFF';

 // No verified prior-zero evidence was provided by the owner.
 const noOpening=await send('saveEasyStoreSaleV2',{
   requestId:'ACC212-NO-OPENING-PROOF',customerId:customer,
   invoiceNo:'ACC212-NO-OPENING',paid:0
 });
 assert.equal(noOpening.status,403);
 assert.equal(noOpening.code,'acc212-zero-opening-proof-not-authenticated');
 // Explicit pinning of phase-one mode alone is not production GO. With fake
 // G2 roster and simulated GENERAL in ephemeral SQLite, actual native sale
 // and ordinary customer receipt remain available on their original paths.
 const newSale=await send('saveEasyStoreSaleV2',{
   requestId:'ACC211-PHASE1-SALE-0001',customerId:customer,department:'طباعة',
   item:'ACC187_FAKE_MATERIAL',invoiceNo:'ACC211-PHASE1-INV-0001',
   qty:1,unitPrice:20,total:20,paid:0,paymentMethod:'نقدي',workDate:'2099-12-31'
 });
 assert.equal(newSale.success,true,JSON.stringify(newSale));
 assert.equal(balance('customer',customer),20);
 const stageCash=await send('savePartyLedgerTransaction',{
   requestId:'ACC211-PHASE1-RECEIPT-0001',partyType:'customer',
   customerId:customer,operation:'payment_received',amount:10,
   paymentMethod:'نقدي',refNo:'ACC211-PHASE1-INV-0001',workDate:'2099-12-31'
 });
 assert.equal(stageCash.success,true,JSON.stringify(stageCash));
 assert.equal(balance('customer',customer),10);
 assert.equal(one("SELECT status FROM employee_accounting_request_ledger_v1 WHERE request_key='ACC211-PHASE1-RECEIPT-0001'").status,'COMMITTED');
 // Fake GENERAL must never bypass READONLY_LOCK, including allowed receipts.
 env.EASYSTORE_FINANCE_PHASE1_SCOPE_V1='READONLY_LOCK';
 const beforeLock=snapshot();
 const locked=await send('savePartyLedgerTransaction',{
   requestId:'ACC211-LOCKED-CASH-0001',partyType:'customer',customerId:customer,
   operation:'payment_received',amount:1
 });
 assert.equal(locked.status,403);assert.equal(locked.code,'acc211-phase1-readonly-lock');
 assert.deepEqual(snapshot(),beforeLock);
 env.EASYSTORE_FINANCE_PHASE1_SCOPE_V1='BAD_OR_UNRECOGNIZED';
 const invalid=await send('saveEasyStoreSaleV2',{
   requestId:'ACC211-INVALID-ENV-0001',customerId:customer,invoiceNo:'ACC211-INVALID-INV',total:10
 });
 assert.equal(invalid.status,403);assert.equal(invalid.code,'acc211-phase1-invalid-scope');
 env.EASYSTORE_FINANCE_PHASE1_SCOPE_V1='ENFORCE';
 db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1;");
 const blockedRead=await send('savePartyLedgerTransaction',{
   requestId:'ACC211-READONLY-LOCK-0001',partyType:'customer',
   customerId:customer,operation:'payment_received',amount:1
 });
 assert.equal(blockedRead.status,503,'SQL finance READONLY must always win');
 assert.equal(balance('customer',customer),10);
 console.log('ACC211_RESTRICTED_PHASE1_REAL_NATIVE_SALE_RECEIPT=TESTED_FAKE_SQLITE');
 console.log('ACC211_NO_REAL_G2_ROSTER_SUPPLIER_REFUND_OPENING_WRITES=PASS');
 console.log('ACC211_DEFAULT_ENFORCEMENT_REQUIRES_EXPLICIT_SERVER_FLAG=PASS');
 console.log('ACC211_GENERAL_NOT_A_RELEASE_GO=PASS');
 console.log('ACC211_FINANCE_RELEASE=NO_GO');
 console.log('ACC187_PURCHASE_REVERSAL_STOCK_AND_SETTLED_DEBT_DENIAL=PASS');
 console.log('ACC187_SALE_REFUND_ACTION_NOT_IMPLEMENTED_FAIL_CLOSED=PASS');
 console.log('ACC187_SALE_REOPEN_REVIEW_NOT_CASH_REFUND_AND_NOT_RESTOCK=PASS');
 console.log('ACC187_REOPEN_DUPLICATE_FINANCE_LEDGER_STABLE=PASS');
 console.log('ACC187_READONLY_AND_FORGED_ROLE_DENIED=PASS');
 console.log('ACC187_G4_FULL_SALE_REFUND_ACCEPTANCE=BLOCKED_MISSING_BUSINESS_DESIGN');
 console.log('ACC187_RELEASE_DECISION=NO_GO');
 console.log('ACC187_PRODUCTION_D1_MUTATIONS=ZERO');
}finally{db.close();}
