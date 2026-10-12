import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {validateAcc181OwnerDirection} from '../scripts/acc181_zero_opening_direction_preflight.mjs';

// ACC-193: all data is fabricated in temporary SQLite memory; no network.
const decision=JSON.parse(fs.readFileSync('docs/trendos/staging/ACC181_G3_ZERO_OPENING_DECISION.json','utf8'));
const accepted=validateAcc181OwnerDirection(decision);
assert.equal(accepted.G3,'OPEN');
assert.equal(decision.owner_direction,'START_NEW_ACCOUNTING_BOOKS_FROM_ZERO');
for(const k of ['historical_import_requested','historical_invoices_to_import',
  'historical_customer_supplier_balances_to_import','delete_existing_production_records',
  'initialize_production_finance_records','cutover_auto_activate',
  'inventory_physical_count_and_method_approved',
  'opening_cash_custody_reconciled_and_approved',
  'prior_unpaid_obligations_legacy_separation_approved',
  'owner_zero_opening_scope_signed','g3_accounting_cutover_accepted']){
  assert.equal(decision[k],false,k);
}
assert.equal(decision.cutover_date_local,null);

const migrations=[15,20,21,22,23,24,25,26,27,28,29,30];
const names={
 15:'employee_accounting_zero_google_v1',
 20:'employee_accounting_party_master_v1',
 21:'employee_accounting_material_dimensions_v1',
 22:'employee_accounting_day_ops_v1',
 23:'employee_accounting_command_audit_v1',
 24:'employee_accounting_party_balances_v1',
 25:'employee_accounting_final_reversal_day_close_v1',
 26:'employee_accounting_tx_guard_v1',
 27:'employee_accounting_direct_sale_cost_v1',
 28:'employee_accounting_write_canary_v1',
 29:'employee_accounting_canary_mode_v1',
 30:'employee_accounting_write_canary_budget_v1'
};
const db=new DatabaseSync(':memory:');
try{
  db.exec('CREATE TABLE fake_legacy(id TEXT PRIMARY KEY, amount REAL);');
  db.prepare('INSERT INTO fake_legacy(id,amount) VALUES(?,?)').run('ACC193_OLD_FAKE_INVOICE',115);
  db.prepare('INSERT INTO fake_legacy(id,amount) VALUES(?,?)').run('ACC193_OLD_FAKE_DEBT',70);
  for(const n of migrations){
    const path='cloudflare-d1/migrations/'+String(n).padStart(4,'0')+'_'+names[n]+'.sql';
    const sql=fs.readFileSync(path,'utf8');
    assert.doesNotMatch(sql,/INSERT\s+INTO\s+employee_accounting_\w+\s*\([^;]*\bFROM\s+t12_/i);
    db.exec(sql);
  }
  for(const table of ['employee_accounting_final_invoices_v1',
    'employee_accounting_purchase_invoices_v1','employee_accounting_stock_moves_v1',
    'employee_accounting_cashbox_v1','employee_accounting_party_ledger_v1',
    'employee_accounting_party_balances_v1','employee_accounting_materials_v1',
    'employee_accounting_dept_lines_v1','employee_accounting_request_ledger_v1']){
    const q=db.prepare('SELECT COUNT(*) AS c FROM '+table).get().c;
    assert.equal(q,0,table+' must start with no synthetic transactions');
  }
  const legacy=db.prepare('SELECT COUNT(*) AS c,SUM(amount) AS v FROM fake_legacy').get();
  assert.equal(legacy.c,2);
  assert.equal(legacy.v,185);
  assert.equal(db.prepare('SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1').get().mode,'OFF');
  const budget=db.prepare('SELECT enabled,allowed_usernames_json,allowed_actions_json,max_amount,expires_at_ms,max_commands,commands_started FROM employee_accounting_write_canary_v1 WHERE singleton=1').get();
  assert.equal(budget.enabled,1,'enabled=1 is the default active deny-all canary GUARD, not permission');
  assert.equal(budget.allowed_usernames_json,'[]');
  assert.equal(budget.allowed_actions_json,'[]');
  assert.equal(budget.max_amount,0);
  assert.equal(budget.expires_at_ms,0);
  assert.equal(budget.max_commands,0);
  assert.equal(budget.commands_started,0);
  console.log('ACC193_FRESH_ACCOUNTING_TABLES_NO_TRANSACTIONS=PASS');
  console.log('ACC193_EXISTING_SYNTHETIC_HISTORY_KEPT_SEPARATE=PASS');
  console.log('ACC193_CASH_STOCK_LIABILITIES_OWNER_NOT_SIGNED=PASS');
  console.log('ACC193_BACKEND_OFF_CANARY_ZERO_DATE_UNSET=PASS');
  console.log('ACC193_REAL_G3_OPENING_ACCEPTANCE=NOT_PERFORMED');
  console.log('ACC193_RELEASE_DECISION=NO_GO');
}finally{db.close();}
