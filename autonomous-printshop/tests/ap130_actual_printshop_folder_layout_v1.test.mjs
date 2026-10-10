import assert from 'node:assert/strict';
import {planRemoteWorkFolderTransferV1 as plan}
  from '../core/printshop-remote-work-folder-policy-v1.mjs';
// Owner supplied nested path: D:\print\الشغل\10-2026\Tooday\10-10.
// The D:\...\work root is NOT emitted by the selector. No disk or SMB I/O.
const privateValue='CLIENT_PRIVATE_PATH_AND_NAME_NOT_EXPOSED';
const base={
  workDay:'2026-10-10',workArea:'ديجتال',workLayout:'MONTH_TOODAY_DAY',
  operation:'BROWSE',shopMachineOnline:true,
  encryptedPrivateNetworkConnected:true,
  protectedDeviceIdentityAttested:true,ownerAccessAttested:true,
  shareRestrictedToWorkRoot:true,windowsShareCredentialRequired:true,
  noOverwriteConfirmed:true,
  privateCustomerSubdir:privateValue,
  actualWindowsWorkRoot:'D:\\print\\الشغل'
};
function check(input,expected){
  const r=plan({...base,...input});
  assert.equal(r.status,expected);
  assert.equal(r.fileOperationPerformed,false);
  assert.equal(r.remoteAccessVerifiedByThisModule,false);
  assert.equal(r.productionWriteAllowed,false);
  assert.equal(r.overwriteAllowed,false);
  assert.equal(r.deleteAllowed,false);
  assert.equal(r.customerSubfolderExposed,false);
  assert.equal(r.localDriveRootExposed,false);
  assert.ok(!JSON.stringify(r).includes(privateValue));
  assert.ok(!JSON.stringify(r).includes('D:\\'));
  return r;
}
let x=check({},'PRIVATE_MANUAL_TRANSFER_SETUP_REVIEW');
assert.equal(x.workLayout,'MONTH_TOODAY_DAY');
assert.equal(x.dayFolder,'10-10-2026');
assert.equal(x.safeRelativeDayArea,'10-2026\\Tooday\\10-10\\ديجتال');
x=check({workArea:'فوتو',operation:'DOWNLOAD'},'PRIVATE_MANUAL_TRANSFER_SETUP_REVIEW');
assert.equal(x.safeRelativeDayArea,'10-2026\\Tooday\\10-10\\فوتو');
x=check({workDay:'2026-11-05'},'PRIVATE_MANUAL_TRANSFER_SETUP_REVIEW');
assert.equal(x.safeRelativeDayArea,'11-2026\\Tooday\\5-11\\ديجتال');
x=check({workLayout:'FLAT_DAY'},'PRIVATE_MANUAL_TRANSFER_SETUP_REVIEW');
assert.equal(x.safeRelativeDayArea,'10-10-2026\\ديجتال');
x=check({workLayout:'FLAT_DAY',workArea:'فوتو'},'PRIVATE_MANUAL_TRANSFER_SETUP_REVIEW');
assert.equal(x.safeRelativeDayArea,'10-10-2026\\فوتو');
check({workLayout:'MONTH\\..\\BAD'},'WORK_LAYOUT_UNVERIFIED');
check({workDay:'2026-02-30'},'DAY_FOLDER_INVALID');
check({workDay:'10-10'},'DAY_FOLDER_INVALID');
check({workArea:'../فوتو'},'WORK_AREA_UNVERIFIED');
check({operation:'UPLOAD',noOverwriteConfirmed:false},'UPLOAD_CONFLICT_POLICY_REQUIRED');
check({operation:'UPLOAD'},'PRIVATE_MANUAL_TRANSFER_SETUP_REVIEW');
check({operation:'DELETE'},'OPERATION_NOT_SUPPORTED');
check({shopMachineOnline:false},'PRINTSHOP_PRIVATE_NETWORK_NOT_CONNECTED');
check({shareRestrictedToWorkRoot:false},'WINDOWS_SHARE_SCOPE_NOT_ATTESTED');
const hostile={...base};
Object.defineProperty(hostile,'workLayout',{get(){throw new Error(privateValue);}});
const denied=plan(hostile);
assert.equal(denied.status,'REMOTE_FOLDER_INPUT_UNVERIFIED');
assert.ok(!JSON.stringify(denied).includes(privateValue));
console.log('AP130_ACTUAL_MONTH_TOODAY_SHORT_DAY_LAYOUT=PASS');
console.log('AP130_LEGACY_FLAT_FOLDER_RETAINED=PASS');
console.log('AP130_NO_WINDOWS_DISK_OR_SHARE_WRITES=PASS');
console.log('AP130_REAL_SHOP_PC_PATH_EXISTS=NOT_CHECKED');
