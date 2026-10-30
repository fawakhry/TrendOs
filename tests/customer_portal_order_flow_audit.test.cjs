// Existing customer portal audit against unchanged authentication/order authority.
// Synthetic browser-state stubs only; never contacts production APIs or logs customers.
const assert=require("node:assert/strict");
const {test}=require("node:test");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const guide=require("../customer-design-guided-chat-v1.js");
const slice=(from,to)=>app.slice(app.indexOf(from),app.indexOf(to,app.indexOf(from)+from.length));

test("customer portal retains code/password login, per-tab session and existing authenticated draft endpoints",()=>{
  for(const id of ["customerEntryBtn","customerLoginBtn","customerCode","customerPassword",
    "customerHomePanel","customerShowNewOrderBtn","customerNewOrderPanel","customerDraftMessages",
    "customerAddDraftItemBtn","customerSubmitDraftBtn","customerOrdersPanel","customerLogoutBtn"]) {
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
  }
  assert.ok(app.includes('api("customerLogin"'));
  assert.ok(app.includes('api("customerLogout"'));
  assert.ok(app.includes('api("getCustomerOrders"'));
  assert.ok(app.includes('api("createCustomerDraft"'));
  assert.ok(app.includes('api("addCustomerDraftItem"'));
  assert.ok(app.includes('apiPost("uploadCustomerDraftFile"'));
  assert.ok(app.includes('api("submitCustomerDraft"'));
  assert.ok(app.includes('sessionStorage.setItem("matbagy_platform_customer_session"'));
  assert.ok(app.includes('localStorage.removeItem("matbagy_platform_customer_session"'));
});

test("single chat is used for both portal new order and design service; stale placeholder removed",()=>{
  assert.ok(!html.includes('id="customerDesignerPanel"'));
  assert.ok(html.includes('id="customerShowDesignerBtn"'));
  assert.ok(app.includes('if (newOrder) newOrder.click();'));
  const onDesigner=app.indexOf('on("customerShowDesignerBtn"');
  assert.ok(onDesigner>0);
  const wire=app.slice(onDesigner,onDesigner+280);
  assert.ok(wire.includes('"customerShowNewOrderBtn"'));
  assert.ok(!wire.includes('state.customerViewMode = "designer"'));
  assert.ok(app.includes('if (state.customerViewMode === "designer") state.customerViewMode = "newOrder"'));
});

test("logout and preview exit clear image objects, originals-in-progress, credentials and per-customer choices",()=>{
  const clear=slice("function clearCustomerSession()","function customerAuthParams");
  assert.ok(clear.includes('clearCustomerDraftInputs();'));
  assert.ok(clear.includes('window.TrendOSCustomerRecipe.reset(document)'));
  assert.ok(clear.includes('"customerPassword", "customerCode"'));
  assert.ok(clear.includes('state.customerDraft = null'));
  assert.ok(clear.includes('state.customerImageViewerFiles = []'));
  assert.ok(clear.includes('state.customerSelectedMarketVendor = null'));
  assert.ok(clear.includes('state.customerSelectedFranchise = null'));
  assert.ok(clear.includes('state.customerLocation = null'));
  assert.ok(app.includes('function revokeCustomerPendingFiles()'));
  const revoke=slice("function revokeCustomerPendingFiles()","function makeCustomerPendingFile");
  assert.ok(revoke.includes('URL.revokeObjectURL'));
  assert.ok(revoke.includes('state.customerPendingFiles = []'));
  const preview=slice("function closeVisitorPreview()","function bootMain()");
  assert.ok(preview.includes('clearCustomerDraftInputs()'));
  assert.ok(preview.includes('window.TrendOSCustomerRecipe.reset(document)'));
  const freshDraft=slice("function resetCustomerDraft()","function authParams(extra)");
  assert.ok(freshDraft.includes('revokeCustomerPendingFiles()'));
  assert.ok(freshDraft.includes('window.TrendOSCustomerRecipe.reset(document)'));
  assert.ok(app.includes('if (state.visitorPreview) { setMsg("customerOrderMsg"'));
});

test("product recipe data is cleared when customer logs out, including face-protection acknowledgment",()=>{
  const values={};
  function element(id){
    if(!values[id]) values[id]={value:"",checked:false,dataset:{},classList:{toggle(){}},
        textContent:"",appendChild(){},focus(){}};
    return values[id];
  }
  const doc={getElementById:element,createElement:()=>({value:"",textContent:""})};
  element("customerRecipeProduct").value="mug";
  element("customerRecipeWidth").value="20";
  element("customerRecipeHeight").value="9";
  element("customerRecipeGarment").value="L";
  element("customerRecipeKeepOriginal").checked=true;
  element("customerOrderItem").dataset.recipeFilled="مج";
  assert.equal(guide.reset(doc),true);
  assert.equal(element("customerRecipeProduct").value,"");
  assert.equal(element("customerRecipeWidth").value,"");
  assert.equal(element("customerRecipeHeight").value,"");
  assert.equal(element("customerRecipeGarment").value,"");
  assert.equal(element("customerRecipeKeepOriginal").checked,false);
  assert.equal(element("customerOrderItem").dataset.recipeFilled,"");
});

test("portal UI new-order chat remains isolated from staff, accounting and production writes",()=>{
  const addon=fs.readFileSync(path.join(root,"customer-design-guided-chat-v1.js"),"utf8");
  const css=fs.readFileSync(path.join(root,"customer-design-guided-chat-v1.css"),"utf8");
  assert.ok(html.includes('id="customerNewOrderPanel"'));
  assert.ok(css.includes("#customerNewOrderPanel"));
  assert.ok(!addon.includes('fetch('));
  assert.ok(!addon.includes('XMLHttpRequest'));
  assert.ok(!addon.includes('OPENAI_API_KEY'));
  assert.ok(!addon.includes('window.state ='));
  assert.ok(!addon.includes('customerDraft.submitted ='));
  assert.ok(!addon.includes('submitCustomerDraft('));
});
