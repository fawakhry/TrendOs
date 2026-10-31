import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectZeroGoogleOnePackageV1 as inspect} from '../tools/zero_google_one_package_v1.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('one integrated snapshot includes real legacy nine routes and all prior source audits',()=>{
  const x=inspect(ROOT);
  assert.equal(x.sourceChecksPassed,true,JSON.stringify(x.sourceFailures));
  assert.equal(x.sourceFileCount>50,true);
  assert.equal(x.legacyCustomerGoogleActions.length,9);
  assert.equal(x.customerGoogleActionsRetiredInProductionLastProven,0);
  assert.equal(x.sourceGuardDetails.preCloud,true);
  assert.equal(x.sourceGuardDetails.operatorRoutes,6);
  assert.equal(x.sourceGuardDetails.operatorMutationRoutes,2);
  assert.equal(x.sourceGuardDetails.financeExactIdBalanceSource,true);
  assert.equal(x.sourceGuardDetails.financeStatementIdentitySourceReady,false);
  assert.equal(x.buildBundleAllowed,true);
});
test('integrated source success NEVER authorizes live Cloudflare, finance, T12 or Printshop',()=>{
  const x=inspect(ROOT);
  for(const flag of [
    'realCloudflareUbuntuLinkQualified','realR2ClamavVendorScanQualified',
    'officialT12OrderCreatedByThisPackage','t12FileHandoffQualified',
    'financeCustomerStatementAuthorized','book24SingleWriterCertified',
    'originalBrowserLiveCutoverQualified','productionDeploymentApproved',
    'productionDeploymentPerformed','customerDataModified','printReleaseAllowed',
    'appsScriptMayBeDisabled','zeroGoogleComplete','operatorGoogleRetiredLiveProven'
  ])assert.equal(x[flag],false,flag);
  assert.equal(x.releaseDecision,'NO_GO_PENDING_EXTERNAL_AUTHORITIES_AND_LIVE_PARITY');
  assert.equal(x.releaseGates.length,8);
  assert.ok(x.releaseGates.every(g=>g.ready===false));
});
test('frozen nine-action Google dependency and six-operator-task routes are separate scopes',()=>{
  const x=inspect(ROOT);
  assert.deepEqual(x.legacyCustomerGoogleActions,[
    'customerLogin','customerLogout','changeCustomerPassword','getCustomerOrders',
    'getCustomerPortalAccountsV1859','createCustomerDraft','addCustomerDraftItem',
    'submitCustomerDraft','uploadCustomerDraftFile'
  ]);
  assert.equal(x.sourceGuardDetails.operatorRoutes,6);
  assert.equal(x.supportCase,'02394197');
});
test('all manifest files are concrete allowlisted repository sources, not secrets or network',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,
    'packages/zero-google-one-package-v1/manifest.json'),'utf8'));
  const files=[...manifest.sourceFiles,...manifest.packageFiles];
  assert.equal(files.length,new Set(files).size);
  for(const file of files){
    assert.equal(file.startsWith('/'),false,file);
    assert.equal(file.includes('..'),false,file);
    assert.equal(file.includes('.env'),false,file);
    assert.equal(file.includes('node_modules'),false,file);
    assert.equal(fs.statSync(path.join(ROOT,file)).isFile(),true,file);
  }
  assert.equal(manifest.deploy,false);
  assert.equal(manifest.merge,false);
  assert.equal(manifest.sourceOnly,true);
  assert.equal(manifest.printReleaseAuthorized,false);
});
