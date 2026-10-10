/* AP-132 — source-only gateway/router discovery for legacy Windows 7 printshop.
 * Does NOT inspect physical networks, install VPN, mount SMB, open files or authorize transfers.
 * User assertions below are NOT independent security attestations.
 */
export const AP132_GATEWAY_REVIEW_VERSION='AP132_GATEWAY_REVIEW_V1';

export function planShopGatewayAP132V1(input={}){
  const output=(status,candidate,nextOwnerAction,homeEndpointGate='NOT_ATTESTED')=>({
    version:AP132_GATEWAY_REVIEW_VERSION,
    status,candidate,nextOwnerAction,homeEndpointGate,
    realGatewayDiscoveredByCode:false,
    actualWin7ShareChecked:false,
    physicalNetworkVerified:false,
    vpnConnectionVerified:false,
    smbConnectionVerified:false,
    realUploadDownloadTested:false,
    businessPlanOrLicenseVerified:false,
    shareOrFirewallChanged:false,
    customerFilesReadOrWritten:false,
    customerOriginalsPreservedByDesign:true,
    customerIdentityOrPathDisclosed:false,
    publicSMBAllowed:false,
    directWin7VPNClientAllowed:false,
    smbV1Allowed:false,
    overwriteOrDeleteAllowed:false,
    productionDeploymentAllowed:false,
    realOrderPrintAllowed:false,
    ownerConfigurationApprovalRequired:true
  });
  try {
    const d=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
    // Any attempted WAN SMB/RDP, obsolete Win7 client or broad data exposure is an unconditional STOP.
    const bad=['directWin7VPNClient','openPublicSMB','openPublicRDP','openPublicFTP',
      'requireSMBv1','shareWholeDisk','allowGuestOrEveryone','mirrorAllCustomerFiles',
      'allowRemoteOverwrite','allowRemoteDelete','changePrintDrivers','deployProduction'];
    if(bad.some(k=>d[k]===true))
      return output('REJECT_UNSAFE_LEGACY_EXPOSURE','NONE',
        'لا تنفذ التغيير غير الآمن؛ أبقِ Windows 7 والملفات الأصلية كما هي.');
    if(d.shopOS!=='WINDOWS_7_X64')
      return output('SHOP_OS_ATTESTATION_REQUIRED','NONE',
        'تأكيد نظام جهاز المطبعة قبل اختيار البوابة.');
    if(d.modernGatewayPresent===undefined)
      return output('ASK_EXISTING_SHOP_GATEWAY','NONE',
        'هل يوجد داخل المطبعة جهاز Windows حديث ومدعوم أو Linux، على نفس الراوتر ويظل شغال؟');
    if(typeof d.modernGatewayPresent!=='boolean')
      return output('GATEWAY_ANSWER_INVALID','NONE','حدد وجود جهاز وسيط: نعم أو لا فقط.');
    const homeGate=d.homeSupportedPatched===true&&d.homeVPNClientCompatible===true
      ? 'REPORTED_READY_REQUIRES_INDEPENDENT_VERIFICATION'
      : 'HOME_1607_PATCH_AND_SUPPORT_HOLD';
    if(d.modernGatewayPresent===true){
      if(!['WINDOWS_10_SUPPORTED','WINDOWS_11_SUPPORTED','LINUX_SUPPORTED'].includes(d.gatewayOS))
        return output('MODERN_GATEWAY_OS_NOT_QUALIFIED','NONE',
          'حدد نظام الجهاز الوسيط الآخر، بدون أي كلمات مرور.',homeGate);
      if(d.gatewayCurrentPatches!==true||d.sameShopLAN!==true||d.alwaysPowered!==true||
         d.currentVPNRoutingSupported!==true||d.scopeRouteToWin7Tcp445!==true)
        return output('MODERN_GATEWAY_SECURITY_REVIEW','MODERN_PC',
          'راجع تحديثات الجهاز الوسيط، وجوده على شبكة المطبعة، وإمكان حصر المسار في SMB فقط.',homeGate);
      return output('MODERN_PC_GATEWAY_CANDIDATE_ONLY','MODERN_PC',
        'راجع إعداد البوابة وACL محليًا بعد موافقة المالك، ولا تستخدم ملفات العملاء بعد.',homeGate);
    }
    if(d.routerModelKnown===undefined)
      return output('ASK_ROUTER_MODEL','NONE',
        'اكتب موديل راوتر المطبعة الموجود على الملصق، بدون باسورد أو بيانات دخول.',homeGate);
    if(typeof d.routerModelKnown!=='boolean')
      return output('ROUTER_ANSWER_INVALID','NONE','أكد معرفة موديل الراوتر: نعم أو لا.',homeGate);
    if(d.routerModelKnown===false)
      return output('ROUTER_MODEL_UNKNOWN','NONE',
        'اقرأ موديل راوتر المطبعة من الملصق فقط، بدون تصوير كلمة السر.',homeGate);
    if(d.routerWireGuardSupported===false)
      return output('PLAN_SUPPORTED_LINUX_GATEWAY','NEW_GATEWAY',
        'الراوتر غير مناسب؛ راجع تكلفة جهاز Linux صغير حديث ومدعوم.',homeGate);
    if(d.routerWireGuardSupported!==true||d.routerFirmwareCurrent!==true||
       d.routerRestrictsToWin7Tcp445!==true||d.routerRemoteReachabilityChecked!==true)
      return output('ROUTER_WIREGUARD_REVIEW','ROUTER',
        'راجع دعم WireGuard وتحديث الراوتر وتقييد المنفذ 445 وقابلية الوصول من خارج المطبعة.',homeGate);
    return output('ROUTER_GATEWAY_CANDIDATE_ONLY','ROUTER',
      'راجع الإعدادات مع المالك، ولا تفتح SMB/RDP أو مشاركة Windows 7 للإنترنت.',homeGate);
  }catch{
    return output('MALFORMED_GATEWAY_INPUT_DENIED','NONE',
      'البيانات غير قابلة للتحقق؛ لا تُجرِ أي تغيير شبكي.');
  }
}
