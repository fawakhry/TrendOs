/** ACC252: PRIVATE Stage service-binding-only NEGATIVE proof, NEVER financial POST.
 * This Worker MUST NOT be deployed or receive a public route. Wrangler remote
 * preview only; no credentials, customers, employee tokens or SQL mutations.
 */
const H='/internal/acc252/stage-service-boundary/negative';
const S='/internal/acc253/stage-service-boundary/signed';
const refs=[
  ['TRENDOS_CUSTOMER_FACTS','/internal/easystore/customer-facts/v1'],
  ['TRENDOS_EMPLOYEE_SESSION','/internal/easystore/native-employee-session/v1']
];
function result(code,status=503,more={}){
  return new Response(JSON.stringify({success:false,code,...more}),{status,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
}
async function call(binding,path,method='GET',body){
  const r=await binding.fetch(new Request('https://service-stage.internal'+path,{
    method,headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})
  }));
  // Only disclose numerical status, NEVER the response body, identity, secret,
  // session, SQL, CF-Ray or customer information.
  return r.status;
}
export default {async fetch(request,env){
  const uri=new URL(request.url).pathname;
  if(uri!==H && uri!==S)return result('not-found',404);
  if(uri===S) {
    if(request.method!=='GET')return result('method-not-allowed',405);
    if(typeof env?.EASYSTORE_FINANCE?.fetch!=='function')
      return result('private-finance-binding-missing');
    try {
      const signed=await env.EASYSTORE_FINANCE.fetch(new Request(
        'https://isolated-finance-service.internal/internal/acc253/signed-source-smoke',
        {method:'POST'}));
      const body=await signed.json();
      if(signed.status!==200||body?.success!==true||
         body?.code!=='ACC253_LIVE_SIGNED_INTERNAL_STAGE_SOURCE_PASS'||
         body?.customerFactsHmacAuthenticated!==true||
         body?.employeePacketHmacAccepted!==true||
         body?.nativeAuthControl!=='OFF'||
         body?.financeWrites!=='OFF'||
         body?.employeeLoginQualified!==false||
         body?.invoicePostingQualified!==false)
        return result('signed-source-stage-private-proof-unqualified',503);
      return new Response(JSON.stringify({
        success:true,code:'PRIVATE_ACC253_SIGNED_SOURCE_LIVE_PASS',
        customerFactsHmacAuthenticated:true,
        employeePacketHmacAccepted:true,financeWrites:'OFF',
        nativeAuthControl:'OFF',realEmployeeLogin:false,
        customerDataFetched:false,financePost:false
      }),{status:200,headers:{'content-type':'application/json; charset=utf-8',
        'cache-control':'no-store'}});
    }catch{return result('signed-source-private-preview-unavailable');}
  }
  if(request.method!=='GET')return result('method-not-allowed',405);
  if(!env?.EASYSTORE_FINANCE?.fetch ||
     refs.some(([name])=>typeof env[name]?.fetch!=='function'))
    return result('private-service-binding-missing');
  try{
    const check={};
    for(const [name,path] of refs){
      const b=env[name];
      const get=await call(b,path,'GET');
      const unsigned=await call(b,path,'POST',{probe:'ACC252_NO_CREDENTIALS_NO_CUSTOMER'});
      check[name]={methodDenied:get===405,unsignedDenied:unsigned===401};
      if(get!==405||unsigned!==401)
        return result('stage-service-boundary-not-qualified',503,{checks:check});
    }
    const fin=env.EASYSTORE_FINANCE;
    const healthResponse=await fin.fetch(new Request(
      'https://private-finance-stage.internal/v1/employee/accounting/health'));
    const health=await healthResponse.json();
    check.financeHealth=healthResponse.status===200&&health?.success===true&&
      health?.schemaTables===22&&health?.mode==='OFF'&&
      health?.financeWrites==='OFF'&&health?.financeRelease==='NO_GO'&&
      health?.readOnlyApiEnabled===false;
    const financialDenied=await call(fin,'/v1/employee/accounting','POST',{
      action:'saveAccountingFinalInvoice',username:'ACC252_NOT_REAL_ACCOUNT',
      orderId:'ACC252_NOT_REAL_ORDER'});
    check.financeInvoiceDenied=financialDenied===503;
    if(!check.financeHealth||!check.financeInvoiceDenied)
      return result('finance-stage-boundary-not-qualified',503,{checks:check});
    return new Response(JSON.stringify({
      success:true,code:'PRIVATE_STAGE_BOUNDARY_NEGATIVE_LIVE_PASS',
      checks:check,financialAuthority:false,readsEnabled:false,
      liveAuthenticatedEmployee:false,liveCustomerIdentity:false
    }),{status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
  }catch{return result('stage-service-preview-unavailable');}
}};
