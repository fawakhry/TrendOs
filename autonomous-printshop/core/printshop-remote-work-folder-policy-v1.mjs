/* AP-129 — Windows printshop day folders: private remote folder-selector contract.
 * SOURCE_ONLY. Does not mount SMB, join NetBird, inspect local disks or transfer.
 * The shop PC remains the authoritative home for customer files.
 */
export const REMOTE_WORK_FOLDER_VERSION='AP129_REMOTE_WORK_FOLDER_V1';
const AREAS=new Set(['ديجتال','فوتو']);
const OPS=new Set(['BROWSE','DOWNLOAD','UPLOAD']);
const text=v=>typeof v==='string'?v.trim():'';

export function normalizeWorkDayFolderV1(raw){
  const v=text(raw);
  let year,month,day;
  if(/^\d{4}-\d{2}-\d{2}$/.test(v)){
    [year,month,day]=v.split('-').map(Number);
  }else if(/^\d{1,2}-\d{1,2}-\d{4}$/.test(v)){
    [day,month,year]=v.split('-').map(Number);
  }else return '';
  if(year<2000||year>2100)return '';
  const dt=new Date(Date.UTC(year,month-1,day));
  if(dt.getUTCFullYear()!==year||dt.getUTCMonth()+1!==month||
    dt.getUTCDate()!==day)return '';
  return day+'-'+month+'-'+year;
}
function result(state,dayFolder='',area=''){
  return {
    version:REMOTE_WORK_FOLDER_VERSION,status:state,
    dayFolder,areaFolder:area,
    safeRelativeDayArea:dayFolder&&area?dayFolder+'\\'+area:'',
    shareIsPrintshopLocalOnly:true,
    remoteAccessVerifiedByThisModule:false,
    businessLicenseVerifiedByThisModule:false,
    userIdentityVerifiedByThisModule:false,
    customerSubfolderExposed:false,
    localDriveRootExposed:false,
    filenameOrCustomerPIIExposed:false,
    fileOperationPerformed:false,
    overwriteAllowed:false,
    deleteAllowed:false,
    renameAllowed:false,
    printDispatchAllowed:false,
    productionWriteAllowed:false
  };
}
export function planRemoteWorkFolderTransferV1(input={}){
  try{
    const data=input&&typeof input==='object'?input:{};
    const day=normalizeWorkDayFolderV1(data.workDay);
    const area=text(data.workArea);
    const operation=text(data.operation);
    if(!day)return result('DAY_FOLDER_INVALID');
    if(!AREAS.has(area))return result('WORK_AREA_UNVERIFIED');
    if(!OPS.has(operation))return result('OPERATION_NOT_SUPPORTED',day,area);
    if(data.shopMachineOnline!==true||data.encryptedPrivateNetworkConnected!==true)
      return result('PRINTSHOP_PRIVATE_NETWORK_NOT_CONNECTED',day,area);
    if(data.protectedDeviceIdentityAttested!==true||
       data.ownerAccessAttested!==true)
      return result('PROTECTED_ACCESS_NOT_ATTESTED',day,area);
    if(data.shareRestrictedToWorkRoot!==true||
       data.windowsShareCredentialRequired!==true)
      return result('WINDOWS_SHARE_SCOPE_NOT_ATTESTED',day,area);
    if(operation==='UPLOAD'&&data.noOverwriteConfirmed!==true)
      return result('UPLOAD_CONFLICT_POLICY_REQUIRED',day,area);
    // Host assertions above are not independent authentication.
    // Actual SMB/NetBird setup and ACLs must be verified on both PCs.
    return result('PRIVATE_MANUAL_TRANSFER_SETUP_REVIEW',day,area);
  }catch{return result('REMOTE_FOLDER_INPUT_UNVERIFIED');}
}
