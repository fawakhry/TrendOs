import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateAcc181OwnerDirection} from '../scripts/acc181_zero_opening_direction_preflight.mjs';
const original=JSON.parse(fs.readFileSync('docs/trendos/staging/ACC181_G3_ZERO_OPENING_DECISION.json','utf8'));
const state=validateAcc181OwnerDirection(original);
assert.equal(state.owner_zero_import_direction_recorded,true);
assert.equal(state.G3,'OPEN');
assert.equal(state.release_decision,'NO_GO');
assert.equal(state.production_mutations,0);
assert.equal(state.accounting_date_signed,false);
for(const field of [
 'historical_import_requested',
 'historical_invoices_to_import',
 'historical_customer_supplier_balances_to_import',
 'delete_existing_production_records',
 'initialize_production_finance_records',
 'inventory_physical_count_and_method_approved',
 'opening_cash_custody_reconciled_and_approved',
 'prior_unpaid_obligations_legacy_separation_approved',
 'staff_finance_grants_owner_signed',
 'owner_zero_opening_scope_signed',
 'genuine_source_snapshot_evidence_verified',
 'approved_cutover_action_window',
 'g3_accounting_cutover_accepted',
 'production_changes_performed'
]){
 assert.throws(()=>validateAcc181OwnerDirection({...original,[field]:true}),/UNAPPROVED_G3_STATE_CHANGE_/,field);
}
for(const [field,value] of [
 ['cutover_date_local','2026-10-11'],
 ['cutover_date_policy','AUTO_START_ON_CODE_COMPLETE'],
 ['cutover_auto_activate',true],
 ['program_completion_is_not_release_authorization',false],
 ['current_backend_policy','GENERAL'],
 ['current_frontend_write_mode','CANARY'],
 ['release_decision','GO'],
 ['owner_direction','IMPORT_ALL_LEGACY_DATA'],
 ['source','UNVERIFIED_EMPLOYEE_ASSERTION'],
 ['schema','OTHER_SCHEMA']
]){
 assert.throws(()=>validateAcc181OwnerDirection({...original,[field]:value}),/ACC181_/,field);
}
const copy={...original};delete copy.g3_accounting_cutover_accepted;
assert.throws(()=>validateAcc181OwnerDirection(copy),/UNAPPROVED_G3_STATE_CHANGE_/);
assert.throws(()=>validateAcc181OwnerDirection(null),/DOCUMENT_INVALID/);
console.log('ACC181_NEW_BOOKS_OWNER_DIRECTION_NO_HISTORIC_IMPORT=PASS');
console.log('ACC181_NO_DELETE_NO_RESET_NO_FINANCE_DML=PASS');
console.log('ACC181_CUTOVER_DATE_STOCK_TREASURY_AND_LEGACY_DEBTS_REMAIN_OPEN=PASS');
console.log('ACC181_FAKE_SIGNOFF_OR_FINANCIAL_GO_REJECTED=PASS');
console.log('ACC181_PRODUCTION_MUTATIONS=ZERO');
