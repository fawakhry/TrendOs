/* TrendOS Native customer draft Stage HTTP transport — loopback-only, OFF.
 * Source-only wiring for the already-approved Entry665/666 request contracts.
 * NOT imported by app.js, index.html, Worker, or the Native browser dispatcher.
 * Refuses all public hosts, even Cloudflare Stage, until independently attested.
 * No bearer persisted. No automatic official order, Google, file preview or R2 access.
 */
"use strict";
const HOST_PATTERN=/^http:\/\/127\.0\.0\.1:([0-9]{2,5})$/;
const HEX32=/^[a-f0-9]{32}$/;
const HEX64=/^[a-f0-9]{64}$/;
const DRAFT=/^CDR-[a-f0-9]{32}$/;
const ITEM=/^CDI-[a-f0-9]{32}$/;
const LIMIT=5*1024*1024;
const fail=code=>{const error=new Error(code);error.code=code;return error};
function localOrigin(value){
  if(typeof value!=="string")throw fail("STAGE_ORIGIN_INVALID");
  const match=HOST_PATTERN.exec(value);
  const port=match&&Number(match[1]);
  if(!match||!Number.isInteger(port)||port<1024||port>65535)
    throw fail("STAGE_ORIGIN_FORBIDDEN");
  return value;
}
function validBinary(bytes,type){
  if(!(bytes instanceof Uint8Array)||bytes.length<8||bytes.length>LIMIT)
    return false;
  if(type==="image/png")
    return [137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
  if(type==="image/jpeg")return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if(type==="application/pdf")
    return [37,80,68,70,45].every((b,i)=>bytes[i]===b);
  return false;
}
function createNativeCustomerLoopbackTransportV0(options={}){
  if(options.enabled!==true||typeof options.fetchImpl!=="function"||
     typeof options.getBearer!=="function"||
     typeof options.isStageAuthorized!=="function")
    throw fail("STAGE_TRANSPORT_OFF");
  const origin=localOrigin(options.baseUrl);
  const requestOrigin=localOrigin(options.requestOrigin);
  const timeoutMs=options.timeoutMs===undefined?5000:options.timeoutMs;
  if(!Number.isInteger(timeoutMs)||timeoutMs<200||timeoutMs>15000)
    throw fail("STAGE_TIMEOUT_INVALID");
  async function post(path,headers,body){
    if(options.isStageAuthorized()!==true)throw fail("STAGE_AUTHORIZATION_OFF");
    const bearer=options.getBearer();
    if(typeof bearer!=="string"||!HEX64.test(bearer))
      throw fail("NATIVE_BEARER_REQUIRED");
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),timeoutMs);
    let response;
    try {
      response=await options.fetchImpl(origin+path,{
        method:"POST",headers:{
          "accept":"application/json","authorization":"Bearer "+bearer,
          "origin":requestOrigin,...headers
        },body,credentials:"omit",redirect:"error",cache:"no-store",
        signal:controller.signal
      });
    }catch{
      // Do not expose request URLs, tokens, or raw transport errors.
      throw fail("NATIVE_STAGE_HTTP_UNCERTAIN");
    }finally{clearTimeout(timeout)}
    if(!response||!Number.isInteger(response.status)||
       typeof response.text!=="function")
      throw fail("NATIVE_STAGE_RESPONSE_UNVERIFIED");
    let raw;
    try{raw=await response.text()}catch{throw fail("NATIVE_STAGE_RESPONSE_UNCERTAIN")}
    if(typeof raw!=="string"||raw.length>4096)
      throw fail("NATIVE_STAGE_RESPONSE_INVALID");
    let parsed;
    try{parsed=JSON.parse(raw)}catch{throw fail("NATIVE_STAGE_RESPONSE_INVALID")}
    if(!parsed||typeof parsed!=="object"||Array.isArray(parsed)||
       !parsed.body||typeof parsed.body!=="object"||Array.isArray(parsed.body))
      throw fail("NATIVE_STAGE_RESPONSE_SHAPE_INVALID");
    // Local fixture protocol wraps the original handler body, never credentials.
    return {status:response.status,body:parsed.body};
  }
  async function addItem(fields){
    if(!fields||!DRAFT.test(fields.draftId)||!HEX32.test(fields.requestKey))
      throw fail("NATIVE_STAGE_ITEM_INVALID");
    const data={
      requestKey:fields.requestKey,department:fields.department,
      itemName:fields.itemName,qty:fields.qty,notes:fields.notes,
      heatPress:fields.heatPress,flyPrint:fields.flyPrint
    };
    if(!["طباعة","ليزر"].includes(data.department)||
       typeof data.itemName!=="string"||data.itemName.length<1||
       data.itemName.length>120||data.itemName.trim()!==data.itemName||
       !Number.isSafeInteger(data.qty)||data.qty<1||data.qty>99||
       typeof data.notes!=="string"||data.notes.length>1000||
       typeof data.heatPress!=="boolean"||typeof data.flyPrint!=="boolean"||
       (data.department==="ليزر"&&(data.heatPress||data.flyPrint)))
      throw fail("NATIVE_STAGE_ITEM_INVALID");
    return post("/v1/customer/native/drafts/"+fields.draftId+"/items",
      {"content-type":"application/json"},JSON.stringify(data));
  }
  async function uploadFile(fields){
    if(!fields||!DRAFT.test(fields.draftId)||!ITEM.test(fields.itemId)||
       !HEX32.test(fields.requestKey)||
       !validBinary(fields.bytes,fields.contentType))
      throw fail("NATIVE_STAGE_FILE_INVALID");
    return post("/v1/customer/native/drafts/"+fields.draftId+
      "/items/"+fields.itemId+"/files",
      {"content-type":fields.contentType,
       "x-idempotency-key":fields.requestKey},fields.bytes);
  }
  return Object.freeze({addItem,uploadFile,sourceOnly:true,loopbackOnly:true,
    productionEnabled:false,apiHostOnly:"127.0.0.1",
    nativeSessionStored:false,workerWired:false});
}
module.exports={createNativeCustomerLoopbackTransportV0,localOrigin,validBinary};
