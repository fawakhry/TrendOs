import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

// Execute the actual repository's native Accounting handler with an
// entirely in-memory D1 statement double; this NEVER contacts Production.
const source=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8')
  .replace(/^import \{ verifyEmployeeSessionCloudFirst \} from '.\/cloud-session-bridge-v3\.mjs';\s*/,'')
  .replace(/^export /gm,'');
assert.ok(source.includes('handleEmployeeAccountingNativeRequest'),'native accounting handler source');

function setup({mode='CANARY',sessionValid=true}={}){
  const state={sql:[],writes:[],batch:[],commandsStarted:0,authCalls:0};
  const DB={
    prepare(sql){
      const stmt={sql:String(sql),bindings:[]};
      state.sql.push(stmt);
      const chain={
        bind(...args){stmt.bindings=args;return chain;},
        async first(){
          if(stmt.sql.includes("FROM employee_accounting_control_v1"))
            return {mode,nextInvoiceNumber:1,policyEpoch:39};
          if(stmt.sql.includes("FROM employee_accounting_write_canary_v1"))
            return {enabled:1,allowedUsersJson:'["ضياء"]',allowedActionsJson:'["closePurchaseCustodyV1920"]',maxAmount:0,expiresAtMs:Date.now()+15*60*1000,policyEpoch:39,maxCommands:1,commandsStarted:state.commandsStarted};
          if(stmt.sql.includes("UPDATE employee_accounting_write_canary_v1")&&stmt.sql.includes("RETURNING commands_started")){
            if(state.commandsStarted) return null;
            state.commandsStarted++;
            return {commandsStarted:1,maxCommands:1};
          }
          if(stmt.sql.includes("FROM employee_accounting_custody_closes_v1"))return null;
          if(stmt.sql.includes("FROM employee_accounting_request_ledger_v1"))return null;
          throw Error('unexpected mock .first() statement: '+stmt.sql.slice(0,110));
        },
        async all(){
          if(/FROM employee_accounting_custody_events_v1|FROM employee_accounting_custody_closes_v1/.test(stmt.sql))
            return {results:[]};
          throw Error('unexpected mock .all() statement: '+stmt.sql.slice(0,110));
        },
        async run(){
          state.writes.push(stmt);
          if(stmt.sql.includes("INSERT INTO employee_accounting_request_ledger_v1"))return {success:true};
          throw Error('unexpected separate mutation: '+stmt.sql.slice(0,110));
        }
      };
      return chain;
    },
    async batch(stmts){
      state.batch.push(...stmts);
      assert.equal(stmts.length,3,'custody close must atomically batch close, event and request completion');
      const sql=stmts.map(x=>state.sql.find(s=>s.sql===x.sql)?.sql||x.sql);
      assert.equal(sql.filter(x=>x.includes('INSERT INTO employee_accounting_custody_closes_v1')).length,1);
      assert.equal(sql.filter(x=>x.includes('INSERT INTO employee_accounting_events_v1')).length,1);
      assert.equal(sql.filter(x=>x.includes('UPDATE employee_accounting_request_ledger_v1')).length,1);
      assert.ok(sql.every(x=>!/INSERT INTO employee_accounting_cashbox_v1|INSERT INTO employee_accounting_stock_moves_v1|INSERT INTO employee_accounting_custody_events_v1/.test(x)),
        'zero custody balance must not touch cashbox, stock or settlement');
      return [];
    }
  };
  const sandbox={
    crypto:webcrypto,
    TextEncoder,Response,Request,Headers,URL,URLSearchParams,Date,Intl,JSON,Math,
    console,
    verifyEmployeeSessionCloudFirst:async(username,token)=>{
      state.authCalls++;
      if(!sessionValid||username!=='ضياء'||token!=='MOCK-NON-PRODUCTION')
        return {ok:false,message:'invalid synthetic session'};
      return {ok:true,authSource:'MOCK',body:{user:{username:'ضياء',role:'admin',department:''}}};
    }
  };
  const context=vm.createContext(sandbox);
  vm.runInContext(source+'\n;globalThis.ACC157_HANDLER=handleEmployeeAccountingNativeRequest;',context,{timeout:10000});
  return {state,env:{DB,CORS_ORIGINS:'https://fawakhry.github.io'},handler:context.ACC157_HANDLER};
}
function makeRequest({token='MOCK-NON-PRODUCTION',action='closePurchaseCustodyV1920'}={}){
  return new Request('https://unit.invalid/v1/employee/accounting',{
    method:'POST',
    headers:{Origin:'https://fawakhry.github.io',Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({action,username:'ضياء',name:'ضياء',_ts:Date.now(),
      requestId:'A213-CCLOSE-MOCK-NO-LIVE-20261010',employee:'A2-CANARY-CUSTODY-OFFLINE',
      department:'عام',workDate:'2099-12-31'})
  });
}
{
  const {handler,env,state}=setup();
  const response=await handler(makeRequest(),env);
  const result=await response.json();
  assert.equal(response.status,200,'in-memory guarded zero-balance canary should finish: '+JSON.stringify(result));
  assert.equal(result.success,true,JSON.stringify(result));
  assert.equal(result.balanceBefore,0);
  assert.equal(result.settlementAmount,0);
  assert.equal(result.settlementType,'NONE');
  assert.equal(result.balanceAfter,0);
  assert.equal(state.commandsStarted,1,'one bounded budget reservation');
  assert.equal(state.writes.length,1,'one PREPARED request ledger row only');
  assert.equal(state.batch.length,3,'single atomic D1 batch');
  assert.equal(state.authCalls,1,'server checked the mock token before policy reserve');
}
{
  const {handler,env,state}=setup({mode:'READONLY'});
  const response=await handler(makeRequest(),env);
  const result=await response.json();
  assert.equal(response.status,503);
  assert.equal(result.code,'employee-accounting-readonly');
  assert.equal(state.commandsStarted,0);
  assert.equal(state.writes.length,0);
  assert.equal(state.batch.length,0);
}
{
  const {handler,env,state}=setup({sessionValid:false});
  const response=await handler(makeRequest(),env);
  const result=await response.json();
  assert.equal(response.status,401);
  assert.equal(result.code,'employee-session-rejected');
  assert.equal(state.commandsStarted,0,'bad auth must not burn budget');
  assert.equal(state.writes.length,0);
}
console.log('A213_SYNTHETIC_HANDLER_CANARY_COMMIT_PIPELINE=PASS');
console.log('A213_SYNTHETIC_CANARY_NO_CASHBOX_STOCK_SETTLEMENT=PASS');
console.log('A213_SYNTHETIC_READONLY_AND_BAD_AUTH_FAIL_CLOSED=PASS');
console.log('A213_SYNTHETIC_PRODUCTION_MUTATION=NO');
