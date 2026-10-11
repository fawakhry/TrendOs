import assert from 'node:assert/strict';
import {assessShopRouterAP133V1 as assess,AP133_ROUTER_GATE_VERSION}
 from '../core/printshop-router-model-gate-v1.mjs';
import {planRemoteWorkFolderTransferV1}
 from '../core/printshop-remote-work-folder-policy-v1.mjs';
const base={shopOS:'WINDOWS_7_X64',modernGatewayPresent:false};
const model='ZXHN H168N'; // Synthetic label, NEVER a VPN compatibility claim
const eligible={routerModelLabel:model,vendorModelDocsReviewed:true,
 wireGuardServerDocumented:true,vendorSecurityFirmwareMaintained:true,
 externalVPNReachabilityVerified:true,routerRestrictsToSingleWin7Tcp445:true,
 win7SMB2Confirmed:true,shopShareScopeAndACLReviewed:true,
 homeSupportedPatchedVPNClient:true,ownerApprovedRouterAndShareChanges:true};
function expect(extra,status,candidate='NONE'){
 const out=assess({...base,...extra});
 assert.equal(out.version,AP133_ROUTER_GATE_VERSION);
 assert.equal(out.status,status);assert.equal(out.candidate,candidate);
 for(const k of ['routerHardwareDetected','routerModelAuthenticated',
  'routerFirmwareOrWireGuardVerified','routerConfigured','directSMBInternetAllowed',
  'unsupportedWindowsVPNAllowed','smbv1Allowed','wholeLanExposed',
  'win7NetworkShareConfigured','win7ShareRootApproved','privateVPNConnected',
  'homeEndpointAttested','actualShopFilesRead','actualShopFilesWritten',
  'customerPathOrCredentialsExposed','realUploadDownloadVerified',
  'remoteOverwriteOrDeleteAllowed','productionDeploymentAllowed','printDispatchAllowed'])
  assert.equal(out[k],false,k);
 assert.equal(out.ownerOnsiteApprovalRequired,true);
 return out;
}
expect({},'ASK_PHYSICAL_ROUTER_MODEL');
expect({routerModelLabel:'WE'},'EXACT_ROUTER_MODEL_REQUIRED');
expect({routerModelLabel:'TP-Link'},'EXACT_ROUTER_MODEL_REQUIRED');
expect({routerModelLabel:'password=secret'},'EXACT_ROUTER_MODEL_REQUIRED');
expect({routerModelLabel:'http://router.example'},'EXACT_ROUTER_MODEL_REQUIRED');
expect({routerModelLabel:'HG633'},'OFFICIAL_MODEL_CAPABILITY_RESEARCH_REQUIRED');
expect({routerModelLabel:model},'OFFICIAL_MODEL_CAPABILITY_RESEARCH_REQUIRED');
expect({...eligible,wireGuardServerDocumented:undefined},'WIREGUARD_SERVER_SUPPORT_NOT_PROVEN');
expect({...eligible,wireGuardServerDocumented:false},'ROUTER_NATIVE_WIREGUARD_UNSUPPORTED','NEW_GATEWAY_REVIEW');
expect({...eligible,vendorSecurityFirmwareMaintained:false},'ROUTER_FIRMWARE_SUPPORT_HOLD');
expect({...eligible,cgnatConfirmed:true},'DIRECT_INBOUND_VPN_CGNAT_BLOCKED','ALTERNATIVE_REVIEW');
expect({...eligible,externalVPNReachabilityVerified:false},'VPN_WAN_REACHABILITY_NOT_VERIFIED');
expect({...eligible,routerRestrictsToSingleWin7Tcp445:false},'ROUTER_PER_HOST_PORT_FILTER_NOT_PROVEN');
expect({...eligible,win7SMB2Confirmed:false},'WIN7_SMB2_SHARE_AND_ACL_HOLD');
expect({...eligible,shopShareScopeAndACLReviewed:false},'WIN7_SMB2_SHARE_AND_ACL_HOLD');
expect({...eligible,homeSupportedPatchedVPNClient:false},'HOME_ENDPOINT_SECURITY_HOLD');
expect({...eligible,ownerApprovedRouterAndShareChanges:false},'OWNER_EXPLICIT_SETUP_APPROVAL_REQUIRED');
expect(eligible,'ROUTER_CANDIDATE_SOURCE_ONLY_NOT_CONNECTED');
expect({shopOS:'WINDOWS_10'},'LEGACY_SHOP_OS_NOT_CONFIRMED');
expect({modernGatewayPresent:true},'NO_ALTERNATE_PC_DECISION_REQUIRED');
for(const key of ['installLegacyNetBirdOnWin7','publicWanSMB','publicWanRDP','publicWanFTP',
 'enableSMB1','permitGuestSMB','permitEveryoneSMB','shareEntireDisk','unrestrictedVPNLAN',
 'usePPTP','enableUPnPForSMB','flashUnofficialFirmware','exposeCustomerOriginals',
 'autoMirrorAllJobs','allowActiveFileOverwrite','allowRemoteDelete',
 'modifyPrintDrivers','modifyCustomerFiles','deployProduction'])
 expect({...eligible,[key]:true},'BLOCK_UNSAFE_NETWORK_CHANGE');
const secret='SECRET_CUSTOMER_PATH_OR_PASSWORD';
const hostile={...base};
Object.defineProperty(hostile,'routerModelLabel',{get(){throw Error(secret);}});
assert.equal(assess(hostile).status,'MALFORMED_ROUTER_INPUT_BLOCKED');
const out=expect({...eligible,routerAdminPassword:secret,customerPath:secret},
 'ROUTER_CANDIDATE_SOURCE_ONLY_NOT_CONNECTED');
assert.ok(!JSON.stringify(out).includes(secret));
assert.ok(!JSON.stringify(out).includes(model));
const x=planRemoteWorkFolderTransferV1({
 workDay:'2026-10-10',workArea:'فوتو',workLayout:'MONTH_TOODAY_DAY',
 operation:'BROWSE',shopMachineOnline:true,encryptedPrivateNetworkConnected:true,
 protectedDeviceIdentityAttested:true,ownerAccessAttested:true,
 shareRestrictedToWorkRoot:true,windowsShareCredentialRequired:true
});
assert.equal(x.safeRelativeDayArea,'10-2026\\Tooday\\10-10\\فوتو');
assert.equal(x.remoteAccessVerifiedByThisModule,false);
console.log('AP133_MODEL_INTAKE_AND_FAILCLOSED_ROUTER_GATES=PASS');
console.log('AP133_SMB_WAN_CGNAT_HOME_AND_OWNER_PROTECTIONS=PASS');
console.log('AP133_REAL_REMOTE_ACCESS=NOT_EXECUTED');
