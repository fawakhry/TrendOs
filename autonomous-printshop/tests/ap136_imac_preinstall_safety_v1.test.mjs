import assert from 'node:assert/strict';
import {planImacPreinstallAP136V1 as check,AP136_VERSION} from '../core/imac-preinstall-safety-v1.mjs';
const data={ownerConfirmedModel:'iMac12,1',ownerReportedSSDGB:128,ownerReportedRamGB:8,
 currentLocation:'HOME',ownerStatesNoImportantFiles:true,
 ownerWantsEraseAndReinstall:true,ownerDeclinesBackup:true};
const ready={usbStickCapacityGB:8,usbMayBeFullyErased:true,officialLinuxISOObtained:true,
 verifiedChecksum:true,usbWriterTargetVerified:true,ownerObservedTryUbuntuBoot:true,
 ownerCheckedImacDiskIdentityAtInstaller:true,lastMinuteOwnerEraseAuthorization:true};
const checks=['actualDiskContentsVerified','externalUsbCreated','usbContentsDeleted',
 'liveBootTested','linuxInstalled','diskPhysicallyIdentified','internalDiskErased',
 'printerDriversModified','shopWin7Touched','customerDataReadOrCopied',
 'remoteAccessConfigured','trendosServiceDeployed','d1Written','productionChanged',
 'printDispatchApproved'];
function expect(fields,status){
 const r=check({...data,...fields});
 assert.equal(r.version,AP136_VERSION);assert.equal(r.status,status);
 assert.equal(r.backupNotRequestedByOwner,true);
 for(const k of checks)assert.equal(r[k],false,k);
 assert.equal(r.lastMinuteEraseConfirmationRequired,true);
 assert.equal(r.perDeviceInstallerDiskReviewRequired,true);
 return r;
}
expect({},'ASK_ERASABLE_USB');
expect({ownerStatesNoImportantFiles:false},'OWNER_DATA_DECISION_REQUIRED');
expect({ownerDeclinesBackup:false},'OWNER_DATA_DECISION_REQUIRED');
expect({ownerWantsEraseAndReinstall:false},'OWNER_DATA_DECISION_REQUIRED');
expect({ownerReportedSSDGB:256},'REPORTED_IMAC_PROFILE_NOT_MATCHED');
expect({usbStickCapacityGB:4},'USB_CAPACITY_TOO_SMALL_OR_INVALID');
expect({usbStickCapacityGB:8},'USB_DATA_ERASE_NOT_APPROVED');
expect({...ready,usbMayBeFullyErased:false},'USB_DATA_ERASE_NOT_APPROVED');
expect({...ready,verifiedChecksum:false},'OFFICIAL_ISO_AND_CHECKSUM_REQUIRED');
expect({...ready,usbWriterTargetVerified:false},'USB_TARGET_IDENTITY_REQUIRED');
expect({...ready,ownerObservedTryUbuntuBoot:false},'NONDESTRUCTIVE_LIVE_BOOT_HOLD');
expect({...ready,ownerCheckedImacDiskIdentityAtInstaller:false},'INSTALLER_TARGET_IDENTITY_HOLD');
expect({...ready,lastMinuteOwnerEraseAuthorization:false},'ERASE_PENDING_FINAL_OWNER_DECISION');
expect(ready,'INSTALL_PRECHECK_REPORTED_ONLY_NO_DISK_WRITE');
for(const k of ['formatInternalDiskNow','wipeShopWin7','installOnPrintshopWin7',
  'createPublicSMB','disableFirmwareSecurity','useSMB1','enableOldWin7NetBird',
  'copyCustomerFiles','alterCustomerOrders','deployProduction','writeProductionD1',
  'autoAuthorizePrint']){
 expect({...ready,[k]:true},'BLOCK_UNSAFE_IMMEDIATE_CHANGE');
}
const secret='SENSITIVE_CUSTOMER_DATA_NOT_ECHOED';
const hostile={...data};
Object.defineProperty(hostile,'usbStickCapacityGB',{get(){throw Error(secret);}});
assert.equal(check(hostile).status,'MALFORMED_INPUT_BLOCKED');
const noLeak=expect({...ready,secretFile:secret},'INSTALL_PRECHECK_REPORTED_ONLY_NO_DISK_WRITE');
assert.ok(!JSON.stringify(noLeak).includes(secret));
console.log('AP136_OWNER_ACCEPTED_DATA_LOSS_WITH_NO_BACKUP=RECORDED');
console.log('AP136_USB_LIVE_BOOT_DISK_CONFIRMATION_TESTS=PASS');
console.log('AP136_REAL_ERASE_OR_INSTALL_OR_SHOP_WRITE=NOT_EXECUTED');
