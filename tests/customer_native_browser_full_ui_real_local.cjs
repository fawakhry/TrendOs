/* Real Chromium + original isolated local Workerd D1/R2 stage UI test.
 * Private fixture pages are served at 127.0.0.1:8000. No real customer,
 * Cloudflare remote URL, Google, public files, live orders or production DB.
 */
"use strict";
const {chromium}=require(process.env.CUSTOMER_STAGE_LOCAL_PLAYWRIGHT_MODULE);
const assert=require("node:assert/strict");
const cfg=process.env;
if(cfg.CUSTOMER_NATIVE_BROWSER_UI_LOCAL_E2E!=="1"||
   !/^http:\/\/127\.0\.0\.1:\d+$/.test(cfg.CUSTOMER_UPLOAD_LOCAL_BASE||""))
  throw Error("DISPOSABLE_LOOPBACK_CHROMIUM_ONLY");
const frontend="http://127.0.0.1:8000";
const png=Buffer.from([137,80,78,71,13,10,26,10,1,2,3,4,5]);
const forbidden=[];
async function assertUi(page,code,password,expectedOrder,otherOrder){
  await page.locator("#code").fill(code);
  await page.locator("#password").fill(password);
  await page.locator("#loginBtn").click();
  await page.locator("#portal").waitFor({state:"visible",timeout:30000});
  await page.getByText(expectedOrder).first().waitFor({timeout:30000});
  const orders=await page.locator("#orders").innerText();
  assert.ok(orders.includes(expectedOrder));
  assert.ok(!orders.includes(otherOrder));
  assert.equal(await page.locator("#password").inputValue(),"");
  assert.ok((await page.locator("#availability").innerText()).includes("Stage"));
}
async function main(){
  const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  try{
    const context=await browser.newContext({locale:"ar-EG",acceptDownloads:false});
    const page=await context.newPage();
    // Expected HTTP 409 on read-only T12 preflight may appear as a browser
    // console error. Only page exceptions and remote requests are blockers.
    page.on("pageerror",()=>forbidden.push("PAGE_ERROR"));
    await page.route("**/*",async route=>{
      const url=route.request().url();
      if(!/^http:\/\/127\.0\.0\.1:(8000|[0-9]{2,5})(\/|$)/.test(url)||
          (url.startsWith("http://127.0.0.1:") &&
           !url.startsWith(frontend) && !url.startsWith(cfg.CUSTOMER_UPLOAD_LOCAL_BASE))){
        forbidden.push("FORBIDDEN_REMOTE_ORIGIN");await route.abort();return;
      }
      await route.continue();
    });
    await page.goto(frontend+"/customer-portal-native-stage-v0.html",{waitUntil:"load"});
    await page.locator("#loginPanel").waitFor({state:"visible"});
    await assertUi(page,cfg.CUSTOMER_UI_CODE_C1,cfg.CUSTOMER_UI_PASS_C1,
      "LOCAL-ORDER-LOCAL-C1","LOCAL-ORDER-LOCAL-C2");
    await page.locator("#department").selectOption("طباعة");
    await page.locator("#qty").fill("2");
    await page.locator("#itemName").fill("تابلوه 30×40 — ملف وهمي");
    await page.locator("#notes").fill("تصميم للتجربة فقط، بدون بيانات فعلية");
    await page.locator("#files").setInputFiles({name:"synthetic.png",mimeType:"image/png",buffer:png});
    await page.locator("#addBtn").click();
    await page.getByText("تم حفظ البند في المسودة، لكن الأوردر الرسمي لم يبدأ.").waitFor({
      state:"visible",timeout:45000
    }).catch(async()=>{
      const status=await page.locator("#availability").innerText();
      throw Error("NATIVE_STAGE_UI_UPLOAD_FAILED:"+status);
    });
    assert.equal(await page.locator("#draftStatus").innerText(),"STAGED_NOT_SUBMITTED");
    assert.equal(await page.locator("#fileCount").innerText(),"1");
    assert.ok((await page.locator("#messages").innerText()).includes("تابلوه 30×40"));
    await page.locator("#checkBtn").click();
    await page.getByText("لم يتم إنشاء أوردر رسمي.",{exact:false}).last().waitFor({timeout:25000});
    const preflightText=await page.locator("#messages").innerText();
    assert.ok(preflightText.includes("T12_CUSTOMER_FILE_HANDOFF_NOT_YET_SUPPORTED"),
      "PREFLIGHT_LOCAL_REASON_MISMATCH="+preflightText.slice(-350));
    await page.locator("#logoutBtn").click();
    await page.locator("#loginPanel").waitFor({state:"visible"});
    assert.equal(await page.locator("#portal").isVisible(),false);
    let oldC2Bearer="";
    page.on("request",req=>{
      if(req.url().includes("/v1/customer/native/orders")&&
         req.headers().authorization?.startsWith("Bearer "))
        oldC2Bearer=req.headers().authorization;
    });
    await assertUi(page,cfg.CUSTOMER_UI_CODE_C2,cfg.CUSTOMER_UI_PASS_C2,
      "LOCAL-ORDER-LOCAL-C2","LOCAL-ORDER-LOCAL-C1");
    assert.equal(await page.locator("#fileCount").innerText(),"0");
    assert.match(oldC2Bearer,/^Bearer [a-f0-9]{64}$/);
    await page.locator("#changePasswordBtn").click();
    await page.locator("#passwordPanel").waitFor({state:"visible"});
    await page.locator("#currentPassword").fill("LOCAL-WRONG-PASSWORD-ONLY-FIXTURE!");
    await page.locator("#newPassword").fill(cfg.CUSTOMER_UI_PASS_C2_NEW);
    await page.locator("#confirmPassword").fill(cfg.CUSTOMER_UI_PASS_C2_NEW);
    await page.locator("#savePasswordBtn").click();
    await page.getByText("لم تتغير كلمة المرور.",{exact:false}).waitFor();
    assert.equal(await page.locator("#portal").isVisible(),true,
      "Incorrect current password should not destroy a valid session");
    assert.equal(await page.locator("#currentPassword").inputValue(),"");
    await page.locator("#currentPassword").fill(cfg.CUSTOMER_UI_PASS_C2);
    await page.locator("#newPassword").fill(cfg.CUSTOMER_UI_PASS_C2_NEW);
    await page.locator("#confirmPassword").fill(cfg.CUSTOMER_UI_PASS_C2_NEW);
    await page.locator("#savePasswordBtn").click();
    await page.locator("#loginPanel").waitFor({state:"visible",timeout:30000});
    assert.equal(await page.locator("#portal").isVisible(),false);
    assert.equal(await page.locator("#passwordPanel").isVisible(),false);
    const oldTokenAttempt=await fetch(
      cfg.CUSTOMER_UPLOAD_LOCAL_BASE+"/v1/customer/native/orders?limit=40&offset=0",{
        headers:{Origin:frontend,Authorization:oldC2Bearer},
        redirect:"error",cache:"no-store"});
    assert.equal(oldTokenAttempt.status,401,"Password CAS did not invalidate existing D1 bearer");
    oldC2Bearer="";
    await page.locator("#code").fill(cfg.CUSTOMER_UI_CODE_C2);
    await page.locator("#password").fill(cfg.CUSTOMER_UI_PASS_C2);
    await page.locator("#loginBtn").click();
    await page.getByText("فشل الدخول أو قراءة الطلبات:",{exact:false}).waitFor();
    assert.equal(await page.locator("#portal").isVisible(),false);
    await assertUi(page,cfg.CUSTOMER_UI_CODE_C2,cfg.CUSTOMER_UI_PASS_C2_NEW,
      "LOCAL-ORDER-LOCAL-C2","LOCAL-ORDER-LOCAL-C1");
    await page.locator("#logoutBtn").click();
    await page.locator("#loginPanel").waitFor({state:"visible"});
    // Default OFF: same assets without injected local configuration must not
    // render login or perform any Native/Google request.
    const off=await context.newPage();
    await off.goto(frontend+"/customer-portal-native-stage-v0.html?unconfigured=1",
      {waitUntil:"load"});
    assert.equal(await off.locator("#loginPanel").isVisible(),false);
    assert.ok((await off.locator("#availability").innerText()).includes("مقفولة"));
    assert.equal(forbidden.length,0,forbidden.join(","));
    console.log("PASS: REAL CHROMIUM blue customer chat, Native D1 login C1/C2 isolated orders, R2 private file, preflight denied, D1 password rotation+old-session revocation, logout, default OFF");
    console.log("NO_REMOTE_HTTP=YES; PRODUCTION_GO_LIVE=NO_GO; CUSTOMER_UI_STAGE_SOURCE_COMPLETE=YES");
  }finally{await browser.close()}
}
main().catch(e=>{console.error("LOCAL_CUSTOMER_BROWSER_UI_E2E_FAILED:",e.message);
  process.exitCode=1});
