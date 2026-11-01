/* TrendOS Customer Portal release-readiness REPORT ONLY (v1).
 * No network, API calls, credentials, customer records, filesystem mutation,
 * Cloudflare deploy, or automatic approval. NEVER produces a GO verdict.
 */
"use strict";
const fs=require("node:fs");
const path=require("node:path");
const ROOT=__dirname;
function between(source,begin,end){
  if(typeof source!=="string")return "";
  const a=source.indexOf("function "+begin+"(");
  const b=source.indexOf("function "+end+"(",a+begin.length);
  return a>=0&&b>a?source.slice(a,b):"";
}
function assess(f){
  const reasons=[];
  const check=(condition,code)=>{if(!condition)reasons.push(code);return Boolean(condition)};
  const handlers={
    listing:between(f.backend,"getCustomerOrders_","makeCustomerOrderSeparator_"),
    upload:between(f.backend,"uploadCustomerDraftFile_","collectDraftItems_")
  };
  const orderCodeOnly=check(
    handlers.listing.length>0&&
    /if\s*\(!rowCode\s*\|\|\s*rowCode\s*!==\s*customer\.customerCode\)\s*continue;/.test(handlers.listing)&&
    !/rowNameKey\s*!==\s*nameKey/.test(handlers.listing)&&
    /if\s*\(!colCode\)\s*return/.test(handlers.listing),
    "CUSTOMER_ORDER_CODE_ISOLATION_NOT_DEPLOYABLE_IN_SOURCE");
  const privateUpload=check(
    handlers.upload.length>0&&
    !/\.setSharing\s*\(\s*DriveApp\.Access\.ANYONE_WITH_LINK/.test(handlers.upload)&&
    /bytes\.length\s*!==\s*size/.test(handlers.upload)&&
    /colCustomerCode/.test(handlers.upload)&&
    /DriveApp\.Access\.PRIVATE/.test(handlers.upload),
    "PRIVATE_UPLOAD_AND_ITEM_OWNERSHIP_NOT_DEPLOYABLE_IN_SOURCE");
  // The legacy flow creates the server item first, THEN uploads files.
  // A failed later file upload leaves a remote partial item, while the retry
  // issues a second addCustomerDraftItem request without an idempotency key.
  // Source observations are NOT a substitute for atomic backend recovery proof.
  const appText=f.app||"";
  const draftBegin=appText.indexOf("async function addCustomerDraftItem()");
  const draftEnd=appText.indexOf("async function submitCustomerDraft()",draftBegin);
  const draftFlow=draftBegin>=0&&draftEnd>draftBegin?appText.slice(draftBegin,draftEnd):"";
  const createIndex=draftFlow.indexOf('api("addCustomerDraftItem"');
  const uploadIndex=draftFlow.indexOf("await uploadFilesForDraftItem(");
  const createsItemBeforeAttachmentUpload=createIndex>=0&&uploadIndex>createIndex;
  // No source-only inspection can certify idempotent server-side recovery.
  const draftUploadRecovery=check(false,
    "CUSTOMER_DRAFT_PARTIAL_UPLOAD_RETRY_AND_ROLLBACK_UNVERIFIED");
  // These two flags attest only to source behavior, not to deployed runtime.
  const uiDefaultOff=check(
    /TRENDOS_CUSTOMER_CHAT_V1_ENABLED\s*!==\s*true/.test(f.uiScript||"") &&
    /id="customerDesignRecipe"[^>]*\bhidden\b/.test(f.html||""),
    "UI_DEFAULT_OFF_GUARD_NOT_CONFIRMED");
  const existingOrderRoute=check(
    /"submitCustomerDraft"/.test(f.app||"")&&
    /"uploadCustomerDraftFile"/.test(f.app||"")&&
    /"getCustomerOrders"/.test(f.app||""),
    "EXISTING_CUSTOMER_ORDER_CONTRACT_NOT_PRESENT");
  // No local source is proof of private runtime media, two-user auth E2E,
  // current Cloudflare exact-live bytes, scanner/print gate, or Google retirement.
  const externalRequired=[
    "DEPLOYED_BACKEND_VERSION_UNVERIFIED",
    "REAL_PRIVATE_MEDIA_ACL_AND_VIEW_PROXY_UNVERIFIED",
    "TWO_CUSTOMER_AUTHENTICATED_STAGE_E2E_MISSING",
    "CLOUDFLARE_EXACT_LIVE_ASSET_AND_ROLLBACK_UNVERIFIED",
    "ZERO_GOOGLE_CUSTOMER_ACTIONS_RETIREMENT_UNPROVEN",
    "PRIVATE_R2_SCANNER_ATTESTATION_AND_HUMAN_PRINT_QA_MISSING",
    "DRAFT_UPLOAD_ATOMICITY_AND_IDEMPOTENT_RETRY_E2E_MISSING"
  ];
  return Object.freeze({
    schema:"trendos-customer-portal-readiness-audit-v1",
    outcome:"NO_GO",
    sourceOnly:true,productionReady:false,
    paidAiEnabledByThisTool:false,
    deployedBackendHardenedByThisTool:false,
    sourceChecks:{orderCodeOnly,privateUpload,uiDefaultOff,existingOrderRoute,draftUploadRecovery},
    sourceObservations:{createsItemBeforeAttachmentUpload},
    blockers:Object.freeze([...reasons,...externalRequired]),
    nextAction:"Independent backend remediation, private-media access and isolated authenticated E2E before guarded release"
  });
}
function main(args){
  if(args.length!==1 || !["--report","--require-go"].includes(args[0])){
    process.stderr.write("Usage: node customer-portal-readiness-audit-v1.cjs --report|--require-go\n");
    return 2;
  }
  const read=name=>fs.readFileSync(path.join(ROOT,name),"utf8");
  const state=assess({backend:read("Code.gs"),
    html:read("index.html"),app:read("app.js"),
    uiScript:read("customer-design-guided-chat-v1.js")});
  process.stdout.write(JSON.stringify(state,null,2)+"\n");
  return args[0]==="--require-go"?3:0;
}
if(require.main===module)process.exitCode=main(process.argv.slice(2));
module.exports={assess,between,main};
