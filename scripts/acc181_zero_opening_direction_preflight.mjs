// ACC-181 — static owner direction preflight, never a live G3 financial activation.
import assert from 'node:assert/strict';
import fs from 'node:fs';

export function validateAcc181OwnerDirection(x){
  if(!x || typeof x!=='object' || Array.isArray(x)) throw Error('ACC181_OWNER_DIRECTION_DOCUMENT_INVALID');
  const exact={
    schema:'ACC181_G3_ZERO_OPENING_OWNER_DIRECTION_V1',
    owner_direction:'START_NEW_ACCOUNTING_BOOKS_FROM_ZERO',
    historical_import_requested:false,
    historical_invoices_to_import:false,
    historical_customer_supplier_balances_to_import:false,
    delete_existing_production_records:false,
    initialize_production_finance_records:false,
    cutover_date_local:null,
    cutover_date_policy:'SELECT_DATE_ONLY_AT_OWNER_APPROVED_ACTUAL_FINANCE_GO_LIVE',
    cutover_auto_activate:false,
    program_completion_is_not_release_authorization:true,
    inventory_physical_count_and_method_approved:false,
    opening_cash_custody_reconciled_and_approved:false,
    prior_unpaid_obligations_legacy_separation_approved:false,
    staff_finance_grants_owner_signed:false,
    owner_zero_opening_scope_signed:false,
    genuine_source_snapshot_evidence_verified:false,
    approved_cutover_action_window:false,
    g3_accounting_cutover_accepted:false,
    current_backend_policy:'READONLY',
    current_frontend_write_mode:'OFF',
    release_decision:'NO_GO',
    production_changes_performed:false
  };
  for(const [k,value] of Object.entries(exact)){
    if(!Object.prototype.hasOwnProperty.call(x,k) || x[k]!==value)
      throw Error('ACC181_UNAPPROVED_G3_STATE_CHANGE_'+k);
  }
  if(x.source!=='OWNER_CHAT_DIRECTION_2026-10-10')
    throw Error('ACC181_OWNER_PROVENANCE_MISMATCH');
  if(typeof x.note!=='string'||x.note.length<80)
    throw Error('ACC181_SCOPE_EXPLANATION_MISSING');
  return {
    owner_zero_import_direction_recorded:true,
    accounting_date_signed:false,
    inventory_and_treasury_checked:false,
    legacy_obligations_addressed:false,
    financial_production_write_approved:false,
    G3:'OPEN',
    release_decision:'NO_GO',
    production_mutations:0
  };
}

if(process.argv[1]?.endsWith('/acc181_zero_opening_direction_preflight.mjs')){
  try {
    const input=JSON.parse(fs.readFileSync(process.argv[2]||'docs/trendos/staging/ACC181_G3_ZERO_OPENING_DECISION.json','utf8'));
    const status=validateAcc181OwnerDirection(input);
    assert.equal(status.G3,'OPEN');
    assert.equal(status.production_mutations,0);
    console.log('ACC181_OWNER_ZERO_IMPORT_DIRECTION=RECORDED');
    console.log('ACC181_OPENING_STOCK_AND_CASH_VERIFICATION=PENDING');
    console.log('ACC181_CUTOVER_DATE_AND_SIGNOFF=PENDING');
    console.log('ACC181_G3_STATUS=OPEN');
    console.log('ACC181_FINANCE_RELEASE=NO_GO');
    console.log('ACC181_PRODUCTION_MUTATIONS=ZERO');
  }catch(e){console.error(String(e.message));process.exitCode=1;}
}
