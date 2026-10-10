import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Guard historical finance qualifications against stale expected counts or an
// unsafe CI mutation. Strictly source-only, with ZERO production connections.
const paths={
 a211:'.github/workflows/easystore-a211-waste-qualification.yml',
 a212:'.github/workflows/easystore-a212-dept-line-qualification.yml',
 current:'.github/workflows/easystore-a213-custody-close-qualification.yml'
};
const source=Object.fromEntries(
 Object.entries(paths).map(([name,path])=>[name,fs.readFileSync(path,'utf8')])
);
const exact={
 materials:1,templates:1,parties:1,partyBalances:1,waste:1,deptLines:1,
 custodyCloses:0,custodyEvents:0,requestLedger:6,events:6,stockMoves:0,
 partyLedger:0,cashbox:0,purchases:0,dailyPurchases:0,finalInvoices:0,dayCloses:0
};
function check(name,content){
 const exp=/\bconst exp=(\{[^\n]+\});/.exec(content);
 assert.ok(exp,'explicit exact D1 financial baseline missing in '+name);
 const m=vm.runInNewContext('('+exp[1]+')',Object.create(null),{timeout:1000});
 assert.deepEqual({...m},exact,'six-canary baseline must keep all exact counts: '+name);
 assert.match(content,/on:\s*\n\s*push:\s*\n\s*branches:\s*\n\s*-\s*candidate\/easystore-accounting-a2-20261005/);
 assert.match(content,/permissions:\s*\n\s*contents:\s*read/);
 assert.doesNotMatch(content,/contents:\s*write|git\s+push|git\s+commit|git\s+add|tee\s+\.github\//i);
 assert.match(content,/npx wrangler d1 execute "\$DATABASE" --remote --config "\$API_CONFIG" --json --command "/);
 const sql=/--command "\s*([\s\S]*?)\s*"\s*>\s*\/tmp\/d1.json/.exec(content);
 assert.ok(sql,'remote D1 must be bounded to a read-only SQL literal');
 assert.match(sql[1],/^\s*SELECT\s/i,'D1 statement must be SELECT');
 assert.doesNotMatch(sql[1],/\b(?:UPDATE|DELETE|INSERT|REPLACE|ALTER|DROP|CREATE|PRAGMA|ATTACH)\b/i);
 assert.match(content,/if\(h.mode!=='READONLY'\|\|h.authoritativeWrites!==false\)/);
 assert.match(content,/if\(Number\(h.writeCanaryAllowedUserCount\|\|0\)\|\|Number\(h.writeCanaryAllowedActionCount\|\|0\)\|\|Number\(h.writeCanaryMaxCommands\|\|0\)\|\|Number\(h.writeCanaryCommandsStarted\|\|0\)\)/);
 assert.match(content,/EASYSTORE_ACCOUNTING_D1_WRITE_MODE\\s\*=\\s\*'OFF'/);
 assert.match(content,/EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS\\s\*=\\s\*\\\[\\\]/);
 assert.ok(content.includes("for(const [k,v] of Object.entries(exp))if(Number(r[k]||0)!==v)throw Error("),
   'require exact-match fail-closed count loop');
 assert.doesNotMatch(content,/workflow_dispatch:/,'qualification must not arm money-moving workflows');
 if(name==='a211'||name==='a212'){
   assert.match(content,/HISTORICAL_CANARY=ALREADY_COMPLETED_NO_REPLAY/);
   assert.match(content,/SIX_CANARY_READONLY_BASELINE=PASS/);
 }
 return true;
}
for(const [name,content] of Object.entries(source))assert.equal(check(name,content),true);
assert.throws(()=>check('a211',source.a211.replace('requestLedger:6','requestLedger:4')),'reject four-canary drift');
assert.throws(()=>check('a212',source.a212.replace('deptLines:1','deptLines:0')),'reject five-canary drift');
assert.throws(()=>check('a211',source.a211.replace('contents: read','contents: write')),'reject qualification with repo writes');
assert.throws(()=>check('a211',source.a211+'\n          git push origin HEAD:candidate/easystore-accounting-a2-20261005'),'reject bot branch mutation');
assert.throws(()=>check('a212',source.a212.replace("h.mode!=='READONLY'","h.mode!=='GENERAL'")),'reject untrusted backend mode');
assert.throws(()=>check('a211',source.a211.replace('SELECT\n','UPDATE employee_accounting_control_v1 SET mode=\'GENERAL\';\n')),'reject D1 DML');
console.log('ACC172_A211_A212_A213_CURRENT_SIX_CANARY_EXACT_COUNTS=PASS');
console.log('ACC172_A211_AUTOBOT_REPOSITORY_MUTATION_REMOVED=PASS');
console.log('ACC172_READONLY_D1_QUERY_AND_OFF_HEALTH_LOCKED=PASS');
console.log('ACC172_OLD_BASELINES_AND_WRITE_PERMISSION_MUTATIONS_REJECTED=PASS');
console.log('ACC172_HISTORICAL_FINANCE_CANARY_REEXECUTIONS=ZERO');
console.log('ACC172_PRODUCTION_FINANCIAL_WRITES=ZERO');
