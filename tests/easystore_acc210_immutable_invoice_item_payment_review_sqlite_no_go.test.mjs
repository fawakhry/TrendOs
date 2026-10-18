// ACC210: real checked-in accounting Worker creates a cash sale + a later
// COMMITTED receipt. Candidate item allocation rows are fixture-only direct
// SQL into a dormant review table; application receives NO INSERT API.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';

await test('ACC210 audited item/cash source-only candidate — SQLite REVIEW, NO_GO',async t=>{
 const db=new DatabaseSync(':memory:');
 t.after(()=>db.close());
 for(const m of [
  '0015_employee_accounting_zero_google_v1.sql','0020_employee_accounting_party_master_v1.sql',
  '0021_employee_accounting_material_dimensions_v1.sql','0022_employee_accounting_day_ops_v1.sql',
  '0023_employee_accounting_command_audit_v1.sql','0024_employee_accounting_party_balances_v1.sql',
  '0025_employee_accounting_final_reversal_day_close_v1.sql','0026_employee_accounting_tx_guard_v1.sql',
  '0027_employee_accounting_direct_sale_cost_v1.sql','0028_employee_accounting_write_canary_v1.sql',
  '0029_employee_accounting_canary_mode_v1.sql','0030_employee_accounting_write_canary_budget_v1.sql',
  '0031_employee_accounting_customer_advance_credit_v1.sql'])
  db.exec(fs.readFileSync('cloudflare-d1/migrations/'+m,'utf8'));
 db.exec("CREATE TABLE t12_customers(customer_id TEXT PRIMARY KEY,customer_name TEXT,active TEXT,updated_at TEXT)");
 db.prepare("INSERT INTO t12_customers(customer_id,customer_name,active) VALUES('ACC210_FAKE_A','FAKE CUSTOMER A','نعم'),('ACC210_FAKE_B','FAKE CUSTOMER B','نعم')").run();
 // RED FIRST: new migration is absent; not merely a test mock or imaginary API.
 db.exec(fs.readFileSync('cloudflare-d1/migrations/0034_accounting_item_payment_attribution_review_sourceonly_v1.sql','utf8'));
 const inDb=(sql,...args)=>db.prepare(sql).get(...args);
 const count=(table)=>inDb('SELECT COUNT(*) AS n FROM '+table).n;
 assert.equal(count('employee_accounting_invoice_item_payment_review_v1'),0);
 assert.equal(inDb('SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1').mode,'OFF');
 const network={requests:0},env={CORS_ORIGINS:'https://fawakhry.github.io',DB:null};
 env.DB={
   prepare(sql){const ctx={sql:String(sql),args:[]};
     const stmt={bind(...args){ctx.args=args;return stmt;},
       first(){return Promise.resolve(db.prepare(ctx.sql).get(...ctx.args)||null)},
       all(){return Promise.resolve({results:db.prepare(ctx.sql).all(...ctx.args)})},
       run(){return Promise.resolve(db.prepare(ctx.sql).run(...ctx.args))}};
     stmt._args=ctx;return stmt;},
   async batch(statements){
     db.exec('BEGIN IMMEDIATE');
     try{const result=statements.map(s=>db.prepare(s._args.sql).run(...s._args.args));db.exec('COMMIT');return result}
     catch(e){db.exec('ROLLBACK');throw e}
   }
 };
 let role='admin';
 const worker=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8')
   .replace(/^import \{ verifyEmployeeSessionCloudFirst \} from '\.\/cloud-session-bridge-v3\.mjs';\s*/,'')
   .replace(/^export /gm,'');
 const context=vm.createContext({
   crypto:webcrypto,Request,Response,Headers,TextEncoder,URL,URLSearchParams,Intl,Date,Math,JSON,console,
   verifyEmployeeSessionCloudFirst:async(username,token)=>{
     if(username!=='ACC210_FAKE_OWNER'||token!=='ACC210_FAKE_TOKEN')return {ok:false};
     return {ok:true,authSource:'ACC210_FAKE_SESSION',body:{user:{username,role,department:'عام'}}}
   }
 });
 vm.runInContext(worker+'\n;globalThis.ACC210_HANDLER=handleEmployeeAccountingNativeRequest;',context,{timeout:15000});
 async function send(action,data={}){
   const original=globalThis.fetch;
   globalThis.fetch=()=>{network.requests++;throw Error('NO_NETWORK_ALLOWED')};
   try{
     const res=await context.ACC210_HANDLER(new Request('https://offline.invalid/v1/employee/accounting',{
       method:'POST',headers:{Origin:'https://fawakhry.github.io','Content-Type':'application/json',
         Authorization:'Bearer ACC210_FAKE_TOKEN'},
       body:JSON.stringify({action,username:'ACC210_FAKE_OWNER',...data})
     }),env);
     return {status:res.status,...await res.json()}
   }finally{globalThis.fetch=original}
 }
 const getCase=()=>db.prepare("SELECT * FROM employee_accounting_invoice_item_payment_review_v1 ORDER BY proposal_id").all();
 function propose(id,invoice='ACC210_INV_A',line='ACC210_FIXTURE_LINE_A',receipt='ACC210_LATER_RECEIPT',cents=500,customer='ACC210_FAKE_A',extra={}){
   const record={
     proposal_id:id,invoice_no:invoice,accounting_line_id:line,
     receipt_ledger_request_key:receipt,customer_id:customer,proposed_cents:cents,
     actor_subject:'ACC210_UNVERIFIED_REVIEWER',actor_role_label:'admin',
     evidence_sha256:'a'.repeat(64),reason:'Proposed allocation requires independently attested payment and item evidence',
     proposed_at_ms:1790000000000, ...extra
   };
   const keys=Object.keys(record);
   return db.prepare('INSERT INTO employee_accounting_invoice_item_payment_review_v1('+
     keys.join(',')+') VALUES('+keys.map(()=>'?').join(',')+')').run(...keys.map(k=>record[k]));
 }
 const denied=(fn,pattern)=>assert.throws(fn,pattern);
 db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1");
 db.exec("UPDATE employee_accounting_write_canary_v1 SET enabled=0,max_commands=0,commands_started=0 WHERE singleton=1");
 const material=await send('saveAccountingMaterial',{
   requestId:'ACC210_MATERIAL_R1',materialName:'ACC210_FAKE_PAPER',department:'طباعة',
   unit:'قطعة',unitCost:4,stockQty:100,active:'نعم'
 });
 assert.equal(material.success,true,JSON.stringify(material));
 const first=await send('saveEasyStoreSaleV2',{
   requestId:'ACC210_SALE_A',customerId:'ACC210_FAKE_A',department:'طباعة',item:'ACC210_FAKE_PAPER',
   invoiceNo:'ACC210_INV_A',qty:2,unitPrice:20,total:40,paid:25,workDate:'2099-12-31'
 });
 assert.equal(first.success,true,JSON.stringify(first));
 const second=await send('saveEasyStoreSaleV2',{
   requestId:'ACC210_SALE_B',customerId:'ACC210_FAKE_A',department:'طباعة',item:'ACC210_FAKE_PAPER',
   invoiceNo:'ACC210_INV_B',qty:2,unitPrice:20,total:40,paid:0,workDate:'2099-12-31'
 });
 assert.equal(second.success,true,JSON.stringify(second));
 const later=await send('savePartyLedgerTransaction',{
   requestId:'ACC210_LATER_RECEIPT',partyType:'customer',customerId:'ACC210_FAKE_A',
   operation:'payment_received',amount:10,paymentMethod:'نقدي',refNo:'ACC210_INV_A',workDate:'2099-12-31'
 });
 assert.equal(later.success,true,JSON.stringify(later));
 assert.equal(inDb("SELECT status FROM employee_accounting_request_ledger_v1 WHERE request_key='ACC210_LATER_RECEIPT'").status,'COMMITTED');
 assert.equal(inDb("SELECT amount FROM employee_accounting_cashbox_v1 WHERE request_key='ACC210_LATER_RECEIPT-CASH'").amount,10);

 await t.test('01 no official item lines on direct sale; inventing one is rejected',()=>{
   denied(()=>propose('ACC210_P01'),/invoice-item-line-not-attached/);
   assert.equal(getCase().length,0);
 });
 // This fixture is deliberately invented to exercise DB structural rules;
 // it is NOT evidence that original direct-sale did have a real item line.
 db.prepare("INSERT INTO employee_accounting_dept_lines_v1(accounting_line_id,order_id,department,final_invoice_no,sale_price,qty) VALUES('ACC210_FIXTURE_LINE_A','ACC210_FIXTURE_ORDER','طباعة','ACC210_INV_A',25,1),('ACC210_FIXTURE_LINE_B','ACC210_FIXTURE_ORDER','طباعة','ACC210_INV_B',25,1)").run();
 await t.test('02 ONLY fixture review row is allowed, and all authority flags are SQL hard-zero',()=>{
   propose('ACC210_P02');
   const a=getCase();assert.equal(a.length,1);
   assert.equal(a[0].review_status,'NOT_ATTESTED');
   assert.equal(a[0].finance_authorized,0);assert.equal(a[0].refund_authorized,0);
   assert.equal(a[0].delivery_authorized,0);assert.equal(a[0].cash_out_authorized,0);
   assert.equal(a[0].proposed_cents,500);
 });
 await t.test('03 same receipt across distinct invoice lines cannot exceed actual COMMITTED cash ledger amount',()=>{
   propose('ACC210_P03','ACC210_INV_B','ACC210_FIXTURE_LINE_B','ACC210_LATER_RECEIPT',500);
   denied(()=>propose('ACC210_P04','ACC210_INV_B','ACC210_FIXTURE_LINE_B','ACC210_LATER_RECEIPT',1),
      /source-receipt-total-exceeded|UNIQUE/);
   assert.equal(count('employee_accounting_invoice_item_payment_review_v1'),2);
 });
 await t.test('04 exact line-to-invoice FK, customer match, phantom invoice and unused receipt reject',()=>{
   denied(()=>propose('ACC210_P05','ACC210_INV_B','ACC210_FIXTURE_LINE_A','ACC210_LATER_RECEIPT',1),/invoice-item-line-not-attached/);
   denied(()=>propose('ACC210_P06','ACC210_INV_A','ACC210_FIXTURE_LINE_A','ACC210_LATER_RECEIPT',1,'ACC210_FAKE_B'),/invoice-customer-id-mismatch/);
   denied(()=>propose('ACC210_P07','ACC210_INV_MISSING','ACC210_FIXTURE_LINE_A','ACC210_LATER_RECEIPT',1),/FOREIGN KEY|invoice-customer-id-mismatch/);
   denied(()=>propose('ACC210_P08','ACC210_INV_A','ACC210_FIXTURE_LINE_A','ACC210_MISSING',1),/receipt-not-committed-with-matching-cash/);
 });
 await t.test('05 forged actor role, invalid hash, missing reason and authority field cannot bypass DB',()=>{
   denied(()=>propose('ACC210_P09','ACC210_INV_A','ACC210_FIXTURE_LINE_A','ACC210_SALE_A-LEDGER-PAYMENT',1,'ACC210_FAKE_A',{actor_role_label:'service'}),/CHECK/);
   denied(()=>propose('ACC210_P10','ACC210_INV_A','ACC210_FIXTURE_LINE_A','ACC210_SALE_A-LEDGER-PAYMENT',1,'ACC210_FAKE_A',{evidence_sha256:'deadbeef'}),/CHECK/);
   denied(()=>propose('ACC210_P11','ACC210_INV_A','ACC210_FIXTURE_LINE_A','ACC210_SALE_A-LEDGER-PAYMENT',1,'ACC210_FAKE_A',{reason:'yes'}),/CHECK/);
   denied(()=>propose('ACC210_P12','ACC210_INV_A','ACC210_FIXTURE_LINE_A','ACC210_SALE_A-LEDGER-PAYMENT',1,'ACC210_FAKE_A',{cash_out_authorized:1}),/CHECK/);
 });
 await t.test('06 parent PREPARED, mismatch cash movement and missing cash fail closed',()=>{
   db.exec("UPDATE employee_accounting_request_ledger_v1 SET status='PREPARED' WHERE request_key='ACC210_LATER_RECEIPT'");
   denied(()=>propose('ACC210_P13','ACC210_INV_A','ACC210_FIXTURE_LINE_A','ACC210_LATER_RECEIPT',1),/receipt-not-committed-with-matching-cash/);
   db.exec("UPDATE employee_accounting_request_ledger_v1 SET status='COMMITTED' WHERE request_key='ACC210_LATER_RECEIPT'");
   db.exec("UPDATE employee_accounting_cashbox_v1 SET movement_type='SUPPLIER_PAYMENT' WHERE request_key='ACC210_LATER_RECEIPT-CASH'");
   denied(()=>propose('ACC210_P14','ACC210_INV_A','ACC210_FIXTURE_LINE_A','ACC210_LATER_RECEIPT',1),/receipt-not-committed-with-matching-cash/);
   db.exec("UPDATE employee_accounting_cashbox_v1 SET movement_type='CUSTOMER_RECEIPT' WHERE request_key='ACC210_LATER_RECEIPT-CASH'");
 });
 await t.test('07 genuine invoice-original cash payment is a distinct valid source key',()=>{
   // Original sale ledger key differs from its original COMMITTED command key.
   const source='ACC210_SALE_A-LEDGER-PAYMENT';
   const r=inDb('SELECT amount FROM employee_accounting_party_ledger_v1 WHERE request_key=?',source);
   assert.equal(r.amount,25);
   propose('ACC210_P15','ACC210_INV_A','ACC210_FIXTURE_LINE_A',source,1500);
   denied(()=>propose('ACC210_P16','ACC210_INV_B','ACC210_FIXTURE_LINE_B',source,1001),
     /source-receipt-total-exceeded/);
 });
 await t.test('08 immutable review cannot be updated, deleted or promoted to authorization',()=>{
   denied(()=>db.exec("UPDATE employee_accounting_invoice_item_payment_review_v1 SET review_status='ATTESTED' WHERE proposal_id='ACC210_P02'"),/immutable-review-row/);
   denied(()=>db.exec("DELETE FROM employee_accounting_invoice_item_payment_review_v1 WHERE proposal_id='ACC210_P02'"),/immutable-review-row/);
   assert.equal(inDb("SELECT review_status FROM employee_accounting_invoice_item_payment_review_v1 WHERE proposal_id='ACC210_P02'").review_status,'NOT_ATTESTED');
 });
 await t.test('09 strict integer positive piastres, no float/zero or oversize proposal',()=>{
   denied(()=>propose('ACC210_P17','ACC210_INV_A','ACC210_FIXTURE_LINE_A','ACC210_SALE_A-LEDGER-PAYMENT',0),/CHECK/);
   denied(()=>propose('ACC210_P18','ACC210_INV_A','ACC210_FIXTURE_LINE_A','ACC210_SALE_A-LEDGER-PAYMENT',1.5),/CHECK/);
   denied(()=>propose('ACC210_P19','ACC210_INV_A','ACC210_FIXTURE_LINE_A','ACC210_SALE_A-LEDGER-PAYMENT',9007199254740992),/CHECK|source-receipt-total-exceeded/);
 });
 await t.test('10 no writer exposed and all fixture records remain NOT_ATTESTED, no outside network',()=>{
   const native=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');
   assert.doesNotMatch(native,/(?:else if\(action==='(?:save|post|approve)InvoiceItemPaymentAttribution)/);
   assert.equal(network.requests,0);
   assert.equal(inDb('SELECT COUNT(*) AS n FROM employee_accounting_invoice_item_payment_review_v1 WHERE finance_authorized<>0 OR refund_authorized<>0 OR review_status<>\'NOT_ATTESTED\'').n,0);
 });

 // A real native owner READ action must be able to surface the proposal state
 // without authorizing cash refund, writing cash, or exposing other customer.
 await t.test('11 actual native READONLY owner preview returns UNATTESTED not payout',async()=>{
   db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1");
   const r=await send('previewInvoiceItemPaymentReviewV1',{invoiceNo:'ACC210_INV_A'});
   assert.equal(r.success,true,JSON.stringify(r));
   assert.equal(r.reviewState,'UNATTESTED_SOURCE_ONLY_CANDIDATES');
   assert.equal(r.candidateCount,2);
   assert.equal(r.proposedTotalCents,2000);
   assert.equal(r.customerId,'ACC210_FAKE_A');
   assert.equal(r.allocationVerified,false);
   assert.equal(r.refundableAmountCents,null);
   assert.equal(r.refundAuthorized,false);
   assert.equal(r.postingAllowed,false);
   assert.equal(r.financeRelease,'NO_GO');
   assert.equal(r.candidateRows?.some(a=>a.invoiceNo==='ACC210_INV_B'),false);
 });
 await t.test('12 client role spoof and wrong official invoice never disclose candidate details',async()=>{
   role='service';
   try{
     const forged=await send('previewInvoiceItemPaymentReviewV1',{invoiceNo:'ACC210_INV_A',role:'admin',approved:true});
     assert.equal(forged.success,false);
     assert.ok(forged.refundAuthorized!==true,'SSO rejection cannot enable refund');
   }finally{role='admin'}
   const missing=await send('previewInvoiceItemPaymentReviewV1',{invoiceNo:'ACC210_INV_DOES_NOT_EXIST'});
   assert.equal(missing.success,false);
 });
 await t.test('13 staged command mutation AFTER proposal is not silently a trusted allocation',async()=>{
   db.exec("UPDATE employee_accounting_request_ledger_v1 SET status='PREPARED' WHERE request_key='ACC210_LATER_RECEIPT'");
   const stale=await send('previewInvoiceItemPaymentReviewV1',{invoiceNo:'ACC210_INV_A'});
   assert.equal(stale.success,true,JSON.stringify(stale));
   assert.equal(stale.reviewState,'SOURCE_EVIDENCE_CHANGED_OR_INCOMPLETE');
   assert.equal(stale.proposedTotalCents,null);
   assert.equal(stale.refundAuthorized,false);
   db.exec("UPDATE employee_accounting_request_ledger_v1 SET status='COMMITTED' WHERE request_key='ACC210_LATER_RECEIPT'");
 });
 await t.test('14 after INSERT source amount shrinks below global cross-invoice proposals, status goes UNKNOWN',async()=>{
   // Original later customer receipt was 10 EGP, provisionally split 5+5
   // across two different invoices. Mutate source ledger down to 4 EGP,
   // leaving cash at 10 EGP; the live PREVIEW must recheck combined 10 EGP.
   db.exec("UPDATE employee_accounting_party_ledger_v1 SET amount=4 WHERE request_key='ACC210_LATER_RECEIPT'");
   const drift=await send('previewInvoiceItemPaymentReviewV1',{invoiceNo:'ACC210_INV_A'});
   assert.equal(drift.success,true,JSON.stringify(drift));
   assert.equal(drift.reviewState,'SOURCE_EVIDENCE_CHANGED_OR_INCOMPLETE');
   assert.equal(drift.proposedTotalCents,null);
   assert.equal(drift.refundAuthorized,false);
   db.exec("UPDATE employee_accounting_party_ledger_v1 SET amount=10 WHERE request_key='ACC210_LATER_RECEIPT'");
 });
 await t.test('15 missing new review schema fails closed, not no candidates',async()=>{
   db.exec('ALTER TABLE employee_accounting_invoice_item_payment_review_v1 RENAME TO acc210_unavailable_source_rows');
   const unavailable=await send('previewInvoiceItemPaymentReviewV1',{invoiceNo:'ACC210_INV_A'});
   assert.equal(unavailable.success,false);
   assert.equal(unavailable.refundAuthorized,false);
   db.exec('ALTER TABLE acc210_unavailable_source_rows RENAME TO employee_accounting_invoice_item_payment_review_v1');
 });
 console.log('ACC210_ACTUAL_NATIVE_SALES_COLLECTION_AND_CASHBOX=TESTED');
 console.log('ACC210_ITEM_PAYMENT_REVIEW_PROPOSALS_ONLY=NOT_ATTESTED');
 console.log('ACC210_CASH_REFUND_AND_DELIVERY_RIGHTS=ZERO');
 console.log('ACC210_FINANCE_RELEASE=NO_GO');
});
