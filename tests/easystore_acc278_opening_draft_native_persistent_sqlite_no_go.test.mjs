import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';

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
  '0031_employee_accounting_customer_advance_credit_v1.sql',
  '0035_easystore_opening_intake_draft_v1.sql'
];
const input=(supplierId,extra={})=>({
  action:'saveEasyStoreOpeningDraftV1',batchId:'ACC278-BATCH-SYNTHETIC-001',
  requestId:'ACC278-REQUEST-SYNTHETIC-001',
  cutoverDate:'2026-11-01',currency:'EGP',
  sourceEvidenceRef:'SYNTHETIC-SIGNED-EVIDENCE-001',
  suppliers:[{supplierId,balanceCents:125000,evidenceRef:'SYNTHETIC-SUPPLIER-EVIDENCE-001'}],
  installments:[
    {contractId:'SYNTHETIC-CONTRACT-001',creditorRef:supplierId,
      supplierId,liabilityTreatment:'INCLUDED_IN_SUPPLIER_OPENING',
      contractTotalCents:90000,paidToCutoverCents:30000,
      remainingCents:60000,installmentCents:15000,
      frequency:'monthly',nextDueDate:'2026-11-15',
      evidenceRef:'SYNTHETIC-INSTALMENT-EVIDENCE-001'},
    {contractId:'SYNTHETIC-CONTRACT-002',creditorRef:'CREDITOR-SYNTHETIC-SEPARATE',
      supplierId:'',liabilityTreatment:'SEPARATE_CREDITOR',
      contractTotalCents:100000,paidToCutoverCents:40000,
      remainingCents:60000,installmentCents:10000,
      frequency:'monthly',nextDueDate:'2026-11-20',
      evidenceRef:'SYNTHETIC-EXTERNAL-EVIDENCE-001'}
  ],...extra
});
test('ACC278 original authenticated native D1: OFF gate, draft commit/readback, duplicate replay, restart, no ledger',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'acc278-original-finance-fake-'));
  const filename=path.join(dir,'temporary-finance.sqlite');
  let db=new DatabaseSync(filename);
  try{
    db.exec('PRAGMA foreign_keys=ON');
    for(const file of migrations){
      db.exec(fs.readFileSync('cloudflare-d1/migrations/'+file,'utf8'));
    }
    const raw=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');
    assert.match(raw,/async function acc278SaveDraft\(/);
    assert.match(raw,/async function acc278GetDraft\(/);
    assert.match(raw,/env\.DB\.batch\(stmts\)/);
    const code=raw.replace(/^import \{ verifyEmployeeSessionCloudFirst \} from '\.\/cloud-session-bridge-v3\.mjs';\s*/,'')
      .replace(/^export /gm,'');
    const env={
      DB:{
        prepare(sql){
          const state={sql:String(sql),args:[]},stmt={
            bind(...args){state.args=args;return stmt},
            first(){return Promise.resolve(db.prepare(state.sql).get(...state.args)||null)},
            all(){return Promise.resolve({results:db.prepare(state.sql).all(...state.args)})},
            run(){return Promise.resolve(db.prepare(state.sql).run(...state.args))}
          };
          stmt.state=state;return stmt;
        },
        async batch(stmts){
          db.exec('BEGIN IMMEDIATE');
          try{
            const results=stmts.map(x=>db.prepare(x.state.sql).run(...x.state.args));
            db.exec('COMMIT');return results;
          }catch(e){db.exec('ROLLBACK');throw e;}
        }
      },
      CORS_ORIGINS:'https://fawakhry.github.io',
      EASYSTORE_STANDALONE_CUSTOMERS_V1:'OFF',
      EASYSTORE_CUSTOMER_SOURCE_V1:'FINANCE_LOCAL_ONLY',
      EASYSTORE_OPENING_DRAFT_INTAKE_V1:'OFF',
      ACCOUNTING_FINANCE_GRANTS_MODE_V1:'ENFORCE',
      ACCOUNTING_FINANCE_GRANTS_V1:JSON.stringify({
        version:1,grants:[{username:'SYNTHETIC_ACC278_ADMIN',mode:'full'}]
      }),
      EASYSTORE_CUSTOMER_CREDIT_V1:'OFF'
    };
    const ctx=vm.createContext({crypto:webcrypto,atob:globalThis.atob,TextEncoder,
      Response,Request,Headers,URL,URLSearchParams,Date,Intl,JSON,Math,console,
      verifyEmployeeSessionCloudFirst:async (username,token)=>
        username==='SYNTHETIC_ACC278_ADMIN'&&token==='FAKE_ACC278_SESSION'
          ?{ok:true,authSource:'SYNTHETIC_VERIFIED_SESSION',
            body:{user:{username,role:'admin',department:''}}}
          :{ok:false,message:'not a verified synthetic session'}
    });
    vm.runInContext(code+'\n;globalThis.TEST_HANDLER=handleEmployeeAccountingNativeRequest;',ctx,{timeout:12000});
    const call=async(action,data={},token='FAKE_ACC278_SESSION')=>{
      const req=new Request('https://acc278.synthetic.invalid/v1/employee/accounting',{
        method:'POST',
        headers:{Origin:'https://fawakhry.github.io','Content-Type':'application/json',
          Authorization:'Bearer '+token},
        body:JSON.stringify({username:'SYNTHETIC_ACC278_ADMIN',action,...data})
      });
      const res=await ctx.TEST_HANDLER(req,env);
      return {status:res.status,...await res.json()};
    };
    const count=t=>Number(db.prepare('SELECT COUNT(*) AS n FROM '+t).get().n);
    const base=input('SUP-REPLACEME');
    assert.equal(db.prepare('SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1').get().mode,'OFF');
    assert.equal((await call(base.action,base)).status,503,'global finance OFF cannot write');
    assert.equal(count('employee_accounting_opening_intake_batches_v1'),0);
    db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1");
    assert.equal((await call(base.action,base)).status,503,'READONLY cannot save draft');
    db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1");
    db.exec("UPDATE employee_accounting_write_canary_v1 SET enabled=0,max_commands=0,commands_started=0 WHERE singleton=1");
    assert.equal((await call(base.action,base)).code,'acc278-finance-readonly-required');
    assert.equal(count('employee_accounting_opening_intake_batches_v1'),0);
    env.EASYSTORE_OPENING_DRAFT_INTAKE_V1='ENFORCE';
    assert.equal((await call(base.action,base)).code,'acc278-finance-readonly-required',
      'feature ON must never permit draft save in finance GENERAL');
    const supplier=await call('saveEasyStoreSupplier',{
      requestId:'ACC278-SUPPLIER-ZERO-REQ-001',name:'ACC278 Synthetic Vendor',
      opening:0,phone:'',address:''
    });
    assert.equal(supplier.success,true,JSON.stringify(supplier));
    assert.match(supplier.supplierId,/^SUP-/);
    // Lock actual finance posting before EVER allowing nonzero opening drafts.
    db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1");
    const denied=await call(base.action,base,'INVALID_TOKEN');
    assert.equal(denied.status,401);
    assert.equal(count('employee_accounting_opening_intake_batches_v1'),0);
    assert.equal((await call(base.action,base)).code,'acc278-original-supplier-id-not-registered');
    const row=input(supplier.supplierId);
    // Reconcile target supplier account before any draft write.
    assert.equal(db.prepare("SELECT balance FROM employee_accounting_party_balances_v1 WHERE party_type='supplier' AND party_id=?").get(supplier.supplierId).balance,0);
    const beforeLedger=count('employee_accounting_party_ledger_v1');
    const beforeCash=count('employee_accounting_cashbox_v1');
    const invalid={...row,installments:[{...row.installments[0],remainingCents:65000}]};
    assert.equal((await call(row.action,invalid)).code,'acc278-instalment-reconciliation-invalid');
    assert.equal(count('employee_accounting_opening_intake_batches_v1'),0);
    const first=await call(row.action,row);
    assert.equal(first.success,true,JSON.stringify(first));
    assert.equal(first.code,'acc278-original-d1-draft-saved-and-read-back');
    assert.equal(first.status,'DRAFT');
    assert.equal(first.totalLiabilityCents,185000);
    assert.equal(first.supplierTotalCents,125000);
    assert.equal(first.separateInstallmentTotalCents,60000);
    assert.equal(first.includedInSupplierCents,60000);
    assert.equal(first.postingAllowed,false);
    assert.equal(first.posted,false);
    assert.equal(count('employee_accounting_opening_intake_batches_v1'),1);
    assert.equal(count('employee_accounting_opening_supplier_drafts_v1'),1);
    assert.equal(count('employee_accounting_opening_installment_drafts_v1'),2);
    assert.equal(count('employee_accounting_party_ledger_v1'),beforeLedger);
    assert.equal(count('employee_accounting_cashbox_v1'),beforeCash);
    assert.equal(db.prepare("SELECT balance FROM employee_accounting_party_balances_v1 WHERE party_type='supplier' AND party_id=?").get(supplier.supplierId).balance,0);
    const replay=await call(row.action,row);
    assert.equal(replay.success,true,JSON.stringify(replay));
    assert.equal(replay.duplicatePrevented,true);
    assert.equal(count('employee_accounting_opening_intake_batches_v1'),1);
    const changed=await call(row.action,{...row,suppliers:[{...row.suppliers[0],balanceCents:126000}]});
    assert.equal(changed.success,false);
    assert.equal(changed.code,'acc278-idempotency-payload-conflict');
    assert.equal(count('employee_accounting_opening_intake_batches_v1'),1);
    db.close();db=new DatabaseSync(filename);db.exec('PRAGMA foreign_keys=ON');
    const persisted=await call('getEasyStoreOpeningDraftV1',{batchId:row.batchId});
    assert.equal(persisted.success,true,JSON.stringify(persisted));
    assert.equal(persisted.totalLiabilityCents,185000);
    assert.equal(persisted.suppliers[0].supplierId,supplier.supplierId);
    assert.equal(persisted.installments.length,2);
    assert.equal(persisted.posted,false);
    assert.equal(count('employee_accounting_party_ledger_v1'),beforeLedger);
    assert.equal(count('employee_accounting_cashbox_v1'),beforeCash);
    // A new legitimate call with same request but altered contract must fail after restart.
    const altered=await call(row.action,{...row,installments:row.installments.map((i,j)=>
      j===0?{...i,evidenceRef:'CHANGED-EVIDENCE-001'}:i)});
    assert.equal(altered.code,'acc278-idempotency-payload-conflict');
    // Feature kill switch even blocks reading private drafts.
    env.EASYSTORE_OPENING_DRAFT_INTAKE_V1='OFF';
    assert.equal((await call('getEasyStoreOpeningDraftV1',{batchId:row.batchId})).code,'acc278-owner-draft-feature-disabled');
    console.log('ACC278_ORIGINAL_D1_AUTHENTICATED_DRAFT_WRITE_READ_REOPEN=PASS');
    console.log('ACC278_NO_DUPLICATE_LIABILITY_OR_CASH_POSTING=PASS');
    console.log('ACC278_STRICT_SIGNED_OPENING_POSTING_NOT_ENABLED=PASS');
    console.log('ACC278_PRODUCTION_DB_WRITES=ZERO');
    console.log('FINANCE_RELEASE=NO_GO');
  }finally{db.close();fs.rmSync(dir,{recursive:true,force:true});}
});
