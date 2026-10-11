import assert from 'node:assert/strict';
import {evaluateImacServerPilotAP134V1 as evalPlan,AP134_VERSION}
  from '../core/imac-local-server-pilot-v1.mjs';
const base={modelIdentifier:'iMac12,1',ramGB:8,ssdGB:128,
 purpose:'VPN_AND_LIGHT_TRENDOS_SERVICES'};
const reported={onPrintshopLAN:true,ownerConfirmedExistingImacDataBackedUp:true,
 ethernetLinkTested:true,linuxBootNonDestructiveVerified:true,ssdHealthGood:true,
 thermalStabilityChecked:true,powerRecoveryChecked:true,separateBackupPlanApproved:true,
 secureHomeEndpointQualified:true,ownerApprovedDestructiveLinuxInstall:true};
function check(fields,status){
 const v=evalPlan({...base,...fields});
 assert.equal(v.version,AP134_VERSION);assert.equal(v.status,status);
 for(const k of ['verifiedImacModelByHardware','linuxBootTested','installedOSVerified',
  'diskBackupVerified','hardwareHealthVerified','physicalShopLocationVerified',
  'serverOnlineVerified','privateVPNVerified','smBConnectionVerified',
  'originalCustomerFilesRead','originalCustomerFilesCopied','legacyShopHostModified',
  'imacDiskErased','allJobsAutoMirrored','orderLinkedToRealFile',
  'printAuthorized','productionDeploymentAllowed','customerFileOverwriteAllowed'])
   assert.equal(v[k],false,k);
 assert.equal(v.ownerConsentForInstallRequired,true);
 assert.equal(v.noPublicSMB,true);assert.equal(v.noLegacyWindowsVPN,true);
 return v;
}
check({},'ASK_IMAC_PHYSICAL_LOCATION');
check({modelIdentifier:'iMac18,1'},'HARDWARE_MODEL_UNCONFIRMED');
check({ramGB:4},'PILOT_RESOURCES_UNVERIFIED');
check({ssdGB:64},'PILOT_RESOURCES_UNVERIFIED');
check({purpose:'LOCAL_GPU_IMAGE_AI'},'WORKLOAD_OUT_OF_PILOT_SCOPE');
check({onPrintshopLAN:false},'SHOP_LAN_LOCATION_HOLD');
check({onPrintshopLAN:true},'EXISTING_DISK_DATA_BACKUP_HOLD');
check({...reported,ownerConfirmedExistingImacDataBackedUp:false},'EXISTING_DISK_DATA_BACKUP_HOLD');
check({...reported,ethernetLinkTested:false},'WIRED_LAN_UNVERIFIED');
check({...reported,linuxBootNonDestructiveVerified:false},'LINUX_BOOT_COMPATIBILITY_HOLD');
check({...reported,ssdHealthGood:false},'OLD_HARDWARE_HEALTH_HOLD');
check({...reported,thermalStabilityChecked:false},'OLD_HARDWARE_HEALTH_HOLD');
check({...reported,powerRecoveryChecked:false},'OLD_HARDWARE_HEALTH_HOLD');
check({...reported,separateBackupPlanApproved:false},'OFF_DEVICE_BACKUP_REQUIRED');
check({...reported,secureHomeEndpointQualified:false},'HOME_ENDPOINT_SECURITY_HOLD');
check({...reported,ownerApprovedDestructiveLinuxInstall:false},
 'INSTALL_REQUIRES_EXPLICIT_OWNER_APPROVAL');
check(reported,'PROVISIONAL_IMAC_PILOT_CANDIDATE_SOURCE_ONLY');
for(const key of ['wipeWithoutBackup','installOnWin7ShopMachine','openPublicSMB',
 'openPublicRDP','installOldVPNOnWin7','useSMB1','copyCustomerOriginalsToServer',
 'mirrorEveryCustomerFolder','autoPrint','overwriteCustomerFiles','assumeProductionReady',
 'deployProduction','writeProductionD1']){
 check({...reported,[key]:true},'BLOCK_UNSAFE_CHANGE');
}
const privateValue='customer-SECRET-imac-path';
const hostile={...base};
Object.defineProperty(hostile,'onPrintshopLAN',{get(){throw Error(privateValue)}});
assert.equal(evalPlan(hostile).status,'INVALID_HARDWARE_INPUT_DENIED');
const r=check({...reported,privateDiskFileNames:privateValue},
 'PROVISIONAL_IMAC_PILOT_CANDIDATE_SOURCE_ONLY');
assert.ok(!JSON.stringify(r).includes(privateValue));
console.log('AP134_IMAC12_1_8GB_128GB_LIGHT_GATEWAY_PILOT=PASS');
console.log('AP134_BACKUP_BOOT_HEALTH_HOME_AND_OWNER_APPROVAL_GATES=PASS');
console.log('AP134_LEGACY_WIN7_AND_CUSTOMER_ORIGINALS=UNTOUCHED');
