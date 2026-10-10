import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import { webcrypto } from 'node:crypto';

// Offline, in-memory SQL execution of the checked-in migrations + actual
// accounting Worker source. NO live D1 API, Wrangler, network or credentials.
const sqlDir='cloudflare-d1/migrations/';
const files=[
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
const native=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8')
  .replace(/^import \{ verifyEmployeeSessionCloudFirst \} from '.\/cloud-session-bridge-v3\.mjs';\s*/,'')
  .replace(/^export /gm,'');
assert.ok(native.includes('async function closePurchaseCustodyV1('));

function makeDb(){
  const db=new DatabaseSync(':memory:');
  for(const migration of files){
    try { db.exec(fs.readFileSync(sqlDir+migration,'utf8')); }
    catch(e){throw Error('Migration '+migration+' rejected by real SQLite: '+e.message);}
  }
  db.prepare("UPDATE employee_accounting_control_v1 SET mode='CANARY',policy_epoch=39 WHERE singleton=1").run();
  db.prepare("UPDATE employee_accounting_write_canary_v1 SET enabled=1, allowed_usernames_json=?,allowed_actions_json=?,max_amount=0,policy_epoch=39,expires_at_ms=?,max_commands=1,commands_started=0 WHERE singleton=1")
    .run('["ضياء"]','["closePurchaseCustodyV1920"]',Date.now()+15*60*1000);
  const trace=[];
  const env={
    CORS_ORIGINS:'https://fawakhry.github.io',
    DB:{
      prepare(sql){
        const statement={sql:String(sql),args:[]};
        trace.push(statement);
        const wrap={
          bind(...args){statement.args=args;return wrap;},
          first(){return Promise.resolve(db.prepare(statement.sql).get(...statement.args)||null);},
          all(){return Promise.resolve({results:db.prepare(statement.sql).all(...statement.args)});},
          run(){return Promise.resolve(db.prepare(statement.sql).run(...statement.args));}
        };
        // D1 batch() receives prepared statements, not SQL text.
        wrap.__stmt=statement;
        return wrap;
      },
      async batch(statements){
        db.exec('BEGIN IMMEDIATE');
        try{
          const results=statements.map(s=>db.prepare(s.__stmt.sql).run(...s.__stmt.args));
          db.exec('COMMIT');
          return results;
        }catch(e){
          db.exec('ROLLBACK');
          throw e;
        }
      }
    }
  };
  const sandbox={
    crypto:webcrypto,TextEncoder,Response,Request,Headers,URL,URLSearchParams,
    Date,Intl,JSON,Math,console,
    verifyEmployeeSessionCloudFirst:async(username,token)=>{
      if(username!=='ضياء'||token!=='ACC158-LOCAL-FAKE-TOKEN')
        return {ok:false,message:'synthetic session rejected'};
      return {ok:true,authSource:'ACC158_LOCAL_SQLITE',body:{user:{username:'ضياء',role:'admin',department:''}}};
    }
  };
  const vmContext=vm.createContext(sandbox);
  vm.runInContext(native+'\n;globalThis.ACC158_HANDLER=handleEmployeeAccountingNativeRequest;',vmContext,{timeout:10000});
  const count=t=>Number(db.prepare('SELECT COUNT(*) n FROM '+t).get().n);
  return {db,env,handler:vmContext.ACC158_HANDLER,count,trace};
}
const requestId='A213-CCLOSE-ACC158-FAKE-20261010';
function req(overrides={},authorization='ACC158-LOCAL-FAKE-TOKEN'){
  return new Request('https://acc158.invalid/v1/employee/accounting',{
    method:'POST',
    headers:{Origin:'https://fawakhry.github.io',Authorization:'Bearer '+authorization,'Content-Type':'application/json'},
    body:JSON.stringify({
      action:'closePurchaseCustodyV1920',username:'ضياء',name:'ضياء',_ts:Date.now(),
      requestId,employee:'A2-CANARY-CUSTODY-ACC158-FAKE',
      department:'عام',workDate:'2099-12-31',
      ...overrides
    })
  });
}
async function send(instance,request){
  const response=await instance.handler(request,instance.env);
  return {status:response.status,body:await response.json()};
}
{
  const s=makeDb();
  try {
    const x=await send(s,req());
    assert.equal(x.status,200,'real SQLite + original Worker should COMMIT: '+JSON.stringify(x.body));
    assert.equal(x.body.success,true);
    assert.equal(x.body.balanceBefore,0);
    assert.equal(x.body.balanceAfter,0);
    assert.equal(x.body.settlementAmount,0);
    assert.equal(x.body.settlementType,'NONE');
    assert.equal(s.count('employee_accounting_custody_closes_v1'),1);
    assert.equal(s.count('employee_accounting_request_ledger_v1'),1);
    assert.equal(s.count('employee_accounting_events_v1'),1);
    for(const table of ['employee_accounting_cashbox_v1','employee_accounting_stock_moves_v1','employee_accounting_custody_events_v1','employee_accounting_party_ledger_v1'])
      assert.equal(s.count(table),0,'zero balance must not affect '+table);
    const command=s.db.prepare('SELECT status,operation FROM employee_accounting_request_ledger_v1 WHERE request_key=?').get(requestId);
    assert.equal(command.status,'COMMITTED');
    assert.equal(command.operation,'custody-close');
    assert.equal(s.db.prepare('SELECT commands_started n FROM employee_accounting_write_canary_v1').get().n,1);
    const dup=await send(s,req());
    assert.equal(dup.status,200,'same request should be idempotent: '+JSON.stringify(dup.body));
    assert.equal(dup.body.duplicatePrevented,true);
    assert.equal(s.count('employee_accounting_custody_closes_v1'),1);
    assert.equal(s.count('employee_accounting_request_ledger_v1'),1);
    assert.equal(s.count('employee_accounting_events_v1'),1);
    assert.equal(s.db.prepare('SELECT commands_started n FROM employee_accounting_write_canary_v1').get().n,1);
    const second=await send(s,req({requestId:'A213-CCLOSE-SECOND-FAKE-20261010',employee:'A2-CANARY-CUSTODY-SECOND'}));
    assert.equal(second.body.success,false,'a second unique command is forbidden');
    assert.equal(s.count('employee_accounting_custody_closes_v1'),1,'blocked second command must not write');
    s.db.prepare("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1").run();
    const denied=await send(s,req({requestId:'A213-CCLOSE-READONLY-FAKE'}));
    assert.equal(denied.status,503);
    assert.equal(denied.body.code,'employee-accounting-readonly');
  } finally {s.db.close();}
}
{
  const s=makeDb();
  try {
    const bad=await send(s,req({},'ACC158-INVALID-FAKE-TOKEN'));
    assert.equal(bad.status,401);
    assert.equal(s.count('employee_accounting_request_ledger_v1'),0);
    assert.equal(s.db.prepare('SELECT commands_started n FROM employee_accounting_write_canary_v1').get().n,0);
  } finally {s.db.close();}
}
{
  // Real SQLite can model a post-budget/pre-ledger failure without touching
  // finances; error must not leave a committed close or permit new budget.
  const s=makeDb();
  try {
    s.db.exec("CREATE TRIGGER acc158_inject_abort BEFORE INSERT ON employee_accounting_request_ledger_v1 BEGIN SELECT RAISE(ABORT,'ACC158_SYNTHETIC_ABORT'); END;");
    const failed=await send(s,req());
    assert.equal(failed.body.success,false);
    assert.equal(s.count('employee_accounting_request_ledger_v1'),0);
    assert.equal(s.count('employee_accounting_custody_closes_v1'),0);
    assert.equal(s.count('employee_accounting_events_v1'),0);
    assert.equal(s.db.prepare('SELECT commands_started n FROM employee_accounting_write_canary_v1').get().n,1,
      'command budget reservation is not proof of a committed financial operation');
  } finally {s.db.close();}
}
console.log('ACC158_REAL_SQLITE_MIGRATIONS_APPLIED=PASS');
console.log('ACC158_REAL_SQLITE_CUSTODY_TRANSACTION=PASS');
console.log('ACC158_REAL_SQLITE_IDEMPOTENCY_SECOND_COMMAND_BLOCKED=PASS');
console.log('ACC158_POST_RESERVATION_PRE_LEDGER_FAILURE_SAFETY=PASS');
console.log('ACC158_NO_PRODUCTION_D1_ACCESS_OR_FINANCIAL_WRITE=PASS');
