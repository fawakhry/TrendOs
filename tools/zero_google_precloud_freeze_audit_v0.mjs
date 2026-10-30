/**
 * Zero Google customer/backend — source-only pre-Cloudflare checkpoint.
 *
 * Read-only audit of repo files, never cloud credentials, network, production
 * D1/R2, Apps Script, T12, employee, EasyStore or an actual runtime.
 * A passing static audit means SOURCE FROZEN/WAITING, NOT production ready.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const CANONICAL_NINE_CUSTOMER_ACTIONS=Object.freeze([
  'customerLogin',
  'customerLogout',
  'changeCustomerPassword',
  'getCustomerOrders',
  'getCustomerPortalAccountsV1859',
  'createCustomerDraft',
  'addCustomerDraftItem',
  'submitCustomerDraft',
  'uploadCustomerDraftFile'
]);
export const ZERO_GOOGLE_PRE_CLOUD_VERSION='ZERO_GOOGLE_PRE_CLOUD_FREEZE_20261030_V0';
const REQUIRED_INTERNAL_MODULES=Object.freeze([
  'private-scan-lease-issuer-internal-v0',
  'private-scan-lease-replay-d1-internal-v0',
  'private-scan-transport-envelope-internal-v0'
]);
const PRODUCTION_ENTRIES=Object.freeze([
  'cloudflare-d1/src/index_v2.js',
  'cloudflare-d1/production-shadow/index.js',
  'cloudflare-d1/customer-stage/index.mjs'
]);
const read=(root,file)=>fs.readFileSync(path.join(root,file),'utf8');
const truth=(value)=>value===true;
function customerLegacyActions(source){
  const fragment=/const LEGACY_CUSTOMER_SESSION_ACTIONS\s*=\s*new Set\s*\(\s*\[([\s\S]*?)\]\s*\)/.exec(source);
  if(!fragment)return null;
  return Array.from(fragment[1].matchAll(/'([a-zA-Z0-9]+)'/g),x=>x[1]);
}
export function inspectZeroGooglePreCloudFreezeV0(root){
  const check={};
  const fail=(key)=>{check[key]=false;};
  const pass=(key,val)=>{check[key]=truth(val);};
  const sourceFiles={};
  const required=[
    'cloudflare-d1/src/legacy-browser-transport-v1.mjs',
    'employee-api-dispatcher-v1.js',
    'cloudflare-d1/wrangler.customer-stage.toml',
    'cloudflare-d1/migrations/0041_customer_private_scan_lease_replay_v0.sql',
    'cloudflare-d1/customer-stage/private-scan-lease-issuer-internal-v0.mjs',
    'cloudflare-d1/customer-stage/private-scan-lease-replay-d1-internal-v0.mjs',
    'cloudflare-d1/customer-stage/private-scan-transport-envelope-internal-v0.mjs',
    'tools/customer_private_scan_loopback_transport_off_v0.py',
    ...PRODUCTION_ENTRIES
  ];
  for(const name of required)try{sourceFiles[name]=read(root,name);}
  catch{sourceFiles[name]=null;fail('source_file_missing_'+name.replace(/[^a-z0-9]/gi,'_'));}
  const legacy=sourceFiles['cloudflare-d1/src/legacy-browser-transport-v1.mjs']||'';
  const employee=sourceFiles['employee-api-dispatcher-v1.js']||'';
  const legacyActions=customerLegacyActions(legacy);
  const employeePart=/var CUSTOMER_SESSION_ACTIONS\s*=\s*new Set\s*\(\s*\[([\s\S]*?)\]\s*\)/.exec(employee);
  const employeeActions=employeePart?
    Array.from(employeePart[1].matchAll(/'([a-zA-Z0-9]+)'/g),x=>x[1]):null;
  const sameNine=actions=>actions?.length===9&&
    JSON.stringify(actions)===JSON.stringify(CANONICAL_NINE_CUSTOMER_ACTIONS);
  pass('nine_legacy_actions_match_source',sameNine(legacyActions));
  pass('nine_employee_dispatcher_actions_match_source',sameNine(employeeActions));
  pass('legacy_google_dependency_still_exists',
    legacy.includes('APPS_SCRIPT_API_URL')&&
    legacy.includes('script.google.com'));
  const config=sourceFiles['cloudflare-d1/wrangler.customer-stage.toml']||'';
  pass('independent_customer_stage_off',
    /TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED\s*=\s*"false"/.test(config));
  pass('no_public_customer_stage_url',
    /^workers_dev\s*=\s*false\s*$/m.test(config)&&
    /^preview_urls\s*=\s*false\s*$/m.test(config));
  pass('no_live_customer_stage_d1_r2_binding',
    !/\[\[\s*d1_databases\s*\]\]|\[\[\s*r2_buckets\s*\]\]/.test(config));
  const migration=sourceFiles['cloudflare-d1/migrations/0041_customer_private_scan_lease_replay_v0.sql']||'';
  pass('replay_table_immutable_pk',
    migration.includes('nonce_digest_hex TEXT PRIMARY KEY')&&
    migration.includes('BEFORE UPDATE')&&migration.includes('BEFORE DELETE'));
  const replay=sourceFiles['cloudflare-d1/customer-stage/private-scan-lease-replay-d1-internal-v0.mjs']||'';
  pass('replay_requires_explicit_off_by_default_flag',
    replay.includes("TRENDOS_CUSTOMER_PRIVATE_SCAN_REPLAY_D1_INTERNAL_V0_ENABLED!=='true'")&&
    replay.includes("SCAN_REPLAY_INTERNAL_OFF"));
  const issuer=sourceFiles['cloudflare-d1/customer-stage/private-scan-lease-issuer-internal-v0.mjs']||'';
  pass('issuer_explicit_off_by_default',
    issuer.includes("TRENDOS_CUSTOMER_PRIVATE_SCAN_LEASE_INTERNAL_V0_ENABLED!=='true'")&&
    issuer.includes('CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0'));
  const transport=sourceFiles['cloudflare-d1/customer-stage/private-scan-transport-envelope-internal-v0.mjs']||'';
  pass('transport_hmac_and_no_fetch',
    transport.includes("HMAC")&&transport.includes("allowSyntheticStage!==true")&&
    !/\bfetch\s*\(/.test(transport));
  const python=sourceFiles['tools/customer_private_scan_loopback_transport_off_v0.py']||'';
  pass('transport_loopback_test_only',
    python.includes('("127.0.0.1", 0)')&&
    python.includes('TRENDOS_PRIVATE_SCAN_LOOPBACK_TEST_ONLY')&&
    python.includes('synthetic_test_only is not True'));
  for(const [i,entry] of PRODUCTION_ENTRIES.entries()){
    const file=sourceFiles[entry]||'';
    pass('new_private_scan_modules_not_imported_in_entry_'+(i+1),
      REQUIRED_INTERNAL_MODULES.every(name=>!file.includes(name)));
  }
  const unsafe=Object.entries(check).filter(([,v])=>v!==true).map(([k])=>k);
  return Object.freeze({
    version:ZERO_GOOGLE_PRE_CLOUD_VERSION,
    auditMode:'READ_ONLY_SOURCE_STATIC_NO_NETWORK',
    status:unsafe.length?'SOURCE_HOLD_REVIEW_REQUIRED':'SOURCE_GUARDS_PASS_WAIT_FOR_CLOUDFLARE',
    sourceGuardsPassed:unsafe.length===0,
    failedChecks:unsafe,
    checks:check,
    canonicalNineCustomerGoogleActions:CANONICAL_NINE_CUSTOMER_ACTIONS,
    legacyActionsPresentInSource:legacyActions||[],
    customerActionsRetiredInProductionProven:0,
    liveProductionTrafficAudited:false,
    operationalAccessCase:'02394197',
    lastKnownControlledRay:'a52d02962ab3e1d0-MRS',
    remoteCloudflareAccessAuthenticated:false,
    remoteIsolatedStageDeployed:false,
    cloudflareUbuntuPrivateBytesTransportQualified:false,
    liveD1ReplayMigrationApplied:false,
    realCustomerFilesScanned:0,
    officialT12CustomerSubmitQualified:false,
    easystoreInvoiceTransactionParityQualified:false,
    productionGo:false,
    customerPrintReleaseAllowed:false,
    nativeGoogleCutoverAllowed:false,
    summary:'PASS means source guardrails only. No stage/prod approval or Google retirement.'
  });
}

const current=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(current){
  const root=path.resolve(process.argv[2]||process.cwd());
  const report=inspectZeroGooglePreCloudFreezeV0(root);
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
  if(!report.sourceGuardsPassed)process.exitCode=1;
}
