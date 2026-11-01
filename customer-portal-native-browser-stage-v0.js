/* Trend Mall isolated customer Stage browser controller — DEFAULT OFF.
 * No import from live index.html. No production host. No Google fallback.
 * Original Native D1 login & owner authority exclusively validated by Worker.
 * All files private R2 quarantine; never show/sell/print before release gates.
 */
(function (win, doc) {
 "use strict";
 var config=win.TRENDOS_CUSTOMER_NATIVE_PORTAL_TEST_CONFIG;
 var local=win.location && win.location.hostname==="127.0.0.1";
 var allow=/^http:\/\/127\.0\.0\.1:([0-9]{2,5})$/;
 var base=config && config.apiBase;
 var found=typeof base==="string"&&allow.exec(base);
 var available=local && config && config.enabled===true &&
   win.TRENDOS_CUSTOMER_UI_NATIVE_STAGE_TEST_ONLY===true &&
   found && Number(found[1])>=1024 && Number(found[1])<=65535 &&
   typeof win.TrendOSCustomerNativeUploadCoordinatorV0?.createNativeCustomerUploadCoordinatorV0==="function" &&
   typeof win.TrendOSCustomerNativeUiStagePlanV0?.createNativeCustomerUiStagePlanV0==="function";
 var $=id=>doc.getElementById(id);
 var state={bearer:"",epoch:0,session:null,clientCode:"",draftId:"",
   draftKey:"",plan:null,rows:[],nextOffset:0,busy:false,requestId:0};
 var text=(id,value)=>{var e=$(id);if(e)e.textContent=String(value==null?"":value)};
 var show=(id,on)=>{var e=$(id);if(e)e.classList.toggle("hidden",!on)};
 var setNotice=(message,kind)=>{
   var e=$("availability");e.textContent=message;
   e.classList.toggle("error",kind==="error");e.classList.toggle("good",kind==="good");
 };
 var error=(code)=>{var e=new Error(code);e.code=code;return e};
 function randomHex(){
   if(!win.crypto || typeof win.crypto.getRandomValues!=="function")
     throw error("SECURE_RANDOM_UNAVAILABLE");
   var a=new Uint8Array(16);win.crypto.getRandomValues(a);
   return Array.from(a,x=>x.toString(16).padStart(2,"0")).join("");
 }
 function currentSession(){
   return state.session && state.bearer ? {
     ownerId:state.session.ownerId,draftId:state.draftId,
     authEpoch:state.session.authEpoch,verified:true,stage:"isolated-local"
   }:null;
 }
 function stageAuthority(){
   if(!available || !state.session || !/^[a-f0-9]{64}$/.test(state.bearer))
     throw error("CUSTOMER_NATIVE_AUTH_REQUIRED");
 }
 async function request(path,method,payload,token){
   if(!available || typeof path!=="string" || !/^\/v1\/customer\/native\//.test(path) ||
      path.includes("?customerId=") || path.includes("#"))
     throw error("LOCAL_NATIVE_ROUTE_DENIED");
   var bearer=token===undefined?state.bearer:token;
   var headers={accept:"application/json"};
   if(bearer)headers.authorization="Bearer "+bearer;
   if(payload!==undefined)headers["content-type"]="application/json";
   var controller=new AbortController();
   var timeout=win.setTimeout(()=>controller.abort(),15000);
   var response,raw;
   try{
     response=await win.fetch(base+path,{method:method,headers:headers,
       ...(payload!==undefined?{body:JSON.stringify(payload)}:{}),
       credentials:"omit",redirect:"error",cache:"no-store",signal:controller.signal});
     raw=await response.text();
   }catch(_){throw error("CUSTOMER_NATIVE_NETWORK_UNCERTAIN")}
   finally{win.clearTimeout(timeout)}
   if(typeof raw!=="string"||raw.length>65536)throw error("CUSTOMER_NATIVE_RESPONSE_INVALID");
   var body;
   try{body=JSON.parse(raw)}catch(_){throw error("CUSTOMER_NATIVE_RESPONSE_INVALID")}
   if(!body||typeof body!=="object"||Array.isArray(body) ||
      typeof body.success!=="boolean")throw error("CUSTOMER_NATIVE_RESPONSE_INVALID");
   return {status:response.status,body:body};
 }
 async function fileRequest(path,bytes,mime,key){
   stageAuthority();
   if(!/^\/v1\/customer\/native\/drafts\/CDR-[a-f0-9]{32}\/items\/CDI-[a-f0-9]{32}\/files$/.test(path) ||
      !/^[a-f0-9]{32}$/.test(key) ||
      !(bytes instanceof Uint8Array)||bytes.length<8||bytes.length>5*1024*1024 ||
      !["image/png","image/jpeg","application/pdf"].includes(mime))
     throw error("CUSTOMER_NATIVE_BINARY_DENIED");
   var controller=new AbortController(),timer=win.setTimeout(()=>controller.abort(),15000);
   var response,raw;
   try{
     response=await win.fetch(base+path,{method:"POST",body:bytes,
       headers:{accept:"application/json",authorization:"Bearer "+state.bearer,
         "content-type":mime,"x-idempotency-key":key},
       credentials:"omit",redirect:"error",cache:"no-store",signal:controller.signal});
     raw=await response.text();
   }catch(_){throw error("CUSTOMER_NATIVE_FILE_NETWORK_UNCERTAIN")}
   finally{win.clearTimeout(timer)}
   if(typeof raw!=="string"||raw.length>4096)throw error("CUSTOMER_NATIVE_RESPONSE_INVALID");
   var body;try{body=JSON.parse(raw)}catch(_){throw error("CUSTOMER_NATIVE_RESPONSE_INVALID")}
   if(!body||typeof body.success!=="boolean")throw error("CUSTOMER_NATIVE_RESPONSE_INVALID");
   return {status:response.status,body:body};
 }
 function transport(){
   return {
     addItem:function(x){
       stageAuthority();
       if(x.draftId!==state.draftId)throw error("CUSTOMER_NATIVE_DRAFT_CHANGED");
       return request("/v1/customer/native/drafts/"+x.draftId+"/items","POST",{
         requestKey:x.requestKey,department:x.department,itemName:x.itemName,
         qty:x.qty,notes:x.notes,heatPress:x.heatPress,flyPrint:x.flyPrint
       });
     },
     uploadFile:function(x){
       stageAuthority();
       if(x.draftId!==state.draftId)throw error("CUSTOMER_NATIVE_DRAFT_CHANGED");
       return fileRequest("/v1/customer/native/drafts/"+x.draftId+
         "/items/"+x.itemId+"/files",x.bytes,x.contentType,x.requestKey);
     }
   };
 }
 function appendBubble(message,user){
   var stream=$("messages"),bubble=doc.createElement("div");
   bubble.className="bubble"+(user?" user":"");
   bubble.textContent=String(message);
   stream.appendChild(bubble);stream.scrollTop=stream.scrollHeight;
 }
 function busy(x){
   state.busy=x;
   ["addBtn","retryBtn","newDraftBtn","checkBtn","logoutBtn"].forEach(function(id){
     var e=$(id);if(e)e.disabled=x;
   });
 }
 function stageStatus(report){
   if(!report)return;
   text("draftStatus",report.phase);
   text("fileCount",report.completedFiles||0);
   show("retryBtn",report.phase==="ITEM_UNCERTAIN"||report.phase==="FILE_UNCERTAIN");
 }
 async function ensureDraft(){
   stageAuthority();
   if(state.draftId)return state.draftId;
   if(!state.draftKey)state.draftKey=randomHex();
   var epoch=state.epoch;
   var r=await request("/v1/customer/native/drafts","POST",{requestKey:state.draftKey});
   if(epoch!==state.epoch)throw error("CUSTOMER_NATIVE_SESSION_STALE");
   if(![200,201].includes(r.status)||r.body.success!==true||
      !/^CDR-[a-f0-9]{32}$/.test(r.body.draftId) ||
      r.body.officialOrderCreated!==false)
     throw error(r.body.code||"CUSTOMER_NATIVE_DRAFT_NOT_CREATED");
   state.draftId=r.body.draftId;
   return state.draftId;
 }
 function resetDraft(){
   if(state.plan){state.plan.cancel();state.plan=null;}
   state.draftId="";state.draftKey="";
   text("draftStatus","لم تبدأ");text("fileCount","0");
   show("retryBtn",false);
   var form=$("itemForm");form.reset();
   if($("messages"))$("messages").replaceChildren();
   appendBubble("مسودة جديدة. يمكنك إضافة البنود وحفظ ملفاتها بشكل خاص للمراجعة فقط.",false);
 }
 function clearPasswordForm(){
   var form=$("changePasswordForm");if(form)form.reset();
   show("passwordPanel",false);
 }
 function disposeSession(){
   clearPasswordForm();
   state.epoch++;state.bearer="";state.session=null;
   state.clientCode="";state.rows=[];state.nextOffset=0;
   resetDraft();
   $("orders").replaceChildren();
   $("password").value="";
   show("portal",false);show("loginPanel",true);
 }
 async function login(event){
   event.preventDefault();
   if(!available||state.busy)return;
   var code=$("code").value.trim(),password=$("password").value;
   if(!code||code.length>80||password.length<12||password.length>128){
     setNotice("راجع كود العميل وكلمة المرور.", "error");return;
   }
   busy(true);
   try{
     var response=await request("/v1/customer/native/login","POST",{portalCode:code,password:password},"");
     if(response.status!==200||response.body.success!==true||
        response.body.customerSessionIssued!==true||
        response.body.source!=="d1-native-customer-login-v0" ||
        !/^[a-f0-9]{64}$/.test(response.body.token) ||
        !Number.isSafeInteger(response.body.expiresAtMs)||
        response.body.expiresAtMs<=Date.now())
       throw error("CUSTOMER_NATIVE_LOGIN_DENIED");
     disposeSession();
     state.bearer=response.body.token;
     state.clientCode=code;state.epoch++;
     state.session={ownerId:"LOCAL-"+randomHex(),authEpoch:state.epoch};
     text("clientCode",code);$("password").value="";
     show("loginPanel",false);show("portal",true);
     setNotice("تم تسجيل دخول تجريبي في Stage المحلية. مسودات الملفات ليست أوردرات رسمية.","good");
     await loadOrders(false);
   }catch(e){setNotice("فشل الدخول أو قراءة الطلبات: "+e.message,"error")}
   finally{busy(false)}
 }
 async function loadOrders(more){
   stageAuthority();
   var offset=more?state.nextOffset:0;
   var epoch=state.epoch;
   var r=await request("/v1/customer/native/orders?limit=40&offset="+offset,"GET");
   if(epoch!==state.epoch)return;
   if(r.status!==200||r.body.success!==true||r.body.readOnly!==true||
      !Array.isArray(r.body.lines))
     throw error(r.body.code||"CUSTOMER_NATIVE_ORDER_READ_UNAVAILABLE");
   if(!more){state.rows=[];$("orders").replaceChildren();}
   r.body.lines.forEach(function(row){
     if(!row||typeof row.orderId!=="string"||
        typeof row.itemName!=="string"||typeof row.status!=="string")return;
     var line=doc.createElement("div");line.className="order";
     var strong=doc.createElement("strong");
     strong.textContent=row.itemName;
     var small=doc.createElement("span");small.className="mini";
     small.textContent="أوردر "+row.orderId+" | "+row.status+" | الكمية "+row.qty;
     line.append(strong,small);$("orders").appendChild(line);
   });
   if(!more&&!r.body.lines.length)text("orders","مافيش أوردرات مرتبطة بالحساب حتى الآن.");
   state.nextOffset=offset+r.body.lines.length;
   show("moreOrdersBtn",r.body.hasMore===true);
 }
 async function add(event){
   event.preventDefault();
   if(state.busy||state.plan)return;
   busy(true);
   try{
     await ensureDraft();
     var files=Array.from($("files").files||[]);
     var form={
       department:$("department").value,itemName:$("itemName").value,
       qty:$("qty").value,notes:$("notes").value,
       heatPress:$("heatPress").checked?"نعم":"لا",
       flyPrint:$("flyPrint").checked?"نعم":"لا",files:files
     };
     state.plan=win.TrendOSCustomerNativeUiStagePlanV0.createNativeCustomerUiStagePlanV0({
       sourceOnlyLocalOptIn:true,transport:transport(),
       coordinatorFactory:win.TrendOSCustomerNativeUploadCoordinatorV0.createNativeCustomerUploadCoordinatorV0,
       getVerifiedSession:currentSession,random:win.crypto
     });
     await state.plan.prepare(form);
     var status=await state.plan.resume();
     await finalize(form,status);
   }catch(e){
     setNotice("تعذر حفظ البند: "+e.message,"error");
     if(state.plan && state.plan.status().phase==="EMPTY"){state.plan.cancel();state.plan=null;}
   }finally{busy(false)}
 }
 async function finalize(form,result){
   stageStatus(result);
   if(result.phase==="STAGED_NOT_SUBMITTED"){
     appendBubble(form.itemName+" × "+form.qty+" — "+result.completedFiles+" ملف خاص محفوظ",true);
     appendBubble("تم حفظ البند في المسودة، لكن الأوردر الرسمي لم يبدأ. الملفات محجوزة للفحص.",false);
     state.plan.cancel();state.plan=null;
     $("itemForm").reset();
     setNotice("اتحفظ البند في مسودة العميل الخاصة. لا يبدأ التنفيذ قبل اعتماد الملفات.","good");
   }else if(result.phase==="ITEM_UNCERTAIN"||result.phase==="FILE_UNCERTAIN"){
     setNotice("انقطع الرد. اضغط «إعادة محاولة آمنة» بنفس مفتاح العملية — لا تبدأ بند جديد.","error");
   }else{
     setNotice("رفع الملف متوقف ويحتاج مراجعة مسؤول. لا تكرر الرفع تلقائيًا. الحالة: "+result.phase,"error");
   }
 }
 async function retry(){
   if(state.busy||!state.plan)return;
   busy(true);try{
     var form={itemName:$("itemName").value,qty:$("qty").value};
     var result=await state.plan.resume();
     await finalize(form,result);
   }catch(e){setNotice("تعذر الاستئناف: "+e.message,"error")}
   finally{busy(false)}
 }
 async function preflight(){
   if(state.busy)return;
   busy(true);try{
     await ensureDraft();
     var r=await request("/v1/customer/native/drafts/"+state.draftId+"/submit-preflight","GET");
     if(r.body.officialOrderCreated!==false||r.body.productionWriteAuthorized!==false)
       throw error("PREFLIGHT_UNEXPECTED_ORDER_AUTHORITY");
     appendBubble("تقرير فحص المسودة: "+(r.body.code||
       (r.body.preflightEligible?"تحتاج اعتماد موظف":"غير جاهزة للتنفيذ"))+
       " — لم يتم إنشاء أوردر رسمي.",false);
   }catch(e){setNotice("فشل فحص المسودة: "+e.message,"error")}
   finally{busy(false)}
 }
 async function changePassword(event){
   event.preventDefault();
   if(state.busy)return;
   try{stageAuthority()}
   catch(_){setNotice("سجل دخولك أولًا لتغيير كلمة المرور.","error");return;}
   var oldPassword=$("currentPassword").value;
   var newPassword=$("newPassword").value;
   var confirmPassword=$("confirmPassword").value;
   if(typeof oldPassword!=="string"||oldPassword.length<12||oldPassword.length>128||
      typeof newPassword!=="string"||newPassword.length<12||newPassword.length>128||
      !newPassword||newPassword.trim()!==newPassword||
      newPassword!==confirmPassword||newPassword===oldPassword){
      setNotice("راجع كلمة المرور الحالية والجديدة والتأكيد. الحد المسموح 12 إلى 128 حرفًا، ولا يجوز إعادة نفس الكلمة.","error");
      return;
   }
   busy(true);
   if($("savePasswordBtn"))$("savePasswordBtn").disabled=true;
   var epoch=state.epoch;
   try{
     var response;
     try{
       response=await request("/v1/customer/native/change-password","POST",
         {currentPassword:oldPassword,newPassword:newPassword});
     }catch(_){
       // A lost response might hide an already committed password CAS.
       // Never continue using potentially revoked session after an uncertain write.
       disposeSession();
       setNotice("لم يصل تأكيد تغيير كلمة المرور من الخادم. أُغلقت الجلسة احتياطيًا؛ جرّب تسجيل الدخول من جديد.","error");
       return;
     }
     if(epoch!==state.epoch){disposeSession();throw error("CUSTOMER_NATIVE_SESSION_STALE");}
     if(response.status===200 && response.body.success===true &&
        response.body.passwordChanged===true &&
        response.body.forceRelogin===true &&
        response.body.allPreviousSessionsInvalidated===true){
       disposeSession();
       setNotice("تم تغيير كلمة المرور وإبطال كل الجلسات القديمة. سجّل دخولك بالكلمة الجديدة.","good");
       return;
     }
     if([400,401,429].includes(response.status)){
       setNotice("لم تتغير كلمة المرور. تحقق من الكلمة الحالية وشروط الجديدة، ثم حاول بشكل صحيح. تكرار الخطأ قد يقفل الحساب مؤقتًا.","error");
       return;
     }
     disposeSession();
     setNotice("تعذّر التأكد من تغيير كلمة المرور. أُغلقت الجلسة احتياطيًا.","error");
   }finally{
     // Clear all sensitive input values also when the server rejects old password.
     if($("changePasswordForm"))$("changePasswordForm").reset();
     if($("savePasswordBtn"))$("savePasswordBtn").disabled=false;
     busy(false);
   }
 }
 async function logout(){
   if(state.busy)return;
   var token=state.bearer;
   disposeSession();setNotice("تم إغلاق الجلسة في المتصفح. جاري تأكيد إبطالها على الخادم.","error");
   try{
     var response=await request("/v1/customer/native/logout","POST",undefined,token);
     if(response.status===200&&response.body.sessionRevoked===true)
       setNotice("تم تسجيل الخروج وإبطال الجلسة على الخادم.","good");
     else throw error("SERVER_LOGOUT_NOT_VERIFIED");
   }catch(_){setNotice("تم مسح الجلسة محليًا، لكن تأكيد إبطالها على الخادم لم يصل. لا تعدّها منتهية على الخادم.","error")}
 }
 function events(){
   $("loginForm").addEventListener("submit",login);
   $("itemForm").addEventListener("submit",add);
   $("retryBtn").addEventListener("click",retry);
   $("checkBtn").addEventListener("click",preflight);
   $("changePasswordForm").addEventListener("submit",changePassword);
   $("changePasswordBtn").addEventListener("click",function(){
     if(state.busy)return;
     var shown=$("passwordPanel").classList.contains("hidden");
     if(shown)$("changePasswordForm").reset();
     show("passwordPanel",shown);
   });
   $("closePasswordBtn").addEventListener("click",function(){
     if(state.busy)return;
     clearPasswordForm();
   });
   $("logoutBtn").addEventListener("click",logout);
   $("newDraftBtn").addEventListener("click",function(){
     if(state.busy)return;resetDraft();setNotice("تم تجهيز مسودة جديدة في المتصفح. المسودة القديمة في D1 لم تُحذف.","good");
   });
   $("refreshOrdersBtn").addEventListener("click",function(){
     loadOrders(false).catch(e=>setNotice(e.message,"error"));
   });
   $("moreOrdersBtn").addEventListener("click",function(){
     loadOrders(true).catch(e=>setNotice(e.message,"error"));
   });
   $("department").addEventListener("change",function(){
     var laser=this.value==="ليزر";
     $("heatPress").disabled=laser;$("flyPrint").disabled=laser;
     if(laser){$("heatPress").checked=false;$("flyPrint").checked=false;}
   });
 }
 if(!available){
   setNotice("بوابة الاختبار مقفولة. لا يوجد اتصال بخدمات العملاء أو Google أو Cloudflare العامة.","error");
   return;
 }
 events();
 setNotice("البيئة المحلية الاختبارية مفعلة. لا توجد أي بيانات عملاء إنتاج.","good");
 show("loginPanel",true);
 win.TrendOSCustomerNativePortalStagePolicyV0=Object.freeze({
   stageOnly:true,loopbackOnly:true,sourceOnly:true,
   officialSubmitEnabled:false,googleFallback:false,
   paidAiEnabled:false,customerProduction:"NO_GO"
 });
}(window,document));
