/**
 * TrendOS Operator Task V2 — Edge HMAC proxy adapter.
 * GitHub candidate only. No top-level doGet/doPost. No secret values committed.
 * Read/write authority remains the existing Operator Task V2 Apps Script backend.
 */
const TRENDOS_OT_EDGE_PROTOCOL_V2_='TRENDOS_OT_EDGE_V1';
const TRENDOS_OT_EDGE_SECRET_PROP_V2_='TRENDOS_OPERATOR_TASK_PROXY_SECRET';
const TRENDOS_OT_EDGE_MAX_SKEW_SEC_V2_=120;

function otepTxtV2_(v){return String(v==null?'':v).trim();}
function otepHexV2_(bytes){return (bytes||[]).map(function(b){const n=(b<0?b+256:b);return ('0'+n.toString(16)).slice(-2);}).join('');}
function otepSha256HexV2_(value){return otepHexV2_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value==null?'':value),Utilities.Charset.UTF_8));}
function otepHmacHexV2_(value,secret){return otepHexV2_(Utilities.computeHmacSha256Signature(String(value==null?'':value),String(secret||''),Utilities.Charset.UTF_8));}
function otepConstantTimeHexV2_(a,b){a=String(a||'').toLowerCase();b=String(b||'').toLowerCase();let diff=a.length^b.length,n=Math.max(a.length,b.length);for(let i=0;i<n;i++)diff|=(a.charCodeAt(i%Math.max(1,a.length))||0)^(b.charCodeAt(i%Math.max(1,b.length))||0);return diff===0;}
function otepSecretV2_(){try{return otepTxtV2_(PropertiesService.getScriptProperties().getProperty(TRENDOS_OT_EDGE_SECRET_PROP_V2_));}catch(e){return '';}}
function otepCanonicalV2_(p){const payloadJson=otepTxtV2_(p.payloadJson)||'{}';return [TRENDOS_OT_EDGE_PROTOCOL_V2_,otepTxtV2_(p.method).toUpperCase(),otepTxtV2_(p.op),otepTxtV2_(p.operator),otepTxtV2_(p.sessionJti),String(p.assertedAt||''),otepTxtV2_(p.idempotencyKey),otepSha256HexV2_(payloadJson)].join('\n');}
function otepParsePayloadV2_(raw){if(!otepTxtV2_(raw))return {};try{const p=JSON.parse(String(raw));return p&&typeof p==='object'&&!Array.isArray(p)?p:null;}catch(e){return null;}}
function otepExpectedMethodV2_(op){if(op==='status'||op==='flyPrint'||op==='pressCandidates'||op==='metrics')return 'GET';if(op==='claimNext'||op==='completeTask')return 'POST';return '';}
function otepMutationV2_(op){return op==='claimNext'||op==='completeTask';}
function otepVerifyAssertionV2_(p){
  if(otepTxtV2_(p.protocol)!==TRENDOS_OT_EDGE_PROTOCOL_V2_)return {ok:false,code:'EDGE_PROXY_PROTOCOL_INVALID'};
  const secret=otepSecretV2_();if(!secret)return {ok:false,code:'EDGE_PROXY_SECRET_NOT_CONFIGURED'};
  const op=otepTxtV2_(p.op),method=otepTxtV2_(p.method).toUpperCase(),expected=otepExpectedMethodV2_(op);if(!expected||method!==expected)return {ok:false,code:'EDGE_PROXY_OPERATION_INVALID'};
  const operator=otepTxtV2_(p.operator),jti=otepTxtV2_(p.sessionJti),ts=Number(p.assertedAt||0),signature=otepTxtV2_(p.signature).toLowerCase();
  if(!operator||!jti||!Number.isFinite(ts)||!signature)return {ok:false,code:'EDGE_PROXY_ASSERTION_INCOMPLETE'};
  const now=Math.floor(Date.now()/1000);if(Math.abs(now-ts)>TRENDOS_OT_EDGE_MAX_SKEW_SEC_V2_)return {ok:false,code:'EDGE_PROXY_ASSERTION_STALE'};
  if(otepMutationV2_(op)&&!otepTxtV2_(p.idempotencyKey))return {ok:false,code:'EDGE_PROXY_IDEMPOTENCY_REQUIRED'};
  const expectedSig=otepHmacHexV2_(otepCanonicalV2_(p),secret);if(!otepConstantTimeHexV2_(expectedSig,signature))return {ok:false,code:'EDGE_PROXY_SIGNATURE_INVALID'};
  const payload=otepParsePayloadV2_(p.payloadJson);if(payload===null)return {ok:false,code:'EDGE_PROXY_PAYLOAD_INVALID'};
  return {ok:true,payload:payload};
}
function otepAuthForOperatorV2_(operator){
  if(typeof findUser_!=='function'||typeof authorize_!=='function')return {ok:false,message:'Employee auth backend غير متاح.'};
  const user=findUser_(otepTxtV2_(operator));
  if(!user||!otepTxtV2_(user.token))return {ok:false,message:'جلسة الموظف الأساسية غير متاحة.'};
  const auth=authorize_(user.username,user.token);if(!auth||!auth.ok)return auth||{ok:false,message:'تعذر التحقق من جلسة الموظف.'};
  auth.operatorTaskRole=typeof otRoleV2_==='function'?otRoleV2_(auth):'OTHER';
  auth.__requestToken=otepTxtV2_(user.token);
  auth.__edgeProxyVerified=true;
  if(['WAEL','GABER','MANAGER'].indexOf(auth.operatorTaskRole)===-1)return {ok:false,message:'Operator Task غير متاح لهذا المستخدم.'};
  return auth;
}
function otepDispatchV2_(op,payload,auth){
  if(typeof otStatusV2_!=='function')return {success:false,code:'OPERATOR_TASK_BACKEND_MISSING',message:'Operator Task V2 backend غير منشور.'};
  if(op==='status')return otStatusV2_(auth);
  if(op==='claimNext')return otClaimNextV2_(auth);
  if(op==='completeTask')return otCompleteTaskV2_({taskId:otepTxtV2_(payload.taskId),finalStatus:otepTxtV2_(payload.finalStatus),notes:otepTxtV2_(payload.notes)},auth);
  if(op==='flyPrint'){
    otRequireEnabledV2_();if(auth.operatorTaskRole!=='WAEL')return {success:false,code:'WAEL_ONLY',message:'طباعة على الطاير متاحة لوائل فقط.'};
    return {success:true,items:otFlyLaneV2_()};
  }
  if(op==='pressCandidates'){
    otRequireEnabledV2_();if(auth.operatorTaskRole!=='WAEL')return {success:false,code:'WAEL_ONLY',message:'فلتر المكبس متاح لوائل فقط.'};
    return {success:true,items:otPressLaneV2_()};
  }
  if(op==='metrics'){
    otRequireEnabledV2_();if(auth.operatorTaskRole!=='MANAGER')return {success:false,code:'MANAGER_ONLY',message:'التقارير متاحة للإدارة فقط.'};
    return otMetricsV2_(auth);
  }
  return {success:false,code:'EDGE_PROXY_OPERATION_UNKNOWN',message:'عملية Operator Task Edge غير معروفة.'};
}
function operatorTaskEdgeProxyV2_(e){
  const p=e&&e.parameter||{},verified=otepVerifyAssertionV2_(p);if(!verified.ok)return {success:false,code:verified.code,message:'تم رفض Edge assertion.'};
  const auth=otepAuthForOperatorV2_(p.operator);if(!auth||!auth.ok)return {success:false,code:'EDGE_PROXY_OPERATOR_AUTH_FAILED',message:auth&&auth.message||'غير مصرح.'};
  try{return otepDispatchV2_(otepTxtV2_(p.op),verified.payload,auth);}catch(err){return {success:false,code:'EDGE_PROXY_TASK_ERROR',message:otepTxtV2_(err&&err.message||err)};}
}
