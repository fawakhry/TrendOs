import assert from 'node:assert/strict';
import {normalizeWorkDayFolderV1,planRemoteWorkFolderTransferV1 as plan}
  from '../core/printshop-remote-work-folder-policy-v1.mjs';
const secret='CLIENT_PRIVATE_PHONE_01000000000';
assert.equal(normalizeWorkDayFolderV1('2026-01-01'),'1-1-2026');
assert.equal(normalizeWorkDayFolderV1('1-1-2026'),'1-1-2026');
assert.equal(normalizeWorkDayFolderV1('01-01-2026'),'1-1-2026');
for(const bad of ['1-1-20226','2026-02-30','29-2-2025',
  '../1-1-2026','C:\\work','../../secret','',null]){
 assert.equal(normalizeWorkDayFolderV1(bad),'');
}
const base={
  workDay:'2026-10-10',workArea:'ديجتال',operation:'BROWSE',
  shopMachineOnline:true,encryptedPrivateNetworkConnected:true,
  protectedDeviceIdentityAttested:true,ownerAccessAttested:true,
  shareRestrictedToWorkRoot:true,windowsShareCredentialRequired:true,
  noOverwriteConfirmed:true,
  customerName:secret,customerSubfolder:secret,
  physicalRoot:'D:\\'+secret
};
const check=(data,state)=>{
  const result=plan({...base,...data});
  assert.equal(result.status,state);
  assert.equal(result.fileOperationPerformed,false);
  assert.equal(result.remoteAccessVerifiedByThisModule,false);
  assert.equal(result.userIdentityVerifiedByThisModule,false);
  assert.equal(result.productionWriteAllowed,false);
  assert.equal(result.deleteAllowed,false);
  assert.equal(result.overwriteAllowed,false);
  assert.equal(result.printDispatchAllowed,false);
  assert.equal(JSON.stringify(result).includes(secret),false);
  assert.equal(JSON.stringify(result).includes('D:\\'),false);
  return result;
};
let out=check({},'PRIVATE_MANUAL_TRANSFER_SETUP_REVIEW');
assert.equal(out.safeRelativeDayArea,'10-10-2026\\ديجتال');
assert.equal(out.shareIsPrintshopLocalOnly,true);
out=check({workArea:'فوتو',operation:'DOWNLOAD'},'PRIVATE_MANUAL_TRANSFER_SETUP_REVIEW');
assert.equal(out.safeRelativeDayArea,'10-10-2026\\فوتو');
check({operation:'UPLOAD'},'PRIVATE_MANUAL_TRANSFER_SETUP_REVIEW');
check({operation:'UPLOAD',noOverwriteConfirmed:false},'UPLOAD_CONFLICT_POLICY_REQUIRED');
check({operation:'DELETE'},'OPERATION_NOT_SUPPORTED');
check({operation:'RENAME'},'OPERATION_NOT_SUPPORTED');
check({operation:'OVERWRITE'},'OPERATION_NOT_SUPPORTED');
check({workArea:'OTHER'},'WORK_AREA_UNVERIFIED');
check({shopMachineOnline:false},'PRINTSHOP_PRIVATE_NETWORK_NOT_CONNECTED');
check({encryptedPrivateNetworkConnected:false},'PRINTSHOP_PRIVATE_NETWORK_NOT_CONNECTED');
check({ownerAccessAttested:false},'PROTECTED_ACCESS_NOT_ATTESTED');
check({protectedDeviceIdentityAttested:false},'PROTECTED_ACCESS_NOT_ATTESTED');
check({shareRestrictedToWorkRoot:false},'WINDOWS_SHARE_SCOPE_NOT_ATTESTED');
check({windowsShareCredentialRequired:false},'WINDOWS_SHARE_SCOPE_NOT_ATTESTED');
check({workDay:'2026-02-30'},'DAY_FOLDER_INVALID');
check({workDay:'..\\secret'},'DAY_FOLDER_INVALID');
check({get workDay(){throw new Error(secret);}},'REMOTE_FOLDER_INPUT_UNVERIFIED');
console.log('AP129_REMOTE_WORK_FOLDER_DAY_DIGITAL_PHOTO=PASS');
console.log('AP129_REMOTE_BROWSE_DOWNLOAD_UPLOAD_PLAN_ONLY=PASS');
console.log('AP129_NO_SMB_OR_NETWORK_OPERATION_NO_CUSTOMER_PII=PASS');
console.log('AP129_PRODUCTION_DEPLOY=NO; LOCAL_FILES_TOUCHED=0');
