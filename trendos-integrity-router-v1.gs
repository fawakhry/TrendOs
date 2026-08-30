/** TrendOS Integrity Router V1 — prepared only. Wire with guarded calls; do not deploy blindly. */
const TRENDOS_INTEGRITY_ROUTER_VERSION_V1='TRENDOS_INTEGRITY_ROUTER_V1_20260830';
const TRENDOS_INTEGRITY_ENABLED_PROP_V1='TRENDOS_INTEGRITY_V1_ENABLED';
const TRENDOS_INTEGRITY_FAMILY_PROPS_V1={
  HEALTH:'TRENDOS_INTEGRITY_V1_HEALTH_ENABLED',
  ORDER_LINE:'TRENDOS_INTEGRITY_V1_ORDER_LINE_ENABLED',
  ATTENDANCE_CLEANING:'TRENDOS_INTEGRITY_V1_ATTENDANCE_CLEANING_ENABLED',
  PRESS:'TRENDOS_INTEGRITY_V1_PRESS_ENABLED',
  INVOICE:'TRENDOS_INTEGRITY_V1_INVOICE_ENABLED',
  WHATSAPP:'TRENDOS_INTEGRITY_V1_WHATSAPP_ENABLED',
  OPS:'TRENDOS_INTEGRITY_V1_OPS_ENABLED',
  AUTOMATION:'TRENDOS_INTEGRITY_V1_AUTOMATION_ENABLED'
};
function trendosRouterTextV1_(v){return String(v==null?'':v).trim();}
function trendosRouterBoolV1_(v){const s=trendosRouterTextV1_(v).toLowerCase();return['1','true','yes','نعم','on'].indexOf(s)!==-1;}
function trendosRouterPropsV1_(){try{return PropertiesService.getScriptProperties();}catch(e){return null;}}
function trendosRouterParamsV1_(e){return e&&e.parameter||{};}
function trendosRouterAuthV1_(p){return authorize_(p.username,p.token);}
function trendosRouterIsAdminV1_(user){const role=trendosRouterTextV1_(user&&user.role).toLowerCase(),name=trendosRouterTextV1_(user&&user.username||user&&user.name).toLowerCase();return role==='admin'||name.indexOf('ضياء')!==-1||name.indexOf('diaa')!==-1;}
function trendosRouterAdminAuthV1_(p){const a=trendosRouterAuthV1_(p);if(!a.ok)return a;return trendosRouterIsAdminV1_(a.user)?a:{ok:false,message:'هذه العملية متاحة للإدارة فقط.'};}
function trendosRouterRequestIdV1_(p){return trendosRouterTextV1_(p.clientRequestId||p.requestId||p.idempotencyKey||p.idempotency_key);}
function trendosIntegrityEnabledV1_(){const props=trendosRouterPropsV1_();return!!(props&&trendosRouterBoolV1_(props.getProperty(TRENDOS_INTEGRITY_ENABLED_PROP_V1)));}
function trendosIntegrityFamilyEnabledV1_(family){
  if(!trendosIntegrityEnabledV1_())return false;const prop=TRENDOS_INTEGRITY_FAMILY_PROPS_V1[trendosRouterTextV1_(family).toUpperCase()];if(!prop)return false;const props=trendosRouterPropsV1_();return!!(props&&trendosRouterBoolV1_(props.getProperty(prop)));
}
function trendosIntegrityFeatureStateV1_(){const out={master:trendosIntegrityEnabledV1_(),families:{}};Object.keys(TRENDOS_INTEGRITY_FAMILY_PROPS_V1).forEach(function(k){out.families[k]=trendosIntegrityFamilyEnabledV1_(k);});return out;}

function trendosIntegrityDependencyHealthV1_(){
  const required=[
    'trendosNormalizeOrderId_','trendosNormalizeLineId_','trendosWithLock_','trendosIdempotencyClaim_','trendosAutomationRunStart_',
    'trendosCustomerDraftAddItemV1_','trendosCustomerDraftUploadFileV1_','trendosCustomerDraftSubmitV1_','trendosUpdateLineV1_',
    'trendosAttendanceV1_','trendosCleaningV1_','trendosPressControlV1_','trendosGoLiveAutopilotV1_',
    'trendosCustomerManagerV1_','trendosWhatsAppWebhookV1_','trendosCreateHandoverV1_','trendosReceiveHandoverV1_',
    'trendosSaveOpsReplyV1_','trendosCreateOpsCoachV1_','trendosRunTrendMasterAutomationSafeV1_',
    'trendosSaveAndonV1_','trendosResolveOpsEventV1_','trendosIntegrityDashboardV1_'
  ];
  const missing=required.filter(function(name){try{return typeof globalThis[name]!=='function';}catch(e){return true;}});
  let fastAuth=false;try{fastAuth=typeof globalThis.authorizeD1FastV25_==='function';}catch(e){}
  return{success:missing.length===0,codeReady:missing.length===0,features:trendosIntegrityFeatureStateV1_(),version:TRENDOS_INTEGRITY_ROUTER_VERSION_V1,requiredCount:required.length,missing:missing,optional:{fastAuthV25Present:fastAuth}};
}

function trendosRouterCreateHandoverV1_(e){const p=trendosRouterParamsV1_(e),a=trendosRouterAuthV1_(p);if(!a.ok)return{success:false,message:a.message};return trendosCreateHandoverV1_({employee:a.user.username||a.user.name,department:a.user.department,orderId:p.orderId,lineId:p.lineId,businessDate:p.businessDate,shift:p.shift,status:p.status,blocker:p.blocker,nextAction:p.nextAction,nextOwner:p.nextOwner});}
function trendosRouterReceiveHandoverV1_(e){const p=trendosRouterParamsV1_(e),a=trendosRouterAuthV1_(p);if(!a.ok)return{success:false,message:a.message};return trendosReceiveHandoverV1_({id:p.id,receiver:a.user.username||a.user.name,managerNote:p.managerNote});}
function trendosRouterOpsReplyV1_(e){const p=trendosRouterParamsV1_(e),a=trendosRouterAuthV1_(p);if(!a.ok)return{success:false,message:a.message};return trendosSaveOpsReplyV1_({requestId:trendosRouterRequestIdV1_(p),employee:a.user.username||a.user.name,department:a.user.department,orderId:p.orderId,lineId:p.lineId,businessDate:p.businessDate,content:p.content||p.text});}
function trendosRouterOpsCoachV1_(e){const p=trendosRouterParamsV1_(e),a=trendosRouterAdminAuthV1_(p);if(!a.ok)return{success:false,message:a.message};return trendosCreateOpsCoachV1_({employee:p.employee,department:p.department,orderId:p.orderId,lineId:p.lineId,businessDate:p.businessDate,status:p.status,blocker:p.blocker,nextAction:p.nextAction,message:p.message});}
function trendosRouterAndonV1_(e){const p=trendosRouterParamsV1_(e),a=trendosRouterAuthV1_(p);if(!a.ok)return{success:false,message:a.message};return trendosSaveAndonV1_({requestId:trendosRouterRequestIdV1_(p),employee:a.user.username||a.user.name,department:a.user.department,reason:p.reason,details:p.details,orderId:p.orderId,lineId:p.lineId,businessDate:p.businessDate});}
function trendosRouterResolveOpsV1_(e){const p=trendosRouterParamsV1_(e),a=trendosRouterAdminAuthV1_(p);if(!a.ok)return{success:false,message:a.message};return trendosResolveOpsEventV1_({eventId:p.eventId,by:a.user.username||a.user.name,note:p.note});}
function trendosRouterRunAutomationV1_(e){const p=trendosRouterParamsV1_(e),a=trendosRouterAdminAuthV1_(p);if(!a.ok)return{success:false,message:a.message};return trendosRunTrendMasterAutomationSafeV1_({by:a.user.username||a.user.name,retryFailed:trendosRouterBoolV1_(p.retryFailed)});}

function trendosIntegrityRouteTableV1_(e){return{
  trendosIntegrityHealthV1:{family:'HEALTH',fn:function(){return trendosIntegrityDependencyHealthV1_();}},
  trendosIntegrityDashboardV1:{family:'HEALTH',fn:function(){return trendosIntegrityDashboardV1_(e);}},
  trendosUpdateLineV1:{family:'ORDER_LINE',fn:function(){return trendosUpdateLineV1_(e);}},
  trendosCustomerDraftAddItemV1:{family:'ORDER_LINE',fn:function(){return trendosCustomerDraftAddItemV1_(e);}},
  trendosCustomerDraftUploadFileV1:{family:'ORDER_LINE',fn:function(){return trendosCustomerDraftUploadFileV1_(trendosRouterParamsV1_(e));}},
  trendosCustomerDraftSubmitV1:{family:'ORDER_LINE',fn:function(){return trendosCustomerDraftSubmitV1_(e);}},
  trendosAttendanceV1:{family:'ATTENDANCE_CLEANING',fn:function(){return trendosAttendanceV1_(e);}},
  trendosCleaningV1:{family:'ATTENDANCE_CLEANING',fn:function(){return trendosCleaningV1_(e);}},
  trendosPressControlV1:{family:'PRESS',fn:function(){return trendosPressControlV1_(e);}},
  trendosGoLiveAutopilotV1:{family:'INVOICE',fn:function(){return trendosGoLiveAutopilotV1_(e);}},
  trendosCustomerManagerV1:{family:'WHATSAPP',fn:function(){return trendosCustomerManagerV1_(e);}},
  trendosCreateHandoverV1:{family:'OPS',fn:function(){return trendosRouterCreateHandoverV1_(e);}},
  trendosReceiveHandoverV1:{family:'OPS',fn:function(){return trendosRouterReceiveHandoverV1_(e);}},
  trendosOpsReplyV1:{family:'OPS',fn:function(){return trendosRouterOpsReplyV1_(e);}},
  trendosOpsCoachV1:{family:'OPS',fn:function(){return trendosRouterOpsCoachV1_(e);}},
  trendosAndonV1:{family:'OPS',fn:function(){return trendosRouterAndonV1_(e);}},
  trendosResolveOpsV1:{family:'OPS',fn:function(){return trendosRouterResolveOpsV1_(e);}},
  trendosRunAutomationV1:{family:'AUTOMATION',fn:function(){return trendosRouterRunAutomationV1_(e);}}
};}
function trendosIntegrityTryRouteV1_(action,e){
  if(!trendosIntegrityEnabledV1_())return null;action=trendosRouterTextV1_(action||trendosRouterParamsV1_(e).action);if(!action)return null;
  const route=trendosIntegrityRouteTableV1_(e)[action];if(!route||!trendosIntegrityFamilyEnabledV1_(route.family))return null;
  try{return{handled:true,family:route.family,result:route.fn()};}catch(err){return{handled:true,family:route.family,result:{success:false,integrityRouterError:true,message:trendosRouterTextV1_(err&&err.message||err),version:TRENDOS_INTEGRITY_ROUTER_VERSION_V1}};}
}
function trendosIntegrityTryWebhookV1_(payload){if(!trendosIntegrityFamilyEnabledV1_('WHATSAPP')||!payload||payload.object!=='whatsapp_business_account')return null;try{return{handled:true,family:'WHATSAPP',result:trendosWhatsAppWebhookV1_(payload)};}catch(err){return{handled:true,family:'WHATSAPP',result:{success:false,integrityRouterError:true,message:trendosRouterTextV1_(err&&err.message||err)}};}}
