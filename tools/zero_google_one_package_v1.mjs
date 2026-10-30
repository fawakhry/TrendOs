/**
 * TrendOS Zero Google ONE PACKAGE — unified OFFLINE release candidate audit.
 * No network, credentials, Cloudflare, Google, D1/R2 real data or deployments.
 *
 * Combines the previously independently verified source guards. A green audit
 * means the source tree is packaged safely; it NEVER authorizes cutover.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {inspectZeroGooglePreCloudFreezeV0} from './zero_google_precloud_freeze_audit_v0.mjs';
import {auditOperatorBook24RepositoryV0} from './zero_google_operator_book24_source_audit_off_v0.mjs';

export const ZERO_GOOGLE_ONE_PACKAGE_VERSION='TRENDOS_ZERO_GOOGLE_ONE_PACKAGE_V1_OFF_20261031';
const MANIFEST='packages/zero-google-one-package-v1/manifest.json';
const FAILED_RELEASE_GATES=Object.freeze([
  {id:'ZG-CF-01',owner:'Cloudflare support / account admin',need:'Exact-Ray Access vs Worker trace for case 02394197 and approved authenticated isolated Stage',ready:false},
  {id:'ZG-STAGE-02',owner:'TrendOS owner',need:'Owner-approved disposable Stage D1/DO/R2 + remote readback + rollback, zero live customer master changes',ready:false},
  {id:'ZG-SCAN-03',owner:'Printshop security owner',need:'Authenticated Cloudflare–Ubuntu private R2 bytes, real D1 nonce CAS, authoritative ClamAV signatures and signed verdict',ready:false},
  {id:'ZG-T12-04',owner:'Original T12 writer owner',need:'Official single-writer delegated multi-item+file handoff, immutable seal, lost ACK/idempotency reconciliation',ready:false},
  {id:'ZG-ACCOUNT-05',owner:'EasyStore finance owner',need:'Authenticated customer_id↔party_id, invoice/receipt statement exact identity and current signed financial parity',ready:false},
  {id:'ZG-BOOK24-06',owner:'Operator/Printshop owner',need:'Two original script-project inventory, real writer election/D1 epoch, no active tasks and rollback',ready:false},
  {id:'ZG-UI-07',owner:'Customer UI owner',need:'All nine legacy actions and five boot reads on original browser in approved real Stage, tenant+negative cases',ready:false},
  {id:'ZG-RELEASE-08',owner:'TrendOS owner',need:'Explicit canary, backups, monitoring and rollback approval before any Google/Apps Script retirement',ready:false}
]);
const safeRelative=(p)=>typeof p==='string'&&p.length>0&&
  !path.isAbsolute(p)&&(!p.startsWith('.')||p.startsWith('.github/workflows/'))&&
  !p.split('/').includes('..')&&
  !p.includes('\\')&&
  !/(^|\/)(\.env|\.git|node_modules|\.wrangler|secrets?|credentials?)(\/|\.|$)/i.test(p);
const parseJson=(s)=>JSON.parse(s);
export function inspectZeroGoogleOnePackageV1(root,options={}){
  const manifest=parseJson(fs.readFileSync(path.join(root,MANIFEST),'utf8'));
  const freeze=inspectZeroGooglePreCloudFreezeV0(root);
  const operator=auditOperatorBook24RepositoryV0(root);
  const allFiles=[...(manifest.sourceFiles||[]),...(manifest.packageFiles||[])];
  const failures=[];
  const fail=(condition,code)=>{if(!condition)failures.push(code);};
  fail(manifest.packageMode==='OFFLINE_INTEGRATION_CANDIDATE_NO_DEPLOY','PACKAGE_MODE_NOT_OFF');
  fail(manifest.productionActionsRetiredLastProven===0&&
    manifest.customerActionsTotal===9,'LEGACY_9_ROUTE_LIVE_STATUS_DRIFT');
  fail(manifest.customerLegacyActions.length===9&&
    JSON.stringify(manifest.customerLegacyActions)===
    JSON.stringify(freeze.canonicalNineCustomerGoogleActions),'CANONICAL_CUSTOMER_ACTION_DRIFT');
  fail(manifest.deploy===false&&manifest.merge===false&&manifest.sourceOnly===true,
    'PACKAGE_UNAUTHORIZED_DEPLOY_MODE');
  fail(manifest.officialT12OrderAuthorized===false&&
    manifest.financeWriteAuthorized===false&&
    manifest.printReleaseAuthorized===false&&
    manifest.liveGoogleTaskRetirementVerified===false,
    'PACKAGE_UNAUTHORIZED_ORDER_FINANCE_PRINT_OR_GOOGLE');
  fail(freeze.sourceGuardsPassed===true,'CUSTOMER_PRE_CLOUD_STATIC_SOURCE_GUARD_FAILED');
  fail(operator.sourceInventoryComplete===true,'OPERATOR_SIX_ROUTE_BOOK24_SOURCE_GUARD_FAILED');
  fail(operator.googleAppsScriptProxyStillInSource===true&&
    operator.stopAppsScriptNowAllowed===false,'BOOK24_GOOGLE_DISABLED_UNSAFELY');
  fail(FAILED_RELEASE_GATES.length===8&&
    FAILED_RELEASE_GATES.every(g=>g.ready===false),'LIVE_RELEASE_GATES_NOT_BLOCKED');
  fail(allFiles.length===new Set(allFiles).size,'PACKAGE_DUPLICATE_FILE');
  fail(allFiles.every(safeRelative),'PACKAGE_UNSAFE_FILE_PATH');
  for(const file of allFiles){
    if(!safeRelative(file))continue;
    let present=false;
    try {
      const stat=fs.lstatSync(path.join(root,file));
      present=stat.isFile()&&!stat.isSymbolicLink()&&stat.size<32*1024*1024;
    } catch {}
    if(!present)fail(false,'MISSING_OR_UNSAFE_SOURCE:'+file);
  }
  const stage=fs.readFileSync(path.join(root,'cloudflare-d1/customer-stage/index.mjs'),'utf8');
  const t12=fs.readFileSync(path.join(root,'cloudflare-d1/customer-stage/t12-draft-lossless-inventory-ro-internal-v0.mjs'),'utf8');
  const scan=fs.readFileSync(path.join(root,'tools/customer_private_scan_loopback_transport_off_v0.py'),'utf8');
  fail(!stage.includes('t12-draft-lossless-inventory-ro-internal-v0')&&
    !stage.includes('private-scan-transport-envelope-internal-v0'),
    'SOURCE_ONLY_MODULE_IMPORTED_IN_STAGE');
  fail(t12.includes('snapshotSealed:false')&&
    t12.includes('t12SingleWriterInvoked:false')&&
    t12.includes('printReleaseAuthorized:false'),
    'T12_AUDIT_NO_GO_FLAGS_MISSING');
  fail(scan.includes('TRENDOS_PRIVATE_SCAN_LOOPBACK_TEST_ONLY'),
    'LOOPBACK_SCANNER_TEST_ONLY_GUARD_MISSING');
  // Real finance-source verification is read-only SQLite, never real EasyStore.
  let finance;
  try {
    finance=parseJson(execFileSync(options.python||'python3',
      [path.join(root,'tools/zero_google_easystore_statement_source_audit_v0.py')],
      {encoding:'utf8',timeout:12000,env:{
        PATH:process.env.PATH||'/usr/bin:/bin',
        PYTHONIOENCODING:'utf-8'
      }}));
  }catch{fail(false,'FINANCE_SOURCE_SQLITE_AUDIT_UNAVAILABLE');}
  if(finance){
    fail(finance.existingBalanceExactIdSourceReady===true&&
      finance.statementSchemaExactIdentityReady===false&&
      finance.fullCustomerStatementAuthorized===false&&
      finance.financeWriteAuthorized===false&&
      finance.productionGo===false,
      'EASYSTORE_FINANCE_SOURCE_GAP_NOT_RECOGNIZED');
  }
  const sourceChecksPassed=failures.length===0;
  return {
    version:ZERO_GOOGLE_ONE_PACKAGE_VERSION,
    artifactMode:'SOURCE_AND_LOCAL_E2E_EVIDENCE_NOT_REMOTE_DEPLOYABLE',
    sourceChecksPassed,buildBundleAllowed:sourceChecksPassed,
    sourceFailures:failures,
    sourceFileCount:allFiles.length,
    legacyCustomerGoogleActions:manifest.customerLegacyActions,
    customerGoogleActionsRetiredInProductionLastProven:0,
    operatorGoogleRetiredLiveProven:false,
    realCloudflareUbuntuLinkQualified:false,
    realR2ClamavVendorScanQualified:false,
    officialT12OrderCreatedByThisPackage:false,
    t12FileHandoffQualified:false,
    financeCustomerStatementAuthorized:false,
    book24SingleWriterCertified:false,
    originalBrowserLiveCutoverQualified:false,
    productionDeploymentApproved:false,
    productionDeploymentPerformed:false,
    customerDataModified:false,
    printReleaseAllowed:false,
    appsScriptMayBeDisabled:false,
    zeroGoogleComplete:false,
    releaseDecision:'NO_GO_PENDING_EXTERNAL_AUTHORITIES_AND_LIVE_PARITY',
    releaseGates:FAILED_RELEASE_GATES,
    supportCase:'02394197',
    lastVerifiedAccessRay:'a52d02962ab3e1d0-MRS',
    sourceGuardDetails:{
      preCloud:freeze.sourceGuardsPassed,
      operatorRoutes:operator.exactOperatorRouteCount,
      operatorMutationRoutes:operator.sourceRoutes.filter(x=>x.mutation).length,
      financeExactIdBalanceSource:finance?.existingBalanceExactIdSourceReady===true,
      financeStatementIdentitySourceReady:finance?.statementSchemaExactIdentityReady===true
    }
  };
}
const current=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(current){
  const root=path.resolve(process.argv[2]||path.dirname(fileURLToPath(import.meta.url))+'/..');
  const report=inspectZeroGoogleOnePackageV1(root);
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
  if(!report.sourceChecksPassed)process.exitCode=1;
}
