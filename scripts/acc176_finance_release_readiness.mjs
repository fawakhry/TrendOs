// ACC-176 — source and public-GET-only release preflight, never a deploy authorizer.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const isZeroNumber=v=>typeof v==='number'&&Number.isFinite(v)&&v===0;
const EXACT_FRONTEND=[
 "window.EASYSTORE_ACCOUNTING_D1_READONLY = true;",
 "window.EASYSTORE_ACCOUNTING_D1_WRITES = false;",
 "window.EASYSTORE_ACCOUNTING_D1_WRITE_MODE = 'OFF';",
 "window.EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS = [];"
];
export function getReleaseSources(){
 return {
  wrangler:get('cloudflare-d1/wrangler.toml'),
  shadow:get('cloudflare-d1/production-shadow/index.js'),
  core:get('cloudflare-d1/src/index_v2.js'),
  accounting:get('cloudflare-d1/src/employee-accounting-native-v1.mjs'),
  manual:get('.github/workflows/easystore-a213-custody-close-canary-execution.yml'),
  existingDeploy:get('.github/workflows/easystore-a2-accounting-readonly-api-deploy.yml')
 };
}
export function evaluateAcc176({sources,health,config,app}){
 const c={};
 const mark=(label,condition)=>{c[label]=condition===true;};
 mark('entrypoint_points_to_original_worker',/^main\s*=\s*"production-shadow\/index\.js"\s*$/m.test(sources.wrangler)
   && /^database_name\s*=\s*"trendos-main"\s*$/m.test(sources.wrangler)
   && sources.shadow.includes("import core from '../src/index_v2.js'")
   && sources.shadow.includes('return core.fetch(request, env, ctx)')
   && sources.core.includes("import { handleEmployeeAccountingNativeRequest, isEmployeeAccountingNativePath } from './employee-accounting-native-v1.mjs'")
   && sources.core.includes('return handleEmployeeAccountingNativeRequest(request, env, ctx)'));
 mark('both_finance_sql_fixes_present',
   sources.accounting.includes("'payment_paid',?,?,-1")
   && sources.accounting.includes("VALUES(?,?,?,?,?,'HANDOFF',?,?,?,?,?,?)")
   && !sources.accounting.includes("VALUES(?,?,?,?,?,'HANDOFF',?,?,?,?,?,?,?)"));
 mark('owner_finance_roster_not_activated_in_checked_in_config',
   sources.accounting.includes("function approvedAccountingModeV1(env,verifiedUsername,user)")
   && sources.accounting.includes("if(!gate)return accountingMode(user)")
   && sources.accounting.includes("if(gate!=='ENFORCE')return 'none'")
   && !/^\s*ACCOUNTING_FINANCE_GRANTS_(?:MODE_V1|V1)\s*=/m.test(sources.wrangler));
 mark('a213_execution_remains_manual_with_published_boot_prearm',
   /^on:\s*\n\s*workflow_dispatch:\s*$/m.test(sources.manual)
   && /permissions:\s*\n\s*contents:\s*read/.test(sources.manual)
   && sources.manual.includes('node --check /tmp/app.js')
   && sources.manual.includes('node tests/easystore_a213_published_boot_gate.test.mjs /tmp/config.js /tmp/app.js --expect-canary')
   && sources.manual.indexOf('node tests/easystore_a213_published_boot_gate.test.mjs /tmp/config.js /tmp/app.js --expect-canary') <
      sources.manual.indexOf('      - name: Arm one zero-balance Custody Close command'));
 mark('published_frontend_off',typeof config==='string'&&EXACT_FRONTEND.every(x=>config.split(x).length===2));
 mark('published_app_is_a213_bootstrap_candidate',typeof app==='string'
    && app.split('  let a213PilotServerReady=false;').length===2
    && app.indexOf('  let a213PilotServerReady=false;')<app.indexOf('  const state = {')
    && app.includes('function a213PilotHealthAllowsOneCommand(h)'));
 mark('public_server_readonly',health?.success===true&&health?.schemaReady===true&&health?.mode==='READONLY'
    && health?.authoritativeWrites===false && health?.writeCanaryReady===true
    && isZeroNumber(health?.googleBusinessCalls));
 mark('public_server_all_canary_allowances_zeroed',
    ['writeCanaryAllowedUserCount','writeCanaryAllowedActionCount',
     'writeCanaryExpiresAtMs','writeCanaryMaxAmount',
     'writeCanaryMaxCommands','writeCanaryCommandsStarted'].every(k=>isZeroNumber(health?.[k])));
 mark('old_release_job_not_version_pinned',
   sources.existingDeploy.includes('git merge --no-edit FETCH_HEAD')
   && sources.existingDeploy.includes('wrangler deploy --config')
   && sources.existingDeploy.includes('wrangler rollback'));
 const blockers=[
  'Owner-approved authenticated finance role matrix / issue #40 absent',
  'Authoritative signed opening balances and cutover reconciliation absent',
  'Independent verified restorable, access-controlled D1 backup not evidenced',
  'Exact production Worker deployment version and merged shared-base artifact not pinned for release',
  'Fresh one-command A2.13 real custody acceptance not completed',
  'Live end-to-end employee finance transaction acceptance not completed',
  'Real emergency rollback / recovery drill not completed',
  'Explicit owner-signed production release and migration approval absent'
 ];
 return {
  schema:'ACC176_FINANCE_RELEASE_READONLY_PREFLIGHT_V1',
  worker_source_sha256:hash(sources.accounting),
  checks:c,
  public_safe_idle_checks_passed:Object.entries(c).filter(([k])=>k!=='old_release_job_not_version_pinned').every(([,v])=>v),
  deployment_artifact_locked:false,
  backup_verified:false,
  real_financial_transactions_authorized:false,
  approved_staff_grants_activated:false,
  release_blockers:blockers,
  release_decision:'NO_GO',
  workflow_execution:'GET_AND_OFFLINE_ONLY',
  production_mutations:0
 };
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [healthFile,configFile,appFile,outFile]=process.argv.slice(2);
 if(!healthFile||!configFile||!appFile||!outFile){
   console.error('ACC176_ARGS_REQUIRED health.json config.js app.js report.json');
   process.exitCode=2;
 }else{
   try{
    const report=evaluateAcc176({
     sources:getReleaseSources(),
     health:JSON.parse(fs.readFileSync(healthFile,'utf8')),
     config:fs.readFileSync(configFile,'utf8'),
     app:fs.readFileSync(appFile,'utf8')
    });
    fs.mkdirSync(path.dirname(outFile),{recursive:true});
    fs.writeFileSync(outFile,JSON.stringify(report,null,2)+'\n','utf8');
    for(const [k,v] of Object.entries(report.checks))console.log('ACC176_'+k.toUpperCase()+'='+(v?'PASS':'FAIL'));
    console.log('ACC176_PUBLIC_SAFE_IDLE='+ (report.public_safe_idle_checks_passed?'PASS':'FAIL'));
    console.log('ACC176_RELEASE_DECISION=NO_GO');
    console.log('ACC176_PRODUCTION_MUTATIONS=ZERO');
    if(!report.public_safe_idle_checks_passed)process.exitCode=1;
   }catch(e){console.error('ACC176_INPUT_OR_PREFLIGHT_FAILED='+String(e.message));process.exitCode=1;}
 }
}
