import assert from 'node:assert/strict';
import fs from 'node:fs';

// ACC-157: read-only current-state acceptance, not a financial write canary.
// GET metadata/health only. Never print response bodies, tokens or identities.
const manifest=JSON.parse(fs.readFileSync(
  'docs/trendos/staging/ACC152_ACCOUNTING_SOURCE_D1_PARITY_MANIFEST_20261010.json','utf8'
));
assert.equal(manifest.classification,'REPO_ONLY_SCHEMA_MAPPING_NOT_MIGRATION');
assert.equal(manifest.source.authority,'UNVERIFIED_FOR_FINANCIAL_OPENING_BALANCES');
assert.equal(manifest.source.accountingTabCount,21);
assert.ok(Array.isArray(manifest.mappings) && manifest.mappings.length>=5);
assert.ok(manifest.mappings.every(x=>x.idMappingVerified===false));
assert.ok(manifest.blockingGates.includes('authoritative_financial_source_identification'));
assert.ok(manifest.blockingGates.includes('real_employee_sso_smoke'));
assert.ok(manifest.blockingGates.includes('owner_approved_financial_write_canary'));
assert.ok(manifest.blockingGates.includes('no_a213_retry_without_new_authorization'));
console.log('ACC157_HISTORICAL_LEDGER_PARITY=BLOCKED_UNVERIFIED_SOURCE');
console.log('ACC157_A213_RETRY=FORBIDDEN');

const allowedUrl={
  accounting:'https://trendos-d1-api.trendmall-contact.workers.dev/v1/employee/accounting/health',
  frontend:'https://fawakhry.github.io/EasyStore/',
  pr:'https://api.github.com/repos/fawakhry/EasyStore/pulls/23',
  main:'https://api.github.com/repos/fawakhry/EasyStore/branches/main'
};
async function get(name){
  const u=allowedUrl[name];
  if(!u)throw Error('UNAPPROVED_DESTINATION');
  const response=await fetch(u,{method:'GET',redirect:'manual',headers:{'Accept':name==='frontend'?'text/html':'application/json'},
    signal:AbortSignal.timeout(15000)});
  if(response.status!==200)throw Error('ACC157_'+name.toUpperCase()+'_HTTP_NOT_200');
  if(name==='frontend'){await response.body?.cancel();return {};}
  // Never log bodies. Only extract approved, non-identifying controls.
  const body=await response.json();
  return body;
}
let live;
try{live=await get('accounting');}catch{
  console.log('ACC157_LIVE_D1_HEALTH=NOT_VERIFIED_BLOCKED_SAFE');
  process.exitCode=1;
}
if(live){
  const controls=[live.mode==='READONLY',live.authoritativeWrites===false,
    Number(live.writeCanaryAllowedUserCount||0)===0,
    Number(live.writeCanaryAllowedActionCount||0)===0,
    Number(live.writeCanaryMaxCommands||0)===0,
    Number(live.writeCanaryCommandsStarted||0)===0];
  if(controls.every(Boolean)){
    console.log('ACC157_LIVE_D1_READONLY_BOUNDARY=PASS');
    console.log('ACC157_CANARY_ALLOWLIST_AND_BUDGET=ZERO');
    console.log('ACC157_LIVE_POLICY_EPOCH='+Number(live.policyEpoch||0));
  }else{
    console.log('ACC157_LIVE_D1_BOUNDARY=DRIFT_BLOCKED_SAFE');
    process.exitCode=1;
  }
}
try{
  await get('frontend');
  console.log('ACC157_PUBLIC_EASYSTORE_FRONTEND_HTTP=PASS_NOT_SSO_PROOF');
}catch{
  console.log('ACC157_PUBLIC_EASYSTORE_FRONTEND_HTTP=UNVERIFIED');
  process.exitCode=1;
}
try{
  const [pr,main]=await Promise.all([get('pr'),get('main')]);
  const isDraft=pr.state==='open'&&pr.draft===true&&pr.merged_at==null;
  const isUnpublished=String(pr.head?.sha||'')!==String(main.commit?.sha||'');
  if(!isDraft||!isUnpublished){
    console.log('ACC157_SSO_RELEASE_STATE=CHANGED_REQUIRE_MANUAL_REVIEW');
    process.exitCode=1;
  }else{
    console.log('ACC157_SSO_PR23=DRAFT_NOT_PRODUCTION');
  }
}catch{
  console.log('ACC157_SSO_RELEASE_METADATA=UNVERIFIED');
  process.exitCode=1;
}
console.log('ACC157_DIAA_REAL_BROWSER_SSO=NOT_VERIFIED');
console.log('ACC157_EMPLOYEE_ROLE_MATRIX=UNVERIFIED_OWNER_APPROVAL_REQUIRED');
console.log('ACC157_FULL_FINANCIAL_GO_LIVE=BLOCKED_SAFE');
console.log('ACC157_FINANCIAL_WRITES=0; INVENTORY_WRITES=0; A213_RETRIES=0');
