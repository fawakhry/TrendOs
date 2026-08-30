/** TrendOS Integrity Router V1 — prepared only. Wire with one guarded call; do not deploy blindly. */
const TRENDOS_INTEGRITY_ROUTER_VERSION_V1='TRENDOS_INTEGRITY_ROUTER_V1_20260830';
function trendosRouterTextV1_(v){return String(v==null?'':v).trim();}
function trendosRouterBoolV1_(v){const s=trendosRouterTextV1_(v).toLowerCase();return['1','true','yes','نعم','on'].indexOf(s)!==-1;}
function trendosRouterParamsV1_(e){return e&&e.parameter||{};}
function trendosRouterAuthV1_(p){return authorize_(p.username,p.token);}
function trendosRouterIsAdminV1_(user){const role=trendosRouterTextV1_(user&&user.role).toLowerCase(),name=trendosRouterTextV1_(user&&user.username||user&&user.name).toLowerCase();return role==='admin'||name.indexOf('ضياء')!==-1||name.indexOf('diaa')!==-1;}
function trendosRouterAdminAuthV1_(p){const a=trendosRouterAuthV1_(p);if(!a.ok)return a;return trendosRouterIsAdminV1_(a.user)?a:{ok:false,message:'هذه العملية متاحة للإدارة فقط.'};}
function trendosRouterRequestIdV1_(p){return trendosRouterTextV1_(p.clientRequestId||p.requestId||p.idempotencyKey||p.idempotency_key);}

function trendosIntegrityDependencyHealthV1_(){
  const required=[
    'trendosNormalizeOrderId_','trendosNormalizeLineId_','trendosWithLock_','trendosIdempotencyClaim_','trendosAutomationRunStart_',
    'trendosCustomerDraftAddItemV1_','trendosCustomerDraftUploadFileV1_','trendosCustomerDraftSubmitV1_','trendosUpdateLineV1_',
    'trendosAttendanceV1_','trendosCleaningV1_','trendosPressControlV1_','trendosGoLiveAutopilotV1_',
    'trendosCustomerManagerV1_','trendosWhatsAppWebhookV1_','trendosCreateHandoverV1_','trendosReceiveHandoverV1_',
    'trendosSaveOpsReplyV1_','trendosCreateOpsCoachV1_','trendosRunTrendMasterAutomationSafeV1_',
    'trendosSaveAndonV1_','trendosResolveOpsEventV1_','trendosIntegrityDashboardV1_','authorizeD1FastV25_'
  ];
  const missing=required.filter(function(name){try{return typeof globalThis[name]!=='function';}catch(e){return true;}});
  return{success:missing.length===0,codeReady:missing.length===0,version:TRENDOS_INTEGRITY_ROUTER_VERSION_V1,requiredCount:required.length,missing:missing};
}

function trendosRouterCreateHandoverV1_(e){
  const p=trendosRouterParamsV1_(e),a=trendosRouterAuthV1_(p);if(!a.ok)return{success:false,message:a.message};
  return trendosCreateHandoverV1_({employee:a.user.username||a.user.name,department:a.user.department,orderId:p.orderId,lineId:p.lineId,businessDate:p.businessDate,shift:p.shift,status:p.status,blocker:p.blocker,nextAction:p.nextAction,nextOwner:p.nextOwner});
}
function trendosRouterReceiveHandoverV1_(e){const p=trendosRouterParamsV1_(e),a=trendosRouterAuthV1_(p);if(!a.ok)return{success:false,message:a.message};return trendosReceiveHandoverV1_({id:p.id,receiver:a.user.username||a.user.name,managerNote:p.managerNote});}
function trendosRouterOpsReplyV1_(e){
  const p=trendosRouterParamsV1_(e),a=trendosRouterAuthV1_(p);if(!a.ok)return{success:false,message:a.message};
  return trendosSaveOpsReplyV1_({requestId:trendosRouterRequestIdV1_(p),employee:a.user.username||a.user.name,department:a.user.department,orderId:p.orderId,lineId:p.lineId,businessDate:p.businessDate,content:p.content||p.text});
}
function trendosRouterOpsCoachV1_(e){
  const p=trendosRouterParamsV1_(e),a=trendosRouterAdminAuthV1_(p);if(!a.ok)return{success:false,message:a.message};
  return trendosCreateOpsCoachV1_({employee:p.employee,department:p.department,orderId:p.orderId,lineId:p.lineId,businessDate:p.businessDate,status:p.status,blocker:p.blocker,nextAction:p.nextAction,message:p.message});
}
function trendosRouterAndonV1_(e){
  const p=trendosRouterParamsV1_(e),a=trendosRouterAuthV1_(p);if(!a.ok)return{success:false,message:a.message};
  return trendosSaveAndonV1_({requestId:trendosRouterRequestIdV1_(p),employee:a.user.username||a.user.name,department:a.user.department,reason:p.reason,details:p.details,orderId:p.orderId,lineId:p.lineId,businessDate:p.businessDate});
}
function trendosRouterResolveOpsV1_(e){const p=trendosRouterParamsV1_(e),a=trendosRouterAdminAuthV1_(p);if(!a.ok)return{success:false,message:a.message};return trendosResolveOpsEventV1_({eventId:p.eventId,by:a.user.username||a.user.name,note:p.note});}
function trendosRouterRunAutomationV1_(e){const p=trendosRouterParamsV1_(e),a=trendosRouterAdminAuthV1_(p);if(!a.ok)return{success:false,message:a.message};return trendosRunTrendMasterAutomationSafeV1_({by:a.user.username||a.user.name,retryFailed:trendosRouterBoolV1_(p.retryFailed)});}

function trendosIntegrityTryRouteV1_(action,e){
  action=trendosRouterTextV1_(action||trendosRouterParamsV1_(e).action);
  if(!action)return null;
  const routes={
    trendosIntegrityHealthV1:function(){return trendosIntegrityDependencyHealthV1_();},
    trendosUpdateLineV1:function(){return trendosUpdateLineV1_(e);},
    trendosCustomerDraftAddItemV1:function(){return trendosCustomerDraftAddItemV1_(e);},
    trendosCustomerDraftUploadFileV1:function(){return trendosCustomerDraftUploadFileV1_(trendosRouterParamsV1_(e));},
    trendosCustomerDraftSubmitV1:function(){return trendosCustomerDraftSubmitV1_(e);},
    trendosAttendanceV1:function(){return trendosAttendanceV1_(e);},
    trendosCleaningV1:function(){return trendosCleaningV1_(e);},
    trendosPressControlV1:function(){return trendosPressControlV1_(e);},
    trendosGoLiveAutopilotV1:function(){return trendosGoLiveAutopilotV1_(e);},
    trendosCustomerManagerV1:function(){return trendosCustomerManagerV1_(e);},
    trendosCreateHandoverV1:function(){return trendosRouterCreateHandoverV1_(e);},
    trendosReceiveHandoverV1:function(){return trendosRouterReceiveHandoverV1_(e);},
    trendosOpsReplyV1:function(){return trendosRouterOpsReplyV1_(e);},
    trendosOpsCoachV1:function(){return trendosRouterOpsCoachV1_(e);},
    trendosAndonV1:function(){return trendosRouterAndonV1_(e);},
    trendosResolveOpsV1:function(){return trendosRouterResolveOpsV1_(e);},
    trendosRunAutomationV1:function(){return trendosRouterRunAutomationV1_(e);},
    trendosIntegrityDashboardV1:function(){return trendosIntegrityDashboardV1_(e);}
  };
  if(!routes[action])return null;
  try{return{handled:true,result:routes[action]()};}catch(err){return{handled:true,result:{success:false,integrityRouterError:true,message:trendosRouterTextV1_(err&&err.message||err),version:TRENDOS_INTEGRITY_ROUTER_VERSION_V1}};}
}
function trendosIntegrityTryWebhookV1_(payload){if(!payload||payload.object!=='whatsapp_business_account')return null;try{return{handled:true,result:trendosWhatsAppWebhookV1_(payload)};}catch(err){return{handled:true,result:{success:false,integrityRouterError:true,message:trendosRouterTextV1_(err&&err.message||err)}};}}
