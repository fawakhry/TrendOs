/* AP-134: source-only eligibility gate for owner-provided iMac12,1.
 * NO destructive OS install, local hardware/network access, disk read or customer operation.
 */
export const AP134_VERSION='AP134_IMAC_LOCAL_PILOT_V1';
const forbidden=['wipeWithoutBackup','installOnWin7ShopMachine','openPublicSMB',
 'openPublicRDP','installOldVPNOnWin7','useSMB1','copyCustomerOriginalsToServer',
 'mirrorEveryCustomerFolder','autoPrint','overwriteCustomerFiles',
 'assumeProductionReady','deployProduction','writeProductionD1'];
function output(status,nextAction){
 return {version:AP134_VERSION,status,nextAction,
  provisionalHardwareCandidateOnly:true,
  verifiedImacModelByHardware:false,linuxBootTested:false,installedOSVerified:false,
  diskBackupVerified:false,hardwareHealthVerified:false,physicalShopLocationVerified:false,
  serverOnlineVerified:false,privateVPNVerified:false,smBConnectionVerified:false,
  originalCustomerFilesRead:false,originalCustomerFilesCopied:false,
  legacyShopHostModified:false,imacDiskErased:false,allJobsAutoMirrored:false,
  orderLinkedToRealFile:false,printAuthorized:false,productionDeploymentAllowed:false,
  customerFileOverwriteAllowed:false,ownerConsentForInstallRequired:true,
  noPublicSMB:true,noLegacyWindowsVPN:true};
}
export function evaluateImacServerPilotAP134V1(input={}){
 try{
  const d=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  if(forbidden.some(key=>d[key]===true))
   return output('BLOCK_UNSAFE_CHANGE','لا تحذف بيانات، أو تعدل جهاز Win7، أو تكشف خدمة ملفات للإنترنت.');
  if(d.modelIdentifier!=='iMac12,1')
   return output('HARDWARE_MODEL_UNCONFIRMED','تأكيد Model Identifier على الجهاز نفسه.');
  if(!Number.isFinite(d.ramGB)||d.ramGB<8||!Number.isFinite(d.ssdGB)||d.ssdGB<128)
   return output('PILOT_RESOURCES_UNVERIFIED','تحقق من وجود 8GB RAM و128GB SSD صالحة فعليًا.');
  if(d.purpose!=='VPN_AND_LIGHT_TRENDOS_SERVICES')
   return output('WORKLOAD_OUT_OF_PILOT_SCOPE','لا تستخدمه كأرشيف أصول العملاء أو للذكاء الاصطناعي الثقيل.');
  if(d.onPrintshopLAN===undefined)
   return output('ASK_IMAC_PHYSICAL_LOCATION','هل iMac موجود داخل المطبعة أم في البيت؟');
  if(d.onPrintshopLAN!==true)
   return output('SHOP_LAN_LOCATION_HOLD','يلزم وجود الجهاز في المطبعة على نفس الشبكة بكابل LAN.');
  if(d.ownerConfirmedExistingImacDataBackedUp!==true)
   return output('EXISTING_DISK_DATA_BACKUP_HOLD','انسخ أي ملفات مطلوبة من iMac قبل أي تجربة تثبيت.');
  if(d.ethernetLinkTested!==true)
   return output('WIRED_LAN_UNVERIFIED','اختبر اتصال Ethernet كابل بالراوتر دون تعديل جهاز الطباعة.');
  if(d.linuxBootNonDestructiveVerified!==true)
   return output('LINUX_BOOT_COMPATIBILITY_HOLD','اختبر إقلاع Ubuntu من USB بدون تثبيت أو مسح SSD.');
  if(d.ssdHealthGood!==true||d.thermalStabilityChecked!==true||
     d.powerRecoveryChecked!==true)
   return output('OLD_HARDWARE_HEALTH_HOLD','افحص SSD والحرارة والاستقرار والعودة بعد انقطاع الكهرباء.');
  if(d.separateBackupPlanApproved!==true)
   return output('OFF_DEVICE_BACKUP_REQUIRED','اعتمد نسخة احتياطية مستقلة؛ 128GB لن يحتوي أرشيف العملاء.');
  if(d.secureHomeEndpointQualified!==true)
   return output('HOME_ENDPOINT_SECURITY_HOLD','لا تفتح ملفات عملاء من Windows 10 LTSB غير مؤهل أمنيًا.');
  if(d.ownerApprovedDestructiveLinuxInstall!==true)
   return output('INSTALL_REQUIRES_EXPLICIT_OWNER_APPROVAL',
    'اطلب موافقة صريحة قبل تهيئة SSD أو استبدال نظام iMac.');
  return output('PROVISIONAL_IMAC_PILOT_CANDIDATE_SOURCE_ONLY',
   'بعد موافقة المالك جهز خطة تركيب ومراجعة مستقلة، وليس اتصالًا أو تثبيتًا فعليًا.');
 }catch{
  return output('INVALID_HARDWARE_INPUT_DENIED','لا تنفذ أي تعديل بناءً على مدخل غير صالح.');
 }
}
