/* AP-135 — owner-reported iMac12,1 currently at HOME: relocation preflight.
 * Offline planning ONLY. No file, network, disk, system, VPN or hardware I/O.
 * Owner declarations are never independent proof; no installation is authorized.
 */
export const AP135_RELOCATION_VERSION='AP135_IMAC_HOME_TO_SHOP_RELOCATION_V1';
const FORBIDDEN=[
 'eraseImacInternalSSD','installLinuxNow','formatExistingDisk',
 'moveWhilePowered','unplugDuringOperation','factoryResetShopRouter',
 'modifyWin7Drivers','installNetBirdOnWin7','exposePublicSMB',
 'useSMB1','shareEntireWin7Disk','autoMirrorCustomerOriginals',
 'writeProductionD1','deployProduction','dispatchRealPrint'
];
function reply(status,nextOwnerAction,stage='HOME_PREFLIGHT'){
 return {
  version:AP135_RELOCATION_VERSION,status,stage,nextOwnerAction,
  ownerReportedStartingLocation:'HOME',
  physicallyInspectedByModule:false,
  deviceMovedByModule:false,
  deviceArrivedAtShopVerified:false,
  installedOperatingSystemVerified:false,
  importantDataBackupVerifiedByModule:false,
  externalDriveOrUSBWritten:false,
  imacInternalDiskModified:false,
  linuxInstalled:false,
  routerOrShopWin7Changed:false,
  actualEthernetLinkVerified:false,
  vpnConnected:false,
  smbShareConnected:false,
  customerDataAccessed:false,
  originalCustomerFilesMoved:false,
  customerFilesOverwritten:false,
  trendosLocalServiceDeployed:false,
  productionD1Written:false,
  printDispatchAuthorized:false,
  explicitOwnerApprovalNeededForInstall:true
 };
}
export function planImacRelocationAP135V1(input={}){
 try{
  const d=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  if(FORBIDDEN.some(k=>d[k]===true))
   return reply('UNSAFE_CHANGE_BLOCKED',
     'ممنوع مسح أو تثبيت أو تغيير جهاز الطباعة خلال مرحلة النقل.');
  if(d.modelIdentifier!=='iMac12,1'||d.ramGB!==8||d.ssdGB!==128)
   return reply('REPORTED_HARDWARE_PROFILE_MISMATCH',
     'راجع موديل وذاكرة وسعة iMac؛ لا تفترض مواصفات مختلفة.');
  if(d.startingLocation!=='HOME')
   return reply('START_LOCATION_NOT_OWNER_CONFIRMED',
     'المعلومة المؤكدة أن الجهاز في البيت، ولا تفترض أنه وصل المطبعة.');
  if(d.importantFilesChecked!==true)
   return reply('ASK_IMPORTANT_FILES_BEFORE_MOVE',
     'شغّل iMac في البيت وقل هل عليه ملفات مهمة تحتاج الاحتفاظ بها؟');
  if(d.importantFilesPresent!==true&&d.importantFilesPresent!==false)
   return reply('IMPORTANT_FILES_ANSWER_REQUIRED',
     'حدد هل توجد ملفات مهمة: نعم أو لا.');
  if(d.importantFilesPresent===true&&d.existingImportantFilesBackedUp!==true)
   return reply('EXISTING_DATA_BACKUP_HOLD',
     'انسخ الملفات المهمة لوسيط منفصل وتأكد من إمكانية فتح النسخة قبل أي نقل أو تجارب.');
  if(d.ownerCanUnlockCurrentOS!==true)
   return reply('CURRENT_OS_ACCESS_HOLD',
     'تحقق من إمكانية فتح النظام الحالي بشكل طبيعي بدون مشاركة كلمات مرور.');
  if(d.imacShutDownFully!==true)
   return reply('SAFE_SHUTDOWN_REQUIRED',
     'أوقف تشغيل الجهاز بالكامل قبل فك الكهرباء والكابلات.');
  if(d.paddedTransportAndCablesReady!==true)
   return reply('PHYSICAL_TRANSPORT_PROTECTION_REQUIRED',
     'جهز تغليف الشاشة والحامل والكابلات بعيدًا عن الضغط والصدمات.');
  if(d.shopPowerAndEthernetSpaceConfirmed!==true)
   return reply('SHOP_POWER_ETHERNET_SITE_HOLD',
     'تأكد من وجود مقبس كهرباء آمن ومنفذ LAN وكابل ومكان تهوية بالمطبعة.');
  if(d.ownerReportsArrivedAtShop!==true)
   return reply('MOVE_OWNER_ACTION_REQUIRED',
     'بعد حماية البيانات والتجهيز انقل الجهاز للمطبعة وهو مطفأ.');
  if(d.shopWiredNetworkLinkObserved!==true)
   return reply('SHOP_ETHERNET_OBSERVATION_REQUIRED',
     'اختبر اتصال LAN من جهاز iMac فقط، دون تغيير الراوتر أو جهاز Windows 7.','SHOP_NONDESTRUCTIVE_CHECK');
  if(d.nondestructiveLinuxLiveUSBChecked!==true)
   return reply('LINUX_LIVE_USB_TEST_REQUIRED',
     'اختبر Try Ubuntu من USB دون اختيار Install ودون الكتابة على SSD الداخلي.','SHOP_NONDESTRUCTIVE_CHECK');
  if(d.ssdHealthAndThermalsReviewed!==true||d.powerRecoveryReviewed!==true)
   return reply('OLD_IMAC_RELIABILITY_HOLD',
     'راجع صحة SSD والحرارة والاستقرار قبل وضع خدمات تعمل 24/7.','SHOP_NONDESTRUCTIVE_CHECK');
  return reply('RELOCATION_CHECKLIST_REPORTED_COMPLETE_NO_LIVE_AUTHORITY',
    'تجهيز النقل مُبلّغ عنه فقط؛ تثبيت Linux أو تشغيل VPN يتطلب مراجعة وموافقة منفصلتين.',
    'SHOP_NONDESTRUCTIVE_CHECK');
 }catch{
  return reply('MALFORMED_RELOCATION_INPUT_DENIED',
    'تعذر التحقق من البيانات؛ لا تغير النظام أو الملفات.');
 }
}
