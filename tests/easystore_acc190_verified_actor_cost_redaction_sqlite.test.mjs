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

 assert.equal(financeState(),'OFF','ephemeral accounting migration must start OFF');
 db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1;");
 // All test materials, templates and lines are created *inside* discarded
 // SQLite in-memory. No real shop identities or financial balances exist here.
 for(const [dept,suffix] of [['طباعة','PRINT'],['ليزر','LASER']]){
   db.prepare("INSERT INTO employee_accounting_materials_v1(material_id,department,material_name,stock_qty,unit_cost,computed_unit_cost,official_sale_price) VALUES(?,?,?,?,?,?,?)")
     .run('ACC190-MAT-'+suffix,dept,'ACC190_FAKE_MATERIAL_'+suffix,8,11,12,30);
   db.prepare("INSERT INTO employee_accounting_templates_v1(template_id,department,item_name,ink_cost,fixed_cost,computed_cost,suggested_sale_price) VALUES(?,?,?,?,?,?,?)")
     .run('ACC190-TPL-'+suffix,dept,'ACC190_FAKE_TEMPLATE_'+suffix,2,7,22,60);
   db.prepare("INSERT INTO employee_accounting_dept_lines_v1(accounting_line_id,order_id,department,item_name,material_cost,operating_cost,other_cost,total_cost,system_cost,system_sale_price,sale_price,profit) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
     .run('ACC190-LINE-'+suffix,'ACC190-FAKE-ORDER-'+suffix,dept,'ACC190_FAKE_LINE_'+suffix,11,4,3,18,18,32,32,14);
 }
 const roleEnv=(grants,mode='ENFORCE')=>{
   env.ACCOUNTING_FINANCE_GRANTS_MODE_V1=mode;
   env.ACCOUNTING_FINANCE_GRANTS_V1=JSON.stringify({version:1,grants});
 };
 const user='ACC170_SYNTHETIC_OPERATOR',source={};
 const setMode=(mode,verifiedRoleValue='service')=>{
   verifiedRole=verifiedRoleValue;
   roleEnv([{username:user,mode}]);
 };
 const silentSnapshot=()=>({
   materials:count('employee_accounting_materials_v1'),
   templates:count('employee_accounting_templates_v1'),
   lines:count('employee_accounting_dept_lines_v1'),
   parties:count('employee_accounting_parties_v1'),
   requests:count('employee_accounting_request_ledger_v1'),
   cash:count('employee_accounting_cashbox_v1'),
   stock:count('employee_accounting_stock_moves_v1')
 });
 const baseline=silentSnapshot();
 const privateMaterials=['unitCost','computedUnitCost'];
 const privateTemplates=['inkCost','fixedCost','computedUnitCost'];
 const privateLines=['materialCost','operatingCost','otherCost','totalCost','systemCost','profit'];
 const restrictedCases=[['print','طباعة','PRINT'],['laser','ليزر','LASER'],['final',null,null]];
 for(const [mode,department,suffix] of restrictedCases){
   setMode(mode);
   const data=await send('getAccounting',{role:'admin',department:'إدارة',permission:'full'});
   assert.equal(data.success,true,mode+' '+JSON.stringify(data));
   assert.equal(data.permissions.mode,mode,'verified strict roster must not use browser-forged admin');
   assert.equal(data.permissions.department,department||'');
   assert.equal(data.permissions.canSeeCosts,false);
   assert.equal(data.permissions.canSeeProfitReports,false);
   assert.equal(data.permissions.canManageMaterials,false);
   assert.equal(data.permissions.canManageCustody,false);
   assert.equal(data.permissions.canReversePurchases,false);
   assert.equal(data.permissions.canCloseDepartmentDay,false);
   assert.equal(data.permissions.canCloseFinalInvoice,mode==='final');
   assert.equal(data.materials.length,department?1:2);
   assert.equal(data.templates.length,department?1:2);
   assert.equal(data.deptLines.length,department?1:2);
   assert.equal(data.finalInvoices.length,0);
   for(const [rows,keys] of [[data.materials,privateMaterials],[data.templates,privateTemplates],[data.deptLines,privateLines]]){
     for(const row of rows){
       for(const key of keys){
         assert.equal(row[key],'',mode+' must not receive raw financial '+key);
       }
     }
   }
   if(suffix){
     assert.ok(data.materials.every(x=>x.id==='ACC190-MAT-'+suffix));
     assert.ok(data.templates.every(x=>x.id==='ACC190-TPL-'+suffix));
     assert.ok(data.deptLines.every(x=>x.id==='ACC190-LINE-'+suffix));
     assert.equal(data.permissions.canEnterDailyPurchase,true);
   }else{
     assert.equal(data.permissions.canEnterDailyPurchase,false);
   }
   const report=data.summary?.byDepartment||[];
   for(const row of report){assert.equal(row.cost,'');assert.equal(row.profit,'');}
 }
 setMode('full');
 const full=await send('getAccounting',{role:'service'});
 assert.equal(full.success,true,JSON.stringify(full));
 assert.equal(full.permissions.mode,'full','roster is authoritative over verified service role');
 assert.equal(full.permissions.canSeeCosts,true);
 assert.equal(full.permissions.canManageCustody,true);
 assert.equal(full.materials.length,2);
 assert.ok(full.materials.every(x=>x.unitCost===11&&x.computedUnitCost===12));
 assert.ok(full.templates.every(x=>x.inkCost===2&&x.fixedCost===7&&x.computedUnitCost===22));
 assert.ok(full.deptLines.every(x=>x.materialCost===11&&x.totalCost===18&&x.profit===14));
 assert.deepEqual(silentSnapshot(),baseline,'read-only role requests cannot mutate any fake ledger');
 // No real staff role is changed: only ephemeral env scope.
 roleEnv([]);
 const missing=await send('getAccounting',{role:'admin'});
 assert.equal(missing.status,403);
 assert.equal(missing.code,'employee-session-rejected');
 roleEnv([{username:'ACC190_DIFFERENT_USER',mode:'full'}]);
 assert.equal((await send('getAccounting',{role:'admin'})).status,403);
 roleEnv([{username:user.toLowerCase(),mode:'full'},{username:user,mode:'print'}]);
 assert.equal((await send('getAccounting',{role:'admin'})).status,403,'duplicate normalized roster denies all');
 roleEnv([{username:'ACC170_*',mode:'full'}]);
 assert.equal((await send('getAccounting',{role:'admin'})).status,403,'wildcards forbidden');
 roleEnv([{username:user,mode:'superadmin'}]);
 assert.equal((await send('getAccounting',{role:'admin'})).status,403,'unknown finance roles forbidden');
 roleEnv([{username:user,mode:'full',scope:'*'}]);
 assert.equal((await send('getAccounting',{role:'admin'})).status,403,'unknown grant fields forbidden');
 setMode('print');
 const badBearer=await send('getAccounting',{}, {token:'ACC190_FORGED_TOKEN'});
 assert.equal(badBearer.status,401,'fake unverified token must not be trusted');
 assert.equal((await send('getAccounting',{username:'ACC190_FORGED_SUBJECT',role:'admin'})).status,401);
 assert.deepEqual(silentSnapshot(),baseline);
 // Even an authenticated synthetic full grant never unlocks finance writes
 // while the backend's control record is READONLY.
 setMode('full','admin');
 const blocked=await send('saveAccountingMaterial',{
   requestId:'ACC190-READONLY-0001',materialName:'ACC190_NOT_ALLOWED',
   department:'طباعة',stockQty:1
 });
 assert.equal(blocked.status,503);
 assert.equal(blocked.code,'employee-accounting-readonly');
 assert.deepEqual(silentSnapshot(),baseline);
 // For a strict unauthorized actor, GENERAL exists in *discarded memory only*.
 // Its authenticated role restrictions must deny before any fake financial SQL.
 db.exec("UPDATE employee_accounting_control_v1 SET mode='GENERAL' WHERE singleton=1;");
 db.exec("UPDATE employee_accounting_write_canary_v1 SET enabled=0,max_commands=0,commands_started=0 WHERE singleton=1;");
 for(const mode of ['print','laser','final']){
   setMode(mode);
   const finance=await send('saveEasyStorePurchaseV2',{
     requestId:'ACC190-DENY-PURCHASE-'+mode,role:'admin',invoiceNo:'FORGED',
     department:'طباعة',qty:1,unitCost:1,total:1,paid:0
   });
   assert.equal(finance.success,false,mode+' purchase must be denied');
   assert.equal(finance.status,400);
   const close=await send('closeDepartmentDayV1920',{
     requestId:'ACC190-DENY-CLOSE-'+mode,role:'admin',
     workDate:'2099-12-31',department:'طباعة'
   });
   assert.equal(close.success,false,mode+' day close must be denied');
   assert.equal(close.status,400);
   const supplier=await send('saveEasyStoreSupplier',{
     requestId:'ACC190-DENY-SUPPLIER-'+mode,role:'admin',supplierName:'ACC190_FORGED_SUPPLIER'
   });
   assert.equal(supplier.success,false);
   assert.equal(supplier.status,400);
 }
 assert.deepEqual(silentSnapshot(),baseline,'no fake finance row changes from denied role actions');
 db.exec("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1;");
 assert.equal(financeState(),'READONLY');
 console.log('ACC190_VERIFIED_MOCK_ROSTER_SCOPES_FULL_FINAL_PRINT_LASER=PASS');
 console.log('ACC190_DEPARTMENT_FILTERED_READS_AND_SERVER_COST_REDACTION=PASS');
 console.log('ACC190_STRICT_EMPTY_DUPLICATE_WILDCARD_UNKNOWN_GRANTS_DENIED=PASS');
 console.log('ACC190_FAKE_SESSION_SPOOF_AND_TOKEN_DENIED=PASS');
 console.log('ACC190_READONLY_SUPERSEDES_AUTHORIZED_FINANCE_GRANT=PASS');
 console.log('ACC190_OTHER_ROLES_DENY_PURCHASE_SUPPLIER_AND_DAY_CLOSE=PASS');
 console.log('ACC190_PRODUCTION_ROLE_GRANTS=NOT_APPLIED');
 console.log('ACC190_RELEASE_DECISION=NO_GO');
 console.log('ACC190_PRODUCTION_MUTATIONS=ZERO');
}finally{db.close();}
