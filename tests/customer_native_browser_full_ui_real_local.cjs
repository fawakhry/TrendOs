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
    page.on("console",m=>{if(m.type()==="error")forbidden.push("CONSOLE_ERROR")});
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
    assert.ok((await page.locator("#messages").innerText()).includes("T12_CUSTOMER_FILE_HANDOFF_NOT_YET_SUPPORTED"));
    await page.locator("#logoutBtn").click();
    await page.locator("#loginPanel").waitFor({state:"visible"});
    assert.equal(await page.locator("#portal").isVisible(),false);
    await assertUi(page,cfg.CUSTOMER_UI_CODE_C2,cfg.CUSTOMER_UI_PASS_C2,
      "LOCAL-ORDER-LOCAL-C2","LOCAL-ORDER-LOCAL-C1");
    assert.equal(await page.locator("#fileCount").innerText(),"0");
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
    console.log("PASS: REAL CHROMIUM blue customer chat, Native D1 login C1/C2 isolated orders, R2 private file, preflight denied, logout, default OFF");
    console.log("NO_REMOTE_HTTP=YES; PRODUCTION_GO_LIVE=NO_GO; CUSTOMER_UI_STAGE_SOURCE_COMPLETE=YES");
  }finally{await browser.close()}
}
main().catch(e=>{console.error("LOCAL_CUSTOMER_BROWSER_UI_E2E_FAILED:",e.message);
  process.exitCode=1});
