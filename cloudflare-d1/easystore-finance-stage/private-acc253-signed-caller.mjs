/** ACC253: temporary, private-only caller for ORIGINAL EasyStore finance Stage.
 * No D1, credentials, tokens or customer data. Actual original finance Worker
 * uses its provisioned secret HMAC bindings to verify original two Stage sources.
 * This preview must NOT be deployed, published or retained as a separate app.
 */
const P='/internal/acc253/check-signed-stage-sources';
function safe(body,status=503){
  return new Response(JSON.stringify(body),{status,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'no-store'
  }});
}
export default {async fetch(request,env){
  if(new URL(request.url).pathname!==P)return safe({ok:false,code:'not-found'},404);
  if(request.method!=='GET')return safe({ok:false,code:'method-not-allowed'},405);
  if(typeof env?.EASYSTORE_FINANCE?.fetch!=='function')
    return safe({ok:false,code:'missing-private-finance-service'});
  try{
    const target=env.EASYSTORE_FINANCE;
    const h=await target.fetch(new Request('https://finance-private.internal/v1/employee/accounting/health'));
    const health=await h.json();
    if(h.status!==200||health?.success!==true||health?.mode!=='OFF'||
      health?.schemaTables!==22||health?.financeWrites!=='OFF'||
      health?.financeRelease!=='NO_GO'||health?.readOnlyApiEnabled!==false)
      return safe({ok:false,code:'finance-stage-off-health-not-qualified'});
    const sign=await target.fetch(new Request('https://finance-private.internal/internal/acc253/signed-source-smoke',{
      method:'POST',headers:{'content-type':'application/json'},body:'{}'
    }));
    const checked=await sign.json();
    if(sign.status!==200||checked?.success!==true||
       checked?.code!=='ACC253_LIVE_SIGNED_INTERNAL_STAGE_SOURCE_PASS'||
       checked?.customerFactsHmacAuthenticated!==true||
       checked?.employeePacketHmacAccepted!==true||
       checked?.nativeAuthControl!=='OFF'||checked?.financeWrites!=='OFF'||
       checked?.financeRelease!=='NO_GO'||
       checked?.employeeLoginQualified!==false||
       checked?.customerIdentityQualified!==false||
       checked?.invoicePostingQualified!==false)
      return safe({ok:false,code:'signed-stage-source-unqualified',financeResponseCode:checked?.code||'unknown'});
    // Additional unchanged original money route hard-deny invariant.
    const fin=await target.fetch(new Request('https://finance-private.internal/v1/employee/accounting',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({action:'saveAccountingFinalInvoice',
        username:'ACC253-NO-REAL-EMPLOYEE',orderId:'ACC253-NO-REAL-ORDER'})
    }));
    const denied=await fin.json();
    if(fin.status!==503||denied?.code!=='isolated-stage-financial-routes-disabled')
      return safe({ok:false,code:'financial-post-was-not-denied'});
    return safe({ok:true,code:'ACC253_ORIGINAL_PRIVATE_LIVE_SIGNED_STAGE_PROVEN',
      financeOff:true,customersHmacSignedResponse:true,
      employeeHmacSignedControlRejection:true,postingDenied:true,
      originalNativeAuthMode:'OFF',realEmployeeAuth:false,realCustomerIdentity:false,
      financialPosting:false},200);
  }catch{return safe({ok:false,code:'private-stage-signed-smoke-unavailable'});}
}};
