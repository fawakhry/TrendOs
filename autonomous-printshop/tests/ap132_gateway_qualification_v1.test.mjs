import assert from 'node:assert/strict';
import {AP132_GATEWAY_REVIEW_VERSION,planShopGatewayAP132V1 as plan}
  from '../core/printshop-gateway-qualification-v1.mjs';
import {planRemoteWorkFolderTransferV1} from '../core/printshop-remote-work-folder-policy-v1.mjs';
const base={shopOS:'WINDOWS_7_X64'};
function check(data,status,candidate='NONE'){
  const x=plan({...base,...data});
  assert.equal(x.version,AP132_GATEWAY_REVIEW_VERSION);
  assert.equal(x.status,status);assert.equal(x.candidate,candidate);
  for(const k of ['realGatewayDiscoveredByCode','actualWin7ShareChecked',
    'physicalNetworkVerified','vpnConnectionVerified','smbConnectionVerified',
    'realUploadDownloadTested','businessPlanOrLicenseVerified',
    'shareOrFirewallChanged','customerFilesReadOrWritten','customerIdentityOrPathDisclosed',
    'publicSMBAllowed','directWin7VPNClientAllowed','smbV1Allowed',
    'overwriteOrDeleteAllowed','productionDeploymentAllowed','realOrderPrintAllowed'])
    assert.equal(x[k],false,k);
  assert.equal(x.ownerConfigurationApprovalRequired,true);
  return x;
}
check({},'ASK_EXISTING_SHOP_GATEWAY');
check({shopOS:'WINDOWS_10'},'SHOP_OS_ATTESTATION_REQUIRED');
check({modernGatewayPresent:'yes'},'GATEWAY_ANSWER_INVALID');
check({modernGatewayPresent:false},'ASK_ROUTER_MODEL');
check({modernGatewayPresent:false,routerModelKnown:false},'ROUTER_MODEL_UNKNOWN');
check({modernGatewayPresent:false,routerModelKnown:true,routerWireGuardSupported:false},
  'PLAN_SUPPORTED_LINUX_GATEWAY','NEW_GATEWAY');
check({modernGatewayPresent:false,routerModelKnown:true,routerWireGuardSupported:true},
  'ROUTER_WIREGUARD_REVIEW','ROUTER');
check({modernGatewayPresent:false,routerModelKnown:true,routerWireGuardSupported:true,
  routerFirmwareCurrent:true,routerRestrictsToWin7Tcp445:true,routerRemoteReachabilityChecked:true},
  'ROUTER_GATEWAY_CANDIDATE_ONLY','ROUTER');
check({modernGatewayPresent:true,gatewayOS:'WINDOWS_7'},'MODERN_GATEWAY_OS_NOT_QUALIFIED');
check({modernGatewayPresent:true,gatewayOS:'LINUX_SUPPORTED'},
  'MODERN_GATEWAY_SECURITY_REVIEW','MODERN_PC');
const modern={modernGatewayPresent:true,gatewayOS:'LINUX_SUPPORTED',gatewayCurrentPatches:true,
  sameShopLAN:true,alwaysPowered:true,currentVPNRoutingSupported:true,
  scopeRouteToWin7Tcp445:true};
const c=check(modern,'MODERN_PC_GATEWAY_CANDIDATE_ONLY','MODERN_PC');
assert.equal(c.homeEndpointGate,'HOME_1607_PATCH_AND_SUPPORT_HOLD');
assert.equal(check({...modern,homeSupportedPatched:true,homeVPNClientCompatible:true},
  'MODERN_PC_GATEWAY_CANDIDATE_ONLY','MODERN_PC').homeEndpointGate,
  'REPORTED_READY_REQUIRES_INDEPENDENT_VERIFICATION');
for(const unsafe of ['directWin7VPNClient','openPublicSMB','openPublicRDP',
  'openPublicFTP','requireSMBv1','shareWholeDisk','allowGuestOrEveryone',
  'mirrorAllCustomerFiles','allowRemoteOverwrite','allowRemoteDelete',
  'changePrintDrivers','deployProduction']){
  check({...modern,[unsafe]:true},'REJECT_UNSAFE_LEGACY_EXPOSURE');
}
const privateMarker='SECRET_CUSTOMER_NAME_OR_PASSWORD_NEVER_ECHO';
const hostile={...base};Object.defineProperty(hostile,'modernGatewayPresent',
  {get(){throw Error(privateMarker)}});
assert.equal(plan(hostile).status,'MALFORMED_GATEWAY_INPUT_DENIED');
const noLeak=check({...modern,routerModel:privateMarker,customer:privateMarker,
  path:'D:\\\\PRIVATE\\\\'+privateMarker},'MODERN_PC_GATEWAY_CANDIDATE_ONLY','MODERN_PC');
assert.ok(!JSON.stringify(noLeak).includes(privateMarker));
assert.ok(!JSON.stringify(noLeak).includes('D:'));
const existing=planRemoteWorkFolderTransferV1({
 workDay:'2026-10-10',workArea:'ديجتال',workLayout:'MONTH_TOODAY_DAY',
 operation:'BROWSE',shopMachineOnline:true,encryptedPrivateNetworkConnected:true,
 protectedDeviceIdentityAttested:true,ownerAccessAttested:true,
 shareRestrictedToWorkRoot:true,windowsShareCredentialRequired:true
});
assert.equal(existing.safeRelativeDayArea,'10-2026\\\\Tooday\\\\10-10\\\\ديجتال');
assert.equal(existing.fileOperationPerformed,false);
console.log('AP132_GATEWAY_ROUTER_DISCOVERY_FAIL_CLOSED=PASS');
console.log('AP132_WIN7_WAN_SMBV1_AND_OVERWRITE_REJECTED=PASS');
console.log('AP132_HOME_ENDPOINT_HOLD_AND_NO_REAL_ACCESS=PASS');
