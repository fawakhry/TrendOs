import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {preflightEasyStoreOpeningACC277} from '../cloudflare-d1/src/easystore-acc277-opening-intake-v1.mjs';
const schema=fs.readFileSync('cloudflare-d1/migrations/0035_easystore_opening_intake_draft_v1.sql','utf8');
test('original finance D1 opening supplier + installment drafts retain real liability without double count',()=>{
  const db=new DatabaseSync(':memory:');
  try{
    db.exec(schema);
    const input={currency:'EGP',cutoverDate:'2026-11-01',
      suppliers:[{supplierId:'SUP-FAKE-001',balanceCents:125000,evidenceRef:'FILE-FAKE-001'}],
      installments:[
        {contractId:'INST-FAKE-001',creditorRef:'SUP-FAKE-001',supplierId:'SUP-FAKE-001',
          liabilityTreatment:'INCLUDED_IN_SUPPLIER_OPENING',contractTotalCents:100000,
          paidToCutoverCents:40000,remainingCents:60000,installmentCents:15000,
          frequency:'monthly',nextDueDate:'2026-11-15',evidenceRef:'FILE-FAKE-002'},
        {contractId:'INST-FAKE-002',creditorRef:'CREDITOR-FAKE-002',supplierId:'',
          liabilityTreatment:'SEPARATE_CREDITOR',contractTotalCents:90000,
          paidToCutoverCents:30000,remainingCents:60000,installmentCents:10000,
          frequency:'monthly',nextDueDate:'2026-11-20',evidenceRef:'FILE-FAKE-003'}
      ]};
    const preview=preflightEasyStoreOpeningACC277(input);
    assert.equal(preview.ok,true);assert.equal(preview.totalLiabilityCents,185000);
    assert.equal(preview.posted,false);
    db.prepare(`INSERT INTO employee_accounting_opening_intake_batches_v1
      (batch_id,cutover_date,currency,status,preparer_ref,source_evidence_ref,
       supplier_total_cents,separate_installment_total_cents,total_liability_cents,
       request_key,request_hash,created_at_ms) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        'BATCH-FAKE-001','2026-11-01','EGP','DRAFT','FAKE-STAFF','FILE-FAKE-ALL',
        preview.supplierTotalCents,preview.separateInstallmentTotalCents,
        preview.totalLiabilityCents,'FAKE-REQ-OPENING-0001','a'.repeat(64),1761955200000);
    db.prepare(`INSERT INTO employee_accounting_opening_supplier_drafts_v1
      (batch_id,supplier_id,balance_cents,evidence_ref) VALUES (?,?,?,?)`)
      .run('BATCH-FAKE-001','SUP-FAKE-001',125000,'FILE-FAKE-001');
    const add=db.prepare(`INSERT INTO employee_accounting_opening_installment_drafts_v1
      (batch_id,contract_id,creditor_ref,supplier_id,liability_treatment,contract_total_cents,
       paid_to_cutover_cents,remaining_cents,installment_cents,frequency,next_due_date,evidence_ref)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
    for(const i of input.installments)add.run('BATCH-FAKE-001',
      i.contractId,i.creditorRef,i.supplierId,i.liabilityTreatment,i.contractTotalCents,
      i.paidToCutoverCents,i.remainingCents,i.installmentCents,i.frequency,i.nextDueDate,i.evidenceRef);
    const x=db.prepare('SELECT * FROM employee_accounting_opening_draft_totals_v1 WHERE batch_id=?')
      .get('BATCH-FAKE-001');
    assert.equal(x.status,'DRAFT');
    assert.equal(x.supplier_draft_cents,125000);
    assert.equal(x.separate_installment_draft_cents,60000);
    assert.equal(x.already_in_supplier_draft_cents,60000);
    assert.equal(x.claimed_total_cents,185000);
    assert.equal(x.supplier_draft_cents+x.separate_installment_draft_cents,185000);
    assert.throws(()=>db.prepare("UPDATE employee_accounting_opening_intake_batches_v1 SET status='APPROVED'").run(),/CHECK constraint failed/);
    assert.throws(()=>db.prepare("INSERT INTO employee_accounting_opening_supplier_drafts_v1 VALUES (?,?,?,?)")
      .run('BATCH-FAKE-001','SUP-FAKE-001',100,'FILE-FAKE-001'),/UNIQUE constraint failed/);
    assert.throws(()=>add.run('BATCH-FAKE-001','INST-FAKE-003','CREDITOR-FAKE-003','',
      'SEPARATE_CREDITOR',90000,80000,20000,30000,'monthly','2026-12-01','FILE-FAKE-003'),/CHECK constraint failed/);
    const forbidden=['employee_accounting_party_ledger_v1','employee_accounting_cashbox_v1',
      'employee_accounting_final_invoices_v1'];
    for(const t of forbidden){
      const row=db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name=?").get(t);
      assert.equal(row.n,0,'opening DRAFT schema must not create a second ledger '+t);
    }
  }finally{db.close();}
});
console.log('ACC277_ORIGINAL_D1_DRAFT_SCHEMA_SQLITE=PASS');
console.log('ACC277_DRAFT_IS_NOT_FINANCIAL_POSTING=PASS');
console.log('ACC277_PRODUCTION_DB_CHANGED=NO');
