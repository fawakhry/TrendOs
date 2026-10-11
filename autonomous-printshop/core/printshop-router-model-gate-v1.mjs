/* AP-133 — source-only exact router model / security gate for shop Windows 7.
 * No hardware detection, VPN, router setting, filesystem, SMB or client data I/O.
 */
export const AP133_ROUTER_GATE_VERSION='AP133_ROUTER_MODEL_GATE_V1';
const forbidden=['installLegacyNetBirdOnWin7','publicWanSMB','publicWanRDP','publicWanFTP',
 'enableSMB1','permitGuestSMB','permitEveryoneSMB','shareEntireDisk',
 'unrestrictedVPNLAN','usePPTP','enableUPnPForSMB','flashUnofficialFirmware',
 'exposeCustomerOriginals','autoMirrorAllJobs','allowActiveFileOverwrite',
 'allowRemoteDelete','modifyPrintDrivers','modifyCustomerFiles','deployProduction'];
const reply=(status,nextOwnerStep,candidate='NONE')=>({
 version:AP133_ROUTER_GATE_VERSION,status,candidate,nextOwnerStep,
 routerHardwareDetected:false,routerModelAuthenticated:false,
 routerFirmwareOrWireGuardVerified:false,routerConfigured:false,
 directSMBInternetAllowed:false,unsupportedWindowsVPNAllowed:false,
 smbv1Allowed:false,wholeLanExposed:false,
 win7NetworkShareConfigured:false,win7ShareRootApproved:false,
 privateVPNConnected:false,homeEndpointAttested:false,
 actualShopFilesRead:false,actualShopFilesWritten:false,
 customerPathOrCredentialsExposed:false,realUploadDownloadVerified:false,
 remoteOverwriteOrDeleteAllowed:false,productionDeploymentAllowed:false,
 printDispatchAllowed:false,ownerOnsiteApprovalRequired:true
});
const generic=new Set(['router','modem','we','vodafone','orange','etisalat','zte',
 'huawei','tp-link','tplink','d-link','dlink','asus','tenda','netgear','راوتر','مودم']);
function exactModel(raw){
 if(typeof raw!=='string'||raw.length>96)return false;
 const s=raw.trim().replace(/\s+/g,' ');
 if(s.length<3||generic.has(s.toLowerCase()))return false;
 if(!/^[A-Za-z0-9\u0600-\u06FF][A-Za-z0-9\u0600-\u06FF ._()+\/-]{1,95}$/u.test(s))return false;
 if(/(password|passphrase|ssid|serial|admin|token|private\s*key|wifi\s*key)/i.test(s))return false;
 return true;
}
export function assessShopRouterAP133V1(input={}){
 try{
  const d=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  if(forbidden.some(k=>d[k]===true))return reply('BLOCK_UNSAFE_NETWORK_CHANGE',
    'لا تنفذ إعدادات تعرض Windows 7 أو ملفات العملاء.');
  if(d.shopOS!=='WINDOWS_7_X64')return reply('LEGACY_SHOP_OS_NOT_CONFIRMED',
    'تأكيد نظام جهاز المطبعة.');
  if(d.modernGatewayPresent!==false)return reply('NO_ALTERNATE_PC_DECISION_REQUIRED',
    'أكد عدم وجود جهاز وسيط حديث داخل المطبعة.');
  if(d.routerModelLabel===undefined||d.routerModelLabel===null||d.routerModelLabel==='')
    return reply('ASK_PHYSICAL_ROUTER_MODEL','اقرأ الشركة والموديل من ملصق الراوتر فقط، بدون باسورد أو سيريال.');
  if(!exactModel(d.routerModelLabel))return reply('EXACT_ROUTER_MODEL_REQUIRED',
    'اكتب رقم موديل الراوتر الكامل وليس اسم الشركة أو شبكة Wi-Fi.');
  // Model input is never returned. Claims below require separate human/vendor review.
  if(d.vendorModelDocsReviewed!==true)return reply('OFFICIAL_MODEL_CAPABILITY_RESEARCH_REQUIRED',
    'مطابقة الموديل مع مستندات الشركة وإصدار الهاردوير.');
  if(d.wireGuardServerDocumented===false)return reply('ROUTER_NATIVE_WIREGUARD_UNSUPPORTED',
    'قارن راوتر حديثًا أو بوابة Linux صغيرة، بدون PPTP أو فتح SMB.','NEW_GATEWAY_REVIEW');
  if(d.wireGuardServerDocumented!==true)return reply('WIREGUARD_SERVER_SUPPORT_NOT_PROVEN',
    'التحقق من WireGuard Server لهذا الموديل والهاردوير تحديدًا.');
  if(d.vendorSecurityFirmwareMaintained!==true)return reply('ROUTER_FIRMWARE_SUPPORT_HOLD',
    'التحقق من إصدار الفيرموير المدعوم والتحديثات الأمنية الرسمية.');
  if(d.cgnatConfirmed===true)return reply('DIRECT_INBOUND_VPN_CGNAT_BLOCKED',
    'راجع مزود الإنترنت أو بوابة باتصال صادر.','ALTERNATIVE_REVIEW');
  if(d.externalVPNReachabilityVerified!==true)return reply('VPN_WAN_REACHABILITY_NOT_VERIFIED',
    'فحص قابلية اتصال VPN من خارج المطبعة دون كشف Win7 للإنترنت.');
  if(d.routerRestrictsToSingleWin7Tcp445!==true)
    return reply('ROUTER_PER_HOST_PORT_FILTER_NOT_PROVEN',
      'إثبات حصر الوصول في عنوان جهاز الطباعة المحلي والمنفذ TCP 445 فقط.');
  if(d.win7SMB2Confirmed!==true||d.shopShareScopeAndACLReviewed!==true)
    return reply('WIN7_SMB2_SHARE_AND_ACL_HOLD',
      'مراجعة SMB2+ والفولدر المسموح وحساب محدود وصلاحيات NTFS والمشاركة.');
  if(d.homeSupportedPatchedVPNClient!==true)
    return reply('HOME_ENDPOINT_SECURITY_HOLD',
      'تأهيل جهاز البيت بنظام وتحديثات وعميل VPN مدعوم قبل ملفات العملاء.');
  if(d.ownerApprovedRouterAndShareChanges!==true)
    return reply('OWNER_EXPLICIT_SETUP_APPROVAL_REQUIRED',
      'طلب موافقة صريحة قبل أي تغيير في الراوتر أو مشاركة Windows.');
  return reply('ROUTER_CANDIDATE_SOURCE_ONLY_NOT_CONNECTED',
    'تقييم نظري فقط؛ لا توجد وصلة VPN أو SMB فعلية ولا إذن تلقائي للطباعة.');
 }catch{
  return reply('MALFORMED_ROUTER_INPUT_BLOCKED',
    'مدخل غير قابل للتحقق؛ لا تُجرِ تغييرًا على شبكة المطبعة.');
 }
}
