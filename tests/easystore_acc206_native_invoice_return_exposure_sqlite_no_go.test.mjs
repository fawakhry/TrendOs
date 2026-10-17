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
 '0030_employee_accounting_write_canary_budget_v1.sql',
 '0031_employee_accounting_customer_advance_credit_v1.sql'
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
   crypto:webcrypto,TextEncoder,Response,Request,Headers,URL,URLSearchParams,
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

 // ACC206 red/green: literal authentic native sale invoice/COMMITTED request
 // and physical cashbox, never an untrusted customer payment assertion.
 const casePreview=(invoiceNo='ACC187-SALE-INVOICE-1',extra={})=>
   send('previewNativeInvoiceReturnExposureV1',{invoiceNo,...extra});
 const physical=()=>Number(one("SELECT amount FROM employee_accounting_cashbox_v1 WHERE request_key='ACC187-SALE-0001-CASH'")?.amount||0);
 const snapshotReturn=()=>JSON.stringify(snapshot());
 const auditBefore=snapshotReturn();
 const reviewCase=await casePreview();
 assert.equal(reviewCase.success,true,JSON.stringify(reviewCase));
 assert.equal(reviewCase.invoiceStatus,'UNDER_REVIEW');
 assert.equal(reviewCase.cashReceiptCents,2500);
 assert.equal(reviewCase.invoicePaidCents,2500);
 assert.equal(reviewCase.reviewState,'INVOICE_UNDER_REVIEW_NO_REFUND_AUTHORITY');
 assert.equal(reviewCase.refundableAmountCents,null);
 assert.equal(reviewCase.cashRefundAuthorized,false);
 assert.equal(reviewCase.customerCreditAuthorized,false);
 assert.equal(reviewCase.postingAllowed,false);
 assert.equal(reviewCase.financeRelease,'NO_GO');
 assert.equal(snapshotReturn(),auditBefore,'owner review must NEVER write a cash or party row');
 const unknownInvoice=await casePreview('ACC206_FAKE_NOT_FOUND');
 assert.equal(unknownInvoice.success,false);
 assert.equal(unknownInvoice.cashRefundAuthorized,false);
 verifiedRole='service';
 const forgedCase=await casePreview('ACC187-SALE-INVOICE-1',{role:'admin',approved:true});
 assert.equal(forgedCase.success,false);
 verifiedRole='admin';
 const cashOriginal=physical();
 assert.equal(cashOriginal,25);
 db.exec("UPDATE employee_accounting_cashbox_v1 SET amount=1 WHERE request_key='ACC187-SALE-0001-CASH'");
 const damaged=await casePreview();
 assert.equal(damaged.reviewState,'CASH_RECEIPT_MISMATCH',JSON.stringify(damaged));
 assert.equal(damaged.cashRefundAuthorized,false);
 db.exec("UPDATE employee_accounting_cashbox_v1 SET amount=25 WHERE request_key='ACC187-SALE-0001-CASH'");
 db.exec("UPDATE employee_accounting_request_ledger_v1 SET status='PREPARED' WHERE request_key='ACC187-SALE-0001'");
 const uncommitted=await casePreview();
 assert.equal(uncommitted.reviewState,'INVOICE_COMMAND_NOT_COMMITTED');
 assert.equal(uncommitted.postingAllowed,false);
 db.exec("UPDATE employee_accounting_request_ledger_v1 SET status='COMMITTED' WHERE request_key='ACC187-SALE-0001'");
 db.exec("ALTER TABLE employee_accounting_cashbox_v1 RENAME TO acc206_temporarily_missing_cashbox");
 const noCashSchema=await casePreview();
 assert.equal(noCashSchema.success,false,'missing cash schema cannot imply payout');
 assert.equal(noCashSchema.cashRefundAuthorized,false);
 db.exec("ALTER TABLE acc206_temporarily_missing_cashbox RENAME TO employee_accounting_cashbox_v1");
 assert.equal(snapshotReturn(),auditBefore);
 console.log('ACC206_ACTUAL_INVOICE_COMMITTED_CASHBOX_REFUND_READONLY=PASS');
 console.log('ACC206_REVIEWED_INVOICE_HELD_CASH_NO_REFUND=PASS');
 console.log('ACC206_FAKE_TAMPER_NONCOMMITTED_MISSING_SCHEMA_FAILCLOSED=PASS');
 console.log('ACC206_REAL_REFUND_AND_CREDIT_POSTING=NOT_IMPLEMENTED');
 assert.equal(financeState(),'READONLY');
 assert.ok(!/fetch\s*\(|Cloudflare|wrangler/i.test(JSON.stringify(sqlTrace)),'must be strictly local SQL');
 console.log('ACC187_PURCHASE_REVERSAL_STOCK_AND_SETTLED_DEBT_DENIAL=PASS');
 console.log('ACC187_SALE_REFUND_ACTION_NOT_IMPLEMENTED_FAIL_CLOSED=PASS');
 console.log('ACC187_SALE_REOPEN_REVIEW_NOT_CASH_REFUND_AND_NOT_RESTOCK=PASS');
 console.log('ACC187_REOPEN_DUPLICATE_FINANCE_LEDGER_STABLE=PASS');
 console.log('ACC187_READONLY_AND_FORGED_ROLE_DENIED=PASS');
 console.log('ACC187_G4_FULL_SALE_REFUND_ACCEPTANCE=BLOCKED_MISSING_BUSINESS_DESIGN');
 console.log('ACC187_RELEASE_DECISION=NO_GO');
 console.log('ACC187_PRODUCTION_D1_MUTATIONS=ZERO');
}finally{db.close();}
