import assert from 'node:assert/strict';
import {planImacRelocationAP135V1 as plan,AP135_RELOCATION_VERSION}
  from '../core/imac-home-to-shop-relocation-v1.mjs';
import {evaluateImacServerPilotAP134V1}
  from '../core/imac-local-server-pilot-v1.mjs';
const base={modelIdentifier:'iMac12,1',ramGB:8,ssdGB:128,startingLocation:'HOME'};
const full={importantFilesChecked:true,importantFilesPresent:true,
 existingImportantFilesBackedUp:true,ownerCanUnlockCurrentOS:true,
 imacShutDownFully:true,paddedTransportAndCablesReady:true,
 shopPowerAndEthernetSpaceConfirmed:true,ownerReportsArrivedAtShop:true,
 shopWiredNetworkLinkObserved:true,nondestructiveLinuxLiveUSBChecked:true,
 ssdHealthAndThermalsReviewed:true,powerRecoveryReviewed:true};
const inert=[
 'physicallyInspectedByModule','deviceMovedByModule','deviceArrivedAtShopVerified',
 'installedOperatingSystemVerified','importantDataBackupVerifiedByModule',
 'externalDriveOrUSBWritten','imacInternalDiskModified','linuxInstalled',
 'routerOrShopWin7Changed','actualEthernetLinkVerified','vpnConnected',
 'smbShareConnected','customerDataAccessed','originalCustomerFilesMoved',
 'customerFilesOverwritten','trendosLocalServiceDeployed','productionD1Written',
 'printDispatchAuthorized'
];
function expect(over,status,stage='HOME_PREFLIGHT'){
 const out=plan({...base,...over});
 assert.equal(out.version,AP135_RELOCATION_VERSION);
 assert.equal(out.status,status);
 assert.equal(out.stage,stage);
 assert.equal(out.ownerReportedStartingLocation,'HOME');
 assert.equal(out.explicitOwnerApprovalNeededForInstall,true);
 for(const k of inert)assert.equal(out[k],false,k);
 return out;
}
expect({},'ASK_IMPORTANT_FILES_BEFORE_MOVE');
expect({startingLocation:'SHOP'},'START_LOCATION_NOT_OWNER_CONFIRMED');
expect({ramGB:16},'REPORTED_HARDWARE_PROFILE_MISMATCH');
expect({importantFilesChecked:true},'IMPORTANT_FILES_ANSWER_REQUIRED');
expect({importantFilesChecked:true,importantFilesPresent:true},
 'EXISTING_DATA_BACKUP_HOLD');
expect({importantFilesChecked:true,importantFilesPresent:false},
 'CURRENT_OS_ACCESS_HOLD');
expect({...full,ownerCanUnlockCurrentOS:false},'CURRENT_OS_ACCESS_HOLD');
expect({...full,imacShutDownFully:false},'SAFE_SHUTDOWN_REQUIRED');
expect({...full,paddedTransportAndCablesReady:false},
 'PHYSICAL_TRANSPORT_PROTECTION_REQUIRED');
expect({...full,shopPowerAndEthernetSpaceConfirmed:false},
 'SHOP_POWER_ETHERNET_SITE_HOLD');
expect({...full,ownerReportsArrivedAtShop:false},
 'MOVE_OWNER_ACTION_REQUIRED');
expect({...full,shopWiredNetworkLinkObserved:false},
 'SHOP_ETHERNET_OBSERVATION_REQUIRED','SHOP_NONDESTRUCTIVE_CHECK');
expect({...full,nondestructiveLinuxLiveUSBChecked:false},
 'LINUX_LIVE_USB_TEST_REQUIRED','SHOP_NONDESTRUCTIVE_CHECK');
expect({...full,ssdHealthAndThermalsReviewed:false},
 'OLD_IMAC_RELIABILITY_HOLD','SHOP_NONDESTRUCTIVE_CHECK');
expect({...full,powerRecoveryReviewed:false},
 'OLD_IMAC_RELIABILITY_HOLD','SHOP_NONDESTRUCTIVE_CHECK');
expect(full,'RELOCATION_CHECKLIST_REPORTED_COMPLETE_NO_LIVE_AUTHORITY','SHOP_NONDESTRUCTIVE_CHECK');
for(const k of [
 'eraseImacInternalSSD','installLinuxNow','formatExistingDisk',
 'moveWhilePowered','unplugDuringOperation','factoryResetShopRouter',
 'modifyWin7Drivers','installNetBirdOnWin7','exposePublicSMB','useSMB1',
 'shareEntireWin7Disk','autoMirrorCustomerOriginals','writeProductionD1',
 'deployProduction','dispatchRealPrint'
])expect({...full,[k]:true},'UNSAFE_CHANGE_BLOCKED');
const secret='SECRET_CUSTOMER_OR_MAC_DISK_FILE';
const hostile={...base};
Object.defineProperty(hostile,'importantFilesChecked',{get(){throw Error(secret);}});
assert.equal(plan(hostile).status,'MALFORMED_RELOCATION_INPUT_DENIED');
const output=expect({...full,privateFileName:secret},
 'RELOCATION_CHECKLIST_REPORTED_COMPLETE_NO_LIVE_AUTHORITY','SHOP_NONDESTRUCTIVE_CHECK');
assert.ok(!JSON.stringify(output).includes(secret));
// AP-134 current location gate cannot be bypassed by AP-135's source-only report.
const previous=evaluateImacServerPilotAP134V1({
 modelIdentifier:'iMac12,1',ramGB:8,ssdGB:128,
 purpose:'VPN_AND_LIGHT_TRENDOS_SERVICES',onPrintshopLAN:false
});
assert.equal(previous.status,'SHOP_LAN_LOCATION_HOLD');
assert.equal(previous.privateVPNVerified,false);
console.log('AP135_HOME_TO_SHOP_DATA_BACKUP_AND_SAFE_TRANSPORT_GATES=PASS');
console.log('AP135_NONDESTRUCTIVE_USB_AND_NO_INSTALL_NO_WIN7_CHANGE=PASS');
console.log('AP135_REAL_SHOP_CONNECTIVITY_OR_CUSTOMER_FILE_ACCESS=NOT_EXECUTED');
