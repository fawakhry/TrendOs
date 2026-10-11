/* AP-136 — owner's explicit iMac wipe intent, still pre-install / zero I/O.
 * Pure contract: owner declaration of no valuable files is not a verified empty disk.
 */
export const AP136_VERSION='AP136_IMAC_PREINSTALL_SAFETY_V1';
const forbidden=['formatInternalDiskNow','wipeShopWin7','installOnPrintshopWin7',
  'createPublicSMB','disableFirmwareSecurity','useSMB1','enableOldWin7NetBird',
  'copyCustomerFiles','alterCustomerOrders','deployProduction','writeProductionD1',
  'autoAuthorizePrint'];
const result=(status,nextAction)=>({
 version:AP136_VERSION,status,nextAction,
 iMacOwnerDataDisposition:'NO_IMPORTANT_FILES_AND_WIPE_INTENT_OWNER_REPORTED',
 backupNotRequestedByOwner:true,
 actualDiskContentsVerified:false,
 externalUsbCreated:false,usbContentsDeleted:false,
 liveBootTested:false,linuxInstalled:false,
 diskPhysicallyIdentified:false,internalDiskErased:false,
 printerDriversModified:false,shopWin7Touched:false,
 customerDataReadOrCopied:false,remoteAccessConfigured:false,
 trendosServiceDeployed:false,d1Written:false,productionChanged:false,
 printDispatchApproved:false,
 perDeviceInstallerDiskReviewRequired:true,
 lastMinuteEraseConfirmationRequired:true
});
export function planImacPreinstallAP136V1(input={}){
 try{
  const d=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  if(forbidden.some(k=>d[k]===true))return result('BLOCK_UNSAFE_IMMEDIATE_CHANGE',
    'لا تمسح القرص الآن ولا تغيّر Windows 7 أو الإنتاج.');
  if(d.ownerConfirmedModel!=='iMac12,1'||d.ownerReportedSSDGB!==128||
     d.ownerReportedRamGB!==8||d.currentLocation!=='HOME')
    return result('REPORTED_IMAC_PROFILE_NOT_MATCHED',
      'اعتمد فقط بيانات جهاز iMac12,1 الموجود في البيت.');
  if(d.ownerStatesNoImportantFiles!==true||d.ownerWantsEraseAndReinstall!==true||
     d.ownerDeclinesBackup!==true)
    return result('OWNER_DATA_DECISION_REQUIRED',
      'تأكيد قرار المالك بعدم الحاجة للنسخة وبقبول مسح بيانات iMac.');
  if(d.usbStickCapacityGB===undefined)return result('ASK_ERASABLE_USB',
    'هل معاك فلاشة فاضية 8 جيجا أو أكبر؟');
  if(!Number.isSafeInteger(d.usbStickCapacityGB)||d.usbStickCapacityGB<8)
    return result('USB_CAPACITY_TOO_SMALL_OR_INVALID',
      'جهّز فلاشة 8 جيجا أو أكبر.');
  if(d.usbMayBeFullyErased!==true)return result('USB_DATA_ERASE_NOT_APPROVED',
    'لا تجهز الفلاشة إلا إذا كانت بياناتها غير مهمة ومسموح بمسحها.');
  if(d.officialLinuxISOObtained!==true||d.verifiedChecksum!==true)
    return result('OFFICIAL_ISO_AND_CHECKSUM_REQUIRED',
      'نزّل ISO رسمي وتحقق من بصمته قبل إنشاء الفلاشة.');
  if(d.usbWriterTargetVerified!==true)
    return result('USB_TARGET_IDENTITY_REQUIRED',
      'راجع أن أداة إعداد الفلاشة اختارت الفلاشة فقط وليس SSD آخر.');
  if(d.ownerObservedTryUbuntuBoot!==true)
    return result('NONDESTRUCTIVE_LIVE_BOOT_HOLD',
      'اختبر Try Ubuntu قبل أي تثبيت أو مسح.');
  if(d.ownerCheckedImacDiskIdentityAtInstaller!==true)
    return result('INSTALLER_TARGET_IDENTITY_HOLD',
      'راجع اسم وسعة قرص iMac الداخلي عند شاشة التثبيت قبل الموافقة على المسح.');
  if(d.lastMinuteOwnerEraseAuthorization!==true)
    return result('ERASE_PENDING_FINAL_OWNER_DECISION',
      'قبل الضغط على Install أو Erase Disk راجع البيانات المستهدفة ثم أكد.');
  return result('INSTALL_PRECHECK_REPORTED_ONLY_NO_DISK_WRITE',
    'التحقق النظري فقط، التنفيذ المادي يظل مسئولية المالك بعد مراجعة القرص.');
 }catch{return result('MALFORMED_INPUT_BLOCKED',
  'بيانات غير قابلة للتحقق، لا تلمس الأقراص.');
 }
}
