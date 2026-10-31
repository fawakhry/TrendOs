const assert=require("node:assert/strict");
const {test}=require("node:test");
const fs=require("node:fs");
const path=require("node:path");
const {assess,main}=require("../customer-portal-readiness-audit-v1.cjs");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const current={backend:read("Code.gs"),uiScript:read("customer-design-guided-chat-v1.js"),html:read("index.html"),app:read("app.js")};

test("real checked-in customer portal correctly fails readiness; no fabricated GO",()=>{
  const result=assess(current);
  assert.equal(result.outcome,"NO_GO");
  assert.equal(result.productionReady,false);
  assert.equal(result.sourceChecks.orderCodeOnly,false);
  assert.equal(result.sourceChecks.privateUpload,false);
  assert.equal(result.sourceChecks.uiDefaultOff,true);
  assert.equal(result.sourceChecks.existingOrderRoute,true);
  assert.ok(result.blockers.includes("DEPLOYED_BACKEND_VERSION_UNVERIFIED"));
  assert.ok(result.blockers.includes("TWO_CUSTOMER_AUTHENTICATED_STAGE_E2E_MISSING"));
  assert.ok(result.blockers.includes("PRIVATE_UPLOAD_AND_ITEM_OWNERSHIP_NOT_DEPLOYABLE_IN_SOURCE"));
});
test("candidate stage patch improving code still NEVER asserts runtime safety",()=>{
  const {prepareCandidate}=require("../customer-portal-p0-stage-patch.cjs");
  const sourceCandidate=prepareCandidate(current.backend);
  const state=assess({...current,backend:sourceCandidate});
  assert.equal(state.sourceChecks.orderCodeOnly,true);
  assert.equal(state.sourceChecks.privateUpload,true);
  assert.equal(state.productionReady,false);
  assert.equal(state.outcome,"NO_GO");
  assert.ok(state.blockers.includes("REAL_PRIVATE_MEDIA_ACL_AND_VIEW_PROXY_UNVERIFIED"));
});
test("tampered or missing source, missing UI flag, and removed legacy order endpoint fail closed",()=>{
  for(const change of [
    {backend:""},
    {uiScript:""},
    {html:""},
    {app:""},
    {backend:current.backend.replace("function getCustomerOrders_","function removed_getCustomerOrders_")},
  ]){
    const output=assess({...current,...change});
    assert.equal(output.outcome,"NO_GO");
    assert.ok(output.blockers.length>0);
  }
  assert.equal(assess({...current,uiScript:"window.TRENDOS_CUSTOMER_CHAT_V1_ENABLED=true;"}).sourceChecks.uiDefaultOff,false);
});
test("audit supports read-only reporting; strict invocation is blocking",()=>{
  assert.equal(main(["--require-go"]),3);
  assert.equal(main(["--report"]),0);
  assert.equal(main(["--unsupported"]),2);
});
test("sensitive information never collected or included in report",()=>{
  const report=assess({...current,backend:current.backend+"\nconst SECRET_KEY='SUPER-SECRET-TEST';"});
  const t=JSON.stringify(report);
  assert.ok(!t.includes("SUPER-SECRET-TEST"));
  assert.ok(!t.includes("OPENAI_API_KEY"));
  assert.equal(report.outcome,"NO_GO");
});
