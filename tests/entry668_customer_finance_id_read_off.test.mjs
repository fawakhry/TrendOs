import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  readNativeCustomerEasyStoreBalanceV0,
  CUSTOMER_EASYSTORE_EXACT_ID_BALANCE_SQL_V0,
  CUSTOMER_EASYSTORE_FINANCE_POLICY_V0
} from '../cloudflare-d1/src/customer-portal-easystore-finance-id-read-v0.mjs';
import {fingerprintCustomerSessionV0} from '../cloudflare-d1/src/customer-portal-native-orders-v0.mjs';

const TOKEN='ab'.repeat(32);
const SECRET='FAKE-only-32-char-native-session-hmac-secret-not-real';
const NOW=1800000000000;
const FAKE_ROW={customerId:'C1',balance:125.50,balanceVersion:3,
  balanceUpdatedAtMs:NOW-60000,accountingMode:'READONLY'};
let operations=[];
function db({row=FAKE_ROW,fail=false}={}){
 return {prepare(sql){
   operations.push({stage:'prepare',sql});
   return {bind(...args){
     operations.push({stage:'bind',args});
     return {async first(){
       if(fail)throw new Error('PRIVATE_SQL_ACCESS');
       return row;
     }};
   }};
 }};
}
const input=(values={})=>({
 db:db(),token:TOKEN,secret:SECRET,nowMs:NOW,
 customerFinancialMappingAttested:true,easyStoreBalanceParityCertified:true,
 ...values
});
test('no new accounting tables, no public route and never use customer name matching',()=>{
 const code=readFileSync('cloudflare-d1/src/customer-portal-easystore-finance-id-read-v0.mjs','utf8');
 const worker=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 assert.doesNotMatch(worker,/customer-portal-easystore-finance-id-read-v0\.mjs/);
 assert.doesNotMatch(code,/fetch\s*\(|script\.google\.com|APPS_SCRIPT_API_URL|CREATE TABLE|INSERT INTO|UPDATE employee_accounting/i);
 const sql=CUSTOMER_EASYSTORE_EXACT_ID_BALANCE_SQL_V0;
 assert.match(sql,/b\.party_type='customer' AND b\.party_id=a\.customer_id/);
 assert.match(sql,/s\.token_fingerprint_hex=\?/);
 assert.match(sql,/s\.revoked_at_ms IS NULL/);
 assert.match(sql,/s\.session_version=a\.session_version/);
 assert.match(sql,/ctl\.mode='GENERAL'/);
 assert.match(sql,/c\.source='cloud-native'/);
 assert.match(sql,/f\.mode IN \('READONLY','GENERAL'\)/);
 assert.match(sql,/NOT EXISTS/);
 assert.doesNotMatch(sql,/party_name\s*=|customer_name\s*=|phone\s*=|legacy_chat_token/i);
 assert.equal(CUSTOMER_EASYSTORE_FINANCE_POLICY_V0.ledgerSchemaDuplicated,false);
 assert.equal(CUSTOMER_EASYSTORE_FINANCE_POLICY_V0.httpRouteAvailable,false);
 assert.equal(CUSTOMER_EASYSTORE_FINANCE_POLICY_V0.defaultEnabled,false);
 assert.equal(CUSTOMER_EASYSTORE_FINANCE_POLICY_V0.productionRelease,'NO_GO');
});
test('independent identity mapping and finance parity proof both mandatory before D1 read',async()=>{
 for(const values of [
  {customerFinancialMappingAttested:false},
  {easyStoreBalanceParityCertified:false},
  {customerFinancialMappingAttested:1},
  {easyStoreBalanceParityCertified:'true'}
 ]){
   operations=[];
   const x=await readNativeCustomerEasyStoreBalanceV0(input(values));
   assert.equal(x.status,503);
   assert.equal(x.body.code,'EASYSTORE_CUSTOMER_FINANCE_PARITY_NOT_APPROVED');
   assert.equal(operations.length,0);
 }
});
test('HMAC D1 session only, no customerId accepted from browser fields',async()=>{
 operations=[];
 const result=await readNativeCustomerEasyStoreBalanceV0(input({
   customerId:'OTHER',customerName:'forged',partyId:'supplier:C2',phone:'0123456'
 }));
 assert.equal(result.status,200);
 assert.equal(result.body.balance,125.50);
 assert.equal(result.body.currency,'EGP');
 assert.equal(result.body.financialPreviewOnly,true);
 assert.equal(result.body.financeAuthoritative,false);
 assert.equal(result.body.financeWriteAuthorized,false);
 assert.equal(result.body.zeroGoogleComplete,false);
 const b=operations.filter(x=>x.stage==='bind');
 assert.equal(b.length,1);
 assert.deepEqual(b[0].args,[
   await fingerprintCustomerSessionV0(TOKEN,SECRET),NOW,NOW
 ]);
 const data=JSON.stringify(result.body);
 for(const secret of [TOKEN,SECRET,'C1','OTHER','0123456','supplier:C2'])
   assert.equal(data.includes(secret),false);
});
test('expired, future-dated or stale balances fail closed, not reported as zero',async()=>{
 for(const row of [
  {...FAKE_ROW,balanceUpdatedAtMs:0},
  {...FAKE_ROW,balanceUpdatedAtMs:NOW+1},
  {...FAKE_ROW,balanceUpdatedAtMs:NOW-86400001},
  {...FAKE_ROW,balanceVersion:0},
  {...FAKE_ROW,balance:NaN},
  {...FAKE_ROW,balance:Infinity},
  {...FAKE_ROW,balance:1.001},
  {...FAKE_ROW,balance:-1e14},
 ]){
  const x=await readNativeCustomerEasyStoreBalanceV0(input({db:db({row})}));
  assert.equal(x.status,503,JSON.stringify(row));
  assert.equal(x.body.financeAuthoritative,false);
 }
 const edge=await readNativeCustomerEasyStoreBalanceV0(input({db:db({
   row:{...FAKE_ROW,balanceUpdatedAtMs:NOW-86400000,balance:0}
 })}));
 assert.equal(edge.status,200);
 assert.equal(edge.body.balance,0);
});
test('missing party-id match and SQL errors cannot expose customer ledger',async()=>{
 for(const row of [null,{...FAKE_ROW,customerId:null}]){
  const x=await readNativeCustomerEasyStoreBalanceV0(input({db:db({row})}));
  assert.equal(x.status,404);
  assert.equal(x.body.success,false);
 }
 const broken=await readNativeCustomerEasyStoreBalanceV0(input({db:db({fail:true})}));
 assert.equal(broken.status,503);
 assert.equal(JSON.stringify(broken).includes('PRIVATE_SQL_ACCESS'),false);
});
test('invalid bearer and missing DB or HMAC secret rejected without a query',async()=>{
 for(const change of [
  {token:'BAD'}, {secret:'short'}, {db:null}, {nowMs:0}
 ]){
  operations=[];
  const x=await readNativeCustomerEasyStoreBalanceV0(input(change));
  assert.notEqual(x.status,200);
  assert.equal(operations.length,0);
 }
});
