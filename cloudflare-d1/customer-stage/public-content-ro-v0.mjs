/* TrendOS: existing D1 employee-content collection → narrowly PUBLIC customer read.
 * Isolated Cloudflare Stage source only, default OFF, no production import/deploy.
 * This does not reuse employee authentication, change the source schema, or
 * expose full JSON records (which may include internal notes and finances).
 */
import {
  fingerprintCustomerSessionV0, CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0
} from '../src/customer-portal-native-orders-v0.mjs';

export const CUSTOMER_NATIVE_PUBLIC_CONTENT_PATH_V0='/v1/customer/native/public-content';
const VIEWS=Object.freeze({
  sections:'platform_sections',branches:'franchise_branches',
  marketplace:'marketplace_vendors',ads:'platform_ads',brand:'white_label'
});
const text=x=>typeof x==='string'?x.trim():'';
const validText=(x,max=220)=>typeof x==='string'&&x.length<=max?x:'';
function json(body,status,origin=''){
  return new Response(JSON.stringify(body),{status,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'no-store',
    'x-content-type-options':'nosniff',
    ...(origin?{'access-control-allow-origin':origin,'vary':'Origin',
      'access-control-allow-methods':'GET,OPTIONS',
      'access-control-allow-headers':'authorization,accept'}:{})
  }});
}
function denied(code,status=503,origin=''){
  return json({success:false,code,source:'customer-native-public-content-stage-v0'},status,origin);
}
function safePublic(row,view){
  if(!row||typeof row.record_json!=='string'||row.record_json.length>8192)
    throw new Error('invalid-private-record');
  let record;
  try{record=JSON.parse(row.record_json);}catch{throw new Error('bad-json');}
  if(!record||Array.isArray(record)||typeof record!=='object')
    throw new Error('bad-shape');
  if(view==='sections'){
    const sectionCode=validText(record.code||row.record_id,48);
    const name=validText(record.name,120);
    if(!sectionCode||!name)return null;
    return {sectionCode,name,description:validText(record.description,360),
      sectionType:validText(record.sectionType,100),
      executionType:validText(record.executionType,100),
      active:'نعم'};
  }
  // Publication must be explicit. Unknown/missing visibility is PRIVATE,
  // never accidentally public just because a record is active in D1.
  if(record.customerVisibility!=='ظاهر كفرع مطبعجي'||
     record.branchRole==='شريك تنفيذ مخفي')
    return null;
  const branchCode=validText(record.code||row.record_id,48);
  const brandName=validText(record.displayName||record.brandName,120);
  if(!branchCode||!brandName)return null;
  return {branchCode,brandName,
    governorate:validText(record.governorate,80),
    city:validText(record.city,80),
    publicArea:validText(record.visibleArea||record.publicArea,80),
    publicDescription:validText(record.customerDescription||record.publicDescription,360),
    active:'نعم',customerVisibility:'ظاهر كفرع مطبعجي'};
}

// No generic record projection for customer marketplace, marketing or brand:
// every permitted property is curated and strictly bounded by its view.
function safeMarketVendor(row){
  const record=parsePublicRecord(row);
  const vendorCode=validText(record.code||record.vendorCode||row.record_id,48);
  const vendorName=validText(record.vendorName||record.name,120);
  if(!vendorCode||!vendorName)return null;
  return {vendorCode,vendorName,category:validText(record.category,90),active:'نعم'};
}
function safeMarketProduct(row,allowedVendors){
  const record=parsePublicRecord(row);
  const vendorCode=validText(record.vendorCode,48);
  const productCode=validText(record.code||record.productCode||row.record_id,48);
  const productName=validText(record.productName||record.name,120);
  if(!vendorCode||!allowedVendors.has(vendorCode)||!productCode||!productName)return null;
  const price=validText(record.price,24);
  // Strict price syntax stops invisible downstream HTML/CSS manipulation;
  // zero and blank are allowed, never raw finance/private price metadata.
  if(price&&!/^[0-9]+(?:\\.[0-9]{1,2})?$/.test(price))return null;
  return {vendorCode,productCode,productName,price,
    description:validText(record.description,360),
    unit:validText(record.unit,50),active:'نعم'};
}
function parsePublicRecord(row){
  if(!row||typeof row.record_json!=='string'||row.record_json.length>8192)
    throw new Error('invalid-private-record');
  let data;
  try{data=JSON.parse(row.record_json);}catch{throw new Error('bad-json');}
  if(!data||typeof data!=='object'||Array.isArray(data))
    throw new Error('bad-private-shape');
  return data;
}
function safePublicAd(row){
  const r=parsePublicRecord(row);
  const headline=validText(r.title||r.headline||r.caption,120);
  if(!headline)return null;
  const placement=validText(r.placement||r.adPlacement,30);
  // Stage supports text-only public notices until signed R2 media proof.
  if(placement&&!['top','marketplace','branches'].includes(placement))return null;
  return {adId:validText(r.adId||row.record_id,48),
    headline,placement:placement||'top',active:'نعم',publicTextOnly:true};
}
function safePublicBrand(row){
  if(!row)return {};
  const r=parsePublicRecord(row);
  const platformName=validText(r.platformName,100);
  const primaryColor=validText(r.primaryColor,7);
  return {...(platformName?{platformName}:{}),
    ...( /^#[0-9a-fA-F]{6}$/.test(primaryColor)?{primaryColor}:{} )};
}
async function readActivePublicCollection(db,collection){
  // One extra record signals truncation; never show misleading partial catalog.
  const out=await db.prepare(
    "SELECT record_id,record_json FROM employee_content_records_v1 WHERE collection=? AND active=1 ORDER BY sort_order,record_id LIMIT 41"
  ).bind(collection).all();
  if(!out||!Array.isArray(out.results)||out.results.length>40)
    throw new Error('public-collection-unqualified');
  return out.results;
}
export async function handleCustomerNativePublicContentStageV0(request,env={}){
  let url;
  try{url=new URL(request.url);}catch{return denied('CUSTOMER_PUBLIC_BAD_URL',400);}
  if(url.pathname!==CUSTOMER_NATIVE_PUBLIC_CONTENT_PATH_V0||url.hash)
    return denied('CUSTOMER_PUBLIC_ROUTE_NOT_FOUND',404);
  const origin=text(request.headers.get('Origin'));
  const origins=text(env.CORS_ORIGINS).split(',').map(text).filter(Boolean);
  if(!origin||origin==='null'||!origins.includes(origin))
    return denied('CUSTOMER_PUBLIC_ORIGIN_FORBIDDEN',403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
    'access-control-allow-origin':origin,'vary':'Origin',
    'access-control-allow-methods':'GET,OPTIONS',
    'access-control-allow-headers':'authorization,accept',
    'cache-control':'no-store'
  }});
  if(request.method!=='GET')return denied('CUSTOMER_PUBLIC_METHOD_DENIED',405,origin);
  if(env.TRENDOS_CUSTOMER_PORTAL_NATIVE_PUBLIC_CONTENT_V0_ENABLED!=='true')
    return denied('CUSTOMER_PUBLIC_ROUTE_OFF',503,origin);
  if(Array.from(url.searchParams.keys()).length!==1||
     !url.searchParams.has('view')||url.searchParams.getAll('view').length!==1)
    return denied('CUSTOMER_PUBLIC_QUERY_DENIED',400,origin);
  const view=url.searchParams.get('view');
  if(!Object.prototype.hasOwnProperty.call(VIEWS,view))
    return denied('CUSTOMER_PUBLIC_VIEW_DENIED',400,origin);
  const bearer=/^Bearer ([a-f0-9]{64})$/i.exec(text(request.headers.get('Authorization')));
  if(!bearer)return denied('CUSTOMER_SESSION_REJECTED',401,origin);
  if(!env.DB||typeof env.DB.prepare!=='function'||
     typeof env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET!=='string'||
     env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET.length<32)
    return denied('CUSTOMER_PUBLIC_STORAGE_UNAVAILABLE',503,origin);
  try{
    const token=bearer[1].toLowerCase();
    const digest=await fingerprintCustomerSessionV0(
      token,env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET);
    const now=Date.now();
    const customer=await env.DB.prepare(CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0)
      .bind(digest,now,now).first();
    if(!customer||!text(customer.customerId))
      return denied('CUSTOMER_SESSION_REJECTED',401,origin);
    // Refuse to publish content while the canonical D1 employee-content
    // collection's control marker is OFF or missing. Never bypass it.
    const control=await env.DB.prepare(
      "SELECT mode,policy_epoch AS epoch FROM employee_content_control_v1 WHERE singleton=1 AND marker='ENTRY614_EMPLOYEE_CONTENT_V1'"
    ).first();
    if(!control||!['READONLY','GENERAL'].includes(control.mode)||
       !Number.isSafeInteger(control.epoch)||control.epoch<1)
      return denied('CUSTOMER_PUBLIC_SOURCE_NOT_QUALIFIED',503,origin);
    let projection={};
    if(view==='marketplace'){
      const vendors=await readActivePublicCollection(env.DB,'marketplace_vendors');
      const products=await readActivePublicCollection(env.DB,'marketplace_products');
      const publicVendors=vendors.map(safeMarketVendor).filter(Boolean);
      const authorized=new Set(publicVendors.map(v=>v.vendorCode));
      if(authorized.size!==publicVendors.length)
        return denied('CUSTOMER_PUBLIC_DUPLICATE_VENDOR',503,origin);
      projection={vendors:publicVendors,products:products.map(row=>
        safeMarketProduct(row,authorized)).filter(Boolean)};
    }else if(view==='ads'){
      // Only text-based campaigns are published; raw images/Google file IDs
      // and unsigned media destinations are never returned or requested.
      const ads=await readActivePublicCollection(env.DB,'platform_ads');
      projection={ads:ads.map(safePublicAd).filter(Boolean)};
    }else if(view==='brand'){
      const rows=await env.DB.prepare(
        "SELECT record_id,record_json FROM employee_content_records_v1 WHERE collection='white_label' AND record_id='default' AND active=1 LIMIT 1"
      ).all();
      if(!rows||!Array.isArray(rows.results)||rows.results.length>1)
        return denied('CUSTOMER_PUBLIC_BRAND_UNQUALIFIED',503,origin);
      projection={settings:safePublicBrand(rows.results[0])};
    }else{
      const rows=await readActivePublicCollection(env.DB,VIEWS[view]);
      projection=view==='sections'?{sections:rows.map(r=>
        safePublic(r,view)).filter(Boolean)}:{branches:rows.map(r=>
        safePublic(r,view)).filter(Boolean)};
    }
    // Strict public-only fields, never expose raw JSON, commissions,
    // customer/contact info, credentials, unverified image or file URLs.
    return json({success:true,readOnly:true,
      source:'customer-native-public-content-stage-v0',view,...projection},200,origin);
  }catch{
    return denied('CUSTOMER_PUBLIC_READ_UNAVAILABLE',503,origin);
  }
}
